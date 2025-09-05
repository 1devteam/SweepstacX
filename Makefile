.PHONY: setup venv deps precommit lint test sweep format migrate-black migrate-ruff-fmt plugins ci all

# one-shot: venv + deps + pre-commit
setup: venv deps precommit

venv:
	python3 -m venv .venv

deps:
	. .venv/bin/activate && pip install -r requirements-dev.txt

precommit:
	. .venv/bin/activate && pre-commit install

lint:
	. .venv/bin/activate && ruff check . --fix || true
	. .venv/bin/activate && flake8 . || true
	. .venv/bin/activate && pylint $${PKG:-src} || true

# Always capture pytest exit code; treat 5 (no tests) as success
test:
	. .venv/bin/activate; \
	pytest -q; rc=$$?; \
	if [ $$rc -eq 5 ]; then \
	  echo "No tests collected (ok)"; \
	  exit 0; \
	elif [ $$rc -eq 0 ]; then \
	  exit 0; \
	else \
	  exit $$rc; \
	fi

sweep: lint
	@echo "--- Sweep complete ---"
	@if ruff check . | grep . >/dev/null; then \
	  echo "Run: ruff check . --fix"; \
	else \
	  echo "No Ruff issues."; \
	fi
	@if flake8 . | grep . >/dev/null; then \
	  echo "Fix Flake8 issues above."; \
	else \
	  echo "No Flake8 issues."; \
	fi
	@if pylint $${PKG:-src} | grep . >/dev/null; then \
	  echo "Review Pylint output for deeper fixes."; \
	else \
	  echo "No Pylint issues."; \
	fi
	@. .venv/bin/activate; \
	pytest -q; rc=$$?; \
	if [ $$rc -eq 5 ]; then \
	  echo "No tests collected (ok)"; \
	  exit 0; \
	elif [ $$rc -eq 0 ]; then \
	  exit 0; \
	else \
	  exit $$rc; \
	fi

format:
	. .venv/bin/activate && ruff check . --fix
	. .venv/bin/activate && ruff format .

migrate-black:
	. .venv/bin/activate && tooleval . --migrate black

migrate-ruff-fmt:
	. .venv/bin/activate && tooleval . --migrate ruff-fmt

plugins:
	. .venv/bin/activate && tooleval . --plugins

ci:
	. .venv/bin/activate && tooleval . --plugins --json --next > sweep_report.json || exit 1

all: deps sweep
