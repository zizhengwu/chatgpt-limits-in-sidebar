# Codex sidebar usage

A small userscript showing **5-hour** and **Weekly** percentages remaining beside your ChatGPT profile. No dependencies or build step.

## Install

1. Enable Tampermonkey or Violentmonkey in Chrome.
2. [Install the userscript](https://gitlab.com/zizhengwu/codex-usage/-/raw/main/codex-usage.user.js) and confirm installation in your userscript manager.
3. Reload ChatGPT.

If the link opens as plain text, create a new script in your userscript manager, paste the contents of `codex-usage.user.js`, and save. Future updates use the same GitLab URL.

The display refreshes every minute while the tab is visible, and when you return to it. Hover for local reset times; click to open usage settings. A dash means usage is unavailable.

Uses your signed-in ChatGPT session and `/backend-api/wham/usage`, the endpoint used by the usage settings page. Tokens are kept in memory and sent only to ChatGPT. The endpoint and sidebar markup are internal and may change.

Validated with Chrome DevTools MCP against the live ChatGPT sidebar and usage response, including sidebar collapse and expand.

Report bugs in [GitLab Issues](https://gitlab.com/zizhengwu/codex-usage/-/issues).
