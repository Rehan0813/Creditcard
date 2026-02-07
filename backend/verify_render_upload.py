import requests
import os

def test_render_upload():
    # Attempt to login to Render
    login_url = "https://creditcard-backend-q0vl.onrender.com/api/auth/login"
    login_payload = {
        "email": "testuser@example.com", 
        "password": "12345"
    }
    
    upload_url = "https://creditcard-backend-q0vl.onrender.com/api/files/upload"
    
    try:
        print(f"Logging in to {login_url}...")
        login_res = requests.post(login_url, json=login_payload)
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.text}")
            return
            
        token = login_res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a test CSV
        test_file_path = "render_debug_upload.csv"
        with open(test_file_path, "w") as f:
            f.write("amount,transaction_time,merchant_category,country,device_type,payment_method\n")
            f.write("100.0,2024-01-01 10:00:00,electronics,US,mobile,credit_card\n")
            
        print(f"Uploading {test_file_path} to {upload_url}...")
        with open(test_file_path, "rb") as f:
            files = {"file": (test_file_path, f, "text/csv")}
            upload_res = requests.post(upload_url, headers=headers, files=files)
            
        print(f"Status Code: {upload_res.status_code}")
        print(f"Response: {upload_res.text}")
        
        if upload_res.status_code == 200:
            print("\nSUCCESS: File upload is working correctly on Render backend!")
        else:
            print(f"\nFAILURE: Received {upload_res.status_code}")
            
    except Exception as e:
        print(f"\nERROR: {e}")
    finally:
        if os.path.exists("render_debug_upload.csv"):
            os.remove("render_debug_upload.csv")

if __name__ == "__main__":
    test_render_upload()
