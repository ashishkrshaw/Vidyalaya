"""
Quick debug script to test if the token is valid
Run this in browser console on http://localhost:5173
"""

# Copy this JavaScript to your browser console:
console.log("=== MFA Setup Debug ===");

// Check if token exists
const token = localStorage.getItem('accessToken');
console.log("Token exists:", !!token);
if (token) {
    console.log("Token preview:", token.substring(0, 20) + "...");
}

// Try to manually call the MFA setup endpoint
const API_BASE = 'http://localhost:8000';

fetch(`${API_BASE}/api/mfa/totp/setup`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
    .then(res => {
        console.log("Response status:", res.status);
        return res.json();
    })
    .then(data => console.log("Response data:", data))
    .catch(err => console.error("Error:", err));
