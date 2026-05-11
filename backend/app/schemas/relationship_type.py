from app.schemas.common import OrmBase


class RelationshipTypeOut(OrmBase):
    id: int
    name: str
    description: str | None = None
