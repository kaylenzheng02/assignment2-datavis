"""Parse the NASA TrES star catalog in TRESCSV.json."""

import json
from pathlib import Path

DATA_PATH = Path(__file__).with_name("TRESCSV.json")

FLOAT_FIELDS = (
    "ra",
    "dec",
    "starthjd",
    "endhjd",
    "bmag",
    "vmag",
    "rmag",
    "rerr",
)


def parse_star(raw):
    star = {
        "rowid": int(raw["rowid"]),
        "star_id": raw["star_id"],
        "region": raw["region"],
        "lcfil": raw["lcfil"],
    }
    for field in FLOAT_FIELDS:
        value = raw[field]
        star[field] = None if value is None else float(value)
    star["npts"] = int(raw["npts"])
    return star


def parse_catalog(path=DATA_PATH):
    with open(path, encoding="utf-8") as file:
        data = json.load(file)

    stars = [parse_star(row) for row in data["stars"]]
    if len(stars) != data["count"]:
        raise ValueError(
            f"Expected {data['count']} stars, parsed {len(stars)}"
        )

    return {
        "source": data["source"],
        "source_url": data["source_url"],
        "generated": data["generated"],
        "columns": data["columns"],
        "count": len(stars),
        "stars": stars,
    }


def summarize(catalog):
    stars = catalog["stars"]
    with_vmag = sum(star["vmag"] is not None for star in stars)
    brightest = min(
        (star for star in stars if star["vmag"] is not None),
        key=lambda star: star["vmag"],
    )
    return {
        "source": catalog["source"],
        "generated": catalog["generated"],
        "count": catalog["count"],
        "region": stars[0]["region"],
        "with_vmag": with_vmag,
        "missing_vmag": catalog["count"] - with_vmag,
        "brightest_star_id": brightest["star_id"],
        "brightest_vmag": brightest["vmag"],
        "ra_range": (
            min(star["ra"] for star in stars),
            max(star["ra"] for star in stars),
        ),
        "dec_range": (
            min(star["dec"] for star in stars),
            max(star["dec"] for star in stars),
        ),
    }


if __name__ == "__main__":
    catalog = parse_catalog()
    summary = summarize(catalog)
    print(f"{summary['source']}  ({summary['generated']})")
    print(f"{summary['count']} stars in {summary['region']}")
    print(
        f"V magnitude: {summary['with_vmag']} measured, "
        f"{summary['missing_vmag']} missing"
    )
    print(
        f"Brightest: {summary['brightest_star_id']} "
        f"V={summary['brightest_vmag']}"
    )
    ra_min, ra_max = summary["ra_range"]
    dec_min, dec_max = summary["dec_range"]
    print(f"RA {ra_min:.4f} to {ra_max:.4f} deg")
    print(f"Dec {dec_min:.4f} to {dec_max:.4f} deg")
    print("First star:", catalog["stars"][0])
