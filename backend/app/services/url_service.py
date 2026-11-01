from math import ceil

from fastapi import HTTPException
from sqlalchemy import func, or_, update

from app.models.url import Url
from app.schemas.url import UrlCreateRequest, UrlListResponse, UrlResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

import secrets
import string
import os

is_development = os.getenv("env") == 'development'
prefix_url = "http://127.0.0.1:8000/url" if is_development else os.getenv("prefix_url")



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
        
        
def redirect_service(db: Session, short_code: str) -> str:
    try:
        stmt = (
            update(Url)
            .where(
                Url.short_code == short_code,
                Url.is_active.is_(True),
                or_(
                    Url.expire_time.is_(None),
                    Url.expire_time > func.now(),
                ),
                or_(
                    Url.max_clicks.is_(None),
                    Url.click_count < Url.max_clicks,
                ),
            )
            .values(
                click_count=Url.click_count + 1
            )
            .returning(Url.long_url)
        )

        long_url = db.execute(stmt).scalar_one_or_none()

        if long_url is None:
            db.rollback()

            url = (
                db.query(Url)
                .filter(Url.short_code == short_code)
                .first()
            )

            if url is None:
                raise HTTPException(
                    status_code=404,
                    detail="Short URL not found",
                )

            raise HTTPException(
                status_code=410,
                detail="This short URL has expired or is no longer available",
            )

        db.commit()

        return long_url

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while processing redirect",
        )
        

def get_urls_service(
    db: Session,
    user_id: int,
    is_active: bool | None,
    alias: str | None,
    page: int,
) -> UrlListResponse:

    LIMIT = 10

    query = db.query(Url).filter(
        Url.user_id == user_id
    )

    # Filter by active status
    if is_active is not None:
        query = query.filter(
            Url.is_active == is_active
        )

    # Search by short code (partial matching)
    if alias:
        query = query.filter(
            Url.short_code.ilike(f"%{alias.strip()}%")
        )

    # Total records after applying filters
    total = query.count()

    # Pagination
    urls = (
        query
        .order_by(Url.created_at.desc())
        .offset((page - 1) * LIMIT)
        .limit(LIMIT)
        .all()
    )

    # Convert SQLAlchemy objects into response schemas
    response_urls = [
        UrlResponse.model_validate({
            "id": url.id,
            "short_url": f"{prefix_url}/{url.short_code}",
            "long_url": url.long_url,
            "max_clicks": url.max_clicks,
            "click_count": url.click_count,
            "expire_time": url.expire_time,
            "is_active": url.is_active,
            "user_id": url.user_id,
            "created_at": url.created_at,
        })
        for url in urls
    ]

    return UrlListResponse(
        urls=response_urls,
        total=total,
        page=page,
        limit=LIMIT,
        total_pages=ceil(total / LIMIT),
    )
    
    
