from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DbDep
from app.models.pipeline import PipelineStage
from app.schemas.pipeline_stage import PipelineStageOut

router = APIRouter(prefix="/pipeline-stages", tags=["reference"])


@router.get("", response_model=list[PipelineStageOut])
def list_pipeline_stages(db: DbDep) -> list[PipelineStage]:
    return list(
        db.scalars(select(PipelineStage).order_by(PipelineStage.order_number)).all()
    )
