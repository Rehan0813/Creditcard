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
import random

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

class ResetPasswordRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    name: str
    new_password: str

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
#
# Load ML model from `finalmodel` package
#
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Point to ../finalmodel/models relative to backend/
FRAUD_MODEL_DIR = os.path.join(BASE_DIR, "..", "finalmodel", "models")
FRAUD_MODEL_PATH = os.path.join(FRAUD_MODEL_DIR, "fraud_pipeline.pkl")
LABEL_ENCODER_PATH = os.path.join(FRAUD_MODEL_DIR, "label_encoder.pkl")

MODEL_LOADED = False
model_pipeline = None
label_encoder = None

try:
    if os.path.exists(FRAUD_MODEL_PATH) and os.path.exists(LABEL_ENCODER_PATH):
        model_pipeline = joblib.load(FRAUD_MODEL_PATH)
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        
        MODEL_LOADED = True
        logger.info(f"[OK] fraud-model loaded from {FRAUD_MODEL_PATH}")
        logger.info(f"Label Encoder classes: {label_encoder.classes_}")
    else:
        logger.warning(f"[WARNING] fraud-model assets not found at {FRAUD_MODEL_PATH}")
except Exception as e:
    import traceback
    logger.error(f"[WARNING] Could not load fraud-model: {e}")
    traceback.print_exc()
    MODEL_LOADED = False
    model_pipeline = None
    label_encoder = None


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
@app.post("/api/auth/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password by validating email/phone and name"""
    if not request.email and not request.phone:
        raise HTTPException(status_code=400, detail="Either email or phone number is required")
    # Find user by email or phone and name
    user = None
    if request.email:
        user = db.query(User).filter(User.email == request.email, User.name == request.name).first()
    if request.phone:
        user = db.query(User).filter(User.phone == request.phone, User.name == request.name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found with the provided information. Please verify your details.")
    try:
        # Update password
        user.password = hash_password(request.new_password)
        db.commit()
        return {"message": "Password reset successful. You can now login with your new password."}
    except Exception as e:
        db.rollback()
        print(f"[ERROR] reset_password: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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


def get_risk_metadata(final_risk_score: float):
    """
    Generate risk level, action, and reasons based on FINAL hybrid risk score (0-100).
    SAFE: 0-30
    VERIFY: 31-70
    BLOCK: 71-100
    """
    if final_risk_score <= 30:
        return {
            "risk_level": "Low",
            "recommended_action": "Safe",
            "reasons": ["Hybrid Score indicates low risk (0-30)"]
        }
    elif final_risk_score <= 70:
        return {
            "risk_level": "Medium",
            "recommended_action": "Verify",
            "reasons": ["Hybrid Score indicates medium risk (31-70)"]
        }
    else:
        return {
            "risk_level": "High",
            "recommended_action": "Block",
            "reasons": ["Hybrid Score indicates high risk (71-100)"]
        }

def calculate_rule_risk(data_norm: dict):
    """
    Implements the deterministic rule-based logic.
    Returns: (rule_score, rule_reason)
    """
    # 1. Parse Inputs
    try:
        amount = float(data_norm.get("amount", 0.0) or 0.0)
    except:
        amount = 0.0

    ts_raw = str(data_norm.get("transaction_time", ""))
    # Default to current time if missing
    try:
        ts = pd.to_datetime(ts_raw, dayfirst=True, errors='coerce')
        if pd.isna(ts):
            ts = pd.Timestamp.utcnow()
    except:
        ts = pd.Timestamp.utcnow()

    hour = ts.hour
    
    # helper for country
    country_map = {
        "usa": "usa", "us": "usa", "united states": "usa",
        "uk": "uk", "united kingdom": "uk", "gb": "uk",
        "in": "india", "india": "india",
        "ae": "uae", "uae": "uae", "united arab emirates": "uae",
        "de": "germany", "germany": "germany", "deutschland": "germany"
    }
    raw_country = str(data_norm.get("country", "unknown")).lower().strip()
    country = country_map.get(raw_country, raw_country)

    # 2. Time Classification Rule
    # Daytime: 06:00 – 21:59 (hours 6 to 21 inclusive)
    # Nighttime: 22:00 – 05:59
    if 6 <= hour <= 21:
        is_daytime = True
        time_str = "Daytime"
    else:
        is_daytime = False
        time_str = "Nighttime"

    # 3. Apply Rules
    # Score mapping:
    # SAFE zone → 0–30
    # VERIFY zone → 31–70
    # BLOCK zone → 71–100
    # Risk increases proportionally with Amount
    
    rule_score = 50.0 # Default
    reason = "Default Rule"
    rule_decision = "VERIFY" # Default

    def calculate_proportional_score(val, min_val, max_val, min_score, max_score):
        """Linearly map val from [min_val, max_val] to [min_score, max_score]"""
        if max_val == min_val: return max_score
        pct = (val - min_val) / (max_val - min_val)
        score = min_score + (pct * (max_score - min_score))
        return min(max(score, min_score), max_score)

    if country == "india":
        # Domestic Rules
        if is_daytime:
            # Daytime Limits: Safe < 5000, Verify < 25000
            if amount < 5000:
                # SAFE Zone (0-30)
                rule_score = calculate_proportional_score(amount, 0, 5000, 0, 30)
                rule_decision = "SAFE"
                reason = f"Domestic (Day) & Amount {amount:.0f} < 5000 -> SAFE (Score: {rule_score:.1f})"
            elif amount <= 25000:
                # VERIFY Zone (31-70)
                rule_score = calculate_proportional_score(amount, 5000, 25000, 31, 70)
                rule_decision = "VERIFY"
                reason = f"Domestic (Day) & Amount {amount:.0f} in [5000, 25000] -> VERIFY (Score: {rule_score:.1f})"
            else:
                # BLOCK Zone (71-100)
                # Cap scaling at some reasonable max amount, e.g., 50000 for 100% score
                rule_score = calculate_proportional_score(amount, 25000, 50000, 71, 100)
                rule_decision = "BLOCK"
                reason = f"Domestic (Day) & Amount {amount:.0f} > 25000 -> BLOCK (Score: {rule_score:.1f})"
        else:
            # Nighttime Limits: Safe < 3000, Verify < 10000
            if amount < 3000:
                # SAFE Zone (0-30)
                rule_score = calculate_proportional_score(amount, 0, 3000, 5, 30) # Night starts slightly higher risk
                rule_decision = "SAFE"
                reason = f"Domestic (Night) & Amount {amount:.0f} < 3000 -> SAFE (Score: {rule_score:.1f})"
            elif amount <= 10000:
                # VERIFY Zone (31-70)
                rule_score = calculate_proportional_score(amount, 3000, 10000, 31, 70)
                rule_decision = "VERIFY"
                reason = f"Domestic (Night) & Amount {amount:.0f} in [3000, 10000] -> VERIFY (Score: {rule_score:.1f})"
            else:
                # BLOCK Zone (71-100)
                rule_score = calculate_proportional_score(amount, 10000, 20000, 71, 100)
                rule_decision = "BLOCK"
                reason = f"Domestic (Night) & Amount {amount:.0f} > 10000 -> BLOCK (Score: {rule_score:.1f})"
    else:
        # Foreign Rules
        # Foreign starts at VERIFY minimum.
        if is_daytime:
            # Limit: Verify <= 20000
            if amount <= 20000:
                # VERIFY Zone (35-70) - Foreign minimum higher
                rule_score = calculate_proportional_score(amount, 0, 20000, 35, 70)
                rule_decision = "VERIFY"
                reason = f"Foreign (Day) & Amount {amount:.0f} <= 20000 -> VERIFY (Score: {rule_score:.1f})"
            else:
                # BLOCK Zone (71-100)
                rule_score = calculate_proportional_score(amount, 20000, 40000, 71, 100)
                rule_decision = "BLOCK"
                reason = f"Foreign (Day) & Amount {amount:.0f} > 20000 -> BLOCK (Score: {rule_score:.1f})"
        else: # Nighttime
            # Limit: Verify <= 10000
            if amount <= 10000:
                # VERIFY Zone (40-70) - Foreign Night higher minimum
                rule_score = calculate_proportional_score(amount, 0, 10000, 40, 70)
                rule_decision = "VERIFY"
                reason = f"Foreign (Night) & Amount {amount:.0f} <= 10000 -> VERIFY (Score: {rule_score:.1f})"
            else:
                # BLOCK Zone (71-100)
                rule_score = calculate_proportional_score(amount, 10000, 20000, 71, 100)
                rule_decision = "BLOCK"
                reason = f"Foreign (Night) & Amount {amount:.0f} > 10000 -> BLOCK (Score: {rule_score:.1f})"
                
    return rule_score, reason, rule_decision

def calculate_prediction(data: dict):
    """
    Hybrid Prediction Logic:
    Final Risk = (0.6 * ML Risk) + (0.4 * Rule Risk)
    CRITICAL: Rule BLOCK overrides everything.
    """
    # Normalize inputs
    data_norm = {str(k).strip().lower().replace(" ", "_"): v for k, v in data.items()}
    logger.info(f"DEBUG: calculate_prediction input: {data_norm}")

    # 1. Calculate Rule Risk
    rule_risk_score, rule_reason, rule_decision = calculate_rule_risk(data_norm)
    
    # 2. Calculate ML Risk
    ml_risk_score = 50.0  # Default fallback
    ml_reason = "ML Model not loaded"
    
    if MODEL_LOADED and model_pipeline and label_encoder:
        try:
            # Prepare input compatible with the pipeline
            input_df = pd.DataFrame([{
                "amount": float(data_norm.get("amount", 0)),
                "country": str(data_norm.get("country", "UNKNOWN")),
                "transaction_time": str(data_norm.get("transaction_time", ""))
            }])
            
            # Predict probabilities
            probas = model_pipeline.predict_proba(input_df)[0]
            classes = label_encoder.classes_
            
            # Calculate a weighted ML risk score (0-100)
            risk_weighted_sum = 0.0
            for i, cls_name in enumerate(classes):
                c_upper = cls_name.upper()
                p = probas[i]
                if "SAFE" in c_upper:
                    risk_weighted_sum += p * 0
                elif "VERIFY" in c_upper:
                    risk_weighted_sum += p * 50
                elif "BLOCK" in c_upper:
                    risk_weighted_sum += p * 100
                else:
                    risk_weighted_sum += p * 50
            
            ml_risk_score = risk_weighted_sum
            # Select top class for logging/reason
            top_class_idx = np.argmax(probas)
            top_class = classes[top_class_idx]
            ml_reason = f"ML Prediction: {top_class} (Conf: {probas[top_class_idx]:.2f})"
            
        except Exception as e:
            logger.error(f"ML Prediction Error: {e}")
            ml_risk_score = 50.0 # Fallback
            ml_reason = f"ML Error: {str(e)}"
    
    # 3. Calculate Final Risk
    # Formula: Final Risk = (0.6 × ML Risk) + (0.4 × Rule Risk)
    final_risk_score = (0.6 * ml_risk_score) + (0.4 * rule_risk_score)
    final_risk_score = round(final_risk_score, 2)
    
    # 4. Generate Metadata (Risk Level, Action)
    # CRITICAL FIX: If Rule Decision == BLOCK, Final Action = BLOCK
    
    if rule_decision == "BLOCK":
        metadata = {
            "risk_level": "High",
            "recommended_action": "Block",
            "reasons": [f"CRITICAL: Rule Violation ({rule_reason}) overrides ML."]
        }
        # Optionally force score to reflect high risk if it's somehow low? 
        # But we keep the calculated hybrid score for transparency unless requested otherwise.
        # User said "Use FinalRisk thresholds" ELSE. logic implies we skip thresholds here.
    else:
        metadata = get_risk_metadata(final_risk_score)
    
    # 5. Construct Reasons
    # Combine Rule reason and ML reason
    combined_reasons = []
    combined_reasons.append(f"Rule Logic: {rule_reason} (Score: {rule_risk_score})")
    combined_reasons.append(f"AI Model: {ml_reason} (Score: {ml_risk_score:.1f})")
    combined_reasons.append(f"Final Hybrid Score: {final_risk_score}/100")
    
    metadata["reasons"] = combined_reasons + metadata["reasons"] # Prepend detailed reasons
    
    # Return in format expected by API
    return {
        "fraud_score": final_risk_score / 100.0, # Convert back to 0-1 for API consistency if needed, strictly 0-100 requested? 
        # API usually expects 0-1 float for fraud_score in many systems, 
        # but user said "0-100 scale".
        # Let's look at existing code: "if fraud_score < 0.3". 
        # Existing code used 0.0 - 1.0.
        # User request: "Risk Scoring Logic (0–100 Scale)"
        # Use 0-100 for internal logic, but maybe normalized for `fraud_score` field if downstream expects 0-1.
        # Let's check the PredictionResponse model. `fraud_score: float`.
        # I will return the 0-100 score divided by 100 to keep it normalized 0.0-1.0 for the API field which likely feeds UI progress bars.
        # But I'll make sure the metadata risk level uses the 0-100 logic (which mapped to 0-0.3 etc in old code).
        # WAIT. Old code: <0.3 (30%), <0.7 (70%).
        # New rules: 0-30, 31-70, 71-100.
        # So dividing by 100 perfectly matches the old 0.0-1.0 scale expectation (0.3 = 30).
        
        "fraud_score": final_risk_score / 100.0, 
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
        amount=float(request.amount),
        transaction_time=str(request.transaction_time),
        merchant_category=str(request.merchant_category),
        country=str(request.country),
        device_type=str(request.device_type),
        payment_method=str(request.payment_method),
        channel=str(request.channel) if request.channel else None,
        merchant_country=str(request.merchant_country) if request.merchant_country else None,
        transaction_count_24h=int(request.transaction_count_24h) if request.transaction_count_24h else None,
        avg_amount_24h=float(request.avg_amount_24h) if request.avg_amount_24h else None,
        fraud_score=float(prediction_data["fraud_score"]),
        risk_level=str(prediction_data["risk_level"]),
        recommended_action=str(prediction_data["recommended_action"]),
        prediction_date=datetime.utcnow()
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    return PredictionResponse(
        prediction_id=prediction.id,
        fraud_score=float(prediction_data["fraud_score"]),
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
            fraud_score=float(prediction_data["fraud_score"]),
            risk_level=str(prediction_data["risk_level"]),
            recommended_action=str(prediction_data["recommended_action"]),
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

