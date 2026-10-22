# Codex sidebar usage

A small userscript showing **5-hour** and **weekly** percentages remaining and local reset times beside your ChatGPT profile. No dependencies or build step.

## Install

1. Enable Tampermonkey or Violentmonkey in Chrome.
2. [Install the userscript](https://gitlab.com/zizhengwu/codex-usage/-/raw/main/codex-usage.user.js) and confirm installation in your userscript manager.
3. Reload ChatGPT.

If the link opens as plain text, create a new script in your userscript manager, paste the contents of `codex-usage.user.js`, and save. Future updates use the same GitLab URL.

The compact display uses two aligned rows, for example `5h 80% ↻14:30` and `w 65% ↻Fri 14:30`. Percentages are remaining usage; `↻` marks the reset time in your local timezone using a 24-hour clock. The weekly reset includes the weekday. Hover for full reset dates; click to open usage settings. A dash means that value is unavailable.

The display refreshes every minute while the tab is visible, and when you return to it.

Uses your signed-in ChatGPT session and `/backend-api/wham/usage`, the endpoint used by the usage settings page. Tokens are kept in memory and sent only to ChatGPT. The endpoint and sidebar markup are internal and may change.

Validated with Chrome DevTools MCP against the live ChatGPT sidebar and usage response, including sidebar collapse and expand.

Report bugs in [GitLab Issues](https://gitlab.com/zizhengwu/codex-usage/-/issues).
