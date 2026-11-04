import redis
import secrets
import string
import os

from fastapi import HTTPException
from sqlalchemy import case, func, or_, update
from math import ceil
from app.models.url import Url
from app.schemas.url import UrlCreateRequest, UrlListResponse, UrlResponse, UrlUpdateRequest
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.services.cache_service import get_cached_url, cache_url, invalidate_cached_url

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

    # 1. Redis cache lookup
    try:
        cached_url = get_cached_url(short_code)

        if cached_url is not None:
            return cached_url["long_url"]

    except redis.RedisError:
        pass

    try:
        # 2. Build update values dynamically
        update_values = {}

        # Increment only for click-limited URLs
        # (max_clicks IS NOT NULL)
        update_values["click_count"] = case(
            (
                Url.max_clicks.is_not(None),
                Url.click_count + 1,
            ),
            else_=Url.click_count,
        )

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
            .values(**update_values)
            .returning(
                Url.id,
                Url.short_code,
                Url.long_url,
                Url.max_clicks,
                Url.is_active,
                Url.expire_time,
                Url.created_at,
                Url.user_id,
            )
        )

        result = db.execute(stmt).mappings().one_or_none()

        # 3. Handle invalid URLs
        if result is None:
            db.rollback()

            url = db.query(Url).filter(
                Url.short_code == short_code
            ).first()

            if url is None:
                raise HTTPException(
                    status_code=404,
                    detail="Short URL not found",
                )

            raise HTTPException(
                status_code=410,
                detail="This short URL has expired or is no longer available",
            )

        # 4. Commit
        db.commit()

        # 5. Cache only unlimited-click URLs
        if result["max_clicks"] is None:
            try:
                cache_url(result)

            except redis.RedisError:
                pass

        return result["long_url"]

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
    
    
def update_url_config_service(
    data: UrlUpdateRequest,
    url_id: int,
    user_id: int,
    db: Session,
):
    url = (
        db.query(Url)
        .filter(
            Url.user_id == user_id,
            Url.id == url_id,
        )
        .first()
    )

    if url is None:
        raise HTTPException(
            status_code=404,
            detail="No URL found with this id",
        )

    update_data = data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update",
        )

    # Apply updates
    for key, value in update_data.items():
        setattr(url, key, value)

    try:
        db.commit()
        db.refresh(url)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update URL configuration",
        )

    try:
        invalidate_cached_url(url.short_code)
    except redis.RedisError: 
        pass
    
    return UrlResponse(
        id=url.id,
        short_url=f"https://snip.ly/{url.short_code}",
        long_url=url.long_url,
        max_clicks=url.max_clicks,
        click_count=url.click_count,
        expire_time=url.expire_time,
        is_active=url.is_active,
        user_id=url.user_id,
        created_at=url.created_at,
    )
    
    