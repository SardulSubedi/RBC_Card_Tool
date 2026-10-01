"""Read the versioned CardFit catalog. The browser app uses the same file."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "catalog" / "catalog.json"


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def run_node(args: list[str], input_text: str | None = None) -> subprocess.CompletedProcess[str]:
    """npx is a .cmd shim on Windows and is not executable through CreateProcess."""
    command = ["npx", *args]
    if Path.cwd().anchor and __import__("os").name == "nt":
        command = ["cmd", "/c", *command]
    return subprocess.run(
        command,
        input=input_text,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        cwd=ROOT,
    )


def validate_catalog(catalog: dict) -> list[str]:
    errors: list[str] = []
    slugs: set[str] = set()
    source_ids = {source["id"] for source in catalog["sources"]}
    program_ids = {program["id"] for program in catalog["programs"]}
    for card in catalog["cards"]:
        if card["slug"] in slugs:
            errors.append(f"Duplicate slug {card['slug']}")
        slugs.add(card["slug"])
        intervals = []
        for version in card["termVersions"]:
            if version["sourceId"] not in source_ids:
                errors.append(f"{version['id']} is missing source {version['sourceId']}")
            if version["rewardProgramId"] not in program_ids:
                errors.append(f"{version['id']} points at an unknown reward program")
            start = version["effectiveFrom"] or "0000-01-01"
            end = version["effectiveTo"] or "9999-12-31"
            intervals.append((start, end, version["id"]))
            if version["purchaseApr"] is not None and not 0 <= version["purchaseApr"] <= 1:
                errors.append(f"{version['id']} stores APR as a percent instead of a fraction")
            if card["rankEligible"] and not version["rules"]:
                errors.append(f"{version['id']} is rankable without reward rules")
            for rule in version["rules"]:
                if rule["sourceId"] not in source_ids:
                    errors.append(f"Orphan or unsourced rule {rule['id']}")
                if rule["earnUnit"] not in {"cash_back_fraction", "points_per_cad"}:
                    errors.append(f"Rule {rule['id']} has an invalid earn unit")
                if rule["earnUnit"] == "cash_back_fraction" and not 0 <= rule["earnRate"] <= 1:
                    errors.append(f"Rule {rule['id']} has an invalid cash-back fraction")
                if (rule["tierUpperCad"] is not None or rule["tierLowerCad"] > 0) and not rule["capGroupId"]:
                    errors.append(f"Rule {rule['id']} has a tier without a cap group")
        intervals.sort()
        for previous, current in zip(intervals, intervals[1:]):
            if current[0] <= previous[1]:
                errors.append(f"{card['slug']} has overlapping terms {previous[2]} and {current[2]}")
    return errors
