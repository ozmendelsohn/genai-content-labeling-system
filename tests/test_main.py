import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session as SQLAlchemySession
from sqlalchemy.pool import StaticPool # Recommended for SQLite in-memory for tests

from backend.main import app
from backend.database import Base, get_db
from backend.models import User as UserModel, Website as WebsiteModel, Label as LabelModel, Tag as TagModel

# --- Test Database Setup ---
SQLALCHEMY_DATABASE_URL_TEST = "sqlite:///:memory:" # In-memory SQLite database for tests

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL_TEST,
    connect_args={"check_same_thread": False}, # Needed for SQLite
    poolclass=StaticPool, # Ensures each test uses the same in-memory DB connection
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Override get_db dependency for testing
def override_get_db():
    db = None
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        if db:
            db.close()

app.dependency_overrides[get_db] = override_get_db

# --- Fixtures ---
@pytest.fixture(scope="function")
def setup_test_db_per_function():
    # Create tables before each test
    Base.metadata.create_all(bind=test_engine)
    yield
    # Drop tables after each test
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def db_session(setup_test_db_per_function): # Depends on the per-function setup
    """
    Provides a SQLAlchemy session for a test function.
    Ensures the session is closed after the test.
    """
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def client(db_session): # db_session fixture ensures this runs within the test DB context
    # Populate initial data for each test function using the provided db_session
    
    # Admin user
    admin_user = UserModel(id=1, email="admin@test.com", role="admin")
    db_session.add(admin_user)

    # Labeler users
    labeler1 = UserModel(id=2, email="labeler1@test.com", role="labeler")
    labeler2 = UserModel(id=3, email="labeler2@test.com", role="labeler")
    labeler3 = UserModel(id=4, email="labeler3@test.com", role="labeler")
    # User 5 is for the three_labeler_test, ensure it's created.
    labeler4 = UserModel(id=5, email="labeler4@test.com", role="labeler") 
    # User 6 is an extra labeler for testing "no task available after 3 labels" by a *different* user.
    labeler5 = UserModel(id=6, email="labeler5@test.com", role="labeler")
    db_session.add_all([labeler1, labeler2, labeler3, labeler4, labeler5])
    
    db_session.commit() # Commit this initial setup within the test's transaction
    
    # Yield the TestClient, which will use the app with the overridden get_db that uses this session
    yield TestClient(app)
    
    # db_session fixture will handle rollback after the test

from datetime import datetime, timedelta # For task_start_time

# --- Test Cases ---

