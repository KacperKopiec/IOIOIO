from app.models.enums import StageOutcome
from app.schemas.common import OrmBase


class PipelineStageOut(OrmBase):
    id: int
    name: str
    order_number: int
    success_probability: int
    outcome: StageOutcome
