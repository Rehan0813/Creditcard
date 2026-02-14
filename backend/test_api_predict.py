import requests
import json
import random

BASE_URL = "http://127.0.0.1:8000"

def get_auth_token():
    # Login to get token
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    # Try login, if fails, signup
    try:
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if resp.status_code == 200:
            return resp.json()["access_token"]
        
        # Signup if login fails
        signup_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123"
        }
        resp = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
        if resp.status_code == 200:
            return resp.json()["access_token"]
        else:
            print(f"[X] Auth failed: {resp.text}")
            return None
    except Exception as e:
        print(f"[X] Auth Exception: {e}")
        return None

def test_predict_endpoint():
    print("[TEST] Testing /api/predict Endpoint...")
    
    token = get_auth_token()
    if not token:
        print("[X] Could not get auth token, skipping test.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "amount": 25000,
        "transaction_time": "2023-10-27T14:30:00",
        "merchant_category": "electronics",
        "country": "USA",
        "device_type": "mobile",
        "payment_method": "credit_card"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/predict", json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("[OK] Prediction Success!")
            print(f"   Score: {data.get('fraud_score')}")
            print(f"   Level: {data.get('risk_level')}")
            print(f"   Action: {data.get('recommended_action')}")
        else:
            print(f"[X] Prediction Failed: {response.text}")
            
    except Exception as e:
        print(f"[X] Connection Error: {e}")

if __name__ == "__main__":
    test_predict_endpoint()
