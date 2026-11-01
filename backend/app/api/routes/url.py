from fastapi import APIRouter, HTTPException, Query, Response, Depends, status, Header
from fastapi.responses import RedirectResponse
from app.models.url import Url
from app.models.user import User
from app.schemas.url import UrlCreateRequest, UrlListResponse, UrlResponse 
from app.db.db import get_db
from sqlalchemy.orm import Session
from app.services.url_service import get_urls_service, short_url_service, redirect_service
from app.dependencies.auth import get_current_user

import os

is_development = os.getenv("env") == 'development'
prefix_url = "http://127.0.0.1:8000/url" if is_development else os.getenv("prefix_url")

router = APIRouter(prefix="/url", tags=["URL"])



@router.post(
    "",
    response_model=UrlResponse,
    status_code=status.HTTP_201_CREATED,
)
def gen_short_url(
    data: UrlCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    idempotency_key: str = Header(alias="Idempotency-Key")
):
    url = short_url_service(db, data, current_user.id, idempotency_key)
    response = UrlResponse.model_validate(
        {
            "id": url.id,
            "short_url": f"{prefix_url}/{url.short_code}",
            "long_url": url.long_url,
            "max_clicks": url.max_clicks,
            "click_count": url.click_count,
            "expire_time": url.expire_time,
            "is_active": url.is_active,
            "user_id": url.user_id,
            "created_at": url.created_at,
        }
    )

    return response
    

@router.get("/{short_code}")
def redirect_url(short_code: str, db: Session = Depends(get_db)) : 
    long_url = redirect_service(db, short_code)
    return RedirectResponse(
        url=long_url,
        status_code=302,
    )
    
    
@router.get("", response_model=UrlListResponse)
def get_urls(
    is_active: bool | None = None,
    alias: str | None = None,
    page: int = Query(default=1, ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_urls_service(
        db=db,
        user_id=current_user.id,
        is_active=is_active,
        alias=alias,
        page=page,
    )
    
    
