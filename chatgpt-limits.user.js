// ==UserScript==
// @name         Simple ChatGPT Limits
// @namespace    https://github.com/zizhengwu/simple-chatgpt-limits
// @version      1.2.2
// @description  See your remaining ChatGPT limits at a glance in the bottom-left sidebar, with no floating panel or setup needed.
// @author       zizhengwu
// @homepageURL  https://github.com/zizhengwu/simple-chatgpt-limits
// @supportURL   https://github.com/zizhengwu/simple-chatgpt-limits/issues
// @downloadURL  https://raw.githubusercontent.com/zizhengwu/simple-chatgpt-limits/main/chatgpt-limits.user.js
// @updateURL    https://raw.githubusercontent.com/zizhengwu/simple-chatgpt-limits/main/chatgpt-limits.user.js
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';
  if (document.getElementById('chatgpt-limits-style')) return;

  const style = document.createElement('style');
  style.id = 'chatgpt-limits-style';
  style.textContent = `
    #chatgpt-limits {
      flex: 0 0 auto;
      display: grid;
      grid-template-columns: max-content 4ch max-content minmax(7ch, max-content);
      column-gap: 4px;
      margin-left: auto;
      color: inherit;
      font-size: 11px;
      line-height: 16px;
      font-variant-numeric: tabular-nums;
      text-decoration: none;
      white-space: nowrap;
      pointer-events: auto;
    }
    #chatgpt-limits:hover { opacity: .7; }
    #chatgpt-limits > .limits-percent { text-align: right; }
    #chatgpt-limits > .limits-reset { text-align: center; }
    #chatgpt-limits > .limits-label,
    #chatgpt-limits > .limits-countdown { text-align: left; }
  `;
  document.head.append(style);

  const badge = document.createElement('a');
  badge.id = 'chatgpt-limits';
  badge.href = '/settings/usage?tab=overview';
  badge.title = 'ChatGPT limits: loading…';

  const labels = ['5-hour', 'Weekly'];
  function resetCountdown(reset, now) {
    const remaining = reset.getTime() - now;
    if (remaining <= 0) return 'now';
    if (remaining < 60000) return '<1m';
    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days) return `${days}d${hours % 24 ? ` ${hours % 24}h` : ''}`;
    if (hours) return `${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
    return `${minutes}m`;
  }

  function render(windows = []) {
    const details = [];
    const now = Date.now();
    badge.replaceChildren();
    ['5h', 'w'].forEach((label, i) => {
      const window = windows[i];
      const used = window?.used_percent;
      const left = typeof used === 'number' && Number.isFinite(used)
        ? `${Math.round(Math.max(0, Math.min(100, 100 - used)))}%` : '—';
      const reset = typeof window?.reset_at === 'number' && window.reset_at > 0
        ? new Date(window.reset_at * 1000) : null;
      const validReset = reset && Number.isFinite(reset.getTime());
      const time = validReset ? resetCountdown(reset, now) : '—';
      for (const [name, text] of [
        ['label', label], ['percent', left], ['reset', '↻'], ['countdown', time]
      ]) {
        const cell = document.createElement('span');
        cell.className = `limits-${name}`;
        if (name === 'reset') cell.setAttribute('aria-hidden', 'true');
        cell.textContent = text;
        badge.append(cell);
      }
      details.push(`${labels[i]}: ${left === '—' ? 'unavailable' : left + ' left'}; resets: ${validReset ? reset.toLocaleString() : 'unavailable'}`);
    });
    badge.setAttribute('aria-label', `ChatGPT remaining limits. ${details.join('. ')}. Open limit settings.`);
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
      if (!response.ok) throw new Error(`Limits: ${response.status}`);
      const data = await response.json();
      const windows = [data.rate_limit?.primary_window, data.rate_limit?.secondary_window];
      badge.title = 'ChatGPT remaining limits (↻ time until reset)\n' + render(windows).join('\n');
    } catch (error) {
      render();
      badge.title = `ChatGPT limits unavailable: ${error.message}. Retrying every minute.`;
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
