#!/usr/bin/env python3
"""
SweepstacX Black-Box Lab Harness

Runs all four realistic scenarios:
1. Baseline scan (full analysis)
2. PR simulation (incremental git-diff scan)
3. AI fix + rescan (apply fixes, check regressions)
4. Custom rules scan

Produces clean artifact tree and metrics dashboard.
Does NOT touch the SweepstacX engine - pure CLI orchestration.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


def sh(cmd: List[str], cwd: Optional[Path] = None, capture: bool = True) -> subprocess.CompletedProcess:
    """Run shell command."""
    return subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        text=True,
        check=False,
    )


def must(proc: subprocess.CompletedProcess, what: str) -> None:
    """Fail if command returned non-zero."""
    if proc.returncode != 0:
        print(f"\n[FAIL] {what}\n--- STDOUT ---\n{proc.stdout}\n--- STDERR ---\n{proc.stderr}\n", file=sys.stderr)
        raise SystemExit(proc.returncode)


def log(msg: str, level: str = "INFO") -> None:
    """Log message."""
    ts = time.strftime("%H:%M:%S", time.localtime())
    print(f"[{ts}] [{level}] {msg}")


def write_json(path: Path, data: Any) -> None:
    """Write JSON artifact."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    """Write text artifact."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def now_iso() -> str:
    """ISO 8601 timestamp."""
    return time.strftime("%Y-%m-%dT%H-%M-%SZ", time.gmtime())


def git_clone_or_reset(url: str, name: str, workspace: Path, ref: str = "main") -> Path:
    """Clone or reset repo to deterministic state."""
    dest = workspace / name
    
    if not dest.exists():
        log(f"Cloning {name} from {url}")
        proc = sh(["git", "clone", "--depth", "50", url, str(dest)])
        must(proc, f"git clone {url}")
    
    log(f"Resetting {name} to {ref}")
    proc = sh(["git", "fetch", "--all", "--tags", "--prune"], cwd=dest)
    must(proc, "git fetch")
    
    proc = sh(["git", "checkout", ref], cwd=dest)
    must(proc, f"git checkout {ref}")
    
    proc = sh(["git", "reset", "--hard"], cwd=dest)
    must(proc, "git reset --hard")
    
    proc = sh(["git", "clean", "-fdx"], cwd=dest)
    must(proc, "git clean -fdx")
    
    return dest


@dataclass
class ScanResult:
    """Result of a single scan."""
    scenario: str
    repo_name: str
    status: str
    returncode: int
    stdout: str
    stderr: str
    duration_seconds: float
    timestamp: str


@dataclass
class ScenarioMetrics:
    """Metrics for a scenario."""
    scenario_id: str
    scenario_name: str
    repo_name: str
    status: str
    duration_seconds: float
    findings_count: int = 0
    error_message: Optional[str] = None


