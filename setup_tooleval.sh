#!/usr/bin/env bash
# One-shot bootstrap for a Python "tooleval" evaluator that runs Ruff, Flake8, Pylint,
# aggregates results, and includes unit tests. After running this script:
#   1) python -m venv .venv && source .venv/bin/activate
#   2) pip install -e .
#   3) tooleval . --format pretty
#   4) pytest -q
set -euo pipefail

pkg="tooleval"
mkdir -p "$pkg" tests

#####################################
# pyproject.toml
#####################################
cat > pyproject.toml << 'PYTOML'
[project]
name = "tooleval"
version = "0.1.0"
description = "Unified Python code evaluator that runs Ruff, Flake8, and Pylint and aggregates results."
readme = "README.md"
requires-python = ">=3.10"
authors = [{ name = "D", email = "dev@example.com" }]
dependencies = [
  "rich>=13.7.1",
]

[project.optional-dependencies]
dev = [
  "ruff>=0.5.6",
  "flake8>=7.1.0",
  "pylint>=3.2.6",
  "pytest>=8.3.2",
]

[project.scripts]
tooleval = "tooleval.cli:main"

[tool.ruff]
line-length = 100
target-version = "py312"
# E,F: pycodestyle/pyflakes; I: isort; B: bugbear-like rules
select = ["E", "F", "I", "B"]
ignore = ["E203", "E266", "E501"] # examples; adjust to your liking

[tool.flake8]
max-line-length = 100
extend-ignore = "E203,E266,E501"

[tool.pylint.main]
disable = [
  "missing-module-docstring",
  "missing-class-docstring",
  "missing-function-docstring",
]
max-line-length = 100
good-names = ["i", "j", "k", "e", "x", "y", "df"]

[tool.pytest.ini_options]
addopts = "-q"

PYTOML

#####################################
# README.md
#####################################
cat > README.md << 'MD'
# tooleval

Run **Ruff**, **Flake8**, and **Pylint** across your codebase and get a single JSON (or pretty) report.

## Quickstart

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
tooleval . --format pretty
pytest -q
CLI
tooleval [TARGET ...] [--format {json,pretty}] [--exit-zero]
          [--no-ruff] [--no-flake8] [--no-pylint]
TARGET: files/dirs (default: current dir)

--format: json (machine) or pretty (human)

--exit-zero: always exit 0 even if issues were found

*--no- **: skip a specific tool
MD

#####################################

Package init
#####################################
cat > "$pkg/init.py" << 'PY'
all = ["version"]
version = "0.1.0"
PY

#####################################

CLI implementation
#####################################
cat > "$pkg/cli.py" << 'PY'
from future import annotations

import json
import re
import shlex
import subprocess
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, List, Tuple

try:
from rich.console import Console
from rich.table import Table
except Exception: # pragma: no cover
Console = None
Table = None

@dataclass
class Issue:
tool: str
file: str
line: int
column: int
code: str
message: str
severity: str = "warning" # or "error"

def _run(cmd: List[str]) -> Tuple[int, str, str]:
"""Run a subprocess command, capturing output without raising."""
proc = subprocess.run(cmd, capture_output=True, text=True)
return proc.returncode, proc.stdout.strip(), proc.stderr.strip()

--------------------------
Ruff
--------------------------
def run_ruff(targets: Iterable[str]) -> List[Issue]:
issues: List[Issue] = []
cmd = ["ruff", "check", "--format", "json", *targets]
rc, out, err = _run(cmd)
# Ruff emits JSON list; nonzero exit on findings is normal.
if out:
try:
data = json.loads(out)
for entry in data:
loc = entry.get("location", {})
issues.append(
Issue(
tool="ruff",
file=str(entry.get("filename", "")),
line=int(loc.get("row", 0) or 0),
column=int(loc.get("column", 0) or 0),
code=str(entry.get("code", "")),
message=str(entry.get("message", "")),
severity="error" if entry.get("fix", None) is None else "warning",
)
)
except json.JSONDecodeError:
pass
return issues

--------------------------
Flake8 (text output)
--------------------------
_FLAKE_RE = re.compile(r"^(?P<file>.?):(?P<line>\d+):(?P<col>\d+):\s(?P<code>\w\d+)\s(?P<msg>.)$")

def parse_flake8_text(text: str) -> List[Issue]:
found: List[Issue] = []
for line in text.splitlines():
m = _FLAKE_RE.match(line.strip())
if not m:
continue
d = m.groupdict()
found.append(
Issue(
tool="flake8",
file=d["file"],
line=int(d["line"]),
column=int(d["col"]),
code=d["code"],
message=d["msg"],
severity="error" if d["code"].startswith(("F", "E")) else "warning",
)
)
return found

def run_flake8(targets: Iterable[str]) -> List[Issue]:
issues: List[Issue] = []
cmd = ["flake8", *targets]
rc, out, err = _run(cmd)
text = "\n".join([out, err]).strip()
# flake8 prints findings to stdout/stderr, non-zero exit on issues.
if text:
issues.extend(parse_flake8_text(text))
return issues

