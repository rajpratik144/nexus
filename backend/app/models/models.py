from sqlalchemy import Column,Integer,String,DateTime,ForeignKey,Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.database import Base
import uuid


class User(Base):
    __tablename__ = "users"
    id = Column(String,primary_key=True,default=lambda:str(uuid.uuid4()))
    email = Column(String,unique=True,index=True,nullable=False)
    password_hash = Column(String,nullable=False)
    created_at = Column(DateTime,server_default=func.now())

    conversations = relationship("Conversation",back_populates="owner")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String,primary_key=True,default=lambda:str(uuid.uuid4()))
    user_id = Column(String,ForeignKey("users.id"))
    title = Column(String,default="New Chat")
    updated_at = Column(DateTime,server_default=func.now(),onupdate=func.now())

    owner = relationship("User",back_populates="conversations")
    messages = relationship("Message",back_populates="conversation",cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(String,primary_key=True,default=lambda:str(uuid.uuid4()))
    conversation_id = Column(String,ForeignKey("conversations.id",ondelete="CASCADE"))
    role = Column(String) #''user' or 'assistant'
    content = Column(Text)
    created_at = Column(DateTime,server_default=func.now())

    conversation = relationship("Conversation",back_populates="messages")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")