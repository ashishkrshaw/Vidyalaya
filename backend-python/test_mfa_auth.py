"""
Test script to check MFA setup authentication
"""
import requests

# API Base URL
API_BASE = "http://localhost:8000"

# Step 1: Login to get a token
print("=== Testing MFA Setup Flow ===\n")
print("Step 1: Attempting login...")

login_data = {
    "email": input("Enter your email: "),
    "password": input("Enter your password: ")
}

response = requests.post(f"{API_BASE}/api/auth/login", json=login_data)
print(f"Login status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data.get("access_token")
    print(f"✓ Login successful! Token received: {token[:20]}...")
    
    # Step 2: Try to setup TOTP
    print("\nStep 2: Attempting to setup TOTP...")
    headers = {"Authorization": f"Bearer {token}"}
    
    totp_response = requests.post(f"{API_BASE}/api/mfa/totp/setup", headers=headers)
    print(f"TOTP Setup status: {totp_response.status_code}")
    
    if totp_response.status_code == 200:
        print("✓ TOTP setup initiated successfully!")
        qr_data = totp_response.json()
        print(f"Secret: {qr_data.get('secret')}")
    else:
        print(f"✗ TOTP setup failed: {totp_response.text}")
    
    # Step 3: Try to setup Passkey
    print("\nStep 3: Attempting to get Passkey registration options...")
    passkey_response = requests.post(f"{API_BASE}/api/mfa/passkey/register-options", headers=headers)
    print(f"Passkey Setup status: {passkey_response.status_code}")
    
    if passkey_response.status_code == 200:
        print("✓ Passkey setup initiated successfully!")
    else:
        print(f"✗ Passkey setup failed: {passkey_response.text}")

elif response.status_code == 403:
    print(f"✗ Login blocked: {response.json()}")
else:
    print(f"✗ Login failed: {response.text}")
