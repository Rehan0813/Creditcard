import requests
import json

BASE_URL = "http://localhost:8001"

def test_reset_password():
    # Attempt to reset password for a user
    # Note: This assumes a user named "Test User" with email "test@example.com" exists
    # If not, it should return a 404 which also confirms the endpoint works
    payload = {
        "email": "test@example.com",
        "name": "Test User",
        "new_password": "newpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_reset_password()
