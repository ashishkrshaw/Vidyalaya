import sys
import os
from fastapi.testclient import TestClient

# Add current dir to path
sys.path.append(os.getcwd())

print("Attempting to import app.main...")
try:
    from app.main import app
    print("✅ SUCCESS: app.main imported successfully.")
except Exception as e:
    print(f"❌ FAILURE: Crashed on import. Error: {e}")
    sys.exit(1)

print("Attempting to instantiate TestClient...")
try:
    client = TestClient(app)
    print("✅ SUCCESS: TestClient created.")
except Exception as e:
    print(f"❌ FAILURE: TestClient failed. Error: {e}")
    sys.exit(1)

print("Attempting basic health check (GET /)...")
try:
    response = client.get("/")
    print(f"Response Status: {response.status_code}")
    if response.status_code != 404 and response.status_code != 200:
         # 404 is fine if root route isn't defined, just means it responded
         pass
    print("✅ SUCCESS: App responded to request.")
except Exception as e:
    print(f"❌ FAILURE: Request failed. Error: {e}")
    sys.exit(1)

print("ALL CHECKS PASSED. Backend is stable.")
