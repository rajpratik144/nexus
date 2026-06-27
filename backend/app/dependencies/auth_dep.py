# ==========================================
# File: backend/app/dependencies/auth_dep.py
# ==========================================


import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import models
from ..auth.security import SECRET_KEY, ALGORITHM

# We keep this so the 'Authorize' button in Swagger still works
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

async def get_current_user(
    request: Request, 
    db: Session = Depends(get_db),
    token_from_header: str = Depends(oauth2_scheme)
):
    """
    Retrieves the user by checking:
    1. The 'nexus_access_token' HttpOnly Cookie (Primary - used by React)
    2. The 'Authorization' Header (Fallback - used by Swagger Docs)
    """
    # 1. Try to get token from Cookie
    token = request.cookies.get("nexus_access_token")
    
    # 2. If no cookie, check the header (for Swagger/Postman support)
    if not token:
        token = token_from_header

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        # Decode the JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # Find the user
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user