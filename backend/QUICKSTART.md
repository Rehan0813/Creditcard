# Quick Start Guide

## Prerequisites

1. **PostgreSQL** installed and running
2. **Python 3.8+** installed
3. **Model files** in the correct location (see below)

## Step-by-Step Setup

### 1. Install PostgreSQL

If not already installed:
- Windows: Download from https://www.postgresql.org/download/windows/
- Mac: `brew install postgresql`
- Linux: `sudo apt-get install postgresql`

Start PostgreSQL service:
- Windows: Start from Services or use pgAdmin
- Mac/Linux: `brew services start postgresql` or `sudo systemctl start postgresql`

### 2. Set PostgreSQL Password

If you haven't set the password to "rehan", you can do so:

```sql
ALTER USER postgres WITH PASSWORD 'rehan';
```

Or update the password in `database.py` to match your PostgreSQL password.

### 3. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Set Up Database

Run the setup script to create the database and tables:

```bash
python setup_database.py
```

This will:
- Create the `fraud_detection_db` database
- Create all necessary tables (users, uploaded_files, predictions, feedbacks)

### 5. Verify Model Files Location

Make sure your model files are in:
```
../Credit Card Fraud Mlops/Credit Card Fraud Mlops/Model/xgb_fraud_pipeline.pkl
../Credit Card Fraud Mlops/Credit Card Fraud Mlops/Model/fraud_threshold.pkl
```

If they're in a different location, update the paths in `main.py` (lines ~50-51).

### 6. Start the Server

```bash
python main.py
```

Or:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

### 7. Test the API

Visit `http://localhost:8000/docs` to see the interactive API documentation (Swagger UI).

## Testing Endpoints

### 1. Sign Up

```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Or with phone:
```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "password": "password123"
  }'
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the `access_token` from the response.

### 3. Upload File

```bash
curl -X POST "http://localhost:8000/api/files/upload" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@path/to/your/file.csv"
```

### 4. Make Prediction

```bash
curl -X POST "http://localhost:8000/api/predict" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "transaction_time": "2024-01-15 14:30:00",
    "merchant_category": "electronics",
    "country": "US",
    "device_type": "mobile",
    "payment_method": "credit_card"
  }'
```

### 5. Submit Feedback

```bash
curl -X POST "http://localhost:8000/api/feedback" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prediction_id": 1,
    "human_decision": "fraud",
    "reasons": ["customer_confirmed", "unusual_behavior"],
    "thoughts": "Customer confirmed this was fraudulent",
    "model_rating": "accurate"
  }'
```

## Troubleshooting

### Database Connection Error

If you get a connection error:
1. Make sure PostgreSQL is running
2. Check the password in `database.py` matches your PostgreSQL password
3. Verify the database was created: `psql -U postgres -l` (should see `fraud_detection_db`)

### Model Not Found

If you see "Warning: Could not load model":
1. Check the model file paths in `main.py`
2. Verify the `.pkl` files exist
3. The API will still work but use fallback predictions

### Port Already in Use

If port 8000 is already in use:
- Change the port in `main.py`: `uvicorn.run(app, host="0.0.0.0", port=8001)`
- Or specify when running: `uvicorn main:app --port 8001`

## Next Steps

1. Update the frontend to call these API endpoints
2. Replace the hardcoded API URLs in the frontend with `http://localhost:8000`
3. Add error handling and loading states in the frontend
4. Test the full flow: signup → login → upload → predict → feedback
