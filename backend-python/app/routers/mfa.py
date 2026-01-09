from fastapi import APIRouter, HTTPException, Depends, status, Body
import pyotp
import qrcode
import io
import base64
from typing import Optional, List
from datetime import datetime
import secrets

from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
    base64url_to_bytes
)
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    RegistrationCredential,
    AuthenticationCredential,
    PublicKeyCredentialDescriptor
)

from ..database import schools_collection
from ..utils.security import get_current_school, create_access_token
from ..models.school import MessageResponse, TokenResponse, SchoolResponse
from ..config import get_settings

router = APIRouter(prefix="/api/mfa", tags=["Multi-Factor Authentication"])
settings = get_settings()

@router.post("/totp/setup")
async def setup_totp(current_school: dict = Depends(get_current_school)):
    """Generate a new TOTP secret and QR code for the current school"""
    
    if current_school.get("mfa_enabled") and current_school.get("totp_secret"):
        raise HTTPException(status_code=400, detail="MFA is already enabled")
    
    # Generate secret
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    prov_uri = totp.provisioning_uri(
        name=current_school["email"], 
        issuer_name=settings.rp_name
    )
    
    # Generate QR Code
    img = qrcode.make(prov_uri)
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    # Temporarily store secret in school doc (not enabled yet)
    await schools_collection.update_one(
        {"_id": current_school["_id"]},
        {"$set": {"temp_totp_secret": secret}}
    )
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}"
    }

