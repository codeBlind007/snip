import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase


load_dotenv()
class Base(DeclarativeBase):
    pass

USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

DATABASE_URL = (
    f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}"
    "?sslmode=require"
)

engine = create_engine(DATABASE_URL)


def check_database_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database connection successful!")
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise
