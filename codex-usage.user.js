// ==UserScript==
// @name         Codex usage in sidebar
// @namespace    https://gitlab.com/zizhengwu/codex-usage
// @version      1.0.0
// @description  Show remaining 5-hour and weekly Codex limits beside your profile.
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
      margin-left: auto;
      color: inherit;
      font-size: 11px;
      line-height: 16px;
      font-variant-numeric: tabular-nums;
      text-decoration: none;
      white-space: pre;
      pointer-events: auto;
    }
    #codex-usage:hover { opacity: .7; }
  `;
  document.head.append(style);

  const badge = document.createElement('a');
  badge.id = 'codex-usage';
  badge.href = '/settings/usage?tab=overview';
  badge.textContent = '5-hour   —\nWeekly  —';
  badge.title = 'Codex usage: loading…';

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
      const labels = ['5-hour', 'Weekly'];
      badge.textContent = windows.map((window, i) => {
        const used = window?.used_percent;
        const left = typeof used === 'number' && Number.isFinite(used)
          ? `${Math.round(Math.max(0, Math.min(100, 100 - used)))}% left` : '—';
        return `${labels[i]}  ${left}`;
      }).join('\n');
      badge.title = 'Codex remaining usage\n' + windows.map((window, i) =>
        `${labels[i]} resets: ${window?.reset_at
          ? new Date(window.reset_at * 1000).toLocaleString() : 'unavailable'}`
      ).join('\n');
    } catch (error) {
      badge.textContent = '5-hour   —\nWeekly  —';
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
