from fastapi import APIRouter

from app.api.deps import DbDep
from app.schemas.reports import ReportsResponse
from app.services.reports import build_reports

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=ReportsResponse)
def reports_summary(db: DbDep) -> ReportsResponse:
    return build_reports(db)
