"""Apply the separate UI ruleset using the owner's authenticated GitHub CLI.

Preserves every other ruleset. No token arguments or secret files are needed.
"""
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
REPO = "trungxemcode/hsk"


def api(method, endpoint, payload=None):
    args = ["gh", "api", "--method", method, endpoint]
    if payload is not None:
        args += ["--input", "-"]
    result = subprocess.run(args, input=json.dumps(payload) if payload is not None else None,
                            text=True, capture_output=True, check=True)
    return json.loads(result.stdout)


def main():
    subprocess.run(["gh", "auth", "status"], check=True)
    payload = json.loads((ROOT / ".github/ui-scope-ruleset.json").read_text())
    endpoint = f"repos/{REPO}/rulesets"
    # Pagination prevents accidentally creating a duplicate in a large repository.
    matches = []
    for page in range(1, 101):
        rows = api("GET", endpoint + f"?includes_parents=false&per_page=100&page={page}")
        matches.extend(row for row in rows if row["name"] == payload["name"])
        if len(rows) < 100:
            break
    if len(matches) > 1:
        raise RuntimeError("Duplicate named UI rulesets; inspect before changing settings")
    if matches:
        endpoint += "/" + str(matches[0]["id"])
        result = api("PUT", endpoint, payload)
    else:
        result = api("POST", endpoint, payload)
        endpoint += "/" + str(result["id"])
    actual = api("GET", endpoint)
    def matches(expected, received):
        if isinstance(expected, dict):
            return isinstance(received, dict) and all(key in received and matches(value, received[key]) for key, value in expected.items())
        if isinstance(expected, list):
            return isinstance(received, list) and len(expected) == len(received) and all(matches(a, b) for a, b in zip(expected, received))
        return expected == received
    for key in ("name", "target", "enforcement", "conditions", "rules", "bypass_actors"):
        if not matches(payload[key], actual.get(key)):
            raise RuntimeError(f"GitHub verification mismatch: {key}; inspect saved ruleset")
    print(f"ACTIVE: https://github.com/{REPO}/rules/{actual['id']}")


if __name__ == "__main__":
    main()
