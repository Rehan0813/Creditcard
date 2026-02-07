import requests
import json

BASE_URL = "http://localhost:8001"

def test_prediction():
    try:
        # 1. Login
        login_data = {
            "email": "test4@example.com", 
            "password": "password123" 
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code != 200:
            with open("api_result.txt", "w") as f:
                f.write(f"Login failed: {response.text}")
            return
        
        token = response.json().get("access_token")
        
        # 2. Upload file
        headers = {"Authorization": f"Bearer {token}"}
        # Create a dummy file on the fly or use existing
        files = {'file': ('test_pred.csv', open('test_pred.csv', 'rb'), 'text/csv')}
        
        upload_response = requests.post(f"{BASE_URL}/api/files/upload", headers=headers, files=files)
        
        if upload_response.status_code != 200:
            with open("api_result.txt", "w") as f:
                f.write(f"Upload failed: {upload_response.text}")
            return
            
        file_data = upload_response.json()
        file_id = file_data.get("file_id")
        
        # 3. Predict from file
        predict_response = requests.post(f"{BASE_URL}/api/predict/file/{file_id}", headers=headers)
        
        with open("api_result.txt", "w") as f:
            if predict_response.status_code == 200:
                f.write(json.dumps(predict_response.json(), indent=2))
            else:
                f.write(f"Prediction failed: {predict_response.text}")
            
    except Exception as e:
        with open("api_result.txt", "w") as f:
            f.write(f"Error: {e}")

if __name__ == "__main__":
    test_prediction()
