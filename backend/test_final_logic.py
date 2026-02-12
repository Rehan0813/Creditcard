import requests
import json

def test_final_logic():
    """Test the 6 cases from user's final logic"""
    url = "http://127.0.0.1:8001/api/predict"
    login_url = "http://127.0.0.1:8001/api/auth/login"
    register_url = "http://127.0.0.1:8001/api/auth/register"
    
    user_data = {
        "name": "Test User",
        "email": "test_final@example.com",
        "password": "password123"
    }
    
    session = requests.Session()
    
    try:
        # Register/Login
        print("Authenticating...")
        try:
            reg_res = session.post(register_url, json=user_data, timeout=30)
        except:
            pass
        
        login_data = {"email": user_data["email"], "password": user_data["password"]}
        login_res = session.post(login_url, json=login_data)
        
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.text}")
            return
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test Cases
        test_cases = [
            {
                "name": "Test 1: Amount=2000, Daytime, India",
                "expected": "SAFE",
                "payload": {
                    "amount": 2000,
                    "transaction_time": "2024-10-27 14:00:00",  # Daytime
                    "merchant_category": "food",
                    "country": "IN",
                    "device_type": "mobile",
                    "payment_method": "upi"
                }
            },
            {
                "name": "Test 2: Amount=5000, Daytime, India",
                "expected": "VERIFY",
                "payload": {
                    "amount": 5000,
                    "transaction_time": "2024-10-27 14:00:00",  # Daytime
                    "merchant_category": "electronics",
                    "country": "IN",
                    "device_type": "mobile",
                    "payment_method": "credit_card"
                }
            },
            {
                "name": "Test 3: Amount=8000, Nighttime, India",
                "expected": "VERIFY",
                "payload": {
                    "amount": 8000,
                    "transaction_time": "2024-10-27 02:00:00",  # Nighttime
                    "merchant_category": "services",
                    "country": "IN",
                    "device_type": "desktop",
                    "payment_method": "debit_card"
                }
            },
            {
                "name": "Test 4: Amount=12000, Nighttime, India",
                "expected": "BLOCK",
                "payload": {
                    "amount": 12000,
                    "transaction_time": "2024-10-27 23:00:00",  # Nighttime
                    "merchant_category": "electronics",
                    "country": "IN",
                    "device_type": "mobile",
                    "payment_method": "credit_card"
                }
            },
            {
                "name": "Test 5: Amount=20000, Daytime, Not India",
                "expected": "VERIFY",
                "payload": {
                    "amount": 20000,
                    "transaction_time": "2024-10-27 14:00:00",  # Daytime
                    "merchant_category": "travel",
                    "country": "US",
                    "device_type": "mobile",
                    "payment_method": "credit_card"
                }
            },
            {
                "name": "Test 6: Amount=2000, Daytime, Not India",
                "expected": "VERIFY",
                "payload": {
                    "amount": 2000,
                    "transaction_time": "2024-10-27 14:00:00",  # Daytime
                    "merchant_category": "food",
                    "country": "US",
                    "device_type": "mobile",
                    "payment_method": "credit_card"
                }
            }
        ]
        
        print("\n" + "="*70)
        print("TESTING USER'S 6 FINAL LOGIC TEST CASES")
        print("="*70)
        
        passed = 0
        failed = 0
        
        for i, tc in enumerate(test_cases, 1):
            print(f"\n{tc['name']}")
            print(f"Expected: {tc['expected']}")
            
            res = session.post(url, json=tc['payload'], headers=headers)
            
            if res.status_code == 200:
                result = res.json()
                action = result.get('recommended_action', 'UNKNOWN').upper()
                score = result.get('fraud_score', 0)
                
                print(f"Got:      {action} (Score: {score:.4f})")
                
                if action == tc['expected']:
                    print("[PASS]")
                    passed += 1
                else:
                    print(f"[FAIL] - Expected {tc['expected']}, got {action}")
                    failed += 1
            else:
                print(f"[FAIL] API Error: {res.status_code}")
                failed += 1
        
        print("\n" + "="*70)
        print(f"RESULTS: {passed}/6 PASSED, {failed}/6 FAILED")
        print("="*70)
        
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_final_logic()
