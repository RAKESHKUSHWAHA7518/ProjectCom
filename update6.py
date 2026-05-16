import os

file = r"C:\Users\rk751\.gemini\antigravity\brain\d96c3294-c2d8-4eb0-9196-02bed524716d\feature_suggestions.md.resolved"
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("### 10. 📝 Session Notes & Resource Sharing", "### 10. 📝 Session Notes & Resource Sharing [COMPLETED ✅]")
content = content.replace("**What's missing:** Session has a `notes` field (single string, set at booking) but no post-session note-taking.\n**Add:**\n- Mentor/Learner can add post-session notes\n- Attach resource links (YouTube, docs, GitHub repos)\n- Viewable from session history\n> **Files:** `Session.js`, `sessionController.js`, `Sessions.jsx`", "**What's missing:** Session has a `notes` field (single string, set at booking) but no post-session note-taking.\n**Done:**\n- Updated `Session.js` schema with `sharedNotes`.\n- Added `POST /api/sessions/:id/notes` endpoint to `sessionController.js`.\n- Added note-taking UI directly inside past/accepted session cards in `Sessions.jsx`.\n> **Files:** `Session.js`, `sessionController.js`, `Sessions.jsx`")

content = content.replace("### 12. 🌐 Multi-language Support (i18n)", "### 12. 🌐 Multi-language Support (i18n) [COMPLETED ✅]")
content = content.replace("**What's missing:** The app is English-only.\n**Add:** React i18n with `react-i18next` for English, Hindi, Spanish, etc.\n> **Files:** All frontend `.jsx` files", "**What's missing:** The app is English-only.\n**Done:** Installed `i18next` and `react-i18next`, configured `i18n.js` with EN, HI, ES translations, added a `<LanguageToggle />` to the Navbar, and translated the primary App layout and landing page.\n> **Files:** `i18n.js`, `main.jsx`, `App.jsx`")

content = content.replace("| 10 | Session Notes | Low | Low | ⭐⭐ |", "| 10 | ~~Session Notes~~ | Low | Low | **DONE** ✅ |")
content = content.replace("| 12 | i18n | Low | High | ⭐⭐ |", "| 12 | ~~i18n~~ | Low | High | **DONE** ✅ |")

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
