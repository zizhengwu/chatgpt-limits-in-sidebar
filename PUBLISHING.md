# Publishing

## GitHub releases

Update the version in both `manifest.json` and `chatgpt-limits.user.js`, commit,
and push the changes, including `.github/workflows/release.yml`.
Then create and push a matching version tag:

```powershell
git tag v1.2.3
git push origin v1.2.3
```

GitHub Actions builds the ZIP and creates a release with the ZIP attached.
You can also publish a release through GitHub's website using a matching tag;
the workflow attaches the ZIP to that release. The tag must equal `v` followed
by the manifest version, and the userscript version must match.

Download `simple-chatgpt-limits-<version>.zip` from the release assets and upload
it to the Chrome Web Store. Store descriptions and promotional images are
updated separately in the store dashboard.

## Local build

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
