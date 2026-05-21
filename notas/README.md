# 🗒️ Apple Notes — Private Web App

A beautiful, pixel-perfect replica of Apple Notes (iOS dark mode) published as a static GitHub Pages website.

**From:** Marcelo → **To:** Dianney

---

## 📁 File Structure

```
/
├── index.html          ← App shell & all HTML modals
├── notes.json          ← Notes data (edit this to add/remove notes)
├── css/
│   └── style.css       ← All styles (Apple dark theme)
└── js/
    └── script.js       ← All logic (no frameworks, pure JS)
```

---

## 🚀 Deploy to GitHub Pages

1. Create a new **GitHub repository** (can be private or public).
2. Upload all files maintaining the folder structure above.
3. Go to **Settings → Pages**.
4. Under **Source**, select: `Deploy from a branch` → `main` → `/ (root)`.
5. Click **Save**.
6. Your site will be live in ~60 seconds at:
   `https://<your-username>.github.io/<repository-name>/`

---

## 🔐 Developer / Admin Mode

- Press **CTRL + SPACE** on any screen.
- Enter PIN: **0310**
- Admin mode lets you: **Create**, **Edit**, and **Delete** notes.
- Changes are exported as a new `notes.json` file (auto-downloaded).
- **Replace `notes.json` in your repo** to persist changes.
- Press **CTRL + SPACE** again to exit admin mode.

---

## 📝 Manually Edit notes.json

Each note object:

```json
{
  "id": "note-001",
  "title": "Note title",
  "content": "Full note content...",
  "createdAt": "2025-02-14T08:30:00.000Z",
  "sender": "Marcelo",
  "receiver": "Dianney"
}
```

---

## ✨ Features

- 🌑 True Apple Notes dark mode aesthetic
- 📱 Mobile-first, fully responsive
- 🎞️ iOS-style card → fullscreen transition animations
- 🔍 Live search across titles and content
- 🔐 Hidden developer mode (CTRL+SPACE)
- 📤 Auto-export updated notes.json on any admin change
- 📵 Works offline after first load
- 🚫 No frameworks, no dependencies, no backend

---

## 🎨 Customization

Change sender/receiver labels in `js/script.js` → `DataStore.create()`.  
Change the admin password in `js/script.js` → `const ADMIN_PASSWORD`.  
Adjust colors in `css/style.css` → `:root` CSS variables.
