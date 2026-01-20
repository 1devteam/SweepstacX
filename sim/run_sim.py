#!/usr/bin/env python3
"""
SweepstacX Scenario Runner

Deterministic test harness for benchmarking SweepstacX across multiple repos.
Produces reproducible artifacts, metrics, and regression detection.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


def sh(cmd: List[str], cwd: Optional[Path] = None, env: Optional[Dict[str, str]] = None) -> subprocess.CompletedProcess:
    """Run shell command, capture output."""
    return subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )


def must(proc: subprocess.CompletedProcess, what: str) -> None:
    """Fail if command returned non-zero."""
    if proc.returncode != 0:
        print(f"\n[FAIL] {what}\n--- STDOUT ---\n{proc.stdout}\n--- STDERR ---\n{proc.stderr}\n", file=sys.stderr)
        raise SystemExit(proc.returncode)


@dataclass
class RepoSpec:
    name: str
    url: str
    ref: str


@dataclass
class TaskSpec:
    id: str
    type: str
    args: Dict[str, Any]


def load_scenario(path: Path) -> Dict[str, Any]:
    """Load scenario YAML."""
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def ensure_clean_dir(p: Path) -> None:
    """Ensure directory is empty and exists."""
    if p.exists():
        shutil.rmtree(p)
    p.mkdir(parents=True, exist_ok=True)


def git_clone_or_reset(repo: RepoSpec, workspace: Path) -> Path:
    """Clone or reset repo to deterministic state."""
    dest = workspace / repo.name
    if not dest.exists():
        proc = sh(["git", "clone", "--depth", "50", repo.url, str(dest)])
        must(proc, f"git clone {repo.url}")
    
    # Fetch + checkout ref deterministically
    proc = sh(["git", "fetch", "--all", "--tags", "--prune"], cwd=dest)
    must(proc, "git fetch")
    
    proc = sh(["git", "checkout", repo.ref], cwd=dest)
    must(proc, f"git checkout {repo.ref}")
    
    proc = sh(["git", "reset", "--hard"], cwd=dest)
    must(proc, "git reset --hard")
    
    proc = sh(["git", "clean", "-fdx"], cwd=dest)
    must(proc, "git clean -fdx")
    
    return dest


def write_artifact(path: Path, data: Any) -> None:
    """Write artifact (JSON, text, etc)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, (dict, list)):
        path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
    else:
        path.write_text(str(data), encoding="utf-8")


def now_iso() -> str:
    """ISO 8601 timestamp."""
    return time.strftime("%Y-%m-%dT%H-%M-%SZ", time.gmtime())


def run_scan_full(repo_dir: Path, out_json: Path, fmt: str) -> Dict[str, Any]:
    """Run full scan on repo."""
    cmd = ["sweepstacx", "scan", "--path", str(repo_dir), "--json"]
    proc = sh(cmd)
    must(proc, f"scan_full {repo_dir.name}")
    
    try:
        payload = json.loads(proc.stdout) if proc.stdout.strip() else {"stdout": proc.stdout, "stderr": proc.stderr}
    except json.JSONDecodeError:
        payload = {"stdout": proc.stdout, "stderr": proc.stderr}
    
    write_artifact(out_json, payload)
    return {"cmd": cmd, "returncode": proc.returncode, "output_file": str(out_json)}


def run_scan_git_diff(repo_dir: Path, out_json: Path, base_ref: str, fmt: str) -> Dict[str, Any]:
    """Run incremental scan (git diff mode)."""
    cmd = ["sweepstacx", "scan", "--path", str(repo_dir), "--git-diff", "--since", base_ref, "--json"]
    proc = sh(cmd, cwd=repo_dir)
    must(proc, f"scan_git_diff {repo_dir.name}")
    
    try:
        payload = json.loads(proc.stdout) if proc.stdout.strip() else {"stdout": proc.stdout, "stderr": proc.stderr}
    except json.JSONDecodeError:
        payload = {"stdout": proc.stdout, "stderr": proc.stderr}
    
    write_artifact(out_json, payload)
    return {"cmd": cmd, "returncode": proc.returncode, "output_file": str(out_json)}


