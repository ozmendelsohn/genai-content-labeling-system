from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Path to content_detector.db will be relative to backend/src/ if ./ is used.
# If db is in backend/ root, it should be sqlite:///../content_detector.db
# For Docker, it's often best to use an absolute path like /data/content_detector.db and map a volume.
# For now, assuming it's relative to where uvicorn runs, e.g. backend/src or backend/
SQLALCHEMY_DATABASE_URL = "sqlite:///./content_detector.db" # This will need careful checking in Docker

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_db_and_tables(engine_to_use=engine): 
    Base.metadata.create_all(bind=engine_to_use, checkfirst=True) 