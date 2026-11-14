.PHONY: install dev start test coverage lint format

PORT ?= 8080

install:
	uv venv
	uv pip install -r requirements/dev.txt
	.venv/bin/pre-commit install

dev:
	.venv/bin/uvicorn app.main:app --port $(PORT) --reload

start:
	.venv/bin/uvicorn app.main:app --port $(PORT)

test:
	.venv/bin/pytest

coverage:
	.venv/bin/pytest --cov=app --cov-report=term-missing

lint:
	.venv/bin/ruff check .
	.venv/bin/ruff format --check .

format:
	.venv/bin/ruff check --fix .
	.venv/bin/ruff format .
