const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = path.resolve(__dirname, '..');
const manifest = require('../manifest.json');

test('installed extension renders, refreshes, recovers, and opens its popup', async () => {
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`]
  });
  try {
    let mode = 'normal';
    const requests = [];
    await context.route('https://chatgpt.com/**', async route => {
      const url = new URL(route.request().url());
      requests.push(url.pathname);
      if (url.pathname === '/api/auth/session') {
        return route.fulfill({ json: mode === 'signed-out' ? {} : { accessToken: 'fixture-token' } });
      }
      if (url.pathname === '/backend-api/wham/usage') {
        assert.equal(route.request().headers().authorization, 'Bearer fixture-token');
        if (mode === 'error') return route.fulfill({ status: 503, body: 'Unavailable' });
        const now = Math.floor(Date.now() / 1000);
        return route.fulfill({ json: { rate_limit: mode === 'missing' ? {} : {
          primary_window: { used_percent: mode === 'short' ? 99 : 20, reset_at: now + (mode === 'short' ? 30 : 8130) },
          secondary_window: { used_percent: mode === 'short' ? 100 : 35, reset_at: now + (mode === 'short' ? -1 : 273630) }
        } } });
      }
      return route.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(__dirname, 'sidebar.html'), 'utf8') });
    });
    const page = await context.newPage();
    await page.goto('https://chatgpt.com/');
    const badge = page.locator('#codex-usage');
    await page.waitForFunction(() => document.querySelector('#codex-usage')?.textContent.includes('80%'));
    assert.equal(await badge.count(), 1);
    assert.equal(await badge.locator('span').count(), 8);
    const geometry = () => badge.locator('span').evaluateAll(cells => cells.map(cell => {
      const { x, width } = cell.getBoundingClientRect();
      return { x, width };
    }));
    const before = await geometry();
    assert.deepEqual(before.slice(0, 4), before.slice(4));
    assert.equal(await badge.getAttribute('href'), '/settings/usage?tab=overview');
    assert.ok(!(await badge.getAttribute('aria-label')).includes('fixture-token'));

    const refresh = async next => {
      mode = next;
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    };
    await refresh('short');
    await page.waitForFunction(() => document.querySelector('#codex-usage')?.textContent.includes('<1m'));
    assert.ok((await badge.textContent()).includes('now'));
    assert.deepEqual(await geometry(), before);
    await refresh('missing');
    await page.waitForFunction(() => document.querySelectorAll('#codex-usage .usage-percent')[0]?.textContent === '—');
    await refresh('error');
    await page.waitForFunction(() => document.querySelector('#codex-usage')?.title.includes('Usage: 503'));
    await refresh('signed-out');
    await page.waitForFunction(() => document.querySelector('#codex-usage')?.title.includes('Sign in to ChatGPT'));
    await refresh('normal');
    await page.waitForFunction(() => document.querySelector('#codex-usage')?.textContent.includes('80%'));
    await badge.evaluate(el => el.remove());
    await page.waitForFunction(() => !!document.querySelector('#codex-usage'), null, { timeout: 5000 });
    assert.equal(await badge.count(), 1);

    // The userscript and extension share the duplicate-instance guard.
    const requestCount = requests.length;
    await page.addScriptTag({ path: path.join(root, 'codex-usage.user.js') });
    assert.equal(await badge.count(), 1);
    assert.equal(requests.length, requestCount);

    const management = await context.newPage();
    await management.goto('chrome://extensions/');
    const extensionId = await management.evaluate(() => {
      const manager = document.querySelector('extensions-manager').shadowRoot;
      const list = manager.querySelector('extensions-item-list').shadowRoot;
      return [...list.querySelectorAll('extensions-item')]
        .find(item => item.data.name === 'Codex Usage in Sidebar')?.id;
    });
    assert.ok(extensionId, 'Chrome registered the unpacked extension');
    const popup = await context.newPage();
    const popupErrors = [];
    popup.on('pageerror', error => popupErrors.push(error.message));
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    assert.equal(await popup.locator('h1').innerText(), 'Codex Usage\nin Sidebar');
    assert.equal(await popup.locator('a.button').getAttribute('href'), 'https://chatgpt.com/settings/usage?tab=overview');
    assert.equal(await popup.locator('img').evaluate(img => img.complete && img.naturalWidth), 48);
    assert.deepEqual(popupErrors, []);
    assert.deepEqual(manifest.content_scripts[0].matches, ['https://chatgpt.com/*']);
    assert.equal(manifest.permissions, undefined);
    assert.equal(manifest.host_permissions, undefined);
    assert.equal(manifest.version, fs.readFileSync(path.join(root, 'codex-usage.user.js'), 'utf8').match(/@version\s+(\S+)/)[1]);
  } finally {
    await context.close();
  }
});
