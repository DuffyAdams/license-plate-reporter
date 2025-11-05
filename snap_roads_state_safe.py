import sqlite3, sys, time, json, argparse, urllib.parse, urllib.request

OSRM_NEAREST = "https://router.project-osrm.org/nearest/v1/driving"   # best-effort public demo
NOMINATIM    = "https://nominatim.openstreetmap.org"
UA = {"User-Agent": "state-safe-road-snapper/1.0 (contact: you@example.com)"}
QPS_OSRM = 0.25
QPS_NOMI = 1.0

STATE_NAME_TO_CODE = {
    "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO",
    "Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID",
    "Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA",
    "Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS",
    "Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ",
    "New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK",
    "Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD",
    "Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA",
    "West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY","District of Columbia":"DC"
}
STATE_CODES = set(STATE_NAME_TO_CODE.values())
NAME_FROM_CODE = {v:k for k,v in STATE_NAME_TO_CODE.items()}

def http_json(url, params=None, delay=0.0):
    if params:
        url = url + ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if delay:
        time.sleep(delay)
    return data

def osrm_nearest(lat, lon):
    url = f"{OSRM_NEAREST}/{lon:.7f},{lat:.7f}?number=1"
    try:
        data = http_json(url, delay=QPS_OSRM)
        if data.get("code") == "Ok" and data.get("waypoints"):
            wp = data["waypoints"][0]
            s_lon, s_lat = wp["location"]
            street = wp.get("name") or None
            return s_lat, s_lon, street
    except Exception:
        return None, None, None
    return None, None, None

def reverse_state(lat, lon):
    # returns postal code like 'CA' when available; else maps full state name -> code
    try:
        data = http_json(f"{NOMINATIM}/reverse",
            {"lat":lat, "lon":lon, "format":"jsonv2", "zoom":10, "addressdetails":1}, delay=QPS_NOMI)
        addr = data.get("address") or {}
        # Try explicit postal/ISO fields first
        code = (addr.get("state_code") or
                addr.get("ISO3166-2-lvl4") or
                addr.get("ISO3166-2-lvl6") or "")
        if isinstance(code, str) and "-" in code:
            code = code.split("-")[-1]
        if code and code.upper() in STATE_CODES:
            return code.upper()
        state_name = addr.get("state")
        if state_name and state_name in STATE_NAME_TO_CODE:
            return STATE_NAME_TO_CODE[state_name]
    except Exception:
        pass
    return None

def geocode_city_state(city, st_code):
    # forward geocode to a centroid within the state
    q = f"{city}, {st_code}, USA" if city else f"{NAME_FROM_CODE.get(st_code, st_code)}, USA"
    try:
        data = http_json(f"{NOMINATIM}/search",
            {"q": q, "format":"jsonv2", "limit":1, "addressdetails":1}, delay=QPS_NOMI)
        if data:
            lat = float(data[0]["lat"]); lon = float(data[0]["lon"])
            return lat, lon
    except Exception:
        pass
    return None, None

def valid_ll(lat, lon):
    return lat is not None and lon is not None and -90 <= lat <= 90 and -180 <= lon <= 180

def ensure_columns(cur, table):
    cur.execute(f"PRAGMA table_info({table})")
    existing = {row[1] for row in cur.fetchall()}
    if "orig_latitude" not in existing:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN orig_latitude REAL")
    if "orig_longitude" not in existing:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN orig_longitude REAL")
    if "nearest_street" not in existing:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN nearest_street TEXT")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("db")
    ap.add_argument("--table", required=True)
    ap.add_argument("--id", dest="id_col", required=True)
    ap.add_argument("--lat", dest="lat_col", default="latitude")
    ap.add_argument("--lon", dest="lon_col", default="longitude")
    ap.add_argument("--city", dest="city_col", default="city")
    ap.add_argument("--state", dest="state_col", default="state_code")
    args = ap.parse_args()

    con = sqlite3.connect(args.db)
    cur = con.cursor()

    # columns present?
    cur.execute(f"PRAGMA table_info({args.table})")
    have = {r[1] for r in cur.fetchall()}
    need = {args.id_col, args.lat_col, args.lon_col, args.state_col}
    if not need.issubset(have):
        raise SystemExit(f"Table {args.table} missing columns: {sorted(need - have)}")

    ensure_columns(cur, args.table)
    con.commit()

    # preserve originals once
    cur.execute(f"""
        UPDATE {args.table}
        SET orig_latitude  = COALESCE(orig_latitude,  {args.lat_col}),
            orig_longitude = COALESCE(orig_longitude, {args.lon_col})
        WHERE {args.lat_col} IS NOT NULL AND {args.lon_col} IS NOT NULL
    """)
    con.commit()

    # fetch all rows (id, city, state, lat, lon)
    cur.execute(f"""
        SELECT {args.id_col}, COALESCE({args.city_col},''), UPPER({args.state_col}),
               {args.lat_col}, {args.lon_col}
        FROM {args.table}
    """)
    rows = cur.fetchall()

    updated = 0
    for rid, city, st_code, lat, lon in rows:
        st_code = (st_code or "").upper()
        if st_code not in STATE_CODES:
            # Skip rows with unknown state; you can extend for DC/territories if needed
            continue

        seed_lat, seed_lon = (lat, lon) if valid_ll(lat, lon) else (None, None)
        if not valid_ll(seed_lat, seed_lon):
            # fallback to city/state centroid; if no city, just state centroid
            seed_lat, seed_lon = geocode_city_state(city.strip() or None, st_code)
            if not valid_ll(seed_lat, seed_lon):
                # final fallback: try the state name alone
                seed_lat, seed_lon = geocode_city_state(None, st_code)
                if not valid_ll(seed_lat, seed_lon):
                    continue  # give up on this row

        # snap the seed to nearest road
        s_lat, s_lon, street = osrm_nearest(seed_lat, seed_lon)
        if not valid_ll(s_lat, s_lon):
            continue

        # verify the snapped point is in the same state; if not, retry from state centroid
        snap_state = reverse_state(s_lat, s_lon)
        if snap_state != st_code:
            # try again from state centroid
            c_lat, c_lon = geocode_city_state(None, st_code)
            if valid_ll(c_lat, c_lon):
                s2_lat, s2_lon, street2 = osrm_nearest(c_lat, c_lon)
                if valid_ll(s2_lat, s2_lon) and reverse_state(s2_lat, s2_lon) == st_code:
                    s_lat, s_lon, street = s2_lat, s2_lon, (street2 or street)
                else:
                    # if still wrong state, skip update
                    continue
            else:
                continue

        # write back
        cur.execute(
            f"UPDATE {args.table} SET {args.lat_col}=?, {args.lon_col}=?, nearest_street=? WHERE {args.id_col}=?",
            (s_lat, s_lon, street, rid)
        )
        updated += 1
        if updated % 20 == 0:
            con.commit()
            print(f"Updated {updated}…")

    con.commit()
    con.close()
    print(f"Done. Updated {updated} rows.")

if __name__ == "__main__":
    main()
