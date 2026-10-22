// ==UserScript==
// @name         Codex usage in sidebar
// @namespace    https://gitlab.com/zizhengwu/codex-usage
// @version      1.1.0
// @description  Show remaining Codex limits and local reset times beside your profile.
// @author       zizhengwu
// @homepageURL  https://gitlab.com/zizhengwu/codex-usage
// @supportURL   https://gitlab.com/zizhengwu/codex-usage/-/issues
// @downloadURL  https://gitlab.com/zizhengwu/codex-usage/-/raw/main/codex-usage.user.js
// @updateURL    https://gitlab.com/zizhengwu/codex-usage/-/raw/main/codex-usage.user.js
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';
  if (document.getElementById('codex-usage-style')) return;

  const style = document.createElement('style');
  style.id = 'codex-usage-style';
  style.textContent = `
    #codex-usage {
      flex: 0 0 auto;
      display: grid;
      grid-template-columns: auto auto auto;
      column-gap: 5px;
      margin-left: auto;
      color: inherit;
      font-size: 11px;
      line-height: 16px;
      font-variant-numeric: tabular-nums;
      text-decoration: none;
      white-space: nowrap;
      pointer-events: auto;
    }
    #codex-usage:hover { opacity: .7; }
    #codex-usage > :nth-child(3n + 2),
    #codex-usage > :nth-child(3n) { text-align: right; }
  `;
  document.head.append(style);

  const badge = document.createElement('a');
  badge.id = 'codex-usage';
  badge.href = '/settings/usage?tab=overview';
  badge.title = 'Codex usage: loading…';

  const labels = ['5-hour', 'Weekly'];
  const clock = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

  function render(windows = []) {
    const details = [];
    badge.replaceChildren();
    ['5h', 'w'].forEach((label, i) => {
      const window = windows[i];
      const used = window?.used_percent;
      const left = typeof used === 'number' && Number.isFinite(used)
        ? `${Math.round(Math.max(0, Math.min(100, 100 - used)))}%` : '—';
      const reset = typeof window?.reset_at === 'number' && window.reset_at > 0
        ? new Date(window.reset_at * 1000) : null;
      const validReset = reset && Number.isFinite(reset.getTime());
      const time = validReset
        ? `${i === 1 ? weekday.format(reset) + ' ' : ''}${clock.format(reset)}` : '—';
      for (const text of [label, left, `↻${time}`]) {
        const cell = document.createElement('span');
        cell.textContent = text;
        badge.append(cell);
      }
      details.push(`${labels[i]}: ${left === '—' ? 'unavailable' : left + ' left'}; resets: ${validReset ? reset.toLocaleString() : 'unavailable'}`);
    });
    badge.setAttribute('aria-label', `Codex remaining usage. ${details.join('. ')}. Open usage settings.`);
    return details;
  }
  render();

  // Use the expanded sidebar's profile row, not the hidden compact button.
  function mount() {
    if (badge.isConnected) return;
    const profile = [...document.querySelectorAll('[aria-label="Open profile menu"]')]
      .find(button => button.getBoundingClientRect().width > 150);
    const row = profile?.nextElementSibling?.firstElementChild;
    if (row) row.append(badge);
  }

  let busy = false;
  async function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      // Keep the session token in memory; requests stay on chatgpt.com.
      const sessionResponse = await fetch('/api/auth/session', {
        signal: AbortSignal.timeout(15000)
      });
      if (!sessionResponse.ok) throw new Error(`Session: ${sessionResponse.status}`);
      const session = await sessionResponse.json();
      if (!session.accessToken) throw new Error('Sign in to ChatGPT');
      const response = await fetch('/backend-api/wham/usage', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error(`Usage: ${response.status}`);
      const data = await response.json();
      const windows = [data.rate_limit?.primary_window, data.rate_limit?.secondary_window];
      badge.title = 'Codex remaining usage (↻ local reset time)\n' + render(windows).join('\n');
    } catch (error) {
      render();
      badge.title = `Codex usage unavailable: ${error.message}. Retrying every minute.`;
    } finally {
      busy = false;
    }
  }

  mount();
  refresh();
  // Reattach after sidebar navigation or collapse/expand without observing every DOM change.
  setInterval(mount, 2000);
  setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { mount(); refresh(); }
  });
})();
