.PHONY: test lint sim-venv sim-run sim-clean

# Testing
test:
	npm test

lint:
	npm run lint

# Simulation / Benchmarking
SIM_VENV := .sim/venv

sim-venv:
	python3 -m venv $(SIM_VENV)
	$(SIM_VENV)/bin/pip install -U pip
	$(SIM_VENV)/bin/pip install -r sim/requirements.txt

sim-run: sim-venv
	$(SIM_VENV)/bin/python sim/run_sim.py --scenario sim/scenarios/default.yml

sim-clean:
	rm -rf .sim/

.PHONY: help
help:
	@echo "SweepstacX Makefile targets:"
	@echo ""
	@echo "  test          - Run test suite"
	@echo "  lint          - Run linter"
	@echo "  sim-venv      - Create Python venv for simulation"
	@echo "  sim-run       - Run scenario benchmarks"
	@echo "  sim-clean     - Clean simulation artifacts"
	@echo ""
	@echo "Example: make sim-run"
