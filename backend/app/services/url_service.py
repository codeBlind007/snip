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

def short_url_service(
    db: Session,
    data: UrlCreateRequest,
    user_id: int,
    idempotency_key: str,
) -> Url:
    # 1. Check idempotency key for this user
    existing = (
        db.query(Url)
        .filter(
            Url.idempotency_key == idempotency_key,
            Url.user_id == user_id,
        )
        .first()
    )

    if existing is not None:
        return existing

    # 2. Reuse an existing active URL if appropriate
    existing = (
        db.query(Url)
        .filter(
            Url.long_url == str(data.long_url),
            Url.user_id == user_id,
            Url.is_active.is_(True),
        )
        .first()
    )

    if existing is not None:
        return existing

    # 3. Generate or use the requested alias
    code = (
        data.custom_alias
        if data.custom_alias is not None
        else generate_short_code()
    )

    url = Url(
        short_code=code,
        long_url=str(data.long_url),
        max_clicks=data.max_clicks,
        click_count=0,
        expire_time=data.expire_time,
        is_active=True,
        user_id=user_id,
        idempotency_key=idempotency_key,
    )

    try:
        db.add(url)
        db.commit()
        db.refresh(url)
        return url

    except IntegrityError as exc:
        db.rollback()

        # A concurrent request may have processed this key first.
        existing = (
            db.query(Url)
            .filter(
                Url.idempotency_key == idempotency_key,
                Url.user_id == user_id,
            )
            .first()
        )

        if existing is not None:
            return existing

        if data.custom_alias is not None:
            raise HTTPException(
                status_code=409,
                detail="This custom alias is already taken",
            ) from exc

        raise HTTPException(
            status_code=500,
            detail="Could not create a unique short code",
        ) from exc