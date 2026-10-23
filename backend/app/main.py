from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.db import engine, check_database_connection
from app.api.routes.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    check_database_connection()
    yield
    engine.dispose()

app = FastAPI(
    title="URL Shortener API",
    lifespan=lifespan,
)

app.include_router(router=auth_router)

@app.get("/")
def root():
    return {"Hello" : "world"}

@app.get("/health-status")
def health_status():
    return {"server-health": "ok"}