from fastapi import FastAPI, Request, Depends, Form, HTTPException
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, and_
from datetime import datetime, timedelta # Keep timedelta if used, remove if not
from typing import List, Optional

# Adjust imports to be direct as they are now sibling modules in src/
from database import get_db
from schemas import WebsiteCreate, Website, LabelCreate, TagCreate, Tag as TagSchema, User as UserSchema
from models import Website as WebsiteModel, User as UserModel, Label as LabelModel, Tag as TagModel, label_tag_association

app = FastAPI()

# templates = Jinja2Templates(directory="../../frontend/templates") 
templates = Jinja2Templates(directory="/app/templates") # Absolute path within container

@app.get("/")
async def root():
    return {"message": "Welcome to GenAI Content Detection Assistant API"}

@app.get("/admin/upload")
async def admin_upload_form(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

@app.post("/admin/upload_urls")
async def admin_upload_urls(urls_list: str = Form(...), db: Session = Depends(get_db)):
    urls = [url.strip() for url in urls_list.splitlines() if url.strip()]
    added_count = 0
    skipped_count = 0
    processed_urls = set()

    for url_str in urls:
        if url_str in processed_urls:
            skipped_count +=1
            continue
        processed_urls.add(url_str)

        existing_website = db.query(WebsiteModel).filter(WebsiteModel.url == url_str).first()
        if existing_website:
            skipped_count += 1
        else:
            try:
                website_data = WebsiteCreate(url=url_str)
                db_website = WebsiteModel(**website_data.model_dump())
                db.add(db_website)
                db.commit()
                added_count += 1
            except Exception as e:
                skipped_count +=1

    return {
        "message": f"URLs processed. Added: {added_count}, Skipped (duplicates or errors): {skipped_count}"
    }

@app.get("/labeler/task")
async def get_labeler_task(request: Request, user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id, UserModel.role == "labeler").first()
    if not user:
        raise HTTPException(status_code=404, detail="Labeler user not found.")

    labeled_by_user_subquery = db.query(LabelModel.website_id).filter(LabelModel.user_id == user_id).subquery()
    label_counts_subquery = (
        db.query(LabelModel.website_id, sql_func.count(LabelModel.user_id.distinct()).label("labeler_count"))
        .group_by(LabelModel.website_id)
        .subquery()
    )

    website_to_label = (
        db.query(WebsiteModel)
        .outerjoin(
            label_counts_subquery, WebsiteModel.id == label_counts_subquery.c.website_id
        )
        .filter(WebsiteModel.is_active == True)
        .filter(WebsiteModel.id.notin_(labeled_by_user_subquery))
        .filter(
            (label_counts_subquery.c.labeler_count == None) | (label_counts_subquery.c.labeler_count < 3)
        )
        .order_by(WebsiteModel.id)
        .first()
    )

    if not website_to_label:
        return templates.TemplateResponse(
            "message.html",
            {"request": request, "message_title": "No Tasks", "message_body": "No tasks available at the moment. Please check back later."},
        )

    task_start_time = datetime.utcnow().isoformat()

    return templates.TemplateResponse(
        "labeler.html",
        {
            "request": request,
            "website_url": website_to_label.url,
            "website_id": website_to_label.id,
            "user_id": user_id,
            "task_start_time": task_start_time,
        },
    )

@app.post("/labeler/submit_label")
async def submit_label(
    request: Request,
    website_id: int = Form(...),
    user_id: int = Form(...),
    label_value: str = Form(...),
    tags_str: str = Form(""),
    task_start_time: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    website = db.query(WebsiteModel).filter(WebsiteModel.id == website_id).first()
    if not user or not website:
        raise HTTPException(status_code=404, detail="User or Website not found.")

    existing_label = db.query(LabelModel).filter(LabelModel.user_id == user_id, LabelModel.website_id == website_id).first()
    if existing_label:
        return templates.TemplateResponse(
            "message.html",
            {"request": request, "message_title": "Already Labeled", "message_body": "You have already submitted a label for this website."},
        )

    try:
        start_time_obj = datetime.fromisoformat(task_start_time)
        time_spent_seconds = int((datetime.utcnow() - start_time_obj).total_seconds())
    except ValueError:
        time_spent_seconds = None

    label_data = LabelCreate(
        label=label_value,
        website_id=website_id,
        user_id=user_id,
        time_spent_seconds=time_spent_seconds
    )
    db_label = LabelModel(
        **label_data.model_dump(exclude={"tags"}),
        created_at=datetime.utcnow()
    )
    db.add(db_label)
    db.commit()
    db.refresh(db_label)

    tag_names = [tag.strip().lower() for tag in tags_str.split(',') if tag.strip()]
    if tag_names:
        for tag_name in tag_names:
            tag = db.query(TagModel).filter(TagModel.name == tag_name).first()
            if not tag:
                tag_create_data = TagCreate(name=tag_name)
                tag = TagModel(**tag_create_data.model_dump())
                db.add(tag)
                db.commit()
                db.refresh(tag)
            if tag not in db_label.tags:
                 db_label.tags.append(tag)
        db.commit()

    return templates.TemplateResponse(
        "message.html",
        {"request": request, "message_title": "Label Submitted", "message_body": "Thank you, your label has been submitted successfully!"},
    )

@app.get("/users", response_model=list[UserSchema])
async def get_users(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    if user_id is None:
        return []

    requesting_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not requesting_user:
        return []

    if requesting_user.role == "admin":
        users = db.query(UserModel).all()
        return users
    else:
        return [] 