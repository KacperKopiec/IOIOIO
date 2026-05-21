from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = Field(
        default="postgresql://postgres:password@db:5432/app_db",
        alias="DATABASE_URL",
    )
    app_env: str = Field(default="dev", alias="APP_ENV")
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost", "http://localhost:5173"],
        alias="CORS_ORIGINS",
    )

    smtp_host: str | None = Field(default=None, alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_user: str | None = Field(default=None, alias="SMTP_USER")
    smtp_password: str | None = Field(default=None, alias="SMTP_PASSWORD")
    smtp_from: str = Field(default="crm-noreply@agh.edu.pl", alias="SMTP_FROM")
    smtp_use_tls: bool = Field(default=True, alias="SMTP_USE_TLS")
    smtp_use_ssl: bool = Field(default=False, alias="SMTP_USE_SSL")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
