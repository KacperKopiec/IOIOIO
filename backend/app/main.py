from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.activities import router as activities_router
from app.api.companies import router as companies_router
from app.api.company_relationships import router as company_relationships_router
from app.api.contacts import router as contacts_router
from app.api.dashboard import router as dashboard_router
from app.api.events import router as events_router
from app.api.health import router as health_router
from app.api.pipeline_entries import router as pipeline_entries_router
from app.api.reports import router as reports_router
from app.api.industries import router as industries_router
from app.api.pipeline_stages import router as pipeline_stages_router
from app.api.relationship_types import router as relationship_types_router
from app.api.roles import router as roles_router
from app.api.tags import router as tags_router
from app.api.users import router as users_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="AGH CRM", version="0.1.0", root_path="/api")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(industries_router)
    app.include_router(roles_router)
    app.include_router(tags_router)
    app.include_router(pipeline_stages_router)
    app.include_router(relationship_types_router)
    app.include_router(users_router)
    app.include_router(companies_router)
    app.include_router(contacts_router)
    app.include_router(events_router)
    app.include_router(pipeline_entries_router)
    app.include_router(activities_router)
    app.include_router(company_relationships_router)
    app.include_router(dashboard_router)
    app.include_router(reports_router)
    return app


app = create_app()
