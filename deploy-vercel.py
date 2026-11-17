#!/usr/bin/env python3
"""Deploy QuoteRevive (Next.js) to Vercel using Finn's own token via the
custom.vercel-api connector. Source-upload flow: create project (if missing)
-> upload source files -> create production deployment (framework nextjs)
-> poll until READY/ERROR."""
import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.error

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

PROVIDER = "custom.vercel-api"
HOSTS = ["api.vercel.com"]
BASE = "https://api.vercel.com"
TEAM_ID = "team_iIj7dsie5zUfzpaEcAgT8fRk"
PROJECT_NAME = "quoterevive"
SITE = os.path.expanduser("~/workspace/quoterevive")
FILES = [
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "tsconfig.json",
    "next-env.d.ts",
    "README.md",
    "app/layout.tsx",
    "app/page.tsx",
    "app/lib.ts",
    "app/supabase.ts",
    "app/cloud.ts",
    "app/motion.ts",
    "app/paste.ts",
    "app/globals.css",
]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise RuntimeError("redirect refused, verify the endpoint")


def call(method, path, body=None, headers=None, raw=False):
    url = BASE + path
    data = None
    hdrs = dict(headers or {})
    if body is not None:
        if raw:
            data = body
        else:
            data = json.dumps(body).encode()
            hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=hdrs)
    add_surrogate_to_request(req, PROVIDER, allowed_hosts=HOSTS)
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=180) as resp:
            if raw and method == "POST":
                return resp.status, {}
            return resp.status, read_json_response(resp)
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode() or "{}")
        except Exception:
            payload = {}
        return e.code, payload


def main():
    status, payload = call("GET", f"/v9/projects/{PROJECT_NAME}?teamId={TEAM_ID}")
    if status == 200 and payload.get("id"):
        project_id = payload["id"]
        print("project exists:", project_id)
    else:
        status, payload = call("POST", f"/v10/projects?teamId={TEAM_ID}",
                               body={"name": PROJECT_NAME})
        print("create project status:", status)
        if status not in (200, 201):
            print(json.dumps(payload)[:800])
            sys.exit(1)
        project_id = payload["id"]
        print("project created:", project_id)

    entries, blobs = [], {}
    for rel in FILES:
        data = open(os.path.join(SITE, rel), "rb").read()
        sha = hashlib.sha1(data).hexdigest()
        entries.append({"file": rel, "sha": sha, "size": len(data)})
        blobs[sha] = data
    for e in entries:
        data = blobs[e["sha"]]
        status, payload = call(
            "POST", f"/v2/files?teamId={TEAM_ID}", body=data,
            headers={"x-vercel-digest": e["sha"], "Content-Length": str(len(data))},
            raw=True)
        print("upload", e["file"], status)
        if status not in (200, 201):
            print("upload failed", json.dumps(payload)[:500])
            sys.exit(1)

    body = {
        "name": PROJECT_NAME,
        "project": project_id,
        "target": "production",
        "files": entries,
        "projectSettings": {"framework": "nextjs"},
    }
    status, payload = call("POST", f"/v13/deployments?teamId={TEAM_ID}", body=body)
    print("create_deployment status:", status)
    if status not in (200, 201):
        print(json.dumps(payload)[:1200])
        sys.exit(1)
    dep_id = payload.get("id")
    print("deployment id:", dep_id)
    print("deployment url:", payload.get("url"))

    for _ in range(70):
        time.sleep(8)
        s2, p2 = call("GET", f"/v13/deployments/{dep_id}?teamId={TEAM_ID}")
        state = p2.get("readyState") or p2.get("status")
        print("state:", state)
        if state in ("READY", "ERROR", "CANCELED"):
            print(json.dumps({"id": dep_id, "url": p2.get("url"),
                              "readyState": state, "alias": p2.get("alias")}))
            if state != "READY":
                # fetch build error details
                s3, p3 = call("GET", f"/v13/deployments/{dep_id}/events?teamId={TEAM_ID}&limit=40")
                print("events:", json.dumps(p3)[:2000] if s3 == 200 else s3)
                sys.exit(2)
            return
    print("poll timeout")
    sys.exit(3)


if __name__ == "__main__":
    main()
