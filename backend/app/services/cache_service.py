import json
from datetime import datetime, timezone
from app.db.redis import redis_client
from app.models.url import Url

CACHE_PREFIX = "url:"
CACHE_TTL = 3600


def get_cached_url(short_code: str) -> Url: 
    """
    Returns cached URL metadata if available.
    Returns None on cache miss.
    """
    key = f"{CACHE_PREFIX}{short_code}"

    cached_data = redis_client.get(key)

    if cached_data is None:
        return None

    print(cached_data)
    
    return json.loads(cached_data)



def cache_url(url: Url):
    """
    Cache only unlimited-click URLs.
    """

    if url.max_clicks is not None or not url.is_active:
        return

    key = f"{CACHE_PREFIX}{url.short_code}"

    data = {
        "id": url.id,
        "short_code": url.short_code,
        "long_url": url.long_url,
        "max_clicks": url.max_clicks,
        "click_count": None,
        "is_active": url.is_active,
        "expire_time": (
            url.expire_time.isoformat()
            if url.expire_time else None
        ),
        "created_at": (
            url.created_at.isoformat()
            if url.created_at else None
        ),
        "user_id": url.user_id
    }

    ttl = CACHE_TTL

    if url.expire_time:
        expire_time = url.expire_time

        if expire_time.tzinfo is None:
            expire_time = expire_time.replace(tzinfo=timezone.utc)

        remaining = (
            expire_time - datetime.now(timezone.utc)
        ).total_seconds()

        if remaining <= 0:
            return

        ttl = min(CACHE_TTL, max(1, int(remaining)))

    redis_client.setex(
        key,
        ttl,
        json.dumps(data)
    )
    

def invalidate_cached_url(short_code: str):
    key = f"{CACHE_PREFIX}{short_code}"
    redis_client.delete(key)