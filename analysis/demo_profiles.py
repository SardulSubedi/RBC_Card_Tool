"""Compare the four fictional demo profiles with the same engine the app uses."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from catalog_io import ROOT, run_node

OUTPUT = ROOT / "analysis" / "output" / "demo_profile_comparison.csv"
ENGINE = ROOT / "packages" / "engine" / "src" / "cli.ts"


def recommend(profile: dict) -> dict:
    completed = run_node(["tsx", str(ENGINE), "recommend"], json.dumps(profile))
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr or completed.stdout)
    return json.loads(completed.stdout)


def profiles() -> list[dict]:
    # Imported through the CLI so this report cannot drift from the app demos.
    completed = run_node(
        ["tsx", "-e", "import { demos } from './packages/engine/src/demos.ts'; console.log(JSON.stringify(demos))"]
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr)
    return json.loads(completed.stdout)


def main() -> None:
    rows = []
    for demo in profiles():
        result = recommend(demo["profile"])
        winner = result["ranked"][0] if result["ranked"] else None
        rows.append(
            {
                "profile": demo["label"],
                "monthly_spend_cad": result["monthlyTotalCad"],
                "winner": None if winner is None else winner["card"]["name"],
                "ongoing_net_cad": None if winner is None else winner["projection"]["ongoingNetCad"],
                "rewards_cad": None if winner is None else winner["projection"]["rewardValueCad"],
                "annual_fee_cad": None if winner is None else winner["projection"]["applicableFeeCad"],
                "interest_cad": None if winner is None else winner["projection"]["interestCad"],
                "near_tie": result["nearTie"],
                "interest_excluded": result["interestExcludedFromRanking"],
                "cards_ranked": len(result["ranked"]),
            }
        )
    frame = pd.DataFrame(rows)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(OUTPUT, index=False)
    print(frame.to_string(index=False))
    print(f"\nWrote {OUTPUT}")


if __name__ == "__main__":
    main()
