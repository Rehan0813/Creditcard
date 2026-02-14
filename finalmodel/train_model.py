import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
from xgboost import XGBClassifier
import joblib

# -----------------------------
# LOAD DATASET
# -----------------------------
df = pd.read_csv("data/fraud_transactions_200k_final.csv")

# -----------------------------
# USE ONLY 3 FEATURES
# -----------------------------
X = df[[
    "amount",
    "country",
    "transaction_time"
]]

# -----------------------------
# ENCODE TARGET
# -----------------------------
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df["label"])

# -----------------------------
# PREPROCESSING
# -----------------------------
categorical_cols = [
    "country",
    "transaction_time"   # keep as-is
]

numeric_cols = ["amount"]

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
        ("num", "passthrough", numeric_cols)
    ]
)

# -----------------------------
# MODEL
# -----------------------------
model = XGBClassifier(
    objective="multi:softprob",
    num_class=3,
    eval_metric="mlogloss",
    n_estimators=200,
    max_depth=6,
    learning_rate=0.08,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("model", model)
])

# -----------------------------
# TRAIN / TEST SPLIT
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# -----------------------------
# TRAIN
# -----------------------------
pipeline.fit(X_train, y_train)

# -----------------------------
# EVALUATE
# -----------------------------
y_pred = pipeline.predict(X_test)

print("\n📊 Classification Report:\n")
print(classification_report(y_test, y_pred))

print("\n📉 Confusion Matrix:\n")
print(confusion_matrix(y_test, y_pred))

# -----------------------------
# SAVE
# -----------------------------
joblib.dump(pipeline, "models/fraud_pipeline.pkl")
joblib.dump(label_encoder, "models/label_encoder.pkl")

print("\n✅ Model trained using STRICT 3 features.")