/* X28 Mobile — client for the X28 Control Center panel.
   Inside the APK every request goes through the native HTTP bridge, so LAN
   HTTP, self-signed certs and CORS are not a problem. In a normal browser it
   falls back to fetch (the panel must allow the origin). */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util;
  const Dev = (X28.device = {});

  const conf = { panelUrl: '', token: '', timeout: 8000 };
  Dev.setConfig = function (next) {
    if (!next) return conf;
    if (next.panelUrl !== undefined) conf.panelUrl = normalizeBase(next.panelUrl);
    if (next.token !== undefined) conf.token = String(next.token || '');
    if (next.timeout !== undefined) conf.timeout = Number(next.timeout) || 8000;
    return conf;
  };
  Dev.current = () => conf;

  function normalizeBase(url) {
    let u = String(url || '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'http://' + u;
    u = u.replace(/\/+$/, '');
    u = u.replace(/\/api$/i, '');
    return u;
  }
  Dev.normalizeBase = normalizeBase;

  Dev.isNative = () => U.bridge.has('http');
  Dev.available = () => !!(conf.panelUrl && (Dev.isNative() || global.fetch));

  Dev.url = function (path) {
    return normalizeBase(conf.panelUrl) + (path.charAt(0) === '/' ? path : '/' + path);
  };

  function parseBody(text) {
    if (text === null || text === undefined || text === '') return null;
    try { return JSON.parse(text); } catch (e) { return text; }
  }

  Dev.request = function (method, path, options) {
    options = options || {};
    const url = Dev.url(path);
    if (!conf.panelUrl) return Promise.resolve({ ok: false, status: 0, error: 'آدرس پنل تنظیم نشده است.' });
    const headers = Object.assign({ 'Accept': 'application/json' }, options.headers || {});
    let body = options.body;
    if (body !== undefined && body !== null && typeof body !== 'string') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    if (conf.token) headers['X-Token'] = conf.token;
    const timeout = options.timeout || conf.timeout;
    const t0 = Date.now();

    if (Dev.isNative()) {
      return new Promise((resolve) => {
        try {
          const res = U.bridge.call('http', method.toUpperCase(), url, JSON.stringify(headers), body === undefined ? null : body, timeout);
          if (!res || typeof res !== 'object') {
            resolve({ ok: false, status: 0, error: 'پاسخ نامعتبر از لایهٔ شبکه', ms: Date.now() - t0 });
            return;
          }
          if (res.error) {
            resolve({ ok: false, status: res.status || 0, error: friendlyError(res.error, res.status), ms: res.ms || Date.now() - t0 });
            return;
          }
          const data = parseBody(res.body);
          const status = Number(res.status) || 0;
          const ok = status >= 200 && status < 400;
          resolve({
            ok, status, data, raw: res.body, ms: res.ms || Date.now() - t0,
            error: ok ? null : httpError(status, data)
          });
        } catch (e) {
          resolve({ ok: false, status: 0, error: String(e && e.message || e), ms: Date.now() - t0 });
        }
      });
    }

    const init = {
      method: method.toUpperCase(), headers,
      body: body === undefined ? undefined : body,
      credentials: 'include', mode: 'cors', cache: 'no-store'
    };
    const ctrl = global.AbortController ? new AbortController() : null;
    if (ctrl) init.signal = ctrl.signal;
    const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, timeout);

    return fetch(url, init).then((r) => r.text().then((text) => {
      clearTimeout(timer);
      const data = parseBody(text);
      return {
        ok: r.ok, status: r.status, data, raw: text, ms: Date.now() - t0,
        error: r.ok ? null : httpError(r.status, data)
      };
    })).catch((e) => {
      clearTimeout(timer);
      const msg = String(e && e.message || e);
      const hint = /Failed to fetch|NetworkError|Load failed/i.test(msg)
        ? 'دسترسی به پنل برقرار نشد. آدرس شبکهٔ محلی، روشن‌بودن پنل و CORS را بررسی کنید (در نسخهٔ اندروید این محدودیت وجود ندارد).'
        : msg;
      return { ok: false, status: 0, error: hint, ms: Date.now() - t0 };
    });
  };

  function friendlyError(err, status) {
    const s = String(err || '');
    if (/timeout|timed out/i.test(s)) return 'پنل در زمان مقرر پاسخ نداد (timeout).';
    if (/refused|ECONNREFUSED/i.test(s)) return 'اتصال رد شد؛ پنل روی این آدرس و پورت گوش نمی‌دهد.';
    if (/unreachable|ENETUNREACH|EHOSTUNREACH|NoRoute/i.test(s)) return 'آدرس پنل در دسترس نیست؛ وای‌فای/شبکه را بررسی کنید.';
    if (/UnknownHost|Name or service|DNS/i.test(s)) return 'نام میزبان حل نشد.';
    if (/SSL|certificate|Trust/i.test(s)) return 'خطای گواهی TLS؛ آدرس را با http:// امتحان کنید.';
    if (status === 401 || status === 403) return 'دسترسی رد شد (کد ' + status + '). رمز/توکن را بررسی کنید.';
    return s || 'خطای شبکه';
  }

  function httpError(status, data) {
    if (data && typeof data === 'object') {
      if (data.error) return String(data.error);
      if (data.message) return String(data.message);
    }
    if (status === 401) return 'نیاز به ورود (401)';
    if (status === 403) return 'دسترسی ممنوع (403)';
    if (status === 404) return 'مسیر در پنل پیدا نشد (404)';
    if (status >= 500) return 'خطای سرور پنل (' + status + ')';
    return 'خطای HTTP ' + status;
  }

  /* ── endpoints ─────────────────────────────────────────────────────── */
  Dev.health = () => Dev.request('GET', '/api/health', { timeout: 5000 });
  Dev.session = () => Dev.request('GET', '/api/session', { timeout: 5000 });
  Dev.login = (password) => Dev.request('POST', '/api/login', { body: { password } });
  Dev.logout = () => Dev.request('POST', '/api/logout', {});
  Dev.rawStatus = () => Dev.request('GET', '/api/status');
  Dev.rawSeries = (keys, range) =>
    Dev.request('GET', '/api/series?keys=' + encodeURIComponent(keys.join(',')) + '&range=' + encodeURIComponent(range || '1h'));
  Dev.rawEvents = (params) => {
    const q = [];
    if (params && params.q) q.push('q=' + encodeURIComponent(params.q));
    if (params && params.category) q.push('category=' + encodeURIComponent(params.category));
    q.push('limit=' + ((params && params.limit) || 100));
    return Dev.request('GET', '/api/events?' + q.join('&'));
  };
  Dev.rawActions = () => Dev.request('GET', '/api/actions');
  Dev.rawAction = (name, params) => Dev.request('POST', '/api/action/' + encodeURIComponent(name), { body: params || {} });
  Dev.rawPlugins = () => Dev.request('GET', '/api/plugins');
  Dev.rawPluginSet = (id, patch) => Dev.request('POST', '/api/plugins/' + encodeURIComponent(id), { body: patch || {} });
  Dev.rawPluginsReload = () => Dev.request('POST', '/api/plugins-reload', {});
  Dev.rawConfig = () => Dev.request('GET', '/api/config');
  Dev.rawConfigSave = (patch) => Dev.request('POST', '/api/config', { body: patch || {} });
  Dev.rawImportLog = (filename, text) =>
    Dev.request('POST', '/api/import-log', { body: { filename, text }, timeout: 30000 });
  Dev.rawAudit = () => Dev.request('GET', '/api/audit');

  /* high-level helpers ------------------------------------------------ */
  Dev.status = function () {
    return Dev.rawStatus().then((r) => (r.ok ? { ok: true, live: X28.adapt.status(r.data), raw: r.data, ms: r.ms } : r));
  };

  Dev.series = function (keys, range) {
    return Dev.rawSeries(keys, range).then((r) => (r.ok ? { ok: true, series: X28.adapt.series(r.data, keys), raw: r.data } : r));
  };

  Dev.events = function (params) {
    return Dev.rawEvents(params).then((r) => (r.ok ? { ok: true, events: X28.adapt.events(r.data), raw: r.data } : r));
  };

  Dev.actions = function () {
    return Dev.rawActions().then((r) => (r.ok ? { ok: true, actions: X28.adapt.actions(r.data), raw: r.data } : r));
  };

  Dev.runAction = function (name, params) {
    return Dev.rawAction(name, params).then((r) => {
      const data = r.data && typeof r.data === 'object' ? r.data : {};
      return {
        ok: r.ok && data.ok !== false,
        status: r.status,
        message: data.message || data.msg || (r.ok ? 'انجام شد' : r.error),
        data: data.data !== undefined ? data.data : data,
        error: r.ok ? (data.error || null) : r.error
      };
    });
  };

  Dev.plugins = function () {
    return Dev.rawPlugins().then((r) => (r.ok ? { ok: true, plugins: X28.adapt.plugins(r.data), raw: r.data } : r));
  };

  Dev.setPlugin = (id, patch) => Dev.rawPluginSet(id, patch);

  Dev.config = function () {
    return Dev.rawConfig().then((r) => (r.ok ? { ok: true, config: X28.adapt.config(r.data), raw: r.data } : r));
  };

  Dev.configSave = (patch) => Dev.rawConfigSave(patch);

  /* connection probe: health + optional auth requirement */
  Dev.probe = function () {
    const started = Date.now();
    return Dev.health().then((h) => {
      if (!h.ok && h.status === 0) return { ok: false, error: h.error, ms: Date.now() - started };
      return Dev.session().catch(() => ({ ok: false })).then((s) => {
        const session = s && s.ok ? s.data : null;
        const loginRequired = !!(session && (session.login_required || session.required || (session.password_set === true)));
        return Dev.rawStatus().then((st) => {
          const statusOk = st.ok;
          let error = null;
          if (!statusOk) error = st.status === 401 ? 'ورود لازم است؛ رمز پنل را در تنظیمات وارد کنید.' : st.error;
          return {
            ok: statusOk || h.ok,
            authRequired: st.status === 401 || loginRequired,
            statusOk,
            status: st.data,
            error,
            ms: Date.now() - started,
            health: h.data
          };
        });
      });
    });
  };

  /* Extract a normalised sample from an /api/status payload, keeping nulls
     for anything the panel does not expose. */
  Dev.sample = function (live) {
    return {
      t: Date.now(),
      rtt: live.latency,
      rx: live.rxBps,
      tx: live.txBps,
      rsrp: live.rsrp,
      rsrq: live.rsrq,
      sinr: live.sinr,
      loss: live.loss,
      clients: live.clients ? live.clients.filter((c) => c.online).length : null
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
