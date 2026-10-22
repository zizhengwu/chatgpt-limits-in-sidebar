# Publishing

Run in PowerShell 7:

```powershell
./scripts/package.ps1
```

For updates, increase the version in both `manifest.json` and `chatgpt-limits.user.js`, then rebuild.

## Tests

Requires Node.js 18+:

```powershell
npm install
npx playwright-core install chromium
npm test
```

Tests load the extension in Chromium with sample responses. Check the live ChatGPT sidebar separately.

Run `npm run images` to rebuild the icons and store images from `store/source.png`.
