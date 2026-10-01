"""Build a SQLite catalog from data/catalog/catalog.json."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine, text

from catalog_io import ROOT, load_catalog, validate_catalog

DB_PATH = ROOT / "data" / "catalog" / "cardfit.sqlite"

SCHEMA = """
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  applicable_effective_date TEXT,
  notes TEXT NOT NULL
);
CREATE TABLE reward_programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  restrictions TEXT NOT NULL
);
CREATE TABLE valuation_scenarios (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES reward_programs(id),
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  cad_per_points REAL,
  points_basis REAL,
  basis TEXT NOT NULL,
  restrictions TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  verified_at TEXT NOT NULL
);
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  network TEXT NOT NULL,
  family TEXT NOT NULL,
  currency TEXT NOT NULL,
  product_url TEXT NOT NULL,
  active_status TEXT NOT NULL
);
CREATE TABLE card_term_versions (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id),
  effective_from TEXT,
  effective_to TEXT,
  annual_fee_cad REAL NOT NULL,
  purchase_apr REAL,
  reward_program_id TEXT NOT NULL REFERENCES reward_programs(id),
  eligibility_conditions TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id)
);
CREATE TABLE reward_rules (
  id TEXT PRIMARY KEY,
  term_version_id TEXT NOT NULL REFERENCES card_term_versions(id),
  category TEXT NOT NULL,
  earn_unit TEXT NOT NULL,
  earn_rate REAL NOT NULL,
  fallback_rate REAL,
  tier_lower_cad REAL,
  tier_upper_cad REAL,
  cap_group_id TEXT,
  reset_period TEXT NOT NULL,
  conditions TEXT NOT NULL,
  priority INTEGER NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id)
);
CREATE TABLE welcome_offers (
  id TEXT PRIMARY KEY,
  term_version_id TEXT NOT NULL REFERENCES card_term_versions(id),
  offer_type TEXT NOT NULL,
  qualifying_requirements TEXT NOT NULL,
  spend_threshold_cad REAL,
  window_months INTEGER,
  valid_from TEXT,
  valid_to TEXT,
  modelled INTEGER NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id)
);
"""


def main() -> None:
    catalog = load_catalog()
    errors = validate_catalog(catalog)
    if errors:
        raise SystemExit("\n".join(errors))
    if DB_PATH.exists():
        DB_PATH.unlink()
    engine = create_engine(f"sqlite:///{DB_PATH}")
    with engine.begin() as connection:
        for statement in SCHEMA.split(";"):
            if statement.strip():
                connection.execute(text(statement))
        for source in catalog["sources"]:
            connection.execute(
                text(
                    "INSERT INTO sources (id, url, title, retrieved_at, applicable_effective_date, notes) VALUES (:id, :url, :title, :retrieved_at, :applicable, :notes)"
                ),
                {
                    "id": source["id"],
                    "url": source["url"],
                    "title": source["title"],
                    "retrieved_at": source["retrievedAt"],
                    "applicable": source["applicableEffectiveDate"],
                    "notes": source["notes"],
                },
            )
        for program in catalog["programs"]:
            connection.execute(
                text("INSERT INTO reward_programs (id, name, currency, restrictions) VALUES (:id, :name, :currency, :restrictions)"),
                {"id": program["id"], "name": program["name"], "currency": program["currency"], "restrictions": program["restrictions"]},
            )
            for scenario in program["scenarios"]:
                value = scenario["value"]
                connection.execute(
                    text(
                        """INSERT INTO valuation_scenarios
                        (id, program_id, name, method, cad_per_points, points_basis, basis, restrictions, source_id, verified_at)
                        VALUES (:id, :program_id, :name, :method, :cad, :points, :basis, :restrictions, :source_id, :verified_at)"""
                    ),
                    {
                        "id": f"{program['id']}:{scenario['id']}",
                        "program_id": program["id"],
                        "name": scenario["name"],
                        "method": scenario["method"],
                        "cad": None if value is None else value["cad"],
                        "points": None if value is None else value["points"],
                        "basis": scenario["basis"],
                        "restrictions": scenario["restrictions"],
                        "source_id": scenario["sourceId"],
                        "verified_at": scenario["verifiedAt"],
                    },
                )
        for card in catalog["cards"]:
            connection.execute(
                text(
                    """INSERT INTO cards (id, slug, name, network, family, currency, product_url, active_status)
                    VALUES (:id, :slug, :name, :network, :family, :currency, :product_url, :active_status)"""
                ),
                {
                    "id": card["id"],
                    "slug": card["slug"],
                    "name": card["name"],
                    "network": card["network"],
                    "family": card["family"],
                    "currency": card["currency"],
                    "product_url": card["productUrl"],
                    "active_status": card["activeStatus"],
                },
            )
            for version in card["termVersions"]:
                connection.execute(
                    text(
                        """INSERT INTO card_term_versions
                        (id, card_id, effective_from, effective_to, annual_fee_cad, purchase_apr, reward_program_id, eligibility_conditions, verification_status, verified_at, source_id)
                        VALUES (:id, :card_id, :effective_from, :effective_to, :annual_fee_cad, :purchase_apr, :reward_program_id, :eligibility, :verification_status, :verified_at, :source_id)"""
                    ),
                    {
                        "id": version["id"],
                        "card_id": card["id"],
                        "effective_from": version["effectiveFrom"],
                        "effective_to": version["effectiveTo"],
                        "annual_fee_cad": version["annualFeeCad"],
                        "purchase_apr": version["purchaseApr"],
                        "reward_program_id": version["rewardProgramId"],
                        "eligibility": version["eligibility"],
                        "verification_status": version["verificationStatus"],
                        "verified_at": version["verifiedAt"],
                        "source_id": version["sourceId"],
                    },
                )
                for rule in version["rules"]:
                    categories = ["*"] if rule["categories"] == ["*"] else rule["categories"]
                    for category in categories:
                        connection.execute(
                            text(
                                """INSERT INTO reward_rules
                                (id, term_version_id, category, earn_unit, earn_rate, fallback_rate, tier_lower_cad, tier_upper_cad, cap_group_id, reset_period, conditions, priority, source_id)
                                VALUES (:id, :term_version_id, :category, :earn_unit, :earn_rate, :fallback_rate, :tier_lower_cad, :tier_upper_cad, :cap_group_id, :reset_period, :conditions, :priority, :source_id)"""
                            ),
                            {
                                "id": f"{rule['id']}:{category}",
                                "term_version_id": version["id"],
                                "category": category,
                                "earn_unit": rule["earnUnit"],
                                "earn_rate": rule["earnRate"],
                                "fallback_rate": rule["fallbackRate"],
                                "tier_lower_cad": rule["tierLowerCad"],
                                "tier_upper_cad": rule["tierUpperCad"],
                                "cap_group_id": rule["capGroupId"],
                                "reset_period": rule["resetPeriod"],
                                "conditions": rule["conditions"],
                                "priority": rule["priority"],
                                "source_id": rule["sourceId"],
                            },
                        )
                for offer in version["offers"]:
                    connection.execute(
                        text(
                            """INSERT INTO welcome_offers
                            (id, term_version_id, offer_type, qualifying_requirements, spend_threshold_cad, window_months, valid_from, valid_to, modelled, source_id)
                            VALUES (:id, :term_version_id, :offer_type, :requirements, :threshold, :window_months, :valid_from, :valid_to, :modelled, :source_id)"""
                        ),
                        {
                            "id": offer["id"],
                            "term_version_id": version["id"],
                            "offer_type": offer["kind"],
                            "requirements": offer["headline"],
                            "threshold": offer["spendThresholdCad"],
                            "window_months": offer["windowMonths"],
                            "valid_from": offer["validFrom"],
                            "valid_to": offer["validTo"],
                            "modelled": 1 if offer["modelled"] else 0,
                            "source_id": offer["sourceId"],
                        },
                    )
    print(DB_PATH)


if __name__ == "__main__":
    main()
