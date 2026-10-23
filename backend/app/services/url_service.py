from fastapi import HTTPException

from app.models.url import Url
from app.schemas.url import UrlCreateRequest
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import secrets
import string

def generate_short_code(length: int = 7) -> str:
    characters = string.ascii_letters + string.digits
    return ''.join(
        secrets.choice(characters) for _ in range(length)
    )

def short_url_service(db: Session, data: UrlCreateRequest, user_id: int) -> Url:
    code = (data.custom_alias if data.custom_alias is not None else generate_short_code())
    
    url = Url(
        short_url=code,
        long_url=str(data.long_url),
        max_clicks=data.max_clicks,
        click_count=0,
        expire_time=data.expire_time,
        is_active=True,
        user_id=user_id,
    )
    
    try:
        db.add(url)
        db.commit()
        db.refresh(url)
        return url

    except IntegrityError:
        db.rollback()

        if data.custom_alias is not None:
            raise HTTPException(
                status_code=409,
                detail="This custom alias is already taken",
            )

        raise HTTPException(
            status_code=500,
            detail="Could not generate a unique short code",
        )