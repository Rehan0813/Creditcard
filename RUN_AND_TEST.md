# Run Backend + Frontend and Test (local)

The app is set up so **the same code works locally and on Render**—no .env changes when switching.  
Locally, the frontend always talks to your local backend (via Vite proxy). Production builds use the Render URL.

---

## 1. Start the backend

In a terminal:

```bash
cd backend
python main.py
```

You should see: `[Backend] Running on 0.0.0.0:8001` and `Local test: http://127.0.0.1:8001/api/health`.  
Leave this terminal open.

---

## 2. Start the frontend

In a **new** terminal:

```bash
cd Frontend
npm run dev
```

Vite will open the app (or go to the URL it prints, usually **http://localhost:3000**).

---

## 3. Use the app locally

- Open the app at **http://localhost:3000** (or the URL Vite shows).
- **Sign up** → name, then **either** email **or** phone, then password.
- **Log in** → same email or phone and password.
- **Upload a CSV** and click **Analyze Fraud Detection**. Requests go to your local backend on port 8001 via the proxy.

If you see "Cannot reach the server" or "Not Found":
- Make sure the **backend is running** (step 1) on port 8001.
- Use **http://localhost:3000** (or the Vite URL), not 127.0.0.1 or a different port.

---

## 4. Optional: test backend only

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File test_backend.ps1
```

Or open **http://127.0.0.1:8001/docs** for Swagger.

---

## Ports (local)

| Service   | URL                     |
|----------|-------------------------|
| Backend  | http://127.0.0.1:8001   |
| Frontend | http://localhost:3000   (Vite default in this project) |

---

## Deploy on Render

- Backend and frontend code stay the same. Production build uses `VITE_API_URL` from the build env or the default Render backend URL.
- See `backend/RENDER_DEPLOY.md` for backend env vars and start commands.
