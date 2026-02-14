import joblib
import pandas as pd
from datetime import datetime

# -----------------------------
# LOAD MODEL
# -----------------------------
model = joblib.load("models/fraud_pipeline.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")


# -----------------------------
# RULE BASED RISK
# -----------------------------
def rule_risk(country, amount, hour):
    daytime = 6 <= hour <= 21

    if country == "IN":
        if daytime:
            if amount < 5000:
                return (amount / 5000) * 30
            elif amount <= 25000:
                return 31 + ((amount - 5000) / 20000) * 39
            else:
                return 71 + min((amount - 25000) / 25000 * 29, 29)
        else:
            if amount < 3000:
                return (amount / 3000) * 30
            elif amount <= 10000:
                return 31 + ((amount - 3000) / 7000) * 39
            else:
                return 71 + min((amount - 10000) / 20000 * 29, 29)
    else:
        if daytime:
            if amount <= 20000:
                return 40 + (amount / 20000) * 30
            else:
                return 75 + min((amount - 20000) / 30000 * 25, 25)
        else:
            if amount <= 10000:
                return 45 + (amount / 10000) * 25
            else:
                return 80 + min((amount - 10000) / 20000 * 20, 20)


# -----------------------------
# ML RISK
# -----------------------------
def ml_risk(transaction):
    input_df = pd.DataFrame([transaction])
    probs = model.predict_proba(input_df)[0]

    class_names = label_encoder.inverse_transform([0, 1, 2])
    prob_dict = dict(zip(class_names, probs))

    ml_score = (
        prob_dict.get("BLOCK", 0) * 100 +
        prob_dict.get("VERIFY", 0) * 60 +
        prob_dict.get("SAFE", 0) * 10
    )

    return ml_score


# -----------------------------
# FINAL DECISION
# -----------------------------
def final_decision(transaction):
    amount = transaction["amount"]
    country = transaction["country"]
    time_obj = datetime.fromisoformat(transaction["transaction_time"])
    hour = time_obj.hour

    r_risk = rule_risk(country, amount, hour)
    m_risk = ml_risk(transaction)

    final_risk = round((0.6 * m_risk) + (0.4 * r_risk), 2)

    if final_risk <= 30:
        decision = "SAFE"
        action = "Approve Transaction"
    elif final_risk <= 70:
        decision = "VERIFY"
        action = "Send OTP / Step-up Authentication"
    elif final_risk <= 85:
        decision = "BLOCK"
        action = "Temporary Block + User Alert"
    else:
        decision = "BLOCK"
        action = "Hard Block + Fraud Investigation"

    return final_risk, decision, action


# -----------------------------
# TEST CASES
# -----------------------------
if __name__ == "__main__":

    test_cases = [
        {"amount": 1, "country": "IN", "merchant_category": "grocery",
         "payment_method": "credit_card", "device_type": "mobile",
         "transaction_time": "2026-02-09T10:00:00"},

        {"amount": 100000, "country": "IN", "merchant_category": "electronics",
         "payment_method": "credit_card", "device_type": "mobile",
         "transaction_time": "2026-02-09T10:00:00"},

        {"amount": 200000, "country": "US", "merchant_category": "fashion",
         "payment_method": "credit_card", "device_type": "mobile",
         "transaction_time": "2026-02-09T02:00:00"},

        {"amount": 8000, "country": "FR", "merchant_category": "travel",
         "payment_method": "credit_card", "device_type": "mobile",
         "transaction_time": "2026-02-09T14:00:00"},

        {"amount": 25000, "country": "IN", "merchant_category": "entertainment",
         "payment_method": "credit_card", "device_type": "mobile",
         "transaction_time": "2026-02-09T11:00:00"},
    ]

    for i, txn in enumerate(test_cases, 1):
        risk, decision, action = final_decision(txn)

        print(f"\nTest Case {i}")
        print("Risk Score:", risk)
        print("Decision:", decision)
        print("Recommended Action:", action)