# Polyglot Pocket

An independent, local-first translation and dictionary application.

## Independence & Privacy
- **No Paid Services:** This application uses **MyMemory API** and **DictionaryAPI.dev**, which are free-to-use open-source resources. No Gemini API key or paid Google Cloud services are required for the core functionality.
- **Offline-First:** All your translations and searches are saved in a local **IndexedDB** database (via Dexie.js).
- **Privacy Centric:** No data is sent to private third-party servers for tracking. Your history remains entirely on your device.

## Deployment to GitHub Pages
To host this application for free on GitHub Pages:
1. **Export as ZIP / Sync to GitHub:** Use the settings menu in AI Studio to connect your repository.
2. **Setup Actions:** Create a `.github/workflows/deploy.yml` in your repo with the following:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm install
         - run: npm run build
         - uses: JamesIves/github-pages-deploy-action@v4
           with:
             folder: dist
   ```
3. **Configure Pages:** In GitHub Repository Settings -> Pages, set the source to "GitHub Actions".

## Technical Architecture
- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Dexie.js (IndexedDB wrapper)
- **Animations:** Framer Motion
- **Icons:** Lucide React
