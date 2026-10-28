from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base
from app.models.user import User


class Url(Base):
    __tablename__ = "urls"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    idempotency_key: Mapped[str] = mapped_column(String(36),nullable=False)   

    short_code: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )

    long_url: Mapped[str] = mapped_column(
        String(2048), nullable=False
    )

    max_clicks: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    click_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    expire_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "idempotency_key",
            name="uq_urls_user_idempotency_key",
        ),
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    owner: Mapped["User"] = relationship(back_populates="urls")
