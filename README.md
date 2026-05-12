# BJJ Dojo

Track your Brazilian Jiu-Jitsu journey with a fast, offline-first training log and technique library.

## ✨ Highlights
- **Session tracking**: log mat time, energy, taps, notes, and techniques practiced.
- **Technique library**: browse categorized techniques with YouTube references.
- **Category icons**: customize categories with a built-in icon picker or your favorite emoji.
- **Club management**: create, reorder, and select clubs for every session.
- **Language support**: switch between English and Spanish in Settings.
- **Home customization**: reorder home sections and set a weekly mat-time goal.
- **PWA ready**: install it on mobile and keep data available offline.

## 🧰 Tech Stack
- React + TypeScript + Vite
- Tailwind CSS
- Dexie (IndexedDB)
- React Router

## 🚀 Getting Started
```bash
npm install
npm run dev
```

Open the app in your browser (usually `http://localhost:5173`) and start logging sessions right away.

### Build & Preview
```bash
npm run build
npm run preview
```

### Tests
```bash
npm test
```

## 📱 How to Use the App
1. **Log sessions**
   - Go to **Sessions** and tap **+**.
   - Add date, session type, duration, energy, techniques, taps, and notes.
2. **Build your technique game**
   - Open **Techniques** to browse, search, and filter your library.
   - Create custom techniques and link follow-ups/counters.
3. **Set up your profile**
   - Open **Settings** to set your belt color/stripes, theme, and language.
   - Reorder home sections and adjust your weekly mat-time goal.
4. **Manage data safely**
   - Use **Export JSON** to back up your progress.
   - Use **Import JSON** to restore backups on the same or another device.

## 💾 Data Storage
All data lives in your browser’s IndexedDB. Clearing site data or browser storage resets the app.

## 🎛️ Managing Data In-App
- **Clubs**: open Sessions → Clubs to add, reorder, rename, or delete.
- **Categories**: open Techniques → Categories to update icons.
- **Language**: open Settings → Theme & Language and choose **EN** or **ES**.

---
Train smart. Track everything.
