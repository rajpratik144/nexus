from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

# --- MESSAGE SCHEMAS ---
class MessageCreate(BaseModel):
    content: str

# ADD THIS CLASS:
class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- CONVERSATION SCHEMAS ---
class ConversationCreate(BaseModel):
    title: str = "New Chat"

class ConversationOut(BaseModel):
    id: str
    title: str
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)