from app.schemas.common import OrmBase


class RoleOut(OrmBase):
    id: int
    name: str
