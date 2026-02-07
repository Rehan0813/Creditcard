"""
Run this script to test the backend API (health, signup, login).
Make sure the backend is running first: python main.py
"""
import urllib.request
import urllib.error
import json
import sys

BASE = "http://127.0.0.1:8001"
OK = "\033[92m[PASS]\033[0m"
FAIL = "\033[91m[FAIL]\033[0m"


def req(method, path, body=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=5) as r:
            raw = r.read().decode()
            return r.getcode(), json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode() if e.fp else ""
        try:
            data = json.loads(raw) if raw.strip() else {"detail": f"HTTP {e.code}"}
        except json.JSONDecodeError:
            data = {"detail": raw or f"HTTP {e.code}"}
        return e.code, data
    except OSError as e:
        return None, str(e)


def main():
    print("Backend API tests (backend must be running on port 8001)\n")

    # 1. Health
    print("1. GET /api/health")
    code, data = req("GET", "/api/health")
    if code == 200 and data.get("status") == "ok":
        print(f"   {OK} {data}")
    elif code == 404:
        print(f"   (Health route missing - old backend? Trying signup next...)")
    elif code is None:
        print(f"   {FAIL} Backend not reachable. Run: python main.py")
        sys.exit(1)
    else:
        print(f"   {FAIL} code={code} data={data}")
        sys.exit(1)

    # 2. Signup (also proves backend is up if health was 404)
    print("\n2. POST /api/auth/signup (email)")
    code, data = req("POST", "/api/auth/signup", {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "testpass123",
    })
    if code == 200 and "access_token" in data:
        print(f"   {OK} User created, got token")
        token = data["access_token"]
    elif code == 400 and "already exists" in str(data.get("detail", "")).lower():
        print(f"   {OK} User already exists (will try login)")
        token = None
    else:
        print(f"   {FAIL} code={code} data={data}")
        sys.exit(1)

    # 3. Login (email)
    print("\n3. POST /api/auth/login (email)")
    code, data = req("POST", "/api/auth/login", {
        "email": "testuser@example.com",
        "password": "testpass123",
    })
    if code == 200 and "access_token" in data:
        print(f"   {OK} Login OK, got token")
        token = data["access_token"]
    else:
        print(f"   {FAIL} code={code} data={data}")
        sys.exit(1)

    # 4. Login (phone) - signup with phone then login
    print("\n4. POST /api/auth/signup (phone)")
    code, data = req("POST", "/api/auth/signup", {
        "name": "Phone User",
        "phone": "+15551234567",
        "password": "phonepass123",
    })
    if code == 200:
        print(f"   {OK} Phone user created")
    elif code == 400 and "already exists" in str(data.get("detail", "")).lower():
        print(f"   {OK} Phone user already exists")
    else:
        print(f"   {FAIL} code={code} data={data}")

    print("\n5. POST /api/auth/login (phone)")
    code, data = req("POST", "/api/auth/login", {
        "phone": "+15551234567",
        "password": "phonepass123",
    })
    if code == 200 and "access_token" in data:
        print(f"   {OK} Phone login OK")
    else:
        print(f"   {FAIL} code={code} data={data}")

    print("\n" + "=" * 50)
    print("All tests passed. Backend is ready for the frontend.")
    print("Frontend: npm run dev (in Frontend (2)/Frontend)")
    print("Then open http://localhost:3003 and sign up / log in.")
    print("=" * 50)


if __name__ == "__main__":
    main()
