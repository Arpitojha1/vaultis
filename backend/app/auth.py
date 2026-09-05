from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from .config import get_settings
from .database import get_db
from .models import User

password_hash = PasswordHash.recommended()
bearer = HTTPBearer()


def create_token(user: User) -> str:
    settings = get_settings()
    payload = {"user_id": user.user_id, "role": user.role, "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiry_minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_mfa_challenge_token(user: User) -> str:
    settings = get_settings()
    payload = {"mfa_user_id": user.user_id, "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, get_settings().jwt_secret, algorithms=["HS256"])
        user_id = int(payload["user_id"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.get(User, user_id)
    if not user or user.role != payload.get("role"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return user


def require_role(*roles: str):
    def dependency(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user
    return dependency
