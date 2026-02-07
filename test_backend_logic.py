
import sys
import os
import traceback

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

try:
    print("Importing main...")
    import main
    print("Successfully imported main.")
except Exception as e:
    print(f"Failed to import main: {e}")
    traceback.print_exc()
    sys.exit(1)

# Inspect what main thinks MODEL_LOADED is
print(f"MODEL_LOADED: {main.MODEL_LOADED}")
if not main.MODEL_LOADED:
    print("Model not loaded in main.py, debug prints won't help if we hit fallback early? No, fallback is inside try/except block if model is None.")
    # Actually, calculate_prediction checks NO, it checks:
    # if not MODEL_LOADED: return fallback
    # So if model failed to load, we won't see the error "columns are missing".
    # But the user logs show "columns are missing", so MODEL_LOADED MUST be True.

# data from a typical request
dummy_data = {
    "amount": 100.0,
    "transaction_time": "2023-01-01 12:00:00",
    "merchant_category": "retail",
    "country": "US",
    "device_type": "mobile",
    "payment_method": "credit_card"
}

print("\nCalling calculate_prediction with dummy data...")
try:
    result = main.calculate_prediction(dummy_data)
    print("Result:", result)
except Exception as e:
    print(f"Call failed: {e}")
    traceback.print_exc()
