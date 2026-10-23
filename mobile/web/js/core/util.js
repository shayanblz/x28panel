/* X28 Mobile — small utilities (no dependencies) */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = (X28.util = {});

  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  U.esc = function (value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  };

  U.clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (lo, hi) => lo + Math.random() * (hi - lo);
  U.randInt = (lo, hi) => Math.floor(U.rand(lo, hi + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.randn = function () {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  U.round = (v, d) => {
    const p = Math.pow(10, d === undefined ? 1 : d);
    return Math.round(v * p) / p;
  };
  U.mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  U.sum = (arr) => arr.reduce((a, b) => a + b, 0);

  U.uid = (prefix) => (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  U.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  U.raf = (fn) => (global.requestAnimationFrame ? global.requestAnimationFrame(fn) : setTimeout(fn, 16));

  U.debounce = function (fn, ms) {
    let t = 0;
    return function () {
      const args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(self, args), ms);
    };
  };
  U.throttle = function (fn, ms) {
    let last = 0, timer = 0, lastArgs = null;
    return function () {
      const now = Date.now(), left = ms - (now - last);
      lastArgs = arguments;
      if (left <= 0) { last = now; fn.apply(this, lastArgs); }
      else if (!timer) timer = setTimeout(() => { timer = 0; last = Date.now(); fn.apply(this, lastArgs); }, left);
    };
  };

  /* safe JSON storage */
  U.store = {
    get(key, fallback) {
      try {
        const raw = global.localStorage.getItem('x28:' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { global.localStorage.setItem('x28:' + key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    del(key) { try { global.localStorage.removeItem('x28:' + key); } catch (e) {} },
    keys() {
      try {
        return Object.keys(global.localStorage).filter((k) => k.indexOf('x28:') === 0)
          .map((k) => k.slice(4));
      } catch (e) { return []; }
    }
  };

  /* native bridge ------------------------------------------------------- */
  U.bridge = {
    has(name) {
      const A = global.Android;
      return !!(A && typeof A[name] === 'function');
    },
    isNative() { return !!global.Android && typeof global.Android.http === 'function'; },
    call(name) {
      if (!U.bridge.has(name)) return null;
      const args = Array.prototype.slice.call(arguments, 1).map((a) =>
        typeof a === 'object' ? JSON.stringify(a) : a);
      const raw = global.Android[name].apply(global.Android, args);
      if (typeof raw !== 'string' || !raw) return null;
      try { return JSON.parse(raw); } catch (e) { return raw; }
    }
  };

  U.haptic = function (kind) {
    if (!U.bridge.has('vibrate')) return;
    try { global.Android.vibrate(kind === 'heavy' ? 22 : kind === 'warn' ? 14 : 8); } catch (e) {}
  };

  U.toastNative = function (msg) {
    if (!U.bridge.has('toast')) return false;
    try { global.Android.toast(String(msg)); return true; } catch (e) { return false; }
  };

  /* download: uses native saver when inside the APK, blob otherwise */
  U.download = function (filename, content, mime) {
    mime = mime || 'text/plain;charset=utf-8';
    if (U.bridge.has('saveFile')) {
      const res = U.bridge.call('saveFile', filename, String(content), mime);
      return res || { ok: true };
    }
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  };

  U.share = function (text, title) {
    if (U.bridge.has('share')) { try { global.Android.share(String(title || 'X28'), String(text)); return true; } catch (e) {} }
    if (global.navigator && navigator.share) { try { navigator.share({ title: title || 'X28', text: String(text) }); return true; } catch (e) {} }
    return false;
  };

  U.copy = async function (text) {
    try {
      if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  };

  /* DOM helper (used by dynamic lists) */
  U.el = function (tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  };

  U.on = function (root, event, selector, handler) {
    root.addEventListener(event, (e) => {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) handler(e, target);
    });
  };

  /* drag-to-dismiss for bottom sheets */
  U.enableSheetDrag = function (sheet, onClose) {
    const head = sheet.querySelector('.sheet-grab, .sheet-head');
    if (!head) return;
    let startY = 0, dy = 0, active = false;
    const start = (e) => {
      active = true; startY = (e.touches ? e.touches[0].clientY : e.clientY); dy = 0;
      sheet.style.transition = 'none';
    };
    const move = (e) => {
      if (!active) return;
      const y = (e.touches ? e.touches[0].clientY : e.clientY);
      dy = Math.max(0, y - startY);
      sheet.style.transform = 'translateY(' + dy + 'px)';
    };
    const end = () => {
      if (!active) return;
      active = false;
      sheet.style.transition = '';
      if (dy > 96) { onClose(); } else { sheet.style.transform = ''; }
      dy = 0;
    };
    head.addEventListener('touchstart', start, { passive: true });
    head.addEventListener('touchmove', move, { passive: true });
    head.addEventListener('touchend', end);
    head.addEventListener('mousedown', start);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
  };

  U.isRTL = () => (document.documentElement.getAttribute('dir') || 'rtl') === 'rtl';

  U.formatDuration = function (seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d) return d + ' روز و ' + h + ' ساعت';
    if (h) return h + ' ساعت و ' + m + ' دقیقه';
    if (m) return m + ' دقیقه';
    return s + ' ثانیه';
  };

  U.formatDurationShort = function (seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d) return d + 'ر ' + h + 'س';
    if (h) return h + 'س ' + m + 'د';
    if (m) return m + 'د';
    return seconds + 'ث';
  };

  U.relTime = function (ts, now) {
    now = now || Date.now();
    const diff = Math.max(0, Math.round((now - ts) / 1000));
    if (diff < 5) return 'همین حالا';
    if (diff < 60) return diff + ' ثانیه پیش';
    if (diff < 3600) return Math.floor(diff / 60) + ' دقیقه پیش';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ساعت پیش';
    if (diff < 7 * 86400) return Math.floor(diff / 86400) + ' روز پیش';
    const d = new Date(ts);
    return U.dateLabel(d);
  };

  U.timeLabel = function (ts) {
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };

  U.dateLabel = function (d) {
    try {
      return new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
    } catch (e) {
      return (d.getMonth() + 1) + '/' + d.getDate();
    }
  };

  U.dayKey = function (ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  };

  U.dayLabel = function (ts) {
    const d = new Date(ts), now = new Date();
    const one = 86400000;
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (a === b) return 'امروز';
    if (a === b - one) return 'دیروز';
    return U.dateLabel(d);
  };

  U.cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  U.prefersReducedMotion = () =>
    !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);

  U.csv = function (rows) {
    return rows.map((r) => r.map((c) => {
      const s = String(c === null || c === undefined ? '' : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
  };

  U.safe = function (fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
