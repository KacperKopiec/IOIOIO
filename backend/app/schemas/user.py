from pydantic import EmailStr

from app.schemas.common import OrmBase
from app.schemas.role import RoleOut


class UserOut(OrmBase):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    is_active: bool
    role: RoleOut | None = None
