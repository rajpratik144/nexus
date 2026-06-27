# ==========================================
# File: backend/app/routers/auth.py
# ==========================================


from fastapi import APIRouter, Depends, HTTPException, Response, Request, Cookie
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm # Add this
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..auth import security
from ..dependencies.auth_dep import get_current_user
from datetime import datetime

router  = APIRouter(prefix="/auth",tags=["Authentication"])

@router.post("/register",response_model=schemas.UserOut)
def register(user:schemas.UserCreate,db:Session = Depends(get_db)):
    # check if user exist
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400,detail="Email already Registered")
    
    # other-wise Hash and save in db

    hashed_pwd = security.hash_password(user.password)
    new_user = models.User(email = user.email,password_hash = hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ... other imports

# Shared settings for all cookies
COOKIE_PARAMS = {
    "httponly": True,
    "samesite": "none",
    "secure": True, # Set to True in production with HTTPS
    "path": "/"      # Crucial: makes cookie available to all routes
}

@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = security.create_access_token(data={"sub": user.email})
    refresh_token_str, expires_at = security.create_refresh_token(data={"sub": user.email})

    # Save refresh token in DB
    db_refresh = models.RefreshToken(token=refresh_token_str, user_id=user.id, expires_at=expires_at)
    db.add(db_refresh)
    db.commit()

    # Set cookies
    response.set_cookie(key="nexus_access_token", value=access_token, max_age=900, **COOKIE_PARAMS)
    response.set_cookie(key="nexus_refresh_token", value=refresh_token_str, max_age=604800, **COOKIE_PARAMS)

    return {"message": "Authenticated"}

@router.post("/refresh")
async def refresh_token(
    response: Response, 
    nexus_refresh_token: str = Cookie(None), # Explicitly look for the cookie
    db: Session = Depends(get_db)
):
    if not nexus_refresh_token:
        raise HTTPException(status_code=401, detail="Refresh cookie missing")

    db_token = db.query(models.RefreshToken).filter(models.RefreshToken.token == nexus_refresh_token).first()
    if not db_token or db_token.expires_at < datetime.now():
        raise HTTPException(status_code=401, detail="Session expired")

    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    new_access_token = security.create_access_token(data={"sub": user.email})
    
    # Refresh the access token cookie
    response.set_cookie(key="nexus_access_token", value=new_access_token, max_age=900, **COOKIE_PARAMS)
    return {"message": "Refreshed"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("nexus_access_token", path="/")
    response.delete_cookie("nexus_refresh_token", path="/")
    return {"message": "Logged out"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("nexus_access_token")
    response.delete_cookie("nexus_refresh_token")
    return {"message": "Logged out"}


@router.get("/me",response_model=schemas.UserOut)
def profile(current_user:models.User = Depends(get_current_user)):
    """
    Returns the current logged-in user's info.
    If no token is provided or it's invalid, this route returns 401.
    """
    return current_user
