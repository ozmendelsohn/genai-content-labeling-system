from fastapi import FastAPI, Request, Depends, Form, HTTPException
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, and_
from datetime import datetime, timedelta
from typing import List, Optional # Added this line

from backend.database import get_db
from backend.schemas import WebsiteCreate, Website, LabelCreate, TagCreate, Tag as TagSchema, User as UserSchema
from backend.models import Website as WebsiteModel, User as UserModel, Label as LabelModel, Tag as TagModel, label_tag_association

app = FastAPI()

templates = Jinja2Templates(directory="frontend/templates")

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
        if url_str in processed_urls: # handles duplicates within the submission
            skipped_count +=1
            continue
        processed_urls.add(url_str)

        existing_website = db.query(WebsiteModel).filter(WebsiteModel.url == url_str).first()
        if existing_website:
            skipped_count += 1
        else:
            try:
                website_data = WebsiteCreate(url=url_str) # is_active defaults to True
                db_website = WebsiteModel(**website_data.model_dump())
                db.add(db_website)
                db.commit()
                added_count += 1
            except Exception as e: # Catch validation errors or other issues
                # Log error e if needed
                skipped_count +=1 # Or handle error differently

    return {
        "message": f"URLs processed. Added: {added_count}, Skipped (duplicates or errors): {skipped_count}"
    }

@app.get("/labeler/task")
async def get_labeler_task(request: Request, user_id: int, db: Session = Depends(get_db)):
    # Ensure user exists and is a labeler
    user = db.query(UserModel).filter(UserModel.id == user_id, UserModel.role == "labeler").first()
    if not user:
        raise HTTPException(status_code=404, detail="Labeler user not found.")

    # Subquery to find websites already labeled by the current user
    labeled_by_user_subquery = db.query(LabelModel.website_id).filter(LabelModel.user_id == user_id).subquery()

    # Subquery to count distinct labelers per website
    label_counts_subquery = (
        db.query(LabelModel.website_id, sql_func.count(LabelModel.user_id.distinct()).label("labeler_count"))
        .group_by(LabelModel.website_id)
        .subquery()
    )

    # Find a website that:
    # 1. Is active
    # 2. Has not been labeled by the current user
    # 3. Has been labeled by fewer than 3 distinct users (or not labeled at all)
    # Prioritize by oldest website (smallest id)
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
        .order_by(WebsiteModel.id) # Example: oldest website first
        .first()
    )

    if not website_to_label:
        return templates.TemplateResponse(
            "message.html",
            {"request": request, "message_title": "No Tasks", "message_body": "No tasks available at the moment. Please check back later."},
        )

    # Simplistic assignment (can be made more robust)
    # website_to_label.labeler_user_id = user_id
    # website_to_label.assigned_at = datetime.utcnow()
    # db.commit()

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
    # Ensure user and website exist
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    website = db.query(WebsiteModel).filter(WebsiteModel.id == website_id).first()
    if not user or not website:
        raise HTTPException(status_code=404, detail="User or Website not found.")

    # Prevent duplicate labeling by the same user (though task assignment should mostly prevent this)
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
        time_spent_seconds = None # Or handle error, e.g., set to a default or raise HTTP exception

    # Create Label
    label_data = LabelCreate(
        label=label_value,
        website_id=website_id,
        user_id=user_id,
        time_spent_seconds=time_spent_seconds
        # tags will be handled separately
    )
    db_label = LabelModel(
        **label_data.model_dump(exclude={"tags"}), # Pydantic's model_dump, exclude tags for now
        created_at=datetime.utcnow()
    )
    db.add(db_label)
    db.commit()
    db.refresh(db_label)

    # Process and associate Tags
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
            # Associate tag with label
            if tag not in db_label.tags: # Check to prevent duplicate association
                 db_label.tags.append(tag)
        db.commit()

    # Clear assignment from Website model after successful labeling
    # if website.labeler_user_id == user_id:
    #     website.labeler_user_id = None
    #     website.assigned_at = None
    #     db.commit()

    return templates.TemplateResponse(
        "message.html",
        {"request": request, "message_title": "Label Submitted", "message_body": "Thank you, your label has been submitted successfully!"},
    )

@app.get("/users", response_model=list[UserSchema])
async def get_users(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    if user_id is None:
        # raise HTTPException(status_code=403, detail="Access restricted: user_id is required.")
        return [] # Or return a specific message as per requirements

    requesting_user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not requesting_user:
        # raise HTTPException(status_code=404, detail="Requesting user not found.")
        return [] # Or return a specific message

    if requesting_user.role == "admin":
        users = db.query(UserModel).all()
        return users
    else:
        # raise HTTPException(status_code=403, detail="Access restricted: Admin role required.")
        return [] # Or return a specific message
