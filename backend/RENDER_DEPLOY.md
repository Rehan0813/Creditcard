# Render deployment guide

## 1. Why you saw "Cannot reach http://127.0.0.1:8001"

- The **frontend** was built for production without `VITE_API_URL` set, so it fell back to `http://127.0.0.1:8001` (localhost). When users open the deployed site, the browser tries to call localhost and fails.
- **Fix applied:** Production fallback in `Frontend/src/api/fraudApi.js` is now `https://creditcard-backend-q0vl.onrender.com`, so the deployed frontend talks to Render even if `VITE_API_URL` is not set at build time.

## 2. Backend on Render – what was wrong and what was fixed

| Issue | Fix |
|-------|-----|
| **Wrong port** | Render sets `PORT`. The app was hardcoded to 8001. **Fixed:** `main.py` uses `port = int(os.environ.get("PORT", 8001))`. |
| **Reload in production** | **Fixed:** Reload is disabled when `PORT` is set. |
| **Host** | Already correct: `host="0.0.0.0"`. |
| **Database SSL** | Render PostgreSQL requires SSL. **Fixed:** `database.py` uses `sslmode=require` when URL contains `render.com` or `oregon-postgres`. |
| **Database connection stability** | **Fixed:** `pool_pre_ping=True` so stale connections are dropped. |

## 3. Render dashboard – exact settings

### Service type
- **Web Service** (not Background Worker or Cron).

### Build & Deploy
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python main.py`  
  (Or: `uvicorn main:app --host 0.0.0.0 --port $PORT`)

### Environment variables (required)

| Key | Value | Secret? |
|-----|--------|--------|
| `DATABASE_URL` | Your external PostgreSQL URL, e.g.: `postgresql://creditcard_db_tm0a_user:YOUR_PASSWORD@dpg-d63qr8chg0os73cnu7t0-a.oregon-postgres.render.com/creditcard_db_tm0a` | Yes |

- Do **not** set `PORT`; Render sets it automatically.
- Do **not** set `DEV` on Render.

### Region
- Any (e.g. Oregon). Prefer same region as your PostgreSQL instance for lower latency.

## 4. Database

- **External PostgreSQL:** Use your Render (or other) PostgreSQL URL. The backend converts `postgres://` to `postgresql://` and adds `sslmode=require` for Render hosts.
- **First deploy:** Tables are created automatically via `Base.metadata.create_all(bind=engine)` on startup.

## 5. CORS

- Backend uses `allow_origins=["*"]` and `allow_credentials=False`, so any frontend origin can call the API.

## 6. Frontend

- Rebuild and redeploy the frontend. It defaults to `https://creditcard-backend-q0vl.onrender.com` in production.
- Optional: set `VITE_API_URL=https://creditcard-backend-q0vl.onrender.com` in the frontend build environment.

## 7. Verify after deploy

1. **Health (includes DB check):**  
   `curl https://creditcard-backend-q0vl.onrender.com/api/health`  
   Expected: `{"status":"ok","message":"Backend is running","database":"connected"}`.  
   If `"database":"error"`, check `DATABASE_URL` and that the DB allows connections from Render.
2. **Frontend:** Open your deployed frontend; it should call the Render backend, not 127.0.0.1.

## 8. How to prevent this in the future

1. **Backend:** Use `PORT` from the environment and bind to `0.0.0.0`.
2. **Frontend:** Use a production default API URL or set `VITE_API_URL` at build time.
3. **Database:** Use `postgresql://` and `sslmode=require` for cloud Postgres; use `pool_pre_ping=True`.
