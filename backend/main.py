from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uvicorn
import os
from datetime import datetime
import pickle
import pandas as pd
import numpy as np
from io import BytesIO
import xgboost as xgb
import sklearn
from sklearn.pipeline import Pipeline
import joblib

from database import SessionLocal, engine, Base
from models import User, UploadedFile, Prediction, Feedback
from auth import verify_password, hash_password, create_access_token, verify_token

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fraud Detection API", version="1.0.0")


@app.exception_handler(Exception)
def global_exception_handler(request, exc):
    """Log and return actual error for 500s; re-raise HTTPException."""
    from fastapi.responses import JSONResponse
    from fastapi import HTTPException
    import traceback
    if isinstance(exc, HTTPException):
        raise exc
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


# CORS - allow all origins for deployment
# Note: When allow_credentials=True, allow_origins cannot be ["*"]
# We must specify origins or use a wildcard-friendly approach
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Set to False if using origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


@app.get("/api/health")
def health():
    """Health check for proxy and connectivity. Optionally verifies DB."""
    from sqlalchemy import text
    out = {"status": "ok", "message": "Backend is running"}
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        out["database"] = "connected"
    except Exception as e:
        out["database"] = "error"
        out["database_error"] = str(e)
    return out


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to get current user
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Pydantic models for request/response
class SignupRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class PredictionRequest(BaseModel):
    amount: float
    transaction_time: str
    merchant_category: str
    country: str
    device_type: str
    payment_method: str
    channel: Optional[str] = None
    merchant_country: Optional[str] = None
    transaction_count_24h: Optional[int] = None
    avg_amount_24h: Optional[float] = None

class PredictionResponse(BaseModel):
    prediction_id: int
    fraud_score: float
    risk_level: str
    recommended_action: str
    reasons: List[str]

class PredictFileRequest(BaseModel):
    """Which rows of the uploaded file to run fraud detection on. row_indices are 0-based."""
    row_indices: Optional[List[int]] = None  # None = first 5 for backward compat

class FeedbackRequest(BaseModel):
    prediction_id: int
    human_decision: str  # 'fraud' or 'legit'
    reasons: Optional[List[str]] = None
    thoughts: Optional[str] = None
    model_rating: str  # 'accurate', 'partially_accurate', 'not_accurate'
    
    class Config:
        protected_namespaces = ()

class FeedbackResponse(BaseModel):
    feedback_id: int
    message: str

# Load ML model
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Use absolute paths relative to BASE_DIR
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "Credit Card Fraud Mlops", "Credit Card Fraud Mlops", "Model", "xgb_fraud_pipeline.pkl"))
THRESHOLD_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "Credit Card Fraud Mlops", "Credit Card Fraud Mlops", "Model", "fraud_threshold.pkl"))

MODEL_LOADED = False
model = None
threshold_data = None

try:
    if os.path.exists(MODEL_PATH):
        # Try joblib first, then fallback to pickle
        try:
            model = joblib.load(MODEL_PATH)
            print(f"[OK] Model loaded successfully via joblib from {MODEL_PATH}")
        except Exception as joblib_e:
            print(f"[INFO] Joblib load failed: {joblib_e}. Trying pickle...")
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            print(f"[OK] Model loaded successfully via pickle from {MODEL_PATH}")
            
        if os.path.exists(THRESHOLD_PATH):
            try:
                threshold_data = joblib.load(THRESHOLD_PATH)
            except:
                with open(THRESHOLD_PATH, 'rb') as f:
                    threshold_data = pickle.load(f)
        MODEL_LOADED = True
    else:
        print(f"[WARNING] Model file not found at {MODEL_PATH}")
except Exception as e:
    import traceback
    print(f"[WARNING] Could not load model: {e}")
    traceback.print_exc()
    print(f"[INFO] API will work with fallback predictions")
    MODEL_LOADED = False
    model = None
    threshold_data = None

