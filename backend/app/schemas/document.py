from datetime import datetime
from pydantic import Field

from app.schemas.common import OrmBase


class DocumentCreate(OrmBase):
    file_name: str = Field(..., min_length=1, max_length=255)
    file_url: str = Field(..., min_length=1, max_length=500)
    document_type: str | None = Field(default=None, max_length=80)


class DocumentOut(OrmBase):
    id: int
    file_name: str
    file_url: str
    document_type: str | None = None
    archived: bool = False
    created_at: datetime
    updated_at: datetime
    uploaded_by_user_id: int | None = None
    uploaded_by_name: str | None = None