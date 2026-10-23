from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.db import get_db
from app.schemas.auth import SignupRequest, SignupResponse, LoginRequest, LoginResponse
from app.services.auth_service import signup_user, login_user, create_access_token

COOKIE_NAME = "access_token"

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(data: SignupRequest, response: Response, db: Session = Depends(get_db)):
    try:
        user = signup_user(db, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    token = create_access_token(user.id)

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 60,
        path="/",
    )

    return {"user": user}



@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    
    user = login_user(db, data)
    token = create_access_token(user.id)
    
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 60,
        path="/",
    )
    
    return {"user": user}
    