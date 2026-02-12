import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# Setup logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "..", "fraud_training_dataset_50k.csv")
MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "fraud_model.pkl")
ENCODERS_PATH = os.path.join(MODEL_DIR, "encoders.pkl")
FEATURE_NAMES_PATH = os.path.join(MODEL_DIR, "feature_names.pkl")

# Ensure model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

def train():
    logger.info(f"Loading dataset from {DATASET_PATH}...")
    if not os.path.exists(DATASET_PATH):
        logger.error(f"Dataset not found at {DATASET_PATH}")
        return

    df = pd.read_csv(DATASET_PATH)
    
    # --- Preprocessing ---
    logger.info("Preprocessing data...")
    
    # 1. Target Mapping
    # safe -> 0, block -> 1, verify -> 1
    # We treat 'verify' as high risk (1) to be safe, or we could make it a separate class if we did multi-class.
    # For now, let's do Binary Classification: 0 = Safe, 1 = Fraud/Risky
    def map_target(label):
        label = str(label).lower().strip()
        if label == 'safe':
            return 0
        elif label in ['block', 'verify']:
            return 1
        return 1 # default to risk

    df['target'] = df['label'].apply(map_target)
    
    # 2. Date/Time Features
    df['transaction_time'] = pd.to_datetime(df['transaction_time'])
    df['hour'] = df['transaction_time'].dt.hour
    df['day_of_week'] = df['transaction_time'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['is_night'] = ((df['hour'] < 6) | (df['hour'] > 22)).astype(int)

    # 3. Categorical Encoding
    cat_cols = ["merchant_category", "country", "device_type", "payment_method"]
    encoders = {}
    
    for col in cat_cols:
        le = LabelEncoder()
        # Handle potential missing values by filling with 'UNKNOWN'
        df[col] = df[col].fillna("UNKNOWN").astype(str)
        # Fit encoder
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
        logger.info(f"Encoded {col}: {len(le.classes_)} classes")

    # 4. Numerical Features
    # 'amount' is already float.
    # We can add log_amount for better distribution handling
    df['log_amount'] = np.log1p(df['amount'])

    # 5. Derived Features (that we can calculate from single transaction)
    # Note: We CANNOT easily use 'avg_amount_24h' or 'transaction_count_24h' unless we calculate them 
    # from the history in this dataset. For a robust stateless model, we'll skip them or compute them if needed.
    # For this iteration, let's rely on the explicit features available in the single transaction context 
    # and the patterns in amounts/time/location.
    
    # Let's check if there's any other useful column.
    # Columns: amount,transaction_time,merchant_category,country,device_type,payment_method,label
    
    # Selected Features for Training
    features = [
        "amount", "log_amount", 
        "hour", "day_of_week", "is_weekend", "is_night",
        "merchant_category", "country", "device_type", "payment_method"
    ]
    
    X = df[features]
    y = df['target']
    
    logger.info(f"Training on {len(df)} samples with {len(features)} features.")
    
    # --- Split ---
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # --- Train Model ---
    logger.info("Training XGBoost Classifier...")
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        n_estimators=200,
        learning_rate=0.05,
        max_depth=6,
        use_label_encoder=False,
        eval_metric='logloss',
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # --- Evaluate ---
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    logger.info(f"Model Accuracy: {acc:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    
    # --- Save Artifacts ---
    logger.info(f"Saving model to {MODEL_PATH}...")
    joblib.dump(model, MODEL_PATH)
    
    logger.info(f"Saving encoders to {ENCODERS_PATH}...")
    joblib.dump(encoders, ENCODERS_PATH)
    
    logger.info(f"Saving feature names to {FEATURE_NAMES_PATH}...")
    joblib.dump(features, FEATURE_NAMES_PATH)
    
    logger.info("Done.")

if __name__ == "__main__":
    train()
