import pandas as pd
import joblib
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

# -----------------------------
# LOAD DATA & MODEL
# -----------------------------
df = pd.read_csv("fraud_transactions_200k.csv")

model = joblib.load("fraud_xgb_model.pkl")
feature_encoders = joblib.load("feature_encoders.pkl")
label_encoder = joblib.load("label_encoder.pkl")

# -----------------------------
# ENCODE FEATURES (same as training)
# -----------------------------
for col, le in feature_encoders.items():
    df[col] = le.transform(df[col])

df["label"] = label_encoder.transform(df["label"])

# -----------------------------
# SPLIT FEATURES / TARGET
# -----------------------------
X = df.drop("label", axis=1)
y = df["label"]

# -----------------------------
# PREDICT
# -----------------------------
y_pred = model.predict(X)

# -----------------------------
# METRICS
# -----------------------------
print("\n📊 Classification Report (Precision / Recall / F1):\n")
print(classification_report(
    y,
    y_pred,
    target_names=label_encoder.classes_
))

print("📉 Confusion Matrix:\n")
print(confusion_matrix(y, y_pred))

print("\n📌 Overall Metrics:")
print(f"Accuracy  : {accuracy_score(y, y_pred):.4f}")
print(f"Precision : {precision_score(y, y_pred, average='weighted'):.4f}")
print(f"Recall    : {recall_score(y, y_pred, average='weighted'):.4f}")
print(f"F1 Score  : {f1_score(y, y_pred, average='weighted'):.4f}")
