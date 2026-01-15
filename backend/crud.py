"""
CRUD Operations Module
Handles database operations for users and messages.
"""
from sqlalchemy.orm import Session
import models, auth
from pydantic import BaseModel
from fastapi import HTTPException, status
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for user registration request."""
    username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user response."""
    username: str
    id: int


class TokenRequest(BaseModel):
    """Schema for token request."""
    username: str
    password: str


class MessageCreate(BaseModel):
    """Schema for message creation request."""
    sender_id: int
    recipient_id: int
    content: str
    timestamp: datetime = None


def create_user(db: Session, user: UserCreate):
    """Create a new user with hashed password."""
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists.")

    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, username: str):
    """Find a user by username."""
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session):
    """Retrieve all users."""
    return db.query(models.User).all()


def create_chat_message(db: Session, sender_id: int, receiver_id: int, content: str):
    """Create and store a new chat message."""
    chat_message = models.ChatMessage(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
        timestamp=datetime.now()
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    return chat_message



def get_chat_users(db: Session, user_id: int):
    """Get users that the current user has exchanged messages with, ordered by most recent."""
    messages = (
        db.query(models.ChatMessage)
        .filter(
            (models.ChatMessage.sender_id == user_id) | 
            (models.ChatMessage.receiver_id == user_id)
        )
        .order_by(models.ChatMessage.timestamp.desc())
        .all()
    )
    
    # Use a set to prevent duplicate users
    user_ids = set()
    result = []

    for message in messages:
        if message.sender_id == user_id:
            other_user_id = message.receiver_id
        else:
            other_user_id = message.sender_id
        
        if other_user_id not in user_ids:
            user_ids.add(other_user_id)
            other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
            if other_user:
                result.append({"username": other_user.username, "id": other_user.id})

    return result


def get_chat_messages(db: Session, current_user_id: int, target_user_id: int):
    """Retrieve all messages between two users."""
    return db.query(models.ChatMessage).filter(
        ((models.ChatMessage.sender_id == current_user_id) & (models.ChatMessage.receiver_id == target_user_id)) |
        ((models.ChatMessage.sender_id == target_user_id) & (models.ChatMessage.receiver_id == current_user_id))
    ).all()

