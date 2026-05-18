import csv
from io import StringIO

from fastapi import APIRouter, Query, Response

from app.api.deps import DbDep
from app.schemas.reports import ReportsResponse
from app.services.reports import build_reports

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=ReportsResponse)
def reports_summary(
    db: DbDep,
    year: int | None = Query(default=None, ge=2000, le=2100),
    industry_id: int | None = Query(default=None),
    owner_user_id: int | None = Query(default=None),
    event_id: int | None = Query(default=None),
    company_id: int | None = Query(default=None),
) -> ReportsResponse:
    return build_reports(
        db,
        year=year,
        industry_id=industry_id,
        owner_user_id=owner_user_id,
        event_id=event_id,
        company_id=company_id,
    )


@router.get("/export.csv")
def reports_export_csv(
    db: DbDep,
    year: int | None = Query(default=None, ge=2000, le=2100),
    industry_id: int | None = Query(default=None),
    owner_user_id: int | None = Query(default=None),
    event_id: int | None = Query(default=None),
    company_id: int | None = Query(default=None),
) -> Response:
    report = build_reports(
        db,
        year=year,
        industry_id=industry_id,
        owner_user_id=owner_user_id,
        event_id=event_id,
        company_id=company_id,
    )
    out = StringIO()
    writer = csv.writer(out)
    writer.writerow(["Sekcja", "Nazwa", "Wartość", "Dodatkowe"])
    writer.writerow(["Podsumowanie", "Firmy współpracujące", report.annual.collaborating_companies_count, ""])
    writer.writerow(["Podsumowanie", "Partnerzy", report.totals.partners_count, ""])
    writer.writerow(["Podsumowanie", "Łączna kwota", report.totals.total_value, "PLN"])
    writer.writerow([])
    writer.writerow(["Wydarzenie", "Status", "Partnerzy", "Kwota"])
    for event in report.events:
        writer.writerow([event.event_name, event.status.value, event.partners_count, event.total_value])
    writer.writerow([])
    writer.writerow(["Pipeline", "Etap", "Liczba firm", "Kwota"])
    for stage in report.pipeline_stages:
        writer.writerow([stage.stage_outcome, stage.stage_name, stage.count, stage.total_value])
    writer.writerow([])
    writer.writerow(["Historia firmy", "Firma", "Wydarzenie", "Etap", "Kwota"])
    for row in report.company_history:
        writer.writerow([
            row.company_name,
            row.event_name,
            row.stage_name,
            row.agreed_amount or row.expected_amount or 0,
        ])
    return Response(
        content=out.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="reports.csv"'},
    )
