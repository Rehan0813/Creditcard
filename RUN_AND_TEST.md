# Run Backend + Frontend and Test

## 1. Start the backend

Open a terminal:

```bash
cd backend
python main.py
```

You should see: `[Backend] Running. Test: http://127.0.0.1:8001/api/health | Frontend: http://localhost:3003`  
Leave this terminal open.

---

## 2. Test backend with PowerShell (optional)

In a **new** terminal:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File test_backend.ps1
```

You should see `[PASS]` for health. Signup/login may show `[PASS]` or "already exists" / 401 if the user exists.

---

## 3. Start the frontend

In a terminal:

```bash
cd "Frontend (2)/Frontend"
npm run dev
```

**Important:** Open the app at **http://localhost:3003** (use `localhost`, not 127.0.0.1 or a Network URL).  
The frontend uses the Vite proxy so `/api` requests go to the backend without CORS issues.

---

## 4. Test in the browser

- **Sign up**: Name, then **either** email **or** phone, then password. Click Sign Up.
- **Log in**: Same email or phone and password. Click Login.

If you see "Cannot reach the server":
- Ensure the backend is running (step 1).
- Open the app at **http://localhost:3003** (not 0.0.0.0 or another host).

---

## Ports

| Service   | URL                     |
|----------|-------------------------|
| Backend  | http://127.0.0.1:8001   |
| Frontend | http://localhost:3003   |

API docs: http://127.0.0.1:8001/docs (use this in the browser, not 0.0.0.0)