# Inference features
MODEL_FEATURES = [
    'amount', 'transaction_time', 'merchant_category', 'country',
    'device_type', 'payment_method', 'channel', 'merchant_country',
    'transaction_count_24h', 'avg_amount_24h'
]
CATEGORICAL_FEATURES = ['merchant_category', 'country', 'device_type', 'channel', 'payment_method', 'merchant_country']
NUMERICAL_FEATURES = ['amount', 'transaction_count_24h', 'avg_amount_24h']


def _schema_to_model_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert schema columns (amount, transaction_time, merchant_category, country,
    device_type, payment_method, channel?, merchant_country?, transaction_count_24h?, avg_amount_24h?)
    into the DataFrame columns expected by the fraud pipeline (same feature engineering as notebooks).
    """
    df = df.copy()
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    # Ensure optional columns exist with defaults
    if "channel" not in df.columns:
        df["channel"] = "web"
    if "merchant_country" not in df.columns:
        df["merchant_country"] = df["country"].astype(str) if "country" in df.columns else "US"
    if "transaction_count_24h" not in df.columns:
        df["transaction_count_24h"] = 0
    if "avg_amount_24h" not in df.columns:
        df["avg_amount_24h"] = 0.0
    if "currency" not in df.columns:
        df["currency"] = "USD"
    if "merchant_id" not in df.columns:
        df["merchant_id"] = 0

    # Coerce numeric
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
    df["transaction_count_24h"] = pd.to_numeric(df["transaction_count_24h"], errors="coerce").fillna(0).astype(int)
    df["avg_amount_24h"] = pd.to_numeric(df["avg_amount_24h"], errors="coerce").fillna(0.0)
    df["merchant_id"] = pd.to_numeric(df["merchant_id"], errors="coerce").fillna(0).astype(int)

    # Parse time
    df["transaction_time"] = pd.to_datetime(df["transaction_time"], dayfirst=True, errors="coerce")
    df["transaction_time"] = df["transaction_time"].fillna(pd.Timestamp.utcnow())
    df["hour"] = df["transaction_time"].dt.hour
    df["day_of_week"] = df["transaction_time"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["is_night"] = df["hour"].between(0, 5).astype(int)

    # Engineered numeric features (match testing_model.ipynb / 03_feature_engineering_pipeline.ipynb)
    df["log_amount"] = np.log1p(df["amount"])
    df["high_amount"] = (df["amount"] > 300).astype(int)
    df["country_mismatch"] = (df["country"].astype(str) != df["merchant_country"].astype(str)).astype(int)
    df["high_velocity"] = (df["transaction_count_24h"] > 3).astype(int)
    risky_categories = ["electronics", "gaming"]
    df["risky_merchant"] = df["merchant_category"].astype(str).str.lower().isin(risky_categories).astype(int)
    df["is_international"] = (df["country"].astype(str) != df["merchant_country"].astype(str)).astype(int)

    # Ensure categorical columns are string for pipeline
    for col in ["currency", "merchant_category", "merchant_country", "country", "device_type", "channel", "payment_method"]:
        if col in df.columns:
            df[col] = df[col].astype(str).fillna("")

    return df


def _get_pipeline_input_columns(pipe):
    """Get the set of column names the pipeline's first step (preprocessor) expects, if available."""
    try:
        first_step = pipe.steps[0][1]
        cols = set()
        if hasattr(first_step, "transformers_"):
            for _name, _trans, col_list in first_step.transformers_:
                if hasattr(col_list, "__iter__") and not isinstance(col_list, str):
                    cols.update(col_list)
                else:
                    cols.add(col_list)
        elif hasattr(first_step, "feature_names_in_"):
            cols.update(first_step.feature_names_in_)
        return list(cols) if cols else None
    except Exception:
        return None


