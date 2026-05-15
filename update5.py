import os

file = r"C:\Users\rk751\.gemini\antigravity\brain\d96c3294-c2d8-4eb0-9196-02bed524716d\feature_suggestions.md.resolved"
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("### 18. ♻️ Refresh Token / Token Expiry Handling", "### 18. ♻️ Refresh Token / Token Expiry Handling [COMPLETED ✅]")
content = content.replace("**What's missing:** JWT is created at login but likely has no refresh mechanism. Users get logged out unexpectedly.\n**Add:**\n- Short-lived access token (15m) + long-lived refresh token (7d) stored in httpOnly cookie\n- `POST /api/auth/refresh` endpoint", "**What's missing:** JWT is created at login but likely has no refresh mechanism. Users get logged out unexpectedly.\n**Done:**\n- Implemented short-lived access token (15m) + long-lived refresh token (7d) stored in httpOnly cookie\n- Added `POST /api/auth/refresh` and `POST /api/auth/logout` endpoints\n- Updated frontend `authStore.js` to automatically intercept 401s and refresh the token")

content = content.replace("| 18 | Refresh Tokens | Security | Medium | ⭐⭐⭐⭐ |", "| 18 | ~~Refresh Tokens~~ | Security | Medium | **DONE** ✅ |")

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
