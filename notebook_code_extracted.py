# --- CELL 0 ---
joblib.dump(
    {
        "model": "XGBoost",
        "threshold": 0.4,
        "accuracy_test": 0.74,
        "fraud_recall_test": 0.38
    },
    "../Model/model_metadata.pkl"
)


# --- CELL 1 ---
joblib.dump(0.4, "../Model/fraud_threshold.pkl")


# --- CELL 2 ---
import joblib

joblib.dump(pipeline, "../Model/xgb_fraud_pipeline.pkl")


# --- CELL 3 ---
y_val_proba = pipeline.predict_proba(X_val)[:, 1]

for t in [0.3, 0.4, 0.5]:
    print(f"\nThreshold = {t}")
    preds = (y_val_proba >= t).astype(int)
    print(classification_report(y_val, preds))


# --- CELL 4 ---
pipeline.fit(X_train, y_train)


# --- CELL 5 ---
X = df.drop("is_fraud", axis=1)
y = df["is_fraud"]

from sklearn.model_selection import train_test_split

X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=42, stratify=y
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
)


# --- CELL 6 ---
numeric_features = [
    "amount",
    "log_amount",
    "transaction_count_24h",
    "avg_amount_24h",
    "hour",
    "day_of_week",
    "is_weekend",
    "is_international",
    "country_mismatch",
    "high_amount",
    "is_night",
    "high_velocity",
    "risky_merchant",
    "amount_vs_avg",
    "risk_combo"
]


# --- CELL 7 ---
df["risk_combo"] = (
    df["is_international"] +
    df["is_night"] +
    df["high_velocity"]
)


# --- CELL 8 ---
df["amount_vs_avg"] = df["amount"] / (df["avg_amount_24h"] + 1)


# --- CELL 9 ---
y_test_proba = pipeline.predict_proba(X_test)[:, 1]
y_test_pred = (y_test_proba >= 0.4).astype(int)

from sklearn.metrics import classification_report
print(classification_report(y_test, y_test_pred))


# --- CELL 10 ---
y_val_proba = pipeline.predict_proba(X_val)[:, 1]

for t in [0.2, 0.3, 0.4]:
    print(f"\nThreshold = {t}")
    preds = (y_val_proba >= t).astype(int)
    print(classification_report(y_val, preds))


# --- CELL 11 ---
from sklearn.metrics import classification_report

y_val_pred = pipeline.predict(X_val)
print(classification_report(y_val, y_val_pred))


# --- CELL 12 ---
pipeline.fit(X_train, y_train)


# --- CELL 13 ---
print(X_train.columns)


# --- CELL 14 ---
from sklearn.model_selection import train_test_split

X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=42, stratify=y
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
)


# --- CELL 15 ---
X = df.drop("is_fraud", axis=1)
y = df["is_fraud"]


# --- CELL 16 ---
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
    ]
)

scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

xgb_model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    eval_metric="aucpr",
    random_state=42
)

pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("model", xgb_model)
])


# --- CELL 17 ---
numeric_features = [
    "amount",
    "log_amount",
    "transaction_count_24h",
    "avg_amount_24h",
    "hour",
    "day_of_week",
    "is_weekend",
    "is_international",
    "country_mismatch",
    "high_amount",
    "is_night",
    "high_velocity",
    "risky_merchant"
]


# --- CELL 18 ---
risky_categories = ["gaming", "electronics"]
df["risky_merchant"] = df["merchant_category"].isin(risky_categories).astype(int)


# --- CELL 19 ---
df["high_velocity"] = (df["transaction_count_24h"] > 3).astype(int)


# --- CELL 20 ---
df["is_night"] = df["hour"].between(0, 5).astype(int)


# --- CELL 21 ---
df["high_amount"] = (df["amount"] > 300).astype(int)


# --- CELL 22 ---
threshold = 0.3
y_val_pred_custom = (y_val_proba >= threshold).astype(int)

from sklearn.metrics import classification_report
print(classification_report(y_val, y_val_pred_custom))


# --- CELL 23 ---
y_val_proba = pipeline.predict_proba(X_val)[:, 1]


# --- CELL 24 ---
from sklearn.metrics import classification_report

y_val_pred = pipeline.predict(X_val)
print(classification_report(y_val, y_val_pred))


# --- CELL 25 ---
pipeline.fit(X_train, y_train)


# --- CELL 26 ---
from sklearn.pipeline import Pipeline

pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("model", xgb_model)
])


# --- CELL 27 ---
from xgboost import XGBClassifier

scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

xgb_model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    eval_metric="aucpr",
    random_state=42
)


# --- CELL 28 ---
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
    ]
)


# --- CELL 29 ---
from sklearn.model_selection import train_test_split

X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=42, stratify=y
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
)


# --- CELL 30 ---
categorical_features = [
    "currency",
    "merchant_id",
    "merchant_category",
    "merchant_country",
    "country",
    "device_type",
    "channel",
    "payment_method"
]


# --- CELL 31 ---
numeric_features = [
    "amount",
    "log_amount",
    "transaction_count_24h",
    "avg_amount_24h",
    "hour",
    "day_of_week",
    "is_weekend",
    "is_international",
    "country_mismatch"
]


# --- CELL 32 ---
X = df.drop("is_fraud", axis=1)
y = df["is_fraud"]


# --- CELL 33 ---
df.head()
df.columns


# --- CELL 34 ---
df = df.drop(columns=[
    "transaction_id",
    "customer_id",
    "transaction_time"
])


# --- CELL 35 ---
df["country_mismatch"] = (df["country"] != df["merchant_country"]).astype(int)


# --- CELL 36 ---
df["log_amount"] = np.log1p(df["amount"])


# --- CELL 37 ---
df["hour"] = df["transaction_time"].dt.hour
df["day_of_week"] = df["transaction_time"].dt.dayofweek
df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)


# --- CELL 38 ---
import numpy as np

df["transaction_time"] = pd.to_datetime(df["transaction_time"])


# --- CELL 39 ---
df = pd.read_csv("generic_fraud_transactions.csv")
df.head()