# Exact columns the saved xgb_fraud_pipeline expects (from 03_feature_engineering_pipeline.ipynb)
# num: amount, log_amount, transaction_count_24h, avg_amount_24h, hour, day_of_week, is_weekend, is_international, country_mismatch, high_amount, is_night, high_velocity, risky_merchant
# cat: currency, merchant_id, merchant_category, merchant_country, country, device_type, channel, payment_method
PIPELINE_INPUT_COLUMNS = [
    "amount", "log_amount", "transaction_count_24h", "avg_amount_24h",
    "hour", "day_of_week", "is_weekend", "is_international", "country_mismatch",
    "high_amount", "is_night", "high_velocity", "risky_merchant",
    "currency", "merchant_id", "merchant_category", "merchant_country",
    "country", "device_type", "channel", "payment_method",
]
_CAT_COLUMNS = {"currency", "merchant_category", "merchant_country", "country", "device_type", "channel", "payment_method"}


def _build_pipeline_input_df(engineered_df: pd.DataFrame) -> pd.DataFrame:
    """Build a one-row DataFrame with exactly PIPELINE_INPUT_COLUMNS for model.predict_proba."""
    row = {}
    for c in PIPELINE_INPUT_COLUMNS:
        if c in engineered_df.columns:
            val = engineered_df[c].iloc[0]
            if pd.isna(val) and c in _CAT_COLUMNS:
                val = ""
            elif pd.isna(val):
                val = 0
            row[c] = val
        else:
            row[c] = "" if c in _CAT_COLUMNS else (0 if c == "merchant_id" else 0)
    return pd.DataFrame([row], columns=PIPELINE_INPUT_COLUMNS)


# Authentication endpoints
@app.post("/register", response_model=AuthResponse)
@app.post("/api/auth/register", response_model=AuthResponse)
@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Sign up a new user with email OR phone"""
    # Map username to name if needed for compatibility
    if not request.name and request.username:
        request.name = request.username
        
    if not request.name:
        request.name = "User" # Fallback if both missing
        
    print(f"DEBUG: signup request: {request}")
    
    if not request.email and not request.phone:
        raise HTTPException(status_code=400, detail="Either email or phone number is required")
    
    if request.email and request.phone:
        raise HTTPException(status_code=400, detail="Please provide either email OR phone, not both")
    
    # Check if user already exists
    existing_user = None
    if request.email:
        existing_user = db.query(User).filter(User.email == request.email).first()
    if request.phone:
        existing_user = db.query(User).filter(User.phone == request.phone).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists. Please login instead.")
    
    try:
        # Create new user
        hashed_password = hash_password(request.password)
        new_user = User(
            name=request.name,
            email=request.email if request.email else None,
            phone=request.phone if request.phone else None,
            password=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create access token
        access_token = create_access_token({"user_id": new_user.id})
        if hasattr(access_token, "decode"):
            access_token = access_token.decode("utf-8")
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "phone": new_user.phone
            }
        )
    except Exception as e:
        db.rollback()
        print(f"[ERROR] signup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email OR phone"""
    if not request.email and not request.phone:
        raise HTTPException(status_code=400, detail="Either email or phone number is required")
    
    # Find user by email or phone
    user = None
    if request.email:
        user = db.query(User).filter(User.email == request.email).first()
    if request.phone:
        user = db.query(User).filter(User.phone == request.phone).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found. Please sign up first.")
    
    # Verify password
    if not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
    
    # Create access token
    access_token = create_access_token({"user_id": user.id})
    if hasattr(access_token, "decode"):
        access_token = access_token.decode("utf-8")
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone
        }
    )

