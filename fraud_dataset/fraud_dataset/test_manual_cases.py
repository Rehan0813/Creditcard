import pandas as pd
import joblib

# -----------------------------
# LOAD MODEL & ENCODERS
# -----------------------------
model = joblib.load("fraud_xgb_model.pkl")
feature_encoders = joblib.load("feature_encoders.pkl")
label_encoder = joblib.load("label_encoder.pkl")

# -----------------------------
# MANUAL TEST CASES
# -----------------------------
test_data = pd.DataFrame([
    # amount, hour, merchant_category, country, device_type, payment_method
    [2000, 14, "Grocery", "India", "Mobile", "UPI"],        # Case 1
    [5000, 14, "Grocery", "India", "Mobile", "UPI"],        # Case 2
    [8000, 23, "Electronics", "India", "Desktop", "Credit Card"],  # Case 3
    [12000, 1, "Luxury", "India", "Mobile", "Credit Card"],        # Case 4
    [20000, 13, "Travel", "USA", "Desktop", "Credit Card"],        # Case 5
    [2000, 13, "Grocery", "USA", "Mobile", "UPI"],          # Case 6
], columns=[
    "amount",
    "transaction_hour",
    "merchant_category",
    "country",
    "device_type",
    "payment_method"
])

# -----------------------------
# ENCODE CATEGORICAL FEATURES
# -----------------------------
for col, le in feature_encoders.items():
    test_data[col] = le.transform(test_data[col])

# -----------------------------
# PREDICT
# -----------------------------
predictions = model.predict(test_data)
predicted_labels = label_encoder.inverse_transform(predictions)

# -----------------------------
# DISPLAY RESULTS
# -----------------------------
print("\n🔍 Manual Test Results:\n")

cases = [
    "1️⃣ 2k, Daytime, India",
    "2️⃣ 5k, Daytime, India",
    "3️⃣ 8k, Night, India",
    "4️⃣ 12k, Night, India",
    "5️⃣ 20k, Daytime, Not India",
    "6️⃣ 2k, Daytime, Not India",
]

for case, label in zip(cases, predicted_labels):
    print(f"{case}  ➜  {label}")
