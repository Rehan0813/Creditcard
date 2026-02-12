import requests
import json

def test_prediction():
    url = "http://127.0.0.1:8001/api/predict"
    # Token handling omitted for simplicity as endpoint might be protected.
    # If protected, we need to login first. Main.py shows `current_user: User = Depends(get_current_user)`
    
    # Let's try to login first
    login_url = "http://127.0.0.1:8001/api/auth/login"
    # Using a known user or creating one.
    # Let's try to register a temporary user for testing
    register_url = "http://127.0.0.1:8001/api/auth/register"
    user_data = {
        "name": "Test User",
        "email": "test_verification@example.com",
        "password": "password123"
    }
    
    session = requests.Session()
    
    try:
        # Register
        print(f"Registering user: {user_data['email']}")
        try:
            reg_res = session.post(register_url, json=user_data, timeout=30)
            print(f"Registration status: {reg_res.status_code}")
        except requests.exceptions.Timeout:
            print("Registration timed out")
            return
        except requests.exceptions.ConnectionError:
            print("Registration connection error - is backend running?")
            return

        if reg_res.status_code == 400 and "already exists" in reg_res.text:
            print("User already exists, logging in...")
        elif reg_res.status_code != 200:
            print(f"Registration failed: {reg_res.text}")
            return

        # Login
        login_data = {"email": user_data["email"], "password": user_data["password"]}
        print(f"Logging in user: {user_data['email']}")
        login_res = session.post(login_url, json=login_data)
        
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.text}")
            return
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Prediction Payload - Low Risk
        payload_safe = {
            "amount": 50.0,
            "transaction_time": "2024-10-27 10:00:00",
            "merchant_category": "food",
            "country": "usa",
            "device_type": "mobile",
            "payment_method": "credit_card"
        }
        
        print("\nTesting Safe Prediction...")
        res = session.post(url, json=payload_safe, headers=headers)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
        
        # Prediction Payload - High Risk (Fraud pattern from dataset: block)
        # 22529,2024-07-05 00:33:00,grocery,usa,tablet,debit_card,block
        payload_risky = {
            "amount": 22529.0,
            "transaction_time": "2024-07-05 00:33:00",
            "merchant_category": "grocery",
            "country": "usa",
            "device_type": "tablet",
            "payment_method": "debit_card"
        }
        
        print("\nTesting Risky Prediction...")
        res = session.post(url, json=payload_risky, headers=headers)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")

        # Prediction Payload - User's Case (previously 0.0)
        payload_user = {
            "amount": 100.5,
            "transaction_time": "29-01-2026 14:35",
            "merchant_category": "electronics",
            "country": "IN",
            "device_type": "mobile",
            "payment_method": "credit_card"
        }
        
        print("\nTesting User's Reported Case (IN/electronics)...")
        res = session.post(url, json=payload_user, headers=headers)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")

        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")

        # Prediction Payload - High Amount User Case (Should be Fraud/Verify)
        payload_user_high = {
            "amount": 12500.0,
            "transaction_time": "30-01-2026 14:35",
            "merchant_category": "electronics",
            "country": "IN",
            "device_type": "mobile",
            "payment_method": "credit_card"
        }
        
        print("\nTesting User's Case with High Amount (12500)...")
        res = session.post(url, json=payload_user_high, headers=headers)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")

        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")

        # --- Hybrid Rule Tests ---
        
        # Rule 1: India, Daytime (14:00), Amount < 5000 -> Should be Safe
        payload_rule1 = {
            "amount": 4500.0,
            "transaction_time": "30-01-2026 14:00",
            "country": "IN",
            "merchant_category": "electronics",
            "device_type": "mobile",
            "payment_method": "upi"
        }
        print("\nTesting Rule 1 (India, Day, <5k)...")
        res = session.post(url, json=payload_rule1, headers=headers)
        print(f"Response: {res.json()['risk_level']} - {res.json().get('reasons', [])[0]}")

        # Rule 2: India, Night (02:00), Amount < 3000 -> Should be Safe
        payload_rule2 = {
            "amount": 2500.0,
            "transaction_time": "30-01-2026 02:00",
            "country": "IN",
            "merchant_category": "food",
            "device_type": "mobile",
            "payment_method": "upi"
        }
        print("\nTesting Rule 2 (India, Night, <3k)...")
        res = session.post(url, json=payload_rule2, headers=headers)
        print(f"Response: {res.json()['risk_level']} - {res.json().get('reasons', [])[0]}")

        # Rule 3: USA, Low Amount -> Should be Verify (International)
        payload_rule3 = {
            "amount": 100.0,
            "transaction_time": "30-01-2026 14:00",
            "country": "US",
            "merchant_category": "food",
            "device_type": "mobile",
            "payment_method": "credit_card"
        }
        print("\nTesting Rule 3 (USA, Low Amount)...")
        res = session.post(url, json=payload_rule3, headers=headers)
        print(f"Response: {res.json()['risk_level']} - {res.json().get('reasons', [])[0]}")

    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    print("--- Run 1 ---")
    test_prediction()
    print("\n--- Run 2 ---")
    test_prediction()
    print("\n--- Run 3 ---")
    test_prediction()
