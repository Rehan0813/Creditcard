import requests
import json
import socket
from datetime import datetime

def test_register():
    url = "http://127.0.0.1:8001/register"
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    payload = {
        "username": f"test_alias_{timestamp}",
        "email": f"alias_{timestamp}@example.com",
        "password": "12345"
    }
    
    print(f"Testing {url} with payload: {payload}")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("\nSUCCESS: /register alias and username mapping are working correctly!")
        else:
            print(f"\nFAILURE: Received {response.status_code}")
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_register()
