
import os
import sys
import pandas as pd
import joblib
import pickle
import numpy as np
import traceback

# Force unbuffered stdout
sys.stdout.reconfigure(line_buffering=True)

MODEL_PATH = r"c:\Users\rehan\OneDrive\Desktop\cre\Credit Card Fraud Mlops\Credit Card Fraud Mlops\Model\xgb_fraud_pipeline.pkl"
try:
    if os.path.exists(MODEL_PATH):
        print(f"Loading model from {MODEL_PATH}")
        try:
            model = joblib.load(MODEL_PATH)
            print("Loaded with joblib")
        except:
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            print("Loaded with pickle")
    else:
        print(f"Model path not found: {MODEL_PATH}")
        sys.exit(1)
except Exception as e:
    print(f"Failed to load model: {e}")
    traceback.print_exc()
    sys.exit(1)

print(f"Model type: {type(model)}")
if hasattr(model, 'steps'):
    print("Pipeline steps:")
    for step_name, step in model.steps:
        print(f"  - {step_name}: {type(step)}")
        if hasattr(step, 'transformers_'):
            print("    Transformers:")
            for name, trans, cols in step.transformers_:
                print(f"      - {name}: cols={cols}")
        elif hasattr(step, 'feature_names_in_'):
            print(f"    Feature names in: {step.feature_names_in_}")

PIPELINE_INPUT_COLUMNS = [
    "amount", "log_amount", "transaction_count_24h", "avg_amount_24h",
    "hour", "day_of_week", "is_weekend", "is_international", "country_mismatch",
    "high_amount", "is_night", "high_velocity", "risky_merchant",
    "currency", "merchant_id", "merchant_category", "merchant_country",
    "country", "device_type", "channel", "payment_method",
]

print("\nCreating dummy dataframe...")
row = {}
_CAT_COLUMNS = {"currency", "merchant_category", "merchant_country", "country", "device_type", "channel", "payment_method"}

for c in PIPELINE_INPUT_COLUMNS:
    row[c] = "" if c in _CAT_COLUMNS else 0


# Test with ONE row
df = pd.DataFrame([row], columns=PIPELINE_INPUT_COLUMNS)
# Force types
df["amount"] = df["amount"].astype(float)
df["log_amount"] = df["log_amount"].astype(float)

# Test with MISSING columns to see if error matches
# Drop the columns that the user reported as missing
missing_cols = ['risky_merchant', 'hour', 'log_amount', 'high_amount', 'is_night', 'country_mismatch', 'merchant_id', 'high_velocity', 'is_weekend', 'is_international', 'currency', 'day_of_week']
df_bad = df.drop(columns=[c for c in missing_cols if c in df.columns])

print("Bad DataFrame columns:", df_bad.columns.tolist())
try:
    print("\nAttempting prediction with missing columns...")
    pred = model.predict_proba(df_bad)
    print("Prediction success:", pred)
except Exception as e:
    print("\nPrediction failed as expected!")
    print(f"Error: {e}")
