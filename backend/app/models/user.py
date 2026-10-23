from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(100), nullable=False)
    fullname: Mapped[str] = mapped_column(String(100), nullable=False)
    
    urls: Mapped[list["Url"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
    )