--------------------------
Pylint (JSON)
--------------------------
def run_pylint(targets: Iterable[str]) -> List[Issue]:
issues: List[Issue] = []
# --score=n to suppress summary score; --output-format=json for machine output
cmd = ["pylint", "--score=n", "--output-format=json", *targets]
rc, out, err = _run(cmd)
payload = out or err
if payload:
try:
data = json.loads(payload)
for item in data:
issues.append(
Issue(
tool="pylint",
file=item.get("path") or item.get("module", ""),
line=int(item.get("line", 0) or 0),
column=int(item.get("column", 0) or 0),
code=str(item.get("symbol", item.get("message-id", ""))),
message=str(item.get("message", "")),
severity=item.get("type", "warning"),
)
)
except json.JSONDecodeError:
pass
return issues

def pretty_print(issues: List[Issue]) -> None:
if Console is None or Table is None:
print(json.dumps({"issues": [asdict(i) for i in issues]}, indent=2))
return
console = Console()
if not issues:
console.print("[bold green]✅ No issues found.[/bold green]")
return
table = Table(title=f"Issues ({len(issues)})")
table.add_column("Tool", style="cyan", no_wrap=True)
table.add_column("File", style="magenta")
table.add_column("Line", justify="right")
table.add_column("Col", justify="right")
table.add_column("Code", style="yellow", no_wrap=True)
table.add_column("Severity", style="red", no_wrap=True)
table.add_column("Message")
for i in issues:
table.add_row(
i.tool,
str(i.file),
str(i.line),
str(i.column),
i.code,
i.severity,
i.message,
)
console.print(table)

def parse_args(argv: List[str]) -> dict:
# Minimal manual arg parsing
targets: List[str] = []
fmt = "json"
exit_zero = False
use_ruff = True
use_flake8 = True
use_pylint = True

it = iter(argv[1:])
for a in it:
    if a == "--format":
        fmt = next(it, fmt)
    elif a == "--exit-zero":
        exit_zero = True
    elif a == "--no-ruff":
        use_ruff = False
    elif a == "--no-flake8":
        use_flake8 = False
    elif a == "--no-pylint":
        use_pylint = False
    elif a.startswith("-"):
        print(f"Unknown option: {a}", file=sys.stderr)
        sys.exit(2)
    else:
        targets.append(a)
if not targets:
    targets = ["."]
return {
    "targets": targets,
    "format": fmt,
    "exit_zero": exit_zero,
    "use_ruff": use_ruff,
    "use_flake8": use_flake8,
    "use_pylint": use_pylint,
}
def main(argv: List[str] | None = None) -> int:
argv = argv or sys.argv
args = parse_args(argv)
targets = args["targets"]

issues: List[Issue] = []
if args["use_ruff"]:
    issues.extend(run_ruff(targets))
if args["use_flake8"]:
    issues.extend(run_flake8(targets))
if args["use_pylint"]:
    issues.extend(run_pylint(targets))

if args["format"] == "pretty":
    pretty_print(issues)
else:
    print(json.dumps({"issues": [asdict(i) for i in issues]}, indent=2))

exit_code = 0 if (args["exit_zero"] or not issues) else 1
return exit_code
if name == "main": # pragma: no cover
raise SystemExit(main())
PY

#####################################

Tests: unit tests for parsers and CLI glue
#####################################
cat > tests/test_parsers.py << 'PY'
from tooleval.cli import parse_flake8_text, Issue

def test_parse_flake8_text_basic():
sample = "pkg/mod.py:12:8: E225 missing whitespace around operator\n"
"pkg/app.py:3:1: F401 'os' imported but unused"
issues = parse_flake8_text(sample)
assert len(issues) == 2
a, b = issues
assert a.tool == "flake8" and a.file == "pkg/mod.py" and a.line == 12 and a.code == "E225"
assert b.code == "F401" and b.file == "pkg/app.py" and b.line == 3
PY

cat > tests/test_cli_args.py << 'PY'
from tooleval import version
from tooleval.cli import parse_args

def test_parse_args_defaults():
args = parse_args(["tooleval"])
assert args["targets"] == ["."]
assert args["format"] == "json"
assert not args["exit_zero"]
assert args["use_ruff"] and args["use_flake8"] and args["use_pylint"]

def test_parse_args_flags():
args = parse_args(["tooleval", "--format", "pretty", "--exit-zero", "--no-ruff", "src"])
assert args["targets"] == ["src"]
assert args["format"] == "pretty"
assert args["exit_zero"] is True
assert not args["use_ruff"]
PY

#####################################

Done
#####################################
echo "✅ Bootstrapped tooleval."
echo "Next:"
echo " python -m venv .venv && source .venv/bin/activate"
echo " pip install -e '.[dev]'"
echo " tooleval . --format pretty || true"
echo " pytest -q"
