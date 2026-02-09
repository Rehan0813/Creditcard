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
import logging

from database import SessionLocal, engine, Base
from models import User, UploadedFile, Prediction, Feedback
from auth import verify_password, hash_password, create_access_token, verify_token

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

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
    is_international: Optional[int] = None

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

#
# Load ML model from new `fraud-model` package
#
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRAUD_MODEL_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "fraud-model", "model"))
FRAUD_MODEL_PATH = os.path.join(FRAUD_MODEL_DIR, "fraud_model.pkl")
ENCODERS_PATH = os.path.join(FRAUD_MODEL_DIR, "encoders.pkl")

MODEL_LOADED = False
model = None
encoders = None
feature_names = None

try:
    if os.path.exists(FRAUD_MODEL_PATH) and os.path.exists(ENCODERS_PATH):
        model = joblib.load(FRAUD_MODEL_PATH)
        encoders = joblib.load(ENCODERS_PATH)
        
        # Load feature names if available to ensure order consistency
        FEATURE_NAMES_PATH = os.path.join(FRAUD_MODEL_DIR, "feature_names.pkl")
        if os.path.exists(FEATURE_NAMES_PATH):
            feature_names = joblib.load(FEATURE_NAMES_PATH)
            
        MODEL_LOADED = True
        print(f"[OK] fraud-model loaded from {FRAUD_MODEL_PATH}")
        if feature_names:
            print(f"[INFO] Using feature names: {feature_names}")
    else:
        print(f"[WARNING] fraud-model assets not found at {FRAUD_MODEL_PATH} / {ENCODERS_PATH}")
except Exception as e:
    import traceback
    print(f"[WARNING] Could not load fraud-model: {e}")
    traceback.print_exc()
    print("[INFO] API will work with fallback predictions")
    MODEL_LOADED = False
    model = None
    encoders = None


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
    Core prediction logic: replicates feature engineering from train.py.
    """
    # Normalize keys: lowercase, strip, spaces -> underscores
    data_norm = {str(k).strip().lower().replace(" ", "_"): v for k, v in data.items()}

    if not MODEL_LOADED or model is None or encoders is None:
        logger.debug(f"Falling back to 0.5 score. MODEL_LOADED={MODEL_LOADED}")
        metadata = get_risk_metadata(0.5, is_fallback=True)
        return {
            "fraud_score": 0.5,
            **metadata,
        }

    try:
        # --- 1. Basic Features ---
        amount = float(data_norm.get("amount", 0.0) or 0.0)
        ts_raw = data_norm.get("transaction_time", "")
        try:
            ts = pd.to_datetime(ts_raw, dayfirst=True, errors='coerce')
            if pd.isna(ts):
                ts = pd.Timestamp.utcnow()
        except:
            ts = pd.Timestamp.utcnow()
        
        hour = int(ts.hour)
        day_of_week = int(ts.dayofweek)
        is_weekend = 1 if day_of_week in [5, 6] else 0
        is_night = 1 if (hour < 6 or hour > 22) else 0
        
        # --- 2. Advanced Features ---
        log_amount = np.log1p(amount)
        
        country = str(data_norm.get("country", "")).strip().upper()
        merchant_country = str(data_norm.get("merchant_country", "")).strip().upper()
        
        if merchant_country and country:
            country_mismatch = 1 if country != merchant_country else 0
        else:
            country_mismatch = 0
            
        avg_amount_24h = float(data_norm.get("avg_amount_24h", 0.0) or 0.0)
        amount_vs_avg = amount / (avg_amount_24h + 1)
        
        transaction_count_24h = int(data_norm.get("transaction_count_24h", 0) or 0)
        high_velocity = 1 if transaction_count_24h > 3 else 0
        
        # is_international often provided as separate field or derived
        is_international = int(data_norm.get("is_international", country_mismatch))

        # --- 3. Categorical Encoding ---
        cat_cols = ["merchant_category", "country", "device_type", "payment_method"]
        encoded_cats = {}
        for col in cat_cols:
            le = encoders.get(col)
            val = str(data_norm.get(col, "UNKNOWN")).strip()
            if le:
                classes = list(le.classes_)
                # Use "UNKNOWN" if available in classes, else fallback to first class
                if val in classes:
                    encoded_cats[col] = int(le.transform([val])[0])
                elif "UNKNOWN" in classes:
                    encoded_cats[col] = int(le.transform(["UNKNOWN"])[0])
                else:
                    encoded_cats[col] = int(le.transform([classes[0]])[0])
            else:
                encoded_cats[col] = 0

        # --- 4. Construct Row ---
        row = {
            "amount": amount,
            "log_amount": log_amount,
            "hour": hour,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "is_night": is_night,
            "country_mismatch": country_mismatch,
            "amount_vs_avg": amount_vs_avg,
            "high_velocity": high_velocity,
            "is_international": is_international,
            **encoded_cats
        }

        # Use the explicit feature names if loaded to ensure order
        if feature_names:
            X = pd.DataFrame([row])[feature_names]
        else:
            # Fallback to a hardcoded order if feature_names not found
            cols = [
                "amount", "log_amount", "hour", "day_of_week", "is_weekend", "is_night",
                "country_mismatch", "amount_vs_avg", "high_velocity",
                "merchant_category", "country", "device_type", "payment_method", "is_international"
            ]
            # filter to what's in row
            cols = [c for c in cols if c in row]
            X = pd.DataFrame([row])[cols]

        # --- 5. Predict Probability ---
        # Binary model: predict_proba returns [prob_legit, prob_fraud]
        proba = model.predict_proba(X)[0]
        fraud_prob = float(proba[1])
        
        logger.info(f"Prediction: prob={fraud_prob:.4f} for features={row}")

        # Map probability to risk levels
        if fraud_prob < 0.3:
            level = "Low"
            action = "Safe"
        elif fraud_prob < 0.7:
            level = "Medium"
            action = "Verify"
        else:
            level = "High"
            action = "Block"

        metadata = get_risk_metadata(fraud_prob)
        metadata["risk_level"] = level
        metadata["recommended_action"] = action

        return {
            "fraud_score": fraud_prob,
            **metadata,
        }

    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        metadata = get_risk_metadata(0.5, is_fallback=True)
        return {
            "fraud_score": 0.5,
            **metadata,
        }
    except Exception as e:
        import traceback
        logger.error(f"[ERROR] Prediction failed: {e}")
        traceback.print_exc()
        logger.info(f"[INFO] Using fallback prediction (model error: {e})")
        metadata = get_risk_metadata(0.5, is_fallback=True)
        return {
            "fraud_score": 0.5,
            **metadata,
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

