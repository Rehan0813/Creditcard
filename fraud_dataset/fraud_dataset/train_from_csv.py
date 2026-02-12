import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
from xgboost import XGBClassifier
import joblib

# -----------------------------
# LOAD DATASET
# -----------------------------
df = pd.read_csv("fraud_transactions_200k.csv")

# -----------------------------
# ENCODE CATEGORICAL FEATURES
# -----------------------------
feature_encoders = {}

categorical_cols = [
    "merchant_category",
    "country",
    "device_type",
    "payment_method"
]

for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    feature_encoders[col] = le

# Encode target label
label_encoder = LabelEncoder()
df["label"] = label_encoder.fit_transform(df["label"])

# -----------------------------
# SPLIT FEATURES & TARGET
# -----------------------------
X = df.drop("label", axis=1)
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# -----------------------------
# TRAIN XGBOOST MODEL
# -----------------------------
model = XGBClassifier(
    objective="multi:softprob",
    num_class=3,
    eval_metric="mlogloss",
    n_estimators=250,
    max_depth=6,
    learning_rate=0.08,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

model.fit(X_train, y_train)

# -----------------------------
# EVALUATE
# -----------------------------
y_pred = model.predict(X_test)

print("\n📊 Classification Report:\n")
print(classification_report(
    y_test,
    y_pred,
    target_names=label_encoder.classes_
))

print("\n📉 Confusion Matrix:\n")
print(confusion_matrix(y_test, y_pred))

# -----------------------------
# SAVE MODEL & ENCODERS
# -----------------------------
joblib.dump(model, "fraud_xgb_model.pkl")
joblib.dump(feature_encoders, "feature_encoders.pkl")
joblib.dump(label_encoder, "label_encoder.pkl")

print("\n✅ Training complete!")
print("Saved files:")
print("- fraud_xgb_model.pkl")
print("- feature_encoders.pkl")
print("- label_encoder.pkl")
