from pathlib import Path


def test_repo_has_core_files():
    root = Path(__file__).resolve().parents[1]
    assert (root / "pyproject.toml").exists()
    assert (root / "Makefile").exists()
