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
        # from_attributes = True # For Pydantic v2

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
        # from_attributes = True

# Label Schemas
class LabelBase(BaseModel):
    label: str  # 'GenAI' or 'Not GenAI'
    time_spent_seconds: Optional[int] = None

class LabelCreate(LabelBase):
    website_id: int
    user_id: int
    tags: Optional[List[int]] = []

class Label(LabelBase):
    id: int
    website_id: int
    user_id: int
    created_at: datetime
    tags: List[Tag] = []

    class Config:
        orm_mode = True
        # from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    role: str # 'admin' or 'labeler'

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    # labels: List[Label] = [] # Consider if needed, due to potential circular deps

    class Config:
        orm_mode = True
        # from_attributes = True 