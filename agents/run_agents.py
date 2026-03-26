#!/usr/bin/env python3
"""Design Mark X — conceptual parallel agent runner (documentation aid, not CI)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / "config.json"


def main() -> None:
    if not CONFIG.exists():
        print("Missing agents/config.json")
        return
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    name = config.get("system_name", "Design Mark X")
    print(f"Running {name}...")
    for agent in config.get("agents", []):
        print(f"Running {agent}...")
    print("All agents executed in parallel (conceptually).")
    print("Supervisor reviewing outputs...")


if __name__ == "__main__":
    main()
