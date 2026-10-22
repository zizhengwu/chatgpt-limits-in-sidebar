# Codex sidebar usage

A small userscript showing **5-hour** and **weekly** percentages remaining and reset countdowns beside your ChatGPT profile. No dependencies or build step.

## Install

1. Enable Tampermonkey or Violentmonkey in Chrome.
2. [Install the userscript](https://gitlab.com/zizhengwu/codex-usage/-/raw/main/codex-usage.user.js) and confirm installation in your userscript manager.
3. Reload ChatGPT.

If the link opens as plain text, create a new script in your userscript manager, paste the contents of `codex-usage.user.js`, and save. Future updates use the same GitLab URL.

The compact display uses two aligned rows, for example `5h 80% ↻2h 15m` and `w 65% ↻3d 4h`. Percentages are remaining usage; `↻` marks the time until reset, using days/hours, hours/minutes, or minutes as appropriate. Under a minute shows `<1m`; a reset time that has arrived shows `now`. Hover for full reset dates in your local timezone; click to open usage settings. A dash means that value is unavailable.

The display refreshes every minute while the tab is visible, and when you return to it.

Uses your signed-in ChatGPT session and `/backend-api/wham/usage`, the endpoint used by the usage settings page. Tokens are kept in memory and sent only to ChatGPT. The endpoint and sidebar markup are internal and may change.

Validated with Chrome DevTools MCP against the live ChatGPT sidebar and usage response, including sidebar collapse and expand.

Report bugs in [GitLab Issues](https://gitlab.com/zizhengwu/codex-usage/-/issues).
