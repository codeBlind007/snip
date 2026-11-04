import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.db import engine, check_database_connection
from app.api.routes.auth import router as auth_router
from app.api.routes.url import router as url_router
from app.db.redis import redis_client
import redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    check_database_connection()
    try:
        redis_client.ping()
        print("Redis connected successfully!")
    except redis.RedisError as e:
        print(f"Redis connection failed: {e}")
    yield
    engine.dispose()

app = FastAPI(
    title="URL Shortener API",
    lifespan=lifespan,
)

# Configure CORS
origins_env = os.getenv("ALLOWED_ORIGINS")
allowed_origins = [
    origin.strip()
    for origin in origins_env.split(",")
    if origin.strip()
] if origins_env else [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(router=auth_router)
app.include_router(router=url_router)

@app.get("/")
def root():
    return {"Hello" : "world"}

@app.get("/health-status")
def health_status():
    return {"server-health": "ok"}
