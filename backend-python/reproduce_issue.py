
import subprocess
import time
import requests
import sys
import os
import signal

def run_test():
    # Start the server
    print("Starting Uvicorn server...")
    # Using a different port to avoid conflict if the user's server is still running? 
    # But start.sh uses $PORT. The user's error showed port 54085 (likely random/ephemeral or user picked).
    # I'll use 8001.
    env = os.environ.copy()
    env["PORT"] = "8001"
    
    # We need to run python -m uvicorn ...
    cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"]
    
    proc = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    try:
        # Wait for server to start
        print("Waiting for server to start (10s)...")
        time.sleep(10)
        
        url = "http://127.0.0.1:8001/api/auth/signup"
        data = {
            "name": "Test School",
            "email": "test_school_repro@example.com",
            "password": "Password123!",
            "phone": "1234567890",
            "address": "123 Test Lane"
        }
        
        print(f"Sending POST request to {url}...")
        try:
            response = requests.post(url, json=data)
            print(f"Response Status: {response.status_code}")
            print(f"Response Body: {response.text}")
            
            if response.status_code == 500:
                print("SUCCESS: Reproduced 500 Error")
            elif response.status_code == 200 or response.status_code == 400:
                print("FAILURE: Request succeeded (or 400), could not reproduce 500.")
            else:
                print(f"FAILURE: Unexpected status {response.status_code}")
                
        except Exception as requests_e:
            print(f"Request failed: {requests_e}")

    finally:
        print("Terminating server...")
        proc.terminate()
        try:
            outs, errs = proc.communicate(timeout=5)
            print("Server Output:")
            print(outs.decode('utf-8', errors='ignore'))
            print("Server Errors:")
            print(errs.decode('utf-8', errors='ignore'))
        except:
            proc.kill()

if __name__ == "__main__":
    run_test()
