"""Fail if the sourced catalog is internally inconsistent."""

from catalog_io import load_catalog, validate_catalog


def main() -> None:
    errors = validate_catalog(load_catalog())
    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)
    print("Catalog validation passed.")


if __name__ == "__main__":
    main()
