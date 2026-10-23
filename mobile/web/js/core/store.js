/* X28 Mobile — application store: settings, live data, history, polling */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util;
  const F = X28.fmt;
  const Dev = X28.device;

  const DEFAULT_SETTINGS = {
    onboarded: false,
    mode: 'demo',                 // demo | device
    panelUrl: '',
    token: '',
    panelPassword: '',
    rememberPassword: true,
    theme: 'dark',
    digits: 'en',
    chartRange: '10m',
    keepAwake: true,
    autoRefresh: true,
    alerts: true,
    confirmActions: true
  };

  const emptyLive = () => ({
    online: true,
    operator: null,
    network: null,
    band: null,
    bandName: null,
    bandLock: 'auto',
    networkMode: 'auto',
    cellLock: false,
    apn: null,
    latency: null,
    jitter: null,
    loss: null,
    rsrp: null,
    rsrq: null,
    sinr: null,
    pci: null,
    cellId: null,
    earfcn: null,
    temp: null,
    uptime: 0,
    rxBps: 0,
    txBps: 0,
    totalRx: 0,
    totalTx: 0,
    wanIp: null,
    publicIp: null,
    cgnat: null,
    gateway: null,
    dnsMs: null,
    tlsDays: null,
    ipv6: null,
    mtu: null,
    wifi: null,
    clients: [],
    profile: {}
  });

  const state = {
    settings: Object.assign({}, DEFAULT_SETTINGS),
    conn: {
      mode: 'demo', status: 'boot', error: null, lastOk: 0,
      authRequired: false, latency: null, version: null, raw: null, ms: null, polling: false
    },
    live: emptyLive(),
    series: { t: [], rtt: [], rx: [], tx: [], rsrp: [], rsrq: [], sinr: [], loss: [], clients: [] },
    events: [],
    actions: [],
    plugins: [],
    config: null,
    audit: [],
    speed: { running: false, pct: 0, phase: '', downMbps: 0, upMbps: 0, ping: 0, last: null, history: [] },
    ui: { tab: 'dashboard', moreOpen: false, busy: false, lastChange: Date.now(), dataSource: 'demo' }
  };

  const MOD = (global.X28.store = { state });

  let subs = [];
  let demo = null;
  let notifyQueued = false;
  let pollGen = 0;
  let failCount = 0;
  let pollTimer = 0;
  let loadTimer = 0;
  let engineStarted = false;

  MOD.subscribe = function (fn) {
    subs.push(fn);
    return () => { subs = subs.filter((f) => f !== fn); };
  };

  MOD.notify = function () {
    state.ui.lastChange = Date.now();
    if (notifyQueued) return;
    notifyQueued = true;
    U.raf(() => {
      notifyQueued = false;
      subs.slice().forEach((fn) => {
        try { fn(state); } catch (e) {
          if (global.console && console.error) console.error('render error', e);
        }
      });
    });
  };

  /* ── settings ──────────────────────────────────────────────────────── */
  MOD.loadSettings = function () {
    const saved = U.store.get('settings', {});
    state.settings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
    if (!state.settings.onboarded && saved && saved.onboarded === undefined) state.settings.onboarded = false;
    F.setDigits(state.settings.digits);
    MOD.applyTheme(state.settings.theme);
    return state.settings;
  };

  MOD.saveSettings = function () {
    U.store.set('settings', state.settings);
  };

  MOD.applyTheme = function (theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#eef2f8' : '#070a11');
    state.settings.theme = t;
  };

  MOD.setSetting = function (key, value, opts) {
    state.settings[key] = value;
    if (key === 'theme') MOD.applyTheme(value);
    if (key === 'digits') F.setDigits(value);
    if (key === 'panelUrl' || key === 'token') Dev.setConfig({ panelUrl: state.settings.panelUrl, token: state.settings.token });
    if (key === 'mode' && !(opts && opts.silent)) MOD.switchMode(value);
    MOD.saveSettings();
    MOD.notify();
  };

  MOD.resetAll = function () {
    U.store.keys().forEach((k) => U.store.del(k));
    state.settings = Object.assign({}, DEFAULT_SETTINGS);
    MOD.applyTheme('dark');
    F.setDigits('en');
    MOD.notify();
  };

  /* ── events / series ───────────────────────────────────────────────── */
  MOD.addEvent = function (ev) {
    if (!ev) return;
    if (state.events.some((e) => e.id === ev.id)) return;
    state.events.unshift(ev);
    if (state.events.length > 400) state.events.length = 400;
    const level = String(ev.level || '').toLowerCase();
    if (state.settings.alerts && (level === 'crit' || level === 'critical' || level === 'warn') && ev.source !== 'seed') {
      if (X28.ui && X28.ui.toast && Date.now() - (MOD._lastAlertToast || 0) > 12000) {
        MOD._lastAlertToast = Date.now();
        X28.ui.toast(ev.title, level === 'warn' ? 'warn' : 'err', 4200);
        U.haptic('warn');
      }
    }
    MOD.notify();
  };

  function pushPoint(t, sample) {
    const s = state.series;
    s.t.push(t);
    s.rtt.push(sample.rtt === undefined ? null : sample.rtt);
    s.rx.push(sample.rx === undefined ? null : sample.rx);
    s.tx.push(sample.tx === undefined ? null : sample.tx);
    s.rsrp.push(sample.rsrp === undefined ? null : sample.rsrp);
    s.rsrq.push(sample.rsrq === undefined ? null : sample.rsrq);
    s.sinr.push(sample.sinr === undefined ? null : sample.sinr);
    s.loss.push(sample.loss === undefined ? null : sample.loss);
    s.clients.push(sample.clients === undefined ? null : sample.clients);
    const cut = s.t.length - 2600;                       /* ~24h at 1min + live buffer */
    if (cut > 0) {
      Object.keys(s).forEach((k) => s[k].splice(0, cut));
    }
  }

  MOD.ingestSample = function (payload) {
    const live = payload.live || {};
    const prev = state.live;
    state.live = mergeLive(prev, live);
    pushPoint(payload.t || Date.now(), live);
    if (state.conn.mode === 'device') {
      state.conn.status = live.online === false ? 'offline' : 'online';
      state.conn.lastOk = Date.now();
      state.conn.latency = payload.ms || state.conn.latency;
    }
    MOD.notify();
  };

  function mergeLive(prev, next) {
    const out = Object.assign({}, prev);
    Object.keys(next).forEach((k) => {
      const v = next[k];
      if (v === undefined) return;
      if (v === null) return;
      if (Array.isArray(v) && !v.length) return;
      if (typeof v === 'object' && !Array.isArray(v) && v && Object.keys(v).length === 0) return;
      out[k] = v;
    });
    if (next.online === false) out.online = false;
    if (next.online === true) out.online = true;
    if (next.loss !== undefined) out.loss = next.loss;
    if (next.rsrp === null) out.rsrp = null;
    return out;
  }
  MOD.mergeLive = mergeLive;

  MOD.seedSeries = function (rows) {
    state.series = { t: [], rtt: [], rx: [], tx: [], rsrp: [], rsrq: [], sinr: [], loss: [], clients: [] };
    rows.forEach((r) => pushPoint(r.t, r));
    MOD.notify();
  };

  /* bucket-average the local history into <=120 points for charts */
  MOD.rangeSeries = function (rangeKey, keys) {
    keys = keys || ['rtt', 'rx', 'tx', 'rsrp', 'rsrq', 'sinr', 'loss', 'clients'];
    const windows = { '10m': 10 * 60e3, '30m': 30 * 60e3, '1h': 3600e3, '6h': 6 * 3600e3, '24h': 24 * 3600e3 };
    const span = windows[rangeKey] || windows['10m'];
    const t = state.series.t;
    if (!t.length) {
      const empty = { t: [] };
      keys.forEach((k) => { empty[k] = []; });
      return empty;
    }
    keys.forEach((k) => { if (!Array.isArray(state.series[k])) state.series[k] = new Array(t.length).fill(null); });
    const end = t[t.length - 1];
    const start = Math.max(end - span, t[0]);
    let from = 0;
    for (let i = 0; i < t.length; i++) { if (t[i] >= start) { from = i; break; } }
    const n = t.length - from;
    const buckets = Math.min(120, Math.max(12, n));
    const step = (end - start) / buckets || 1;
    const out = { t: [] };
    keys.forEach((k) => { out[k] = []; });

    for (let b = 0; b < buckets; b++) {
      const bStart = start + b * step;
      const bEnd = bStart + step;
      const acc = {}, counts = {};
      keys.forEach((k) => { acc[k] = 0; counts[k] = 0; });
      let lastTs = null;
      for (let i = from; i < t.length; i++) {
        if (t[i] < bStart) continue;
        if (t[i] >= bEnd) break;
        lastTs = t[i];
        keys.forEach((k) => {
          const v = (state.series[k] || [])[i];
          if (v !== null && v !== undefined && !isNaN(v)) { acc[k] += +v; counts[k]++; }
        });
      }
      if (lastTs === null) continue;
      out.t.push(lastTs);
      keys.forEach((k) => out[k].push(counts[k] ? acc[k] / counts[k] : null));
    }
    return out;
  };

  /* ── demo engine ───────────────────────────────────────────────────── */
  MOD.seedDemoEvents = function () {
    const pool = [
      ['ok', 'system', 'پنل با موفقیت بارگذاری شد', '۸ پلاگین فعال شدند و پایش آغاز شد.', 3],
      ['info', 'signal', 'کیفیت سیگنال پایدار', 'RSRP در محدودهٔ مطلوب ثبت شد.', 26],
      ['warn', 'client', 'دستگاه از شبکه خارج شد', 'HP LaserJet بیش از ۹۰ ثانیه پاسخ نداد.', 52],
      ['ok', 'client', 'دستگاه جدید متصل شد', 'iPhone 15 با آدرس 192.168.1.101 به وای‌فای ۵ گیگاهرتز وصل شد.', 78],
      ['info', 'network', 'تست DNS موفق', 'تأخیر DNS برابر ۲۲ میلی‌ثانیه اندازه‌گیری شد.', 104],
      ['warn', 'band', 'تغییر باند توسط شبکه', 'اپراتور باند فعال را برای توزیع بار تغییر داد.', 150],
      ['crit', 'signal', 'افت شدید سیگنال', 'RSRP زیر ‎-105 dBm رفت؛ بررسی موقعیت آنتن پیشنهاد می‌شود.', 210],
      ['ok', 'system', 'بازیابی اتصال', 'ارتباط مودم پس از ۲۰ ثانیه بازگشت.', 212],
      ['info', 'speed', 'سرعت‌سنجی شبانه', 'دانلود ۱۴۲ مگابیت بر ثانیه ثبت شد.', 320],
      ['ok', 'security', 'پشتیبان‌گیری پیکربندی', 'نسخهٔ پشتیبان خودکار ساخته شد.', 410]
    ];
    state.events = pool.map((p, i) => ({
      id: 'seed-' + i,
      ts: Date.now() - p[4] * 60 * 1000,
      level: p[0], cat: p[1], title: p[2], msg: p[3], source: 'seed'
    }));
  };

  MOD.startDemo = function (opts) {
    opts = opts || {};
    if (!demo) {
      demo = X28.demo.create();
      demo.on('sample', (p) => {
        if (p.catchup) {
          state.live = mergeLive(state.live, p.live);
          pushPoint(p.t, p.live);
          return;
        }
        state.live = mergeLive(state.live, p.live);
        pushPoint(p.t, p.live);
        MOD.notify();
      });
      demo.on('event', (ev) => MOD.addEvent(ev));
      demo.on('clients', (clients) => {
        state.live.clients = clients;
        if (state.ui.tab === 'clients') MOD.notify();
      });
    }
    if (!opts.keepHistory) {
      const rows = demo.backfill(24);
      MOD.seedSeries(rows);
      if (!state.events.length) MOD.seedDemoEvents();
    }
    state.conn = { mode: 'demo', status: 'demo', error: null, lastOk: Date.now(), authRequired: false, latency: null, version: 'demo', raw: null, ms: null, polling: false };
    state.settings.mode = 'demo';
    state.ui.dataSource = 'demo';
    engineStarted = true;
    demo.start();
    MOD.notify();
  };

  MOD.stopDemo = function () {
    if (demo) demo.stop();
    engineStarted = false;
  };

  MOD.demoEngine = () => demo;

  /* ── device mode ───────────────────────────────────────────────────── */
  MOD.switchMode = function (mode) {
    mode = mode === 'device' ? 'device' : 'demo';
    if (state.conn.mode === mode && state.conn.status !== 'boot') return;
    stopPolling();
    state.settings.mode = mode;
    state.conn.mode = mode;
    state.conn.error = null;
    state.conn.authRequired = false;
    if (mode === 'demo') {
      MOD.stopDemo();
      state.settings.mode = 'demo';
      state.ui.dataSource = 'demo';
      state.live = emptyLive();
      MOD.startDemo();
    } else {
      MOD.stopDemo();
      Dev.setConfig({ panelUrl: state.settings.panelUrl, token: state.settings.token });
      state.ui.dataSource = 'device';
      MOD.connectDevice();
    }
    MOD.saveSettings();
    MOD.notify();
  };

  let connecting = false;
  MOD.connectDevice = function (opts) {
    opts = opts || {};
    if (connecting && !opts.force) return Promise.resolve(state.conn);
    connecting = true;
    stopPolling();
    state.conn.mode = 'device';
    state.conn.status = 'connecting';
    state.conn.error = null;
    Dev.setConfig({ panelUrl: state.settings.panelUrl, token: state.settings.token, timeout: opts.timeout || 8000 });
    MOD.notify();

    const finish = (connState) => {
      connecting = false;
      Object.assign(state.conn, connState);
      MOD.notify();
      if (connState.status === 'online' || connState.status === 'degraded') {
        startPolling();
        MOD.loadDeviceMeta();
      }
    };

    if (!state.settings.panelUrl) {
      finish({ status: 'offline', error: 'برای حالت دستگاه، آدرس پنل را در تنظیمات وارد کنید.' });
      return Promise.resolve(state.conn);
    }

    return Dev.probe().then((probe) => {
      if (probe.authRequired && state.settings.panelPassword) {
        return Dev.login(state.settings.panelPassword).then(() => Dev.probe());
      }
      return probe;
    }).then((probe) => {
      if (!probe) return;
      if (!probe.ok) {
        finish({ status: 'offline', error: probe.error || 'اتصال به پنل برقرار نشد.', authRequired: !!probe.authRequired });
        return;
      }
      if (probe.authRequired && !probe.statusOk) {
        finish({ status: 'offline', error: probe.error || 'ورود به پنل لازم است.', authRequired: true });
        return;
      }
      const live = probe.status ? X28.adapt.status(probe.status) : null;
      if (live) {
        state.live = mergeLive(state.live, live);
        state.conn.raw = probe.status;
      }
      finish({
        status: 'online', error: null, lastOk: Date.now(), ms: probe.ms,
        authRequired: false, version: live && live.profile ? live.profile.firmware : null
      });
      MOD.ingestSample({ t: Date.now(), live: live || {}, ms: probe.ms });
    }).catch((e) => {
      finish({ status: 'offline', error: String(e && e.message || e) });
    });
  };

  function startPolling() {
    pollGen++;
    failCount = 0;
    state.conn.polling = true;
    const gen = pollGen;
    const tick = () => {
      if (gen !== pollGen) return;
      if (!navigator.onLine) {
        failCount++;
        state.conn.status = 'offline';
        state.conn.error = 'اتصال اینترنت/شبکهٔ دستگاه قطع است.';
        MOD.notify();
        schedule(true);
        return;
      }
      Dev.status().then((r) => {
        if (gen !== pollGen) return;
        if (r.ok) {
          failCount = 0;
          state.conn.status = 'online';
          state.conn.error = null;
          state.conn.lastOk = Date.now();
          state.conn.ms = r.ms;
          state.conn.raw = r.raw;
          state.live = mergeLive(state.live, r.live);
          pushPoint(Date.now(), Dev.sample(r.live));
          MOD.notify();
          if (Date.now() - (MOD._lastMeta || 0) > 20000) {
            MOD._lastMeta = Date.now();
            clearTimeout(loadTimer);
            loadTimer = setTimeout(() => { if (gen === pollGen) MOD.loadDeviceMeta(); }, 800);
          }
        } else {
          failCount++;
          state.conn.error = r.error;
          if (failCount >= 2) state.conn.status = 'offline';
          else state.conn.status = 'degraded';
          MOD.notify();
        }
        schedule(failCount > 0);
      });
    };
    const schedule = (slow) => {
      clearTimeout(pollTimer);
      if (gen !== pollGen) return;
      pollTimer = setTimeout(tick, slow ? 6000 : 2500);
    };
    tick();
  }

  function stopPolling() {
    pollGen++;
    clearTimeout(pollTimer);
    clearTimeout(loadTimer);
    state.conn.polling = false;
  }
  MOD.stopPolling = stopPolling;

  MOD.loadDeviceMeta = function () {
    if (state.conn.mode !== 'device') return;
    clearTimeout(loadTimer);
    Dev.events({ limit: 120 }).then((r) => {
      if (r.ok && r.events.length) {
        const known = new Set(state.events.map((e) => e.id));
        r.events.forEach((e) => { if (!known.has(e.id)) state.events.push(e); });
        state.events.sort((a, b) => b.ts - a.ts);
        state.events = state.events.slice(0, 400);
        MOD.notify();
      }
    });
    Dev.actions().then((r) => {
      if (r.ok) { state.actions = r.actions; MOD.notify(); }
    });
    Dev.plugins().then((r) => {
      if (r.ok) { state.plugins = r.plugins; MOD.notify(); }
    });
    Dev.config().then((r) => {
      if (r.ok) { state.config = r.config; MOD.notify(); }
    });
    loadTimer = setTimeout(() => { if (state.conn.status === 'online') MOD.loadDeviceMeta(); }, 45000);
  };

  MOD.login = function (password) {
    return Dev.login(password).then((r) => {
      if (!r.ok) return { ok: false, error: r.error || 'ورود ناموفق بود.' };
      if (state.settings.rememberPassword) {
        state.settings.panelPassword = password;
        MOD.saveSettings();
      }
      return MOD.connectDevice({ force: true }).then(() => ({ ok: state.conn.status === 'online', error: state.conn.error }));
    });
  };

  MOD.togglePlugin = function (id, enabled) {
    if (state.conn.mode === 'demo') {
      const p = state.plugins.find((x) => x.id === id);
      if (p) p.enabled = enabled;
      MOD.notify();
      return Promise.resolve({ ok: true });
    }
    return Dev.setPlugin(id, { enabled }).then((r) => {
      if (r.ok) {
        const p = state.plugins.find((x) => x.id === id);
        if (p) p.enabled = enabled;
        MOD.notify();
        return { ok: true };
      }
      return { ok: false, error: r.error };
    });
  };

  MOD.reloadPlugins = function () {
    if (state.conn.mode === 'demo') return Promise.resolve({ ok: true });
    return Dev.rawPluginsReload().then((r) => {
      if (!r.ok) return { ok: false, error: r.error };
      return Dev.plugins().then((p) => {
        if (p.ok) { state.plugins = p.plugins; MOD.notify(); }
        return { ok: true };
      });
    });
  };

  MOD.saveConfig = function (patch) {
    if (state.conn.mode === 'demo') return Promise.resolve({ ok: true });
    return Dev.configSave(patch).then((r) => ({ ok: r.ok, error: r.error, data: r.data }));
  };

  /* ── actions ───────────────────────────────────────────────────────── */
  MOD.runAction = function (name, params, meta) {
    meta = meta || {};
    const entry = {
      id: U.uid('act'), ts: Date.now(), name,
      label: meta.label || name, params: params || {}, status: 'running', source: state.conn.mode
    };
    state.audit.unshift(entry);
    state.audit = state.audit.slice(0, 60);
    MOD.notify();
    const runner = state.conn.mode === 'demo' && demo
      ? Promise.resolve(demo.runAction(name, params || {}))
      : Dev.runAction(name, params || {});
    return runner.then((res) => {
      entry.status = res && res.ok ? 'ok' : 'err';
      entry.message = (res && (res.message || res.error)) || '';
      MOD.notify();
      return res;
    }).catch((e) => {
      entry.status = 'err';
      entry.message = String(e && e.message || e);
      MOD.notify();
      return { ok: false, error: entry.message };
    });
  };

  /* ── speed test ────────────────────────────────────────────────────── */
  MOD.loadSpeedHistory = function () {
    state.speed.history = U.store.get('speedHistory', []) || [];
  };

  MOD.speedTest = function () {
    if (state.speed.running) return Promise.resolve(null);
    state.speed = Object.assign({}, state.speed, {
      running: true, pct: 0, phase: 'آماده‌سازی', downMbps: 0, upMbps: 0, ping: 0
    });
    MOD.notify();
    if (state.conn.mode === 'demo' && demo) {
      return demo.speedTest((p) => {
        state.speed.pct = p.pct;
        state.speed.phase = p.phase;
        state.speed.downMbps = p.downMbps;
        state.speed.upMbps = p.upMbps;
        state.speed.ping = p.ping;
        MOD.notify();
      }).then((result) => {
        state.speed.running = false;
        state.speed.pct = 100;
        state.speed.phase = 'پایان';
        state.speed.last = result;
        state.speed.history.unshift(result);
        state.speed.history = state.speed.history.slice(0, 20);
        U.store.set('speedHistory', state.speed.history);
        MOD.notify();
        return result;
      }).catch((e) => {
        state.speed.running = false;
        MOD.notify();
        return { ok: false, error: String(e && e.message || e) };
      });
    }
    return Dev.runAction('speedtest', {}).then((r) => {
      state.speed.running = false;
      state.speed.pct = 100;
      if (r.ok) {
        const d = r.data || {};
        const result = {
          ts: Date.now(), downMbps: Number(d.down_mbps || d.download || d.down || 0),
          upMbps: Number(d.up_mbps || d.upload || d.up || 0),
          ping: Number(d.ping_ms || d.latency || 0), demo: false
        };
        state.speed.last = result;
        state.speed.history.unshift(result);
        state.speed.history = state.speed.history.slice(0, 20);
        U.store.set('speedHistory', state.speed.history);
      }
      MOD.notify();
      return r;
    });
  };

  /* ── boot ──────────────────────────────────────────────────────────── */
  MOD.init = function () {
    MOD.loadSettings();
    MOD.loadSpeedHistory();
    Dev.setConfig({ panelUrl: state.settings.panelUrl, token: state.settings.token });
    state.ui.tab = U.store.get('lastTab', 'dashboard');
    if (state.settings.mode === 'device' && state.settings.panelUrl && state.settings.onboarded) {
      MOD.switchMode('device');
    } else {
      state.conn.mode = 'demo';
      MOD.startDemo();
    }
    global.addEventListener('online', () => {
      if (state.conn.mode === 'device' && state.conn.status === 'offline') MOD.connectDevice({ force: true });
    });
    global.addEventListener('offline', () => {
      if (state.conn.mode === 'device') {
        state.conn.status = 'offline';
        state.conn.error = 'شبکهٔ دستگاه قطع است.';
        MOD.notify();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (state.conn.mode === 'demo' && demo) demo.catchUp();
        if (state.conn.mode === 'device' && state.conn.status !== 'online' && state.settings.panelUrl) {
          MOD.connectDevice({ force: true });
        }
      }
    });
    return state;
  };

  MOD.emptyLive = emptyLive;
  MOD.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  MOD.state = state;
})(typeof window !== 'undefined' ? window : globalThis);
