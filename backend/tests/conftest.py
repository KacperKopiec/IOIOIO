"""Shared pytest fixtures.

Uses the live dev database — assumes `python -m app.db.seeds` + `seeds_demo`
have been run. Mutation tests create rows with unique slugs so they are
self-isolating.
"""
from __future__ import annotations

import uuid
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    with TestClient(app) as c:
        yield c


@pytest.fixture
def unique_slug() -> str:
    return uuid.uuid4().hex[:8]
