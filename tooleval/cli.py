import argparse
import fnmatch
import json
import os
import subprocess
import sys
from pathlib import Path


def get_changed_files(base_path: Path) -> list[str]:
    """Return changed Python files vs origin/main (best-effort)."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "origin/main...HEAD"],
            cwd=base_path,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        return []
    if result.returncode != 0:
        return []
    return [f for f in result.stdout.splitlines() if f.endswith(".py")]


def has_test_files(base_path: Path) -> bool:
    """Detect pytest-style test files anywhere in the tree."""
    patterns = ["test_*.py", "*_test.py"]
    for _root, _dirs, files in os.walk(base_path):
        for fname in files:
            if any(fnmatch.fnmatch(fname, pat) for pat in patterns):
                return True
    return False


def run_cmd(cmd, cwd=None) -> subprocess.CompletedProcess:
    if isinstance(cmd, str):
        cmd = cmd.split()
    try:
        return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    except FileNotFoundError:
        return subprocess.CompletedProcess(cmd, 0, stdout="", stderr="")


def parse_json_output(text: str):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return []


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(description="Adaptive sweep with next-action suggestions.")
    parser.add_argument("path", nargs="?", default=".", help="Project path.")
    parser.add_argument("--changed-only", action="store_true")
    parser.add_argument("--next", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    base_path = Path(args.path).resolve()

    files = None
    if args.changed_only:
        files = get_changed_files(base_path)
        if not files:
            print("No Python file changes detected.")
            sys.exit(0)

    issues = []

    # Ruff (explicit `check`)
    ruff_cmd = ["ruff", "check", "--format", "json"]
    if files:
        ruff_cmd.extend(files)
    else:
        ruff_cmd.append(str(base_path))
    result = run_cmd(ruff_cmd, cwd=base_path)
    issues.extend(parse_json_output(result.stdout))

    # Flake8
    flake8_cmd = ["flake8"]
    if files:
        flake8_cmd.extend(files)
    else:
        flake8_cmd.append(str(base_path))
    result = run_cmd(flake8_cmd, cwd=base_path)
    for line in result.stdout.splitlines():
        if line:
            issues.append({"tool": "flake8", "output": line})

    # Pylint
    pylint_cmd = ["pylint", "-f", "json"]
    if files:
        pylint_cmd.extend(files)
    else:
        pylint_cmd.append(str(base_path))
    result = run_cmd(pylint_cmd, cwd=base_path)
    issues.extend(parse_json_output(result.stdout))

    # Pytest (only if tests exist)
    if has_test_files(base_path):
        result = run_cmd(["pytest", "-q"], cwd=base_path)
        if result.returncode != 0:
            issues.append({"tool": "pytest", "output": "Tests failed"})

    if args.json:
        print(json.dumps({"issues": issues}, indent=2))
    else:
        for issue in issues:
            if "output" in issue:
                print(f"[{issue['tool']}] {issue['output']}")
            else:
                print(f"[{issue.get('tool', '')}] {issue}")

        if args.next:
            print("\nNext action plan:")
            if any(i.get("tool") == "ruff" for i in issues):
                print("1) ruff check . --fix")
            elif any(i.get("tool") == "flake8" for i in issues):
                print("1) fix Flake8 issues above")
            elif any(i.get("tool") == "pylint" for i in issues):
                print("1) review Pylint diagnostics")
            elif any(i.get("tool") == "pytest" for i in issues):
                print("1) investigate failing tests; run: pytest -q")
            else:
                print("✅ No issues found.")


if __name__ == "__main__":
    main()
