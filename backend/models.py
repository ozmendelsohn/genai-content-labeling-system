from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String)  # e.g., 'admin', 'labeler'

    labels = relationship("Label", back_populates="user")

class Website(Base):
    __tablename__ = "websites"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    assigned_at = Column(DateTime, nullable=True, default=None)
    labeler_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    labels = relationship("Label", back_populates="website")
    assignee = relationship("User", foreign_keys=[labeler_user_id])

label_tag_association = Table(
    "label_tag_association",
    Base.metadata,
    Column("label_id", Integer, ForeignKey("labels.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)

class Label(Base):
    __tablename__ = "labels"

    id = Column(Integer, primary_key=True, index=True)
    website_id = Column(Integer, ForeignKey("websites.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    label = Column(String)  # 'GenAI' or 'Not GenAI'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    time_spent_seconds = Column(Integer, nullable=True)

    website = relationship("Website", back_populates="labels")
    user = relationship("User", back_populates="labels")
    tags = relationship("Tag", secondary=label_tag_association, back_populates="labels")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    labels = relationship("Label", secondary=label_tag_association, back_populates="tags")
