#!/usr/bin/env python3
"""Set QuoteRevive's Supabase env vars on the Vercel project using Finn's
own token via the custom.vercel-api connector.

Values are read from ~/workspace/quoterevive/.env.local at runtime — the
anon key is never hardcoded here and never printed. Existing production
values for the same keys are updated in place (PATCH), missing ones are
created (POST /v10/projects/{id}/env)."""
import json
import os
import sys
import urllib.request
import urllib.error

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

PROVIDER = "custom.vercel-api"
HOSTS = ["api.vercel.com"]
BASE = "https://api.vercel.com"
TEAM_ID = "team_iIj7dsie5zUfzpaEcAgT8fRk"
PROJECT_ID = "prj_52dFxe94zb4ARPm11QNvXqTXrdE1"
SITE = os.path.expanduser("~/workspace/quoterevive")
KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise RuntimeError("redirect refused, verify the endpoint")


def call(method, path, body=None):
    url = BASE + path
    data = None
    hdrs = {}
    if body is not None:
        data = json.dumps(body).encode()
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=hdrs)
    add_surrogate_to_request(req, PROVIDER, allowed_hosts=HOSTS)
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=120) as resp:
            return resp.status, read_json_response(resp)
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode() or "{}")
        except Exception:
            payload = {}
        return e.code, payload


def read_env_local():
    values = {}
    with open(os.path.join(SITE, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                values[k.strip()] = v.strip()
    return values


def main():
    values = read_env_local()
    for key in KEYS:
        if not values.get(key):
            print(f"missing {key} in .env.local")
            sys.exit(1)

    status, payload = call("GET", f"/v9/projects/{PROJECT_ID}/env?teamId={TEAM_ID}")
    if status != 200:
        print("list env failed:", status, json.dumps(payload)[:400])
        sys.exit(1)
    existing = {e["key"]: e for e in payload.get("envs", [])}

    for key in KEYS:
        current = existing.get(key)
        if current and "production" in (current.get("target") or []):
            status, payload = call(
                "PATCH",
                f"/v9/projects/{PROJECT_ID}/env/{current['id']}?teamId={TEAM_ID}",
                body={"value": values[key]},
            )
            print(f"{key}: PATCH existing -> {status}")
        else:
            status, payload = call(
                "POST",
                f"/v10/projects/{PROJECT_ID}/env?teamId={TEAM_ID}",
                body={"key": key, "value": values[key], "type": "plain",
                      "target": ["production"]},
            )
            print(f"{key}: POST create -> {status}")
        if status not in (200, 201):
            print(json.dumps(payload)[:400])
            sys.exit(1)

    # Verify (keys + targets only, never values).
    status, payload = call("GET", f"/v9/projects/{PROJECT_ID}/env?teamId={TEAM_ID}")
    present = {e["key"]: e.get("target") for e in payload.get("envs", [])}
    for key in KEYS:
        print(f"verify {key}: present={key in present}, target={present.get(key)}")


if __name__ == "__main__":
    main()