# File upload endpoint
@app.post("/api/files/upload")
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a CSV or Excel file"""
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be CSV or Excel format")
    
    # Read file content
    contents = file.file.read()
    
    # Store file in database
    uploaded_file = UploadedFile(
        user_id=current_user.id,
        filename=file.filename,
        file_content=contents,
        file_size=len(contents),
        upload_date=datetime.utcnow()
    )
    db.add(uploaded_file)
    db.commit()
    db.refresh(uploaded_file)
    
    return {
        "file_id": uploaded_file.id,
        "filename": uploaded_file.filename,
        "file_size": uploaded_file.file_size,
        "upload_date": uploaded_file.upload_date.isoformat(),
        "message": "File uploaded successfully"
    }

@app.get("/api/files")
def get_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all files uploaded by the current user"""
    files = db.query(UploadedFile).filter(UploadedFile.user_id == current_user.id).all()
    return {
        "files": [
            {
                "id": f.id,
                "filename": f.filename,
                "file_size": f.file_size,
                "upload_date": f.upload_date.isoformat()
            }
            for f in files
        ]
    }


@app.get("/api/files/{file_id}/transactions")
def get_file_transactions(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return list of transactions (rows) from an uploaded file so the user can choose which to analyze."""
    uploaded_file = db.query(UploadedFile).filter(
        UploadedFile.id == file_id,
        UploadedFile.user_id == current_user.id
    ).first()
    if not uploaded_file:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        if uploaded_file.filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(uploaded_file.file_content))
        else:
            df = pd.read_excel(BytesIO(uploaded_file.file_content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    # Normalize column names to lowercase for response
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    display_cols = ["amount", "transaction_time", "merchant_category", "country", "device_type", "payment_method"]
    transactions = []
    for idx in range(len(df)):
        row = df.iloc[idx]
        item = {"row_index": int(idx)}
        for k in display_cols:
            if k in df.columns:
                v = row[k]
                item[k] = "" if pd.isna(v) else str(v)
            else:
                item[k] = ""
        transactions.append(item)
    return {"transactions": transactions, "total": len(transactions)}


# Prediction endpoint
def get_risk_metadata(fraud_score: float, is_fallback: bool = False):
    """Generate risk level, action, and reasons based on fraud score"""
    if is_fallback:
        return {
            "risk_level": "Medium",
            "recommended_action": "Verify",
            "reasons": ["Fallback prediction (model version mismatch). Re-train and save the pipeline with this backend's scikit-learn version, or predictions will use this fallback."]
        }
    
    if fraud_score < 0.3:
        return {
            "risk_level": "Low",
            "recommended_action": "Safe",
            "reasons": [
                "Transaction amount within normal spending patterns",
                "Merchant category and location match regular purchasing behavior",
                "Transaction time and payment method consistent with historical activity"
            ]
        }
    elif fraud_score < 0.7:
        return {
            "risk_level": "Medium",
            "recommended_action": "Verify",
            "reasons": [
                "Transaction amount higher than average but within reasonable limits",
                "Geographic location differs from usual purchasing areas",
                "Payment method used is valid but timing is outside normal business hours"
            ]
        }
    else:
        return {
            "risk_level": "High",
            "recommended_action": "Block",
            "reasons": [
                "Transaction amount significantly exceeds typical spending patterns",
                "Merchant category known for high chargeback rates",
                "Multiple velocity rule violations detected"
            ]
        }

def calculate_prediction(data: dict):
    """
    Core prediction logic: maps input data to model format and returns results.
    """
    # Normalize keys: lowercase, strip, spaces -> underscores
    data_norm = {str(k).strip().lower().replace(" ", "_"): v for k, v in data.items()}
    
    if not MODEL_LOADED:
        metadata = get_risk_metadata(0.5, is_fallback=True)
        return {
            "fraud_score": 0.5,
            **metadata
        }

    try:
        # Prepare row with all required features (use defaults for missing)
        row = {}
        for k in MODEL_FEATURES:
            v = data_norm.get(k)
            # handle NaNs or empty strings or None
            if v is None or (isinstance(v, float) and np.isnan(v)) or str(v).strip() == "":
                if k in CATEGORICAL_FEATURES: v = 'Unknown'
                elif k in NUMERICAL_FEATURES: 
                    v = 0 if k in ('transaction_count_24h', 'avg_amount_24h') else 0.0
            row[k] = v
        
        df = pd.DataFrame([row])
        df = _schema_to_model_df(df)
        # Build pipeline input with exactly the columns the saved model expects
        pipeline_df = _build_pipeline_input_df(df)
        fraud_score = float(model.predict_proba(pipeline_df)[0][1])
        
        metadata = get_risk_metadata(fraud_score)
        
        return {
            "fraud_score": float(fraud_score),
            **metadata
        }
    except Exception as e:
        # Model may be from different sklearn version
        print(f"[INFO] Using fallback prediction (model error: {e})")
        metadata = get_risk_metadata(0.5, is_fallback=True)
        return {
            "fraud_score": 0.5,
            **metadata
        }

@app.post("/api/predict", response_model=PredictionResponse)
def predict(
    request: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Make a fraud prediction"""
    prediction_data = calculate_prediction(request.dict())
    
    # Store prediction in database
    prediction = Prediction(
        user_id=current_user.id,
        amount=request.amount,
        transaction_time=request.transaction_time,
        merchant_category=request.merchant_category,
        country=request.country,
        device_type=request.device_type,
        payment_method=request.payment_method,
        channel=request.channel,
        merchant_country=request.merchant_country,
        transaction_count_24h=request.transaction_count_24h,
        avg_amount_24h=request.avg_amount_24h,
        fraud_score=prediction_data["fraud_score"],
        risk_level=prediction_data["risk_level"],
        recommended_action=prediction_data["recommended_action"],
        prediction_date=datetime.utcnow()
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    return PredictionResponse(
        prediction_id=prediction.id,
        fraud_score=prediction_data["fraud_score"],
        risk_level=prediction_data["risk_level"],
        recommended_action=prediction_data["recommended_action"],
        reasons=prediction_data["reasons"]
    )

@app.post("/api/predict/file/{file_id}")
def predict_from_file(
    file_id: int,
    body: Optional[PredictFileRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Make predictions for selected rows of an uploaded file. Send { \"row_indices\": [0, 2, 4] } to analyze specific rows; omit for first 5 (backward compat)."""
    # Get file
    uploaded_file = db.query(UploadedFile).filter(
        UploadedFile.id == file_id,
        UploadedFile.user_id == current_user.id
    ).first()
    
    if not uploaded_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Parse file
    try:
        if uploaded_file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(uploaded_file.file_content))
        else:
            df = pd.read_excel(BytesIO(uploaded_file.file_content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    # Which rows to process: user-selected or default first 5
    if body and body.row_indices is not None and len(body.row_indices) > 0:
        indices = [i for i in body.row_indices if 0 <= i < len(df)]
        if not indices:
            raise HTTPException(status_code=400, detail="No valid row_indices in range for this file.")
    else:
        indices = list(range(min(5, len(df))))
    
    predictions = []
    for idx in indices:
        row = df.iloc[idx]
        data = row.to_dict()
        prediction_data = calculate_prediction(data)
        
        # Store prediction
        prediction = Prediction(
            user_id=current_user.id,
            amount=float(data.get('amount', 0)),
            transaction_time=str(data.get('transaction_time', '')),
            merchant_category=str(data.get('merchant_category', '')),
            country=str(data.get('country', '')),
            device_type=str(data.get('device_type', '')),
            payment_method=str(data.get('payment_method', '')),
            channel=str(data.get('channel', '')) if data.get('channel') else None,
            merchant_country=str(data.get('merchant_country', '')) if data.get('merchant_country') else None,
            transaction_count_24h=int(data.get('transaction_count_24h', 0)) if data.get('transaction_count_24h') else None,
            avg_amount_24h=float(data.get('avg_amount_24h', 0)) if data.get('avg_amount_24h') else None,
            fraud_score=prediction_data["fraud_score"],
            risk_level=prediction_data["risk_level"],
            recommended_action=prediction_data["recommended_action"],
            prediction_date=datetime.utcnow()
        )
        db.add(prediction)
        db.flush()  # Ensure prediction.id is generated
        
        predictions.append({
            "prediction_id": prediction.id,
            **prediction_data
        })
    
    db.commit()
    
    return {
        "predictions": predictions,
        "total_processed": len(predictions)
    }

@app.get("/api/predictions")
def get_predictions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all predictions for the current user"""
    predictions = db.query(Prediction).filter(Prediction.user_id == current_user.id).all()
    
    result_list = []
    for p in predictions:
        metadata = get_risk_metadata(p.fraud_score)
        result_list.append({
            "id": p.id,
            "prediction_id": p.id,
            "amount": p.amount,
            "country": p.country,
            "merchant_category": p.merchant_category,
            "payment_method": p.payment_method,
            "transaction_time": p.transaction_time,
            "fraud_score": p.fraud_score,
            "risk_level": p.risk_level,
            "recommended_action": p.recommended_action,
            "prediction_date": p.prediction_date.isoformat(),
            "reasons": metadata["reasons"]
        })
    
    return {
        "predictions": result_list
    }

# Feedback endpoints
@app.post("/api/feedback", response_model=FeedbackResponse)
def submit_feedback(
    request: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit feedback for a prediction"""
    print(f"\n[Feedback] Received submission from user: {current_user.email or current_user.phone}")
    print(f"[Feedback] Prediction ID: {request.prediction_id}")
    print(f"[Feedback] Decision: {request.human_decision}, Rating: {request.model_rating}")
    print(f"[Feedback] Thoughts: {request.thoughts}")
    
    # Verify prediction exists and belongs to user
    prediction = db.query(Prediction).filter(
        Prediction.id == request.prediction_id,
        Prediction.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Create feedback
    feedback = Feedback(
        prediction_id=request.prediction_id,
        user_id=current_user.id,
        human_decision=request.human_decision,
        reasons=",".join(request.reasons) if request.reasons else None,
        thoughts=request.thoughts,
        model_rating=request.model_rating,
        feedback_date=datetime.utcnow()
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    return FeedbackResponse(
        feedback_id=feedback.id,
        message="Feedback submitted successfully"
    )

@app.get("/api/feedback")
def get_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all feedback submitted by the current user"""
    feedbacks = db.query(Feedback).filter(Feedback.user_id == current_user.id).all()
    return {
        "feedbacks": [
            {
                "id": f.id,
                "prediction_id": f.prediction_id,
                "human_decision": f.human_decision,
                "reasons": f.reasons.split(",") if f.reasons else [],
                "thoughts": f.thoughts,
                "model_rating": f.model_rating,
                "feedback_date": f.feedback_date.isoformat()
            }
            for f in feedbacks
        ]
    }

@app.get("/api/feedback/prediction/{prediction_id}")
def get_feedback_for_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get feedback for a specific prediction"""
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    feedback = db.query(Feedback).filter(Feedback.prediction_id == prediction_id).first()
    
    if not feedback:
        return {"feedback": None}
    
    return {
        "feedback": {
            "id": feedback.id,
            "human_decision": feedback.human_decision,
            "reasons": feedback.reasons.split(",") if feedback.reasons else [],
            "thoughts": feedback.thoughts,
            "model_rating": feedback.model_rating,
            "feedback_date": feedback.feedback_date.isoformat()
        }
    }

if __name__ == "__main__":
    import sys
    # Render (and most PaaS) set PORT; use it so the app listens on the correct port
    port = int(os.environ.get("PORT", 8001))
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    # Disable reload in production (Render sets PORT; local dev typically does not)
    is_production = os.environ.get("PORT") is not None
    print(f"[Backend] Running on 0.0.0.0:{port}  |  Production: {is_production}")
    if is_production:
        print(f"[Backend] Health: https://your-app.onrender.com/api/health")
    else:
        print(f"[Backend] Local test: http://127.0.0.1:{port}/api/health  |  Frontend: http://localhost:3003")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=not is_production)
