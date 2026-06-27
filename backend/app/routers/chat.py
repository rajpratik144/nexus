from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..dependencies.auth_dep import get_current_user
from fastapi.responses import StreamingResponse
from app.services.rag_services import get_nexus_engine

router = APIRouter(prefix="/chats", tags=["Conversations"])

@router.post("/",response_model=schemas.ConversationOut)
def create_chat(chat_data: schemas.ConversationCreate,db:Session =Depends(get_db),current_user : models.User = Depends(get_current_user)):
    new_chat = models.Conversation(title = chat_data.title,user_id = current_user.id)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

@router.get("/",response_model=List[schemas.ConversationOut])
def list_chats(db:Session=Depends(get_db),current_user:models.User=Depends(get_current_user)):
    # fetch all chat belonging to the current User, newest chats first
    return db.query(models.Conversation).filter(models.Conversation.user_id == current_user.id).order_by(models.Conversation.updated_at.desc()).all()

@router.delete("/{chat_id}")
def delete_chat(chat_id:str,db:Session=Depends(get_db),current_user : models.User = Depends(get_current_user)):
    chat = db.query(models.Conversation).filter(models.Conversation.id == chat_id,models.Conversation.user_id == current_user.id).first()

    if not chat:
        raise HTTPException(status_code=404,detail="Chat Not Found")
    db.delete(chat)
    db.commit()
    return {"message":"chat deleted"}


@router.post("/{chat_id}/message")
async def send_message(chat_id: str,payload: schemas.MessageCreate,db: Session = Depends(get_db),current_user: models.User = Depends(get_current_user)):
    # 1. Verify chat ownership
    chat = db.query(models.Conversation).filter(models.Conversation.id == chat_id, models.Conversation.user_id == current_user.id).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 2. Save User Message to Database
    user_msg = models.Message(conversation_id=chat_id, role="user", content=payload.content)
    db.add(user_msg)
    db.commit()

    # 3. Get History for context
    history_records = db.query(models.Message).filter(models.Message.conversation_id == chat_id).all()
    formatted_history = [f"{m.role}: {m.content}" for m in history_records]

    # 4. Define the Generator function
    # IMPORTANT: The 'yield' must stay INSIDE this sub-function
    def token_generator():
        engine = get_nexus_engine()
        full_ai_response = ""
        
        # stream_ask returns a standard python generator
        for chunk in engine.stream_ask(payload.content, current_user.id, formatted_history):
            if chunk:
                token = str(chunk)
                full_ai_response += token
                yield token  # Yielding happens here (inside sub-function)

        # 5. After the loop finishes, save AI response to DB
        # Use the same 'db' session
        ai_msg = models.Message(
            conversation_id=chat_id, 
            role="assistant", 
            content=full_ai_response
        )
        db.add(ai_msg)
        db.commit()

    # 6. Return the response object
    # NO 'yield' exists in this 'send_message' scope, so 'return' is allowed
    return StreamingResponse(token_generator(), media_type="text/plain")

@router.get("/{chat_id}/messages", response_model=List[schemas.MessageResponse])
def get_messages(chat_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Message).filter(models.Message.conversation_id == chat_id).order_by(models.Message.created_at.asc()).all()

@router.patch("/{chat_id}")
def rename_chat(chat_id: str, new_title: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    chat = db.query(models.Conversation).filter(models.Conversation.id == chat_id, models.Conversation.user_id == current_user.id).first()
    if chat:
        chat.title = new_title
        db.commit()
    return chat