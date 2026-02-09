import pandas as pd
import numpy as np
import os
import sys
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, average_precision_score

# 1️⃣ Path Configuration
# Prioritize the richer dataset if available
DATASET_DIR = "Credit Card Fraud Mlops/Credit Card Fraud Mlops/Notebooks"
RICH_DATASET = os.path.join(DATASET_DIR, "generic_fraud_transactions.csv")
FALLBACK_DATASET = "../fraud_training_dataset_50k.csv"

if os.path.exists(RICH_DATASET):
    dataset_path = RICH_DATASET
    label_col = "is_fraud"
    print(f"🚀 Using rich dataset: {dataset_path}")
elif os.path.exists(FALLBACK_DATASET):
    dataset_path = FALLBACK_DATASET
    label_col = "label"
    print(f"⚠️ Rich dataset not found. Using fallback: {dataset_path}")
else:
    # Local fallback for CI/CD or other envs
    dataset_path = "generic_fraud_transactions.csv" if os.path.exists("generic_fraud_transactions.csv") else "fraud_training_dataset_50k.csv"
    label_col = "is_fraud" if "generic" in dataset_path else "label"
    print(f"🔍 Using local file: {dataset_path}")

df = pd.read_csv(dataset_path)

# 2️⃣ Feature Engineering
print("🛠️ Engineering features...")

# Convert time
df["transaction_time"] = pd.to_datetime(df["transaction_time"])
df["hour"] = df["transaction_time"].dt.hour
df["day_of_week"] = df["transaction_time"].dt.dayofweek
df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
df["is_night"] = df["hour"].apply(lambda x: 1 if (x < 6 or x > 22) else 0)

# Derived features
df["log_amount"] = np.log1p(df["amount"])

if "merchant_country" in df.columns and "country" in df.columns:
    df["country_mismatch"] = (df["country"] != df["merchant_country"]).astype(int)
else:
    df["country_mismatch"] = 0

if "avg_amount_24h" in df.columns:
    df["amount_vs_avg"] = df["amount"] / (df["avg_amount_24h"] + 1)
else:
    df["amount_vs_avg"] = 1.0

if "transaction_count_24h" in df.columns:
    df["high_velocity"] = (df["transaction_count_24h"] > 3).astype(int)
else:
    df["high_velocity"] = 0

# 3️⃣ Categorical Encoding
categorical_features = [
    "merchant_category",
    "country",
    "device_type",
    "payment_method"
]

# Ensure we don't include columns that aren't in the dataset
categorical_features = [c for c in categorical_features if c in df.columns]

encoders = {}
for col in categorical_features:
    le = LabelEncoder()
    # Handle missing values if any
    df[col] = df[col].fillna("UNKNOWN").astype(str)
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

# 4️⃣ Handle Labels (Binary)
if label_col in df.columns:
    # Handle string labels
    if df[label_col].dtype == object or df[label_col].dtype == str:
        print(f"🔄 Mapping string labels to numeric...")
        label_map = {"safe": 0, "verify": 1, "block": 2, "fraud": 1, "legit": 0}
        df["target_num"] = df[label_col].str.lower().map(label_map).fillna(0).astype(int)
    else:
        df["target_num"] = df[label_col].astype(int)
    
    # Map to binary (0=safe, 1=risky) for probability training
    if df["target_num"].max() > 1:
        print("🔄 Mapping 3-class label to binary for probability scoring...")
        df["target"] = df["target_num"].apply(lambda x: 1 if x > 0 else 0)
    else:
        df["target"] = df["target_num"]
else:
    print(f"❌ Label column '{label_col}' not found!")
    sys.exit(1)

# 5️⃣ Data Split
features = [
    "amount", "log_amount", "hour", "day_of_week", "is_weekend", "is_night",
    "country_mismatch", "amount_vs_avg", "high_velocity"
] + categorical_features

if "is_international" in df.columns:
    features.append("is_international")

X = df[features]
y = df["target"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 6️⃣ Model Training
print(f"📊 Training XGBoost on {X_train.shape[0]} samples with {X_train.shape[1]} features...")

# Calculate scale_pos_weight for imbalance
# pos_weight = count(negative) / count(positive)
pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=pos_weight,
    eval_metric="aucpr", # Area Under Precision-Recall Curve (good for imbalance)
    random_state=42
)

model.fit(X_train, y_train)

# 7️⃣ Evaluation
y_proba = model.predict_proba(X_test)[:, 1]
y_pred = (y_proba >= 0.5).astype(int)

print("\n📈 MODEL PERFORMANCE REPORT")
print(classification_report(y_test, y_pred))
print(f"Average Precision (PR-AUC): {average_precision_score(y_test, y_proba):.4f}")

# Feature Importance
importances = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
print("\n🔥 Top Features:")
print(importances.head(10))

# 8️⃣ Save Artifacts
os.makedirs("model", exist_ok=True)
joblib.dump(model, "model/fraud_model.pkl")
joblib.dump(encoders, "model/encoders.pkl")
# Also save the feature list to ensure consistency in backend
joblib.dump(features, "model/feature_names.pkl")

print("\n✅ Training complete. Artifacts saved in 'model/' directory.")
