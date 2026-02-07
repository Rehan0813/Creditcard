
import sys
import os
import traceback
import pandas as pd

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

try:
    import main
except Exception as e:
    print(f"Failed to import main: {e}")
    sys.exit(1)

# Base transaction data (safe)
base_data = {
    "transaction_time": "07-02-2026 14:30",
    "merchant_category": "groceries",
    "country": "US",
    "device_type": "mobile",
    "payment_method": "credit_card",
    "channel": "in_store",
    "merchant_country": "US",
    "transaction_count_24h": 1,
    "avg_amount_24h": 45.0,
    "amount": 50.0  # Default
}

scenarios = [
    {"name": "Low Amount", "amount": 10.0},
    {"name": "Normal Amount", "amount": 100.0},
    {"name": "High Amount (Safe Context)", "amount": 1000.0},
    {"name": "Very High Amount (Safe Context)", "amount": 5000.0},
    {
        "name": "High Amount + Risky Context",
        "amount": 5000.0,
        "transaction_time": "07-02-2026 03:00",  # Night
        "merchant_category": "electronics",      # Risky
        "country": "RU"                         # Mismatch
    }
]

print("\n--- Testing Prediction Sensitivity ---\n")

for scenario in scenarios:
    data = base_data.copy()
    data.update(scenario)
    # Remove 'name' from data passed to prediction
    name = data.pop("name")
    
    try:
        result = main.calculate_prediction(data)
        print(f"Scenario: {name}")
        print(f"  Amount: {data['amount']}")
        print(f"  Fraud Score: {result['fraud_score']}")
        print(f"  Risk Level: {result['risk_level']}")
        if result['fraud_score'] > 0.5:
             print(f"  Reasons: {result['reasons']}")
        print("-" * 30)
    except Exception as e:
        print(f"Scenario: {name} FAILED: {e}")
