from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, ConfigDict, field_validator
import re

class UrlCreateRequest(BaseModel):
    long_url: HttpUrl
    custom_alias: str | None = Field(
        default=None, min_length=3, max_length=30
    )
    max_clicks: int | None = Field(default=None, ge=1)
    expire_time: datetime | None = None

    @field_validator("custom_alias")
    @classmethod
    def validate_alias(cls, value: str | None):
        if value is None:
            return value

        if not re.fullmatch(r"[a-zA-Z0-9_-]{3,30}", value):
            raise ValueError(
                "Alias can contain only letters, digits, hyphens, and underscores"
            )

        reserved = {"api", "admin", "login", "docs", "health"}
        if value.lower() in reserved:
            raise ValueError("This alias is reserved")

        return value
    


class UrlResponse(BaseModel):
    id: int
    short_url: HttpUrl
    long_url: HttpUrl
    max_clicks: int | None
    click_count: int
    expire_time: datetime | None
    is_active: bool
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)