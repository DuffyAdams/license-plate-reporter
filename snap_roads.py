import sqlite3
import time
import json
import sys
from urllib.parse import quote
import urllib.request

DB_PATH = sys.argv[1] if len(sys.argv) > 1 else "your.db"
TABLE   = "reports"            # change if your table name differs
ID_COL  = "id"                 # change if your PK differs
LAT_COL = "latitude"           # change if your column differs
LON_COL = "longitude"          # change if your column differs

OSRM_BASE = "https://router.project-osrm.org/nearest/v1/driving"  # public demo endpoint
QPS_DELAY = 0.25  # seconds between requests; be polite

def osrm_nearest(lat, lon):
    # OSRM expects lon,lat order in the path
    url = f"{OSRM_BASE}/{lon:.7f},{lat:.7f}?number=1"
    req = urllib.request.Request(url, headers={"User-Agent": "sqlite-road-snapper"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        if data.get("code") == "Ok" and data.get("waypoints"):
            wp = data["waypoints"][0]
            snapped_lon, snapped_lat = wp["location"]  # [lon, lat]
            name = wp.get("name") or None
            return snapped_lat, snapped_lon, name
    return None, None, None

def main():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # Ensure columns to preserve originals / store street name
    cur.execute(f"PRAGMA table_info({TABLE})")
    cols = {row[1] for row in cur.fetchall()}
    if "orig_latitude"   not in cols:
        cur.execute(f"ALTER TABLE {TABLE} ADD COLUMN orig_latitude REAL")
    if "orig_longitude"  not in cols:
        cur.execute(f"ALTER TABLE {TABLE} ADD COLUMN orig_longitude REAL")
    if "nearest_street"  not in cols:
        cur.execute(f"ALTER TABLE {TABLE} ADD COLUMN nearest_street TEXT")

    # Save originals once where not already saved
    cur.execute(f"""
        UPDATE {TABLE}
        SET orig_latitude  = COALESCE(orig_latitude,  {LAT_COL}),
            orig_longitude = COALESCE(orig_longitude, {LON_COL})
        WHERE {LAT_COL} IS NOT NULL AND {LON_COL} IS NOT NULL
    """)
    con.commit()

    # Fetch candidates with valid coordinates
    cur.execute(f"""
        SELECT {ID_COL}, {LAT_COL}, {LON_COL}
        FROM {TABLE}
        WHERE {LAT_COL} BETWEEN -90 AND 90
          AND {LON_COL} BETWEEN -180 AND 180
    """)
    rows = cur.fetchall()
    print(f"Found {len(rows)} rows with valid coords to snap.")

    updated = 0
    for rid, lat, lon in rows:
        try:
            new_lat, new_lon, street = osrm_nearest(lat, lon)
            if new_lat is None or new_lon is None:
                continue
            cur.execute(f"""
                UPDATE {TABLE}
                SET {LAT_COL} = ?, {LON_COL} = ?, nearest_street = ?
                WHERE {ID_COL} = ?
            """, (new_lat, new_lon, street, rid))
            updated += 1
            if updated % 25 == 0:
                con.commit()
                print(f"Updated {updated}…")
            time.sleep(QPS_DELAY)
        except Exception as e:
            print(f"[WARN] {rid} failed: {e}")
            time.sleep(QPS_DELAY)

    con.commit()
    con.close()
    print(f"Done. Updated {updated} rows.")

if __name__ == "__main__":
    main()