def test_read_main(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to GenAI Content Detection Assistant API"}

# --- User Listing Tests ---
def test_list_users_as_admin(client, db_session):
    response = client.get("/users?user_id=1") # User ID 1 is admin
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 4 # admin + 3 initial labelers + 2 more for tests
    assert any(user['email'] == "admin@test.com" for user in users)
    assert any(user['email'] == "labeler1@test.com" for user in users)

def test_list_users_as_labeler(client):
    response = client.get("/users?user_id=2") # User ID 2 is labeler
    assert response.status_code == 200
    assert response.json() == []

def test_list_users_no_user_id(client):
    response = client.get("/users")
    assert response.status_code == 200
    assert response.json() == []

def test_list_users_non_existent_user_id(client):
    response = client.get("/users?user_id=999")
    assert response.status_code == 200
    assert response.json() == []
    
# --- Admin URL Upload Tests ---
def test_admin_get_upload_form(client):
    response = client.get("/admin/upload")
    assert response.status_code == 200
    assert "<h1>Admin - Upload Website URLs</h1>" in response.text
    assert '<textarea id="urls_list" name="urls_list"' in response.text

def test_admin_upload_urls_success(client, db_session):
    urls_to_upload = "http://example.com/new1\nhttp://example.org/new2"
    response = client.post("/admin/upload_urls", data={"urls_list": urls_to_upload})
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["message"] == "URLs processed. Added: 2, Skipped (duplicates or errors): 0"

    # Verify in DB
    websites = db_session.query(WebsiteModel).all()
    assert any(ws.url == "http://example.com/new1" for ws in websites)
    assert any(ws.url == "http://example.org/new2" for ws in websites)

def test_admin_upload_urls_duplicates(client, db_session):
    initial_urls = "http://unique.com/path1\nhttp://anotherunique.org/path2"
    client.post("/admin/upload_urls", data={"urls_list": initial_urls}) # Seed some URLs

    duplicate_and_new_urls = "http://unique.com/path1\nhttp://newsite.net/path3\nhttp://anotherunique.org/path2"
    response = client.post("/admin/upload_urls", data={"urls_list": duplicate_and_new_urls})
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["message"] == "URLs processed. Added: 1, Skipped (duplicates or errors): 2"

    # Verify only newsite.net/path3 was added in the second call
    new_website = db_session.query(WebsiteModel).filter(WebsiteModel.url == "http://newsite.net/path3").first()
    assert new_website is not None
    
    all_websites = db_session.query(WebsiteModel).all()
    urls_in_db = [ws.url for ws in all_websites]
    assert "http://unique.com/path1" in urls_in_db
    assert "http://anotherunique.org/path2" in urls_in_db
    assert len([url for url in urls_in_db if url == "http://unique.com/path1"]) == 1 # Ensure no actual duplicates in DB

# --- Labeler Workflow Tests ---
def test_labeler_get_task_no_tasks(client, db_session):
    # Ensure no websites are in the DB for this test
    db_session.query(LabelModel).delete()
    db_session.query(WebsiteModel).delete()
    db_session.commit()
    
    response = client.get("/labeler/task?user_id=2") # User ID 2 is labeler
    assert response.status_code == 200
    assert "No tasks available at the moment" in response.text

def test_labeler_get_task_success(client, db_session):
    # Add a website for the task
    website = WebsiteModel(url="http://tasktest.com")
    db_session.add(website)
    db_session.commit()
    db_session.refresh(website) # Get the ID

    response = client.get(f"/labeler/task?user_id=2") # User ID 2
    assert response.status_code == 200
    assert "Label Website Task" in response.text
    assert f'<iframe src="{website.url}"' in response.text
    assert f'<input type="hidden" name="website_id" value="{website.id}">' in response.text
    assert f'<input type="hidden" name="user_id" value="2">' in response.text
    assert 'name="task_start_time"' in response.text

def test_labeler_submit_label_success(client, db_session):
    # Add a website to label
    website = WebsiteModel(url="http://submittest.com")
    db_session.add(website)
    db_session.commit()
    db_session.refresh(website)

    task_start_time = datetime.utcnow().isoformat()
    label_data = {
        "website_id": website.id,
        "user_id": 2, # labeler1
        "label_value": "GenAI",
        "tags_str": "test_tag1, Test Tag2",
        "task_start_time": task_start_time,
    }
    response = client.post("/labeler/submit_label", data=label_data)
    assert response.status_code == 200
    assert "Thank you, your label has been submitted successfully!" in response.text

    # Verify label in DB
    label = db_session.query(LabelModel).filter_by(website_id=website.id, user_id=2).first()
    assert label is not None
    assert label.label == "GenAI"
    assert label.time_spent_seconds is not None and label.time_spent_seconds >= 0

    # Verify tags in DB (tags are stored lowercase)
    tag_names_in_db = sorted([tag.name for tag in label.tags])
    assert tag_names_in_db == sorted(["test_tag1", "test tag2"]) # Tags are lowercased
    
    # Check that the tags were created in the Tag table
    db_tag1 = db_session.query(TagModel).filter(TagModel.name == "test_tag1").first()
    db_tag2 = db_session.query(TagModel).filter(TagModel.name == "test tag2").first()
    assert db_tag1 is not None
    assert db_tag2 is not None


def test_labeler_task_assignment_three_labelers(client, db_session):
    # Add one website
    website = WebsiteModel(url="http://threelabelers.com")
    db_session.add(website)
    db_session.commit()
    db_session.refresh(website)
    website_id = website.id

    labeler_ids = [2, 3, 4] # labeler1, labeler2, labeler3

    for user_id in labeler_ids:
        # Get task
        response_get = client.get(f"/labeler/task?user_id={user_id}")
        assert response_get.status_code == 200
        # Extract task_start_time (simple parsing, real app might need better way)
        # For tests, we can just generate one as the form would
        current_task_start_time = datetime.utcnow().isoformat()
        
        # Submit label
        submit_data = {
            "website_id": website_id,
            "user_id": user_id,
            "label_value": "Not GenAI",
            "tags_str": f"tag_by_user_{user_id}",
            "task_start_time": current_task_start_time
        }
        response_post = client.post("/labeler/submit_label", data=submit_data)
        assert response_post.status_code == 200
        assert "Label Submitted" in response_post.text
        
        # Verify label was stored
        label = db_session.query(LabelModel).filter_by(website_id=website_id, user_id=user_id).first()
        assert label is not None
        assert label.label == "Not GenAI"

    # Now, verify that labeler_ids[0] (user 2) cannot get this task again
    response_user2_again = client.get(f"/labeler/task?user_id={labeler_ids[0]}")
    assert response_user2_again.status_code == 200
    assert "No tasks available at the moment" in response_user2_again.text # Or it might get a different task if others exist

    # Verify a *different* user (User 5, ID 5, who is labeler4@test.com) also cannot get this task
    response_user5 = client.get("/labeler/task?user_id=5") # User ID 5 is labeler4
    assert response_user5.status_code == 200
    # This assertion assumes no OTHER tasks are available. If other tasks were added, this might fail.
    # For a robust test, ensure only one website is present or all others are fully labeled.
    # For now, we assume the logic correctly identifies this specific website as fully labeled.
    # A more precise check would be to see if *this specific website* is offered.
    # However, the current endpoint doesn't allow specifying a website to get.
    # So, we check if the "No tasks" message appears, which means this site wasn't offered.
    assert "No tasks available at the moment" in response_user5.text
