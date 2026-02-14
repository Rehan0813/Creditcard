import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_signup_endpoint():
    print("[TEST] Checking Signup Endpoint Availability...")
    
    url = f"{BASE_URL}/api/auth/signup"
    try:
        response = requests.post(url, json={})
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("[X] Endpoint /api/auth/signup is NOT FOUND (404)")
        elif response.status_code == 422:
            print("[OK] Endpoint exists (422 Validation Error expected for empty body)")
        elif response.status_code == 200:
            print("[OK] Endpoint exists (200 OK)")
        else:
            print(f"[OK] Endpoint exists (Status: {response.status_code})")
            
    except Exception as e:
        print(f"[X] Connection Error: {e}")
        print("Make sure the backend is running.")

if __name__ == "__main__":
    test_signup_endpoint()
