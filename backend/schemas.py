from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Tag Schemas
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int

    class Config:
        orm_mode = True

# Website Schemas
class WebsiteBase(BaseModel):
    url: str
    is_active: bool = True
    assigned_at: Optional[datetime] = None
    labeler_user_id: Optional[int] = None

class WebsiteCreate(WebsiteBase):
    pass

class Website(WebsiteBase):
    id: int

    class Config:
        orm_mode = True

# Label Schemas
class LabelBase(BaseModel):
    label: str  # 'GenAI' or 'Not GenAI'
    time_spent_seconds: Optional[int] = None

class LabelCreate(LabelBase):
    website_id: int
    user_id: int
    tags: Optional[List[int]] = [] # List of Tag IDs

class Label(LabelBase):
    id: int
    website_id: int
    user_id: int
    created_at: datetime
    tags: List[Tag] = []
    # time_spent_seconds is already in LabelBase, so it's inherited here

    class Config:
        orm_mode = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    role: str # 'admin' or 'labeler'

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    labels: List[Label] = []

    class Config:
        orm_mode = True
