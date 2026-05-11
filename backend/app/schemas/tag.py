from app.models.enums import TagCategory
from app.schemas.common import OrmBase


class TagOut(OrmBase):
    id: int
    name: str
    category: TagCategory