class LabHarness:
    """Black-box lab harness."""
    
    def __init__(self, lab_root: Path, workspace: Path, artifacts: Path):
        self.lab_root = lab_root
        self.workspace = workspace
        self.artifacts = artifacts
        self.run_id = now_iso()
        self.run_root = artifacts / self.run_id
        self.metrics: List[ScenarioMetrics] = []
    
    def prepare(self):
        """Prepare directories."""
        log("Preparing lab environment")
        self.run_root.mkdir(parents=True, exist_ok=True)
        self.workspace.mkdir(parents=True, exist_ok=True)
    
    def scenario_1_baseline_scan(self, repo_dir: Path, repo_name: str) -> ScanResult:
        """Scenario 1: Baseline scan (full analysis)."""
        log(f"[SCENARIO 1] Baseline scan of {repo_name}")
        
        out_dir = self.run_root / "scenario_1_baseline" / repo_name
        out_dir.mkdir(parents=True, exist_ok=True)
        
        t0 = time.time()
        
        # Run: sweepstacx scan --path <repo>
        cmd = ["sweepstacx", "scan", "--path", str(repo_dir)]
        proc = sh(cmd)
        
        duration = time.time() - t0
        
        # Capture output
        write_text(out_dir / "stdout.txt", proc.stdout)
        write_text(out_dir / "stderr.txt", proc.stderr)
        write_text(out_dir / "command.txt", " ".join(cmd))
        
        # Try to parse findings count
        findings_count = 0
        if proc.stdout:
            try:
                # Look for JSON in output
                for line in proc.stdout.split("\n"):
                    if "findings" in line.lower() or "issues" in line.lower():
                        findings_count += 1
            except:
                pass
        
        status = "ok" if proc.returncode == 0 else "fail"
        
        result = ScanResult(
            scenario="baseline",
            repo_name=repo_name,
            status=status,
            returncode=proc.returncode,
            stdout=proc.stdout,
            stderr=proc.stderr,
            duration_seconds=duration,
            timestamp=now_iso(),
        )
        
        metrics = ScenarioMetrics(
            scenario_id="1",
            scenario_name="Baseline Scan",
            repo_name=repo_name,
            status=status,
            duration_seconds=duration,
            findings_count=findings_count,
        )
        self.metrics.append(metrics)
        
        log(f"  ✓ {status} ({duration:.1f}s)")
        return result
    
    def scenario_2_pr_simulation(self, repo_dir: Path, repo_name: str) -> ScanResult:
        """Scenario 2: PR simulation (incremental git-diff scan)."""
        log(f"[SCENARIO 2] PR simulation of {repo_name}")
        
        out_dir = self.run_root / "scenario_2_pr_simulation" / repo_name
        out_dir.mkdir(parents=True, exist_ok=True)
        
        t0 = time.time()
        
        # Run: sweepstacx scan --path <repo> --git-diff --since HEAD~1
        cmd = ["sweepstacx", "scan", "--path", str(repo_dir), "--git-diff", "--since", "HEAD~1"]
        proc = sh(cmd)
        
        duration = time.time() - t0
        
        # Capture output
        write_text(out_dir / "stdout.txt", proc.stdout)
        write_text(out_dir / "stderr.txt", proc.stderr)
        write_text(out_dir / "command.txt", " ".join(cmd))
        
        status = "ok" if proc.returncode == 0 else "fail"
        
        result = ScanResult(
            scenario="pr_simulation",
            repo_name=repo_name,
            status=status,
            returncode=proc.returncode,
            stdout=proc.stdout,
            stderr=proc.stderr,
            duration_seconds=duration,
            timestamp=now_iso(),
        )
        
        metrics = ScenarioMetrics(
            scenario_id="2",
            scenario_name="PR Simulation (Git-Diff)",
            repo_name=repo_name,
            status=status,
            duration_seconds=duration,
        )
        self.metrics.append(metrics)
        
        log(f"  ✓ {status} ({duration:.1f}s)")
        return result
    
    def scenario_3_ai_fix_and_rescan(self, repo_dir: Path, repo_name: str) -> Dict[str, Any]:
        """Scenario 3: AI fix + rescan + regression check."""
        log(f"[SCENARIO 3] AI fix and rescan of {repo_name}")
        
        out_dir = self.run_root / "scenario_3_ai_fix_rescan" / repo_name
        out_dir.mkdir(parents=True, exist_ok=True)
        
        results = {
            "phase_1_baseline": None,
            "phase_2_fix": None,
            "phase_3_diff": None,
            "phase_4_rescan": None,
            "regression_check": None,
        }
        
        # Phase 1: Baseline scan
        log(f"  Phase 1: Baseline scan")
        t0 = time.time()
        cmd1 = ["sweepstacx", "scan", "--path", str(repo_dir)]
        proc1 = sh(cmd1)
        duration1 = time.time() - t0
        
        write_text(out_dir / "phase_1_baseline_stdout.txt", proc1.stdout)
        write_text(out_dir / "phase_1_baseline_stderr.txt", proc1.stderr)
        
        results["phase_1_baseline"] = {
            "status": "ok" if proc1.returncode == 0 else "fail",
            "duration": duration1,
        }
        
        # Phase 2: Apply fixes
        log(f"  Phase 2: Apply fixes")
        t0 = time.time()
        cmd2 = ["sweepstacx", "fix"]
        proc2 = sh(cmd2, cwd=repo_dir)
        duration2 = time.time() - t0
        
        write_text(out_dir / "phase_2_fix_stdout.txt", proc2.stdout)
        write_text(out_dir / "phase_2_fix_stderr.txt", proc2.stderr)
        
        results["phase_2_fix"] = {
            "status": "ok" if proc2.returncode == 0 else "fail",
            "duration": duration2,
        }
        
        # Phase 3: Capture diff
        log(f"  Phase 3: Capture diff")
        cmd3 = ["git", "diff"]
        proc3 = sh(cmd3, cwd=repo_dir)
        
        write_text(out_dir / "phase_3_diff.patch", proc3.stdout)
        
        results["phase_3_diff"] = {
            "status": "ok",
            "lines_changed": len(proc3.stdout.split("\n")),
        }
        
        # Phase 4: Rescan
        log(f"  Phase 4: Rescan after fixes")
        t0 = time.time()
        cmd4 = ["sweepstacx", "scan", "--path", str(repo_dir)]
        proc4 = sh(cmd4)
        duration4 = time.time() - t0
        
        write_text(out_dir / "phase_4_rescan_stdout.txt", proc4.stdout)
        write_text(out_dir / "phase_4_rescan_stderr.txt", proc4.stderr)
        
        results["phase_4_rescan"] = {
            "status": "ok" if proc4.returncode == 0 else "fail",
            "duration": duration4,
        }
        
        # Regression check: Compare phase 1 vs phase 4
        log(f"  Phase 5: Regression check")
        regression_detected = False
        if proc1.returncode == 0 and proc4.returncode == 0:
            # Simple heuristic: if rescan has more issues, it's a regression
            baseline_issues = proc1.stdout.count("issue") + proc1.stdout.count("finding")
            rescan_issues = proc4.stdout.count("issue") + proc4.stdout.count("finding")
            regression_detected = rescan_issues > baseline_issues
        
        results["regression_check"] = {
            "regression_detected": regression_detected,
            "baseline_issues": baseline_issues if proc1.returncode == 0 else None,
            "rescan_issues": rescan_issues if proc4.returncode == 0 else None,
        }
        
        total_duration = duration1 + duration2 + duration4
        
        metrics = ScenarioMetrics(
            scenario_id="3",
            scenario_name="AI Fix + Rescan",
            repo_name=repo_name,
            status="ok" if not regression_detected else "regression",
            duration_seconds=total_duration,
        )
        self.metrics.append(metrics)
        
        log(f"  ✓ complete ({total_duration:.1f}s, regression={regression_detected})")
        return results
    
    def scenario_4_custom_rules(self, repo_dir: Path, repo_name: str) -> ScanResult:
        """Scenario 4: Custom rules scan."""
        log(f"[SCENARIO 4] Custom rules scan of {repo_name}")
        
        out_dir = self.run_root / "scenario_4_custom_rules" / repo_name
        out_dir.mkdir(parents=True, exist_ok=True)
        
        t0 = time.time()
        
        # Run: sweepstacx scan --path <repo> --config <custom-rules-config>
        # For now, just run regular scan (custom rules would be in .sweeperc.json)
        cmd = ["sweepstacx", "scan", "--path", str(repo_dir), "--config", str(repo_dir / ".sweeperc.json")]
        proc = sh(cmd)
        
        duration = time.time() - t0
        
        # Capture output
        write_text(out_dir / "stdout.txt", proc.stdout)
        write_text(out_dir / "stderr.txt", proc.stderr)
        write_text(out_dir / "command.txt", " ".join(cmd))
        
        status = "ok" if proc.returncode == 0 else "fail"
        
        result = ScanResult(
            scenario="custom_rules",
            repo_name=repo_name,
            status=status,
            returncode=proc.returncode,
            stdout=proc.stdout,
            stderr=proc.stderr,
            duration_seconds=duration,
            timestamp=now_iso(),
        )
        
        metrics = ScenarioMetrics(
            scenario_id="4",
            scenario_name="Custom Rules Scan",
            repo_name=repo_name,
            status=status,
            duration_seconds=duration,
        )
        self.metrics.append(metrics)
        
        log(f"  ✓ {status} ({duration:.1f}s)")
        return result
    
    def run_all_scenarios(self, repos: List[Dict[str, str]]):
        """Run all four scenarios across all repos."""
        log(f"Starting lab run: {self.run_id}")
        
        for repo_spec in repos:
            repo_name = repo_spec["name"]
            repo_url = repo_spec["url"]
            repo_ref = repo_spec.get("ref", "main")
            
            log(f"\n=== Processing repo: {repo_name} ===")
            
            # Clone/reset repo
            repo_dir = git_clone_or_reset(repo_url, repo_name, self.workspace, repo_ref)
            
            # Run all four scenarios
            try:
                self.scenario_1_baseline_scan(repo_dir, repo_name)
                self.scenario_2_pr_simulation(repo_dir, repo_name)
                self.scenario_3_ai_fix_and_rescan(repo_dir, repo_name)
                self.scenario_4_custom_rules(repo_dir, repo_name)
            except Exception as e:
                log(f"Error processing {repo_name}: {e}", level="ERROR")
    
    def generate_dashboard(self):
        """Generate metrics dashboard."""
        log("\nGenerating metrics dashboard")
        
        dashboard = {
            "run_id": self.run_id,
            "timestamp": now_iso(),
            "scenarios": [asdict(m) for m in self.metrics],
            "summary": {
                "total_scenarios": len(self.metrics),
                "passed": sum(1 for m in self.metrics if m.status == "ok"),
                "failed": sum(1 for m in self.metrics if m.status != "ok"),
                "total_duration_seconds": sum(m.duration_seconds for m in self.metrics),
            },
        }
        
        write_json(self.run_root / "dashboard.json", dashboard)
        
        # Also write markdown summary
        md = "# Lab Run Summary\n\n"
        md += f"**Run ID:** {self.run_id}\n"
        md += f"**Total Scenarios:** {dashboard['summary']['total_scenarios']}\n"
        md += f"**Passed:** {dashboard['summary']['passed']}\n"
        md += f"**Failed:** {dashboard['summary']['failed']}\n"
        md += f"**Total Duration:** {dashboard['summary']['total_duration_seconds']:.1f}s\n\n"
        
        md += "## Scenario Results\n\n"
        for m in self.metrics:
            md += f"- **{m.scenario_name}** ({m.repo_name}): {m.status} ({m.duration_seconds:.1f}s)\n"
        
        write_text(self.run_root / "DASHBOARD.md", md)
        
        log(f"Dashboard written to {self.run_root}")
        print(json.dumps(dashboard, indent=2))
    
    def cleanup_workspace(self, keep: bool = False):
        """Clean up workspace."""
        if not keep:
            log("Cleaning up workspace")
            shutil.rmtree(self.workspace, ignore_errors=True)


def main() -> int:
    """Main entry point."""
    ap = argparse.ArgumentParser(description="SweepstacX Black-Box Lab Harness")
    ap.add_argument("--config", required=True, help="Lab configuration YAML")
    ap.add_argument("--keep-workspace", action="store_true", help="Keep workspace after run")
    args = ap.parse_args()
    
    config_path = Path(args.config).resolve()
    with config_path.open("r") as f:
        config = yaml.safe_load(f)
    
    lab_root = config_path.parent
    workspace = Path(config.get("workspace", ".lab/workspace")).resolve()
    artifacts = Path(config.get("artifacts", ".lab/artifacts")).resolve()
    
    harness = LabHarness(lab_root, workspace, artifacts)
    harness.prepare()
    
    repos = config.get("repos", [])
    harness.run_all_scenarios(repos)
    harness.generate_dashboard()
    harness.cleanup_workspace(keep=args.keep_workspace)
    
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
