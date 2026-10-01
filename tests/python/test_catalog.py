import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "analysis"))

from catalog_io import load_catalog, run_node, validate_catalog  # noqa: E402
from seed_catalog import DB_PATH, main as seed  # noqa: E402


def test_catalog_has_no_structural_errors():
    errors = validate_catalog(load_catalog())
    assert errors == []


def test_sqlite_returns_october_cash_back_rules():
    seed()
    connection = sqlite3.connect(DB_PATH)
    rows = connection.execute(
        """
        SELECT v.annual_fee_cad, r.earn_rate, r.category
        FROM cards c
        JOIN card_term_versions v ON v.card_id = c.id
        JOIN reward_rules r ON r.term_version_id = v.id
        WHERE c.slug = 'rbc-cash-back-mastercard'
          AND v.effective_from = '2026-10-01'
          AND r.category = 'groceries'
        """
    ).fetchall()
    connection.close()
    assert rows
    assert rows[0][0] == 0
    assert rows[0][1] == 0.02


def test_engine_bridge_matches_hand_check():
    profile = {
        "monthly": {
            "groceries": 100,
            "warehouse": 100,
            "dining": 0,
            "gas": 100,
            "ev_charging": 0,
            "transit": 0,
            "rideshare": 0,
            "streaming": 0,
            "gaming": 0,
            "bills": 0,
            "travel": 0,
            "other": 0,
        },
        "shares": {"moiGroceryShare": 0, "moreGroceryShare": 0, "westjetTravelShare": 0, "baTravelShare": 0},
        "preferences": {
            "rewardFocus": "cash",
            "feeMode": "no_fee",
            "maxAnnualFee": 0,
            "studentOrNewcomer": False,
            "personalIncome": None,
            "householdIncome": None,
            "paysInFull": True,
            "averageBalance": None,
            "includeWelcome": False,
            "rankBy": "ongoing",
            "customCentsPerPoint": None,
            "applyCustomToUnvalued": False,
            "vipBanking": False,
            "creditScore": None,
            "currentCardId": None,
            "comparisonDate": "2026-10-01",
        },
    }
    completed = run_node(["tsx", "packages/engine/src/cli.ts", "recommend"], json.dumps(profile))
    assert completed.returncode == 0, completed.stderr
    result = json.loads(completed.stdout)
    winner = result["ranked"][0]
    assert winner["card"]["id"] == "rbc-cash-back-mastercard"
    assert winner["projection"]["ongoingNetCad"] == 42
