import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
ENCODERS_PATH = os.path.join(MODEL_DIR, "encoders.pkl")
DATASET_PATH = os.path.join(BASE_DIR, "..", "fraud_training_dataset_50k.csv")

def inspect():
    print(f"Loading encoders from {ENCODERS_PATH}...")
    if not os.path.exists(ENCODERS_PATH):
        print("Encoders file not found!")
        return

    encoders = joblib.load(ENCODERS_PATH)
    for col, le in encoders.items():
        print(f"\nFeature: {col}")
        print(f"Classes ({len(le.classes_)}): {le.classes_[:10]} ...")
        
        # Check specific values from user logs
        check_vals = ['electronics', 'IN', 'mobile', 'credit_card', 'gaming', 'US', 'web', 'debit_card']
        print("Checking user input values:")
        for val in check_vals:
            if val in le.classes_:
                print(f"  [FOUND] {val}")
            else:
                # Check case insensitive
                lower_classes = [str(c).lower() for c in le.classes_]
                if val.lower() in lower_classes:
                    print(f"  [FOUND-CASE-MISMATCH] {val} (matches '{le.classes_[lower_classes.index(val.lower())]}')")
                else:
                    print(f"  [MISSING] {val}")

    print(f"\nLoading dataset from {DATASET_PATH}...")
    if os.path.exists(DATASET_PATH):
        df = pd.read_csv(DATASET_PATH)
        print("\nDataset Unique Values:")
        for col in ["merchant_category", "country", "device_type", "payment_method"]:
            if col in df.columns:
                uniques = df[col].unique()
                print(f"{col}: {uniques[:10]} ...")
    else:
        print("Dataset file not found.")

if __name__ == "__main__":
    inspect()
