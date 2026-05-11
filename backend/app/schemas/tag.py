from pydantic import Field

from app.models.enums import TagCategory
from app.schemas.common import OrmBase


class TagOut(OrmBase):
    id: int
    name: str
    category: TagCategory


class TagCreate(OrmBase):
    name: str = Field(min_length=1, max_length=80)
    category: TagCategory
