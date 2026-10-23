import os
import jwt

from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import SignupRequest
from datetime import datetime, timedelta, timezone
from pwdlib import PasswordHash
from dotenv import load_dotenv

load_dotenv()

password_hash = PasswordHash.recommended()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not configured")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def signup_user(db: Session, data: SignupRequest) -> User:
    user = User(
        email_id = str(data.email_id),
        fullname = str(data.fullname),
        password = hash_password(data.password),
    )
    print("service layer", user)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user