def run_custom_rules_scan(repo_dir: Path, out_json: Path, fmt: str, rules_path: Path) -> Dict[str, Any]:
    """Run scan with custom rules."""
    cmd = ["sweepstacx", "scan", "--path", str(repo_dir), "--json"]
    proc = sh(cmd)
    must(proc, f"custom_rules_scan {repo_dir.name}")
    
    try:
        payload = json.loads(proc.stdout) if proc.stdout.strip() else {"stdout": proc.stdout, "stderr": proc.stderr}
    except json.JSONDecodeError:
        payload = {"stdout": proc.stdout, "stderr": proc.stderr}
    
    write_artifact(out_json, payload)
    return {"cmd": cmd, "returncode": proc.returncode, "output_file": str(out_json), "rules_path": str(rules_path)}


def main() -> int:
    """Main runner."""
    ap = argparse.ArgumentParser(description="SweepstacX Scenario Runner")
    ap.add_argument("--scenario", required=True, help="Path to scenario YAML")
    args = ap.parse_args()

    scenario_path = Path(args.scenario).resolve()
    cfg = load_scenario(scenario_path)

    workspace = Path(cfg.get("workspace", ".sim/workspace")).resolve()
    artifacts = Path(cfg.get("artifacts", ".sim/artifacts")).resolve()

    run_id = now_iso()
    run_root = artifacts / run_id
    run_root.mkdir(parents=True, exist_ok=True)

    # Snapshot scenario used
    write_artifact(run_root / "scenario.yml", scenario_path.read_text(encoding="utf-8"))

    repos = [RepoSpec(**r) for r in cfg["repos"]]
    tasks = [TaskSpec(id=t["id"], type=t["type"], args=t.get("args", {})) for t in cfg["tasks"]]

    workspace.mkdir(parents=True, exist_ok=True)

    summary: Dict[str, Any] = {
        "run_id": run_id,
        "scenario": str(scenario_path),
        "repos": {},
        "started": time.time(),
    }

    for r in repos:
        print(f"\n[INFO] Processing repo: {r.name}")
        repo_dir = git_clone_or_reset(r, workspace)
        repo_out = run_root / "repos" / r.name
        repo_out.mkdir(parents=True, exist_ok=True)

        summary["repos"][r.name] = {"url": r.url, "ref": r.ref, "tasks": {}}

        for t in tasks:
            t0 = time.time()
            t_out = repo_out / t.id
            t_out.mkdir(parents=True, exist_ok=True)

            print(f"  → Task: {t.id}")

            try:
                if t.type == "scan_full":
                    fmt = str(t.args.get("format", "json"))
                    meta = run_scan_full(repo_dir, t_out / "result.json", fmt)
                elif t.type == "scan_git_diff":
                    fmt = str(t.args.get("format", "json"))
                    base_ref = str(t.args.get("base_ref", "HEAD~1"))
                    meta = run_scan_git_diff(repo_dir, t_out / "result.json", base_ref, fmt)
                elif t.type == "custom_rules_scan":
                    fmt = str(t.args.get("format", "json"))
                    rules_path = Path(str(t.args.get("rules_path", "rules/custom"))).resolve()
                    meta = run_custom_rules_scan(repo_dir, t_out / "result.json", fmt, rules_path)
                else:
                    raise ValueError(f"Unknown task type: {t.type}")

                status = "ok"
            except Exception as e:
                meta = {"error": str(e)}
                status = "fail"

            elapsed = round(time.time() - t0, 3)
            summary["repos"][r.name]["tasks"][t.id] = {
                "type": t.type,
                "status": status,
                "seconds": elapsed,
                "meta": meta,
            }
            print(f"    ✓ {status} ({elapsed}s)")

    summary["finished"] = time.time()
    summary["total_seconds"] = round(summary["finished"] - summary["started"], 3)
    write_artifact(run_root / "summary.json", summary)

    print(f"\n[SUCCESS] Run complete")
    print(json.dumps({"run_id": run_id, "artifacts": str(run_root), "total_seconds": summary["total_seconds"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
