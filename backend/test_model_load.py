import os
import pickle
import pandas as pd
import xgboost as xgb
import sklearn
try:
    import joblib
except ImportError:
    joblib = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "fraud-model", "model")
MODEL_PATH = os.path.join(MODEL_DIR, "fraud_model.pkl")
ENCODERS_PATH = os.path.join(MODEL_DIR, "encoders.pkl")

print(f"Python version: {os.sys.version}")
print(f"Pandas version: {pd.__version__}")
print(f"XGBoost version: {xgb.__version__}")
print(f"Scikit-learn version: {sklearn.__version__}")
if joblib:
    print(f"Joblib version: {joblib.__version__}")

print(f"\nAttempting to load model from: {MODEL_PATH}")
print(f"Attempting to load encoders from: {ENCODERS_PATH}")

if not os.path.exists(MODEL_PATH):
    print("Error: Model file not found!")
else:
    # 1. Try normal pickle
    try:
        print("\nTrying pickle.load...")
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        print("SUCCESS! Model loaded with pickle.")
        print(f"Model type: {type(model)}")
    except Exception as e:
        print(f"Pickle failed: {e}")

    # 2. Try joblib if available
    if joblib:
        try:
            print("\nTrying joblib.load...")
            model = joblib.load(MODEL_PATH)
            print("SUCCESS! Model loaded with joblib.")
            print(f"Model type: {type(model)}")
        except Exception as e:
            print(f"Joblib failed: {e}")

    # 2b. Load encoders (required for inference)
    if joblib and os.path.exists(ENCODERS_PATH):
        try:
            encoders = joblib.load(ENCODERS_PATH)
            print("SUCCESS! Encoders loaded with joblib.")
            print(f"Encoders keys: {list(encoders.keys())}")
        except Exception as e:
            print(f"Encoders load failed: {e}")

    # 3. Try to inspect the file content if both fail
    if not 'model' in locals():
        print("\nBoth methods failed. Trying to read first few bytes...")
        with open(MODEL_PATH, 'rb') as f:
            header = f.read(100)
            print(f"Binary header: {header}")
