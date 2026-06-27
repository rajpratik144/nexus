import os
import shutil
from fastapi import APIRouter,Depends,HTTPException,UploadFile,File
from sqlalchemy.orm import Session
from typing import List
from ..database.database import get_db
from ..dependencies.auth_dep import get_current_user
from ..models import models
from ..services.rag_services import get_nexus_engine


router = APIRouter(prefix="/files",tags=["File Management"])

@router.post("/upload") # No trailing slash here
async def upload_file(file: UploadFile = File(...),db: Session = Depends(get_db),current_user: models.User = Depends(get_current_user)):
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir,exist_ok=True)
    file_path = os.path.join(temp_dir,f"{current_user.id}_{file.filename}")

    try:
        # save file temporarily
        with open (file_path,"wb") as buffer:
            shutil.copyfileobj(file.file,buffer)
        
        # initialize RAg engine
        engine = get_nexus_engine()

        # trigger ingestion the rag engine return a list of doc_ids

        doc_ids = engine.ingest([file_path],current_user.id)

        if not doc_ids:
            raise HTTPException(status_code = 500,detail="Ingestion Failed.")
        
        return {"message":"File uploaded and indexed successfully","doc_ids":doc_ids}
    
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))
    
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/")
def list_files(current_user:models.User = Depends(get_current_user)):
    """Lists files specific to the current user via the RAG engine."""
    engine = get_nexus_engine()

    return engine.get_user_files(current_user.id)

@router.delete("/{doc_id}")
def delete_file(doc_id:str,current_user:models.User = Depends(get_current_user)):
    """Wipes file from both SQL and Pinecone."""
    engine = get_nexus_engine()
    success = engine.delete_files(doc_id,current_user.id)

    if not success:
        raise HTTPException(status_code=404,detail="file not found or delete failed")
    
    return {"message":"File deleted successfully"}



