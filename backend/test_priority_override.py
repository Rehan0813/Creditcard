import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def get_auth_token():
    try:
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "test@example.com", "password": "password123"})
        if resp.status_code == 200: return resp.json()["access_token"]
        resp = requests.post(f"{BASE_URL}/api/auth/signup", json={"name": "Test", "email": "test@example.com", "password": "password123"})
        if resp.status_code == 200: return resp.json()["access_token"]
    except: pass
    return None

def test_override():
    print("[TEST] Testing Rule Priority Override")
    token = get_auth_token()
    if not token:
        print("[X] Auth failed")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # Case: Amount 30000, India, Day -> Rule BLOCK (Score ~76).
    # Even if ML is low, Action must be BLOCK.
    payload = {
        "amount": 30000,
        "country": "India",
        "transaction_time": "2023-10-27 14:00:00",
        "merchant_category": "retail",
        "device_type": "mobile", 
        "payment_method": "credit_card"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/api/predict", json=payload, headers=headers)
        data = resp.json()
        print(f"Response Status: {resp.status_code}")
        print(f"Fraud Score: {data.get('fraud_score')}") # 0-1
        print(f"Risk Level: {data.get('risk_level')}")
        print(f"Action: {data.get('recommended_action')}")
        print(f"Reasons: {data.get('reasons')[0]}")
        
        if data.get('recommended_action') == "Block":
            print("[PASS] Action is BLOCK as expected (Override worked).")
        else:
            print(f"[FAIL] Action is {data.get('recommended_action')}, expected BLOCK.")
            
    except Exception as e:
        print(f"[X] Error: {e}")

if __name__ == "__main__":
    test_override()
