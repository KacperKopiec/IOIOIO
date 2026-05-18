set -e

uv run alembic upgrade head

if [ "${RUN_SEEDS:-1}" != "0" ]; then
  uv run python -m app.db.seeds
fi

if [ "${RUN_DEMO_SEED:-1}" != "0" ]; then
  uv run python -m app.db.seeds_demo
fi

exec uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
