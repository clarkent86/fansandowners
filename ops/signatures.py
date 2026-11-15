#!/usr/bin/env python3
"""Fetch the Change.org signature count and write it where the site can read it.

Run it on a schedule (e.g. every 10 minutes) on whatever serves the site:
  SIGNATURES_OUT=/path/to/site/signatures.json python3 ops/signatures.py
Writes {"count", "goal", "updated", "source"}; the page reads /signatures.json.
Change.org has no public API; the count is in the petition page's embedded data.
On any failure the previous file is left untouched.
"""
import json, os, re, sys, tempfile, time, urllib.request

PETITION = "https://www.change.org/p/let-the-fans-own-dc"
OUT = os.environ.get("SIGNATURES_OUT", "dist/signatures.json")


def fetch():
    req = urllib.request.Request(PETITION, headers={"User-Agent": "Mozilla/5.0 (powertothe.fan signature tracker)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        html = r.read().decode("utf-8", "replace")
    m = re.search(r'"signatureCount":\{[^}]*?"total":(\d+)[^}]*\}', html)
    if not m:
        raise ValueError("signature count not found in page")
    block = m.group(0)
    goal = re.search(r'"goal":(\d+)', block)
    return int(m.group(1)), int(goal.group(1)) if goal else None


def main():
    count, goal = fetch()
    data = {"count": count, "goal": goal, "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "source": PETITION}
    d = os.path.dirname(OUT)
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".signatures.")
    with os.fdopen(fd, "w") as f:
        json.dump(data, f)
    os.chmod(tmp, 0o644)
    os.replace(tmp, OUT)
    print(json.dumps(data))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"signatures: {e}", file=sys.stderr)
        sys.exit(1)
