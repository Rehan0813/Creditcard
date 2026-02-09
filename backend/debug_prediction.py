import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8001"

def send_request(endpoint, data=None, headers=None, method='POST'):
    url = f"{BASE_URL}{endpoint}"
    if headers is None:
        headers = {}
    
    if data:
        json_data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        json_data = None
        
    req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode('utf-8')
            return status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

def debug_requests():
    # 1. Login
    login_payload = {
        "email": "test4@example.com",
        "password": "password123"
    }
    
    print("Attempting login...")
    status, body = send_request("/api/auth/login", login_payload)
    
    if status != 200:
        print("Login failed, attempting signup...")
        signup_payload = {
            "name": "Test User",
            "email": "test4@example.com",
            "password": "password123",
            "phone": "9998887776"
        }
        status, body = send_request("/api/auth/signup", signup_payload)
        if status != 200:
            print(f"Signup failed: {body}")
            return
            
    # Parse token
    try:
        resp_json = json.loads(body)
        token = resp_json.get("access_token")
    except:
        print(f"Failed to parse login response: {body}")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test Transactions with various scenarios to show score variety
    # Added richer fields: merchant_country, transaction_count_24h, avg_amount_24h, is_international
    test_cases = [
        {
            "amt": 100, "cat": "grocery", "country": "US", "time": "2023-10-27T10:00:00",
            "m_country": "US", "count_24h": 1, "avg_24h": 80, "is_intl": 0
        },
        {
            "amt": 3500, "cat": "entertainment", "country": "IN", "time": "2023-10-27T14:30:00",
            "m_country": "US", "count_24h": 5, "avg_24h": 100, "is_intl": 1
        },
        {
            "amt": 12000, "cat": "electronics", "country": "US", "time": "2023-10-27T11:00:00",
            "m_country": "US", "count_24h": 2, "avg_24h": 200, "is_intl": 0
        },
        {
            "amt": 25000, "cat": "gaming", "country": "US", "time": "2023-10-27T23:45:00",
            "m_country": "UK", "count_24h": 10, "avg_24h": 50, "is_intl": 1
        },
    ]
    
    for case in test_cases:
        print(f"\n--- Sending Request: ${case['amt']} | {case['cat']} | {case['country']} ---")
        payload = {
            "amount": float(case["amt"]),
            "transaction_time": case["time"],
            "merchant_category": case["cat"],
            "country": case["country"],
            "device_type": "mobile",
            "payment_method": "credit_card",
            "merchant_country": case["m_country"],
            "transaction_count_24h": case["count_24h"],
            "avg_amount_24h": case["avg_24h"],
            "is_international": case["is_intl"]
        }
        status, body = send_request("/api/predict", payload, headers)
        print(f"Status: {status}")
        try:
            resp = json.loads(body)
            print(f"Score: {resp.get('fraud_score'):.4f} | Level: {resp.get('risk_level')} | Action: {resp.get('recommended_action')}")
            print(f"Reasons: {resp.get('reasons')}")
        except:
            print(f"Response: {body}")

if __name__ == "__main__":
    debug_requests()
