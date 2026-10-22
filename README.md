# Codex sidebar usage

Shows your remaining 5-hour and weekly Codex limits beside your ChatGPT profile.

```text
5h  80%  ↻ 2h 15m
w   65%  ↻ 3d 4h
```

Refreshes every minute while the tab is visible. Hover for reset dates; click to open usage settings. A dash means the data is unavailable.

## Chrome extension

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Reload ChatGPT and expand the sidebar.

## Userscript

With Tampermonkey or Violentmonkey installed, [install the script](https://raw.githubusercontent.com/zizhengwu/codex-limits-in-sidebar/main/codex-usage.user.js) and reload ChatGPT. If the link opens as text, paste it into a new script in your userscript manager.

Use either the extension or the userscript. Both need a signed-in ChatGPT account with Codex limits. Changes to ChatGPT's internal API or sidebar may break the display.

[Publishing](PUBLISHING.md) · [Privacy](PRIVACY.md) · [Report a bug](https://github.com/zizhengwu/codex-limits-in-sidebar/issues)
