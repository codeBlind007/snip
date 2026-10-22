from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.db import engine, check_database_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    check_database_connection()
    yield
    engine.dispose()

app = FastAPI(
    title="URL Shortener API",
    lifespan=lifespan,
)


@app.get("/")
def root():
    return {"Hello" : "world"}

@app.get("/health-status")
def health_status():
    return {"server-health": "ok"}