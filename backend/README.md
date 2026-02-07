# Fraud Detection Backend API

Python FastAPI backend for the Fraud Detection application.

## Features

- **Authentication**: Signup and login with email OR phone number
- **File Upload**: Upload CSV/Excel files and store in PostgreSQL database
- **Fraud Prediction**: Use XGBoost model to predict fraud risk
- **Feedback System**: Submit and retrieve feedback on predictions

## Setup

### 1. Install PostgreSQL

Make sure PostgreSQL is installed and running on your system.

### 2. Create Database

```sql
CREATE DATABASE fraud_detection_db;
```

### 3. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Update Database URL (if needed)

The default database URL is:
```
postgresql://postgres:rehan@localhost:5432/fraud_detection_db
```

If your PostgreSQL setup is different, update the `DATABASE_URL` in `database.py` or set it as an environment variable.

### 5. Run the Server

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Sign up a new user
- `POST /api/auth/login` - Login with email or phone

### File Management

- `POST /api/files/upload` - Upload a CSV/Excel file
- `GET /api/files` - Get all uploaded files

### Predictions

- `POST /api/predict` - Make a fraud prediction from transaction data
- `POST /api/predict/file/{file_id}` - Make predictions from an uploaded file
- `GET /api/predictions` - Get all predictions

### Feedback

- `POST /api/feedback` - Submit feedback for a prediction
- `GET /api/feedback` - Get all feedback
- `GET /api/feedback/prediction/{prediction_id}` - Get feedback for a specific prediction

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Authentication

All endpoints except `/api/auth/signup` and `/api/auth/login` require authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Model Files

Make sure the model files are in the correct location:
- `../Credit Card Fraud Mlops/Credit Card Fraud Mlops/Model/xgb_fraud_pipeline.pkl`
- `../Credit Card Fraud Mlops/Credit Card Fraud Mlops/Model/fraud_threshold.pkl`

If the model files are in a different location, update the paths in `main.py`.
