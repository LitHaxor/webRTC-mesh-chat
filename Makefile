.PHONY: up down logs install test

ENV_FILE := $(wildcard client/.env.local)
COMPOSE := docker compose $(if $(ENV_FILE),--env-file $(ENV_FILE))

up:
	$(COMPOSE) up --build -d
	@echo "App on http://localhost:3000, signal-svc on http://localhost:8080"

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

install:
	$(MAKE) -C signal-svc install
	npm --prefix client install

test:
	$(MAKE) -C signal-svc test
	npm --prefix client test
	npm --prefix client run test:e2e
