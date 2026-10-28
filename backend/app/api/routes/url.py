from fastapi import APIRouter, HTTPException, Response, Depends, status, Header
from app.models.url import Url
from app.models.user import User
from app.schemas.url import UrlCreateRequest, UrlResponse 
from app.db.db import get_db
from sqlalchemy.orm import Session
from app.services.url_service import short_url_service
from app.dependencies.auth import get_current_user
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
            "short_url": f"https://snip.ly/{url.short_code}",
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
    