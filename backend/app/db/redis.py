import redis
from app.core.config import settings

redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    max_connections=20,
    socket_connect_timeout=5,
    socket_timeout=5,
    health_check_interval=30,
)