@router.post("/totp/verify-setup", response_model=MessageResponse)
async def verify_totp_setup(
    code: str = Body(..., embed=True),
    current_school: dict = Depends(get_current_school)
):
    """Verify the first TOTP code and enable MFA for the school"""
    
    secret = current_school.get("temp_totp_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="MFA setup not initiated")
    
    totp = pyotp.TOTP(secret)
    if totp.verify(code):
        # Enable MFA
        await schools_collection.update_one(
            {"_id": current_school["_id"]},
            {
                "$set": {
                    "mfa_enabled": True,
                    "totp_secret": secret,
                    "mfa_type": "totp"
                },
                "$unset": {"temp_totp_secret": ""}
            }
        )
        return MessageResponse(message="MFA enabled successfully", success=True)
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")

@router.post("/totp/verify", response_model=TokenResponse)
async def verify_totp_login(
    email: str = Body(...),
    code: str = Body(...)
):
    """Verify TOTP during login and issue token"""
    
    school = await schools_collection.find_one({"email": email})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    if not school.get("mfa_enabled") or school.get("mfa_type") != "totp":
         raise HTTPException(status_code=400, detail="MFA not enabled or not TOTP")

    secret = school.get("totp_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="MFA configuration error")

    totp = pyotp.TOTP(secret)
    if totp.verify(code):
        # Create token
        token_data = {
            "school_id": str(school["_id"]),
            "email": school["email"],
            "name": school["name"]
        }
        access_token = create_access_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            school=SchoolResponse(
                id=str(school["_id"]),
                name=school["name"],
                email=school["email"],
                phone=school["phone"],
                address=school.get("address"),
                status=school["status"],
                created_at=school["created_at"],
                verified_at=school.get("verified_at"),
                mfa_enabled=True
            )
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")

@router.post("/disable", response_model=MessageResponse)
async def disable_mfa(
    code: str = Body(..., embed=True),
    current_school: dict = Depends(get_current_school)
):
    """Disable MFA (requires current TOTP code or special Passkey code)"""
    
    if not current_school.get("mfa_enabled"):
        raise HTTPException(status_code=400, detail="MFA is not enabled")
    
    mfa_type = current_school.get("mfa_type", "totp")
    
    # Handle Passkey disable with special code (already authenticated via JWT)
    if mfa_type == "passkey" and code == "PASSKEY_DISABLE":
        await schools_collection.update_one(
            {"_id": current_school["_id"]},
            {
                "$set": {"mfa_enabled": False},
                "$unset": {"mfa_type": "", "passkeys": "", "passkey_credential": ""}
            }
        )
        return MessageResponse(message="Passkey MFA disabled successfully", success=True)
    
    # For TOTP, verify the code before disabling
    secret = current_school.get("totp_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="TOTP secret not found")
        
    totp = pyotp.TOTP(secret)
    
    if totp.verify(code):
        await schools_collection.update_one(
            {"_id": current_school["_id"]},
            {
                "$set": {"mfa_enabled": False},
                "$unset": {"totp_secret": "", "mfa_type": "", "passkeys": ""}
            }
        )
        return MessageResponse(message="MFA disabled successfully", success=True)
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")

# --- PASSKEYS (WEBAUTHN) ---

@router.post("/passkey/register-options")
async def get_passkey_register_options(current_school: dict = Depends(get_current_school)):
    """Generate options for registering a new Passkey"""
    
    # User ID must be bytes for WebAuthn
    user_id = str(current_school["_id"]).encode('utf-8')
    
    options = generate_registration_options(
        rp_id=settings.rp_id,
        rp_name=settings.rp_name,
        user_id=user_id,
        user_name=current_school["email"],
        user_display_name=current_school["name"],
        attestation=AttestationConveyancePreference.NONE,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )
    
    # Store challenge in school doc temporarily
    await schools_collection.update_one(
        {"_id": current_school["_id"]},
        {"$set": {"temp_webauthn_challenge": options.challenge}}
    )
    
    return options_to_json(options)

@router.post("/passkey/register-verify", response_model=MessageResponse)
async def verify_passkey_registration(
    credential: dict = Body(...),
    current_school: dict = Depends(get_current_school)
):
    """Verify and save a new Passkey"""
    
    challenge = current_school.get("temp_webauthn_challenge")
    if not challenge:
        raise HTTPException(status_code=400, detail="Registration not initiated")
    
    try:
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=settings.rp_id,
            expected_origin=settings.origin,
            require_user_verification=False,
        )
        
        # Save credential
        new_passkey = {
            "credential_id": verification.credential_id,
            "public_key": verification.public_key,
            "sign_count": verification.sign_count,
            "created_at": datetime.utcnow()
        }
        
        await schools_collection.update_one(
            {"_id": current_school["_id"]},
            {
                "$push": {"passkeys": new_passkey},
                "$set": {"mfa_enabled": True, "mfa_type": "passkey"},
                "$unset": {"temp_webauthn_challenge": ""}
            }
        )
        
        return MessageResponse(message="Passkey registered successfully", success=True)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@router.post("/passkey/login-options")
async def get_passkey_login_options(email: str = Body(..., embed=True)):
    """Generate options for logging in with a Passkey"""
    
    school = await schools_collection.find_one({"email": email})
    if not school or not school.get("passkeys"):
        raise HTTPException(status_code=400, detail="No passkeys found for this account")
    
    allowed_credentials = [
        PublicKeyCredentialDescriptor(id=pk["credential_id"]) 
        for pk in school["passkeys"]
    ]
    
    options = generate_authentication_options(
        rp_id=settings.rp_id,
        allow_credentials=allowed_credentials,
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    
    # Store challenge
    await schools_collection.update_one(
        {"_id": school["_id"]},
        {"$set": {"temp_webauthn_challenge": options.challenge}}
    )
    
    return options_to_json(options)

@router.post("/passkey/login-verify", response_model=TokenResponse)
async def verify_passkey_login(
    email: str = Body(...),
    credential: dict = Body(...)
):
    """Verify Passkey login and provide access token"""
    
    school = await schools_collection.find_one({"email": email})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    challenge = school.get("temp_webauthn_challenge")
    if not challenge:
        raise HTTPException(status_code=400, detail="Login not initiated")
        
    # Find the matching passkey
    credential_id = credential.get("id")
    passkey = next((pk for pk in school["passkeys"] if pk["credential_id"] == credential_id), None)
    
    if not passkey:
        raise HTTPException(status_code=400, detail="Unknown credential")
        
    try:
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=settings.rp_id,
            expected_origin=settings.origin,
            credential_public_key=passkey["public_key"],
            credential_current_sign_count=passkey["sign_count"],
            require_user_verification=False,
        )
        
        # Update sign count
        await schools_collection.update_one(
            {"_id": school["_id"], "passkeys.credential_id": credential_id},
            {
                "$set": {"passkeys.$.sign_count": verification.new_sign_count},
                "$unset": {"temp_webauthn_challenge": ""}
            }
        )
        
        # Create final token
        token_data = {
            "sub": str(school["_id"]),
            "email": school["email"],
            "name": school["name"]
        }
        access_token = create_access_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            school=SchoolResponse(
                id=str(school["_id"]),
                name=school["name"],
                email=school["email"],
                phone=school["phone"],
                address=school.get("address"),
                status=school["status"],
                created_at=school["created_at"],
                verified_at=school.get("verified_at"),
                mfa_enabled=True
            )
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
