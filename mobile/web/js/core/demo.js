/* X28 Mobile — realistic demo engine (works fully offline) */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util;
  const D = (X28.demo = {});

  const CLIENTS_SEED = [
    { id: 'c1', name: 'iPhone 15', kind: 'phone', mac: 'A4:83:E7:2C:11:9B', ip: '192.168.1.101', channel: '5G' },
    { id: 'c2', name: 'Samsung S23', kind: 'phone', mac: '5C:0A:5B:77:03:E1', ip: '192.168.1.102', channel: '5G' },
    { id: 'c3', name: 'MacBook Pro', kind: 'laptop', mac: 'F0:18:98:3A:BC:21', ip: '192.168.1.103', channel: '5G' },
    { id: 'c4', name: 'LG Smart TV', kind: 'tv', mac: '3C:CD:5D:91:22:04', ip: '192.168.1.104', channel: '5G' },
    { id: 'c5', name: 'Laptop-Work', kind: 'laptop', mac: '8C:85:90:4F:1A:CC', ip: '192.168.1.105', channel: '2.4G' },
    { id: 'c6', name: 'Smart Camera', kind: 'camera', mac: 'B0:4E:26:9D:71:5A', ip: '192.168.1.106', channel: '2.4G' },
    { id: 'c7', name: 'HP LaserJet', kind: 'printer', mac: 'D8:9D:67:12:88:3F', ip: '192.168.1.107', channel: '2.4G' },
    { id: 'c8', name: 'Apple Watch', kind: 'watch', mac: 'C8:69:CD:55:2B:70', ip: '192.168.1.108', channel: '5G' }
  ];

  const EVENT_POOL = [
    { level: 'info', cat: 'signal', title: 'کیفیت سیگنال در محدودهٔ پایدار', msg: 'RSRP در بازهٔ سالم باقی ماند.' },
    { level: 'warn', cat: 'signal', title: 'افت موقت SINR', msg: 'نویز سلول مجاور افزایش یافت؛ اتصال بدون قطعی ادامه داد.' },
    { level: 'info', cat: 'band', title: 'باند فعال بررسی شد', msg: 'پروفایل باند با شرایط شبکه هماهنگ است.' },
    { level: 'warn', cat: 'band', title: 'تغییر باند توسط شبکه', msg: 'اپراتور باند فعال را برای توزیع بار تغییر داد.' },
    { level: 'ok', cat: 'client', title: 'دستگاه جدید به وای‌فای متصل شد', msg: 'یک دستگاه با DHCP داخلی آدرس گرفت.' },
    { level: 'warn', cat: 'client', title: 'دستگاه خارج از پوشش', msg: 'ارتباط یکی از دستگاه‌ها با اکسس‌پوینت قطع شد.' },
    { level: 'info', cat: 'network', title: 'تست DNS موفق', msg: 'سرورهای DNS در محدودهٔ نرمال پاسخ دادند.' },
    { level: 'ok', cat: 'network', title: 'بررسی گواهی TLS', msg: 'گواهی معتبر و بدون خطا ارزیابی شد.' },
    { level: 'info', cat: 'system', title: 'نمونه‌گیری دوره‌ای انجام شد', msg: 'وضعیت منابع و سیگنال ثبت شد.' },
    { level: 'ok', cat: 'system', title: 'پشتیبان‌گیری پیکربندی', msg: 'نسخهٔ پشتیبان پیکربندی با موفقیت ساخته شد.' },
    { level: 'warn', cat: 'security', title: 'تلاش ورود ناموفق', msg: 'یک درخواست ورود با رمز نادرست رد شد.' },
    { level: 'info', cat: 'speed', title: 'سرعت‌سنجی زمان‌بندی‌شده', msg: 'نتیجه در تاریخچهٔ سرعت ذخیره شد.' },
    { level: 'crit', cat: 'signal', title: 'افت شدید سیگنال', msg: 'RSRP زیر آستانهٔ هشدار رفت؛ بررسی آنتن پیشنهاد می‌شود.' },
    { level: 'info', cat: 'panel', title: 'همگام‌سازی پنل', msg: 'داده‌های زنده با پنل مرکزی همگام شد.' }
  ];

  const BAND_PROFILE = {
    n78: { rsrp: -94, sinr: 19, cap: 260, latency: 24, name: '5G · ۳۵۰۰' },
    n41: { rsrp: -96, sinr: 16, cap: 180, latency: 27, name: '5G · ۲۵۰۰' },
    B3: { rsrp: -87, sinr: 17, cap: 82, latency: 31, name: '4G · ۱۸۰۰' },
    B1: { rsrp: -90, sinr: 14, cap: 64, latency: 34, name: '4G · ۲۱۰۰' },
    B7: { rsrp: -93, sinr: 12, cap: 70, latency: 35, name: '4G · ۲۶۰۰' },
    B8: { rsrp: -99, sinr: 10, cap: 26, latency: 43, name: '4G · ۹۰۰' },
    B20: { rsrp: -102, sinr: 8, cap: 18, latency: 48, name: '4G · ۸۰۰' },
    B28: { rsrp: -101, sinr: 9, cap: 21, latency: 46, name: '4G · ۷۰۰' }
  };

  function pickInitialBand() {
    const r = Math.random();
    if (r < 0.55) return 'n78';
    if (r < 0.78) return 'B3';
    if (r < 0.9) return 'B1';
    return 'B8';
  }

  D.create = function (options) {
    options = options || {};
    const now0 = Date.now();
    const model = {
      online: true,
      operator: 'MCI',
      network: '5G',
      band: pickInitialBand(),
      bandLock: 'auto',
      cellLock: false,
      networkMode: 'auto',
      apn: 'mcinet',
      ipv6: true,
      mtu: 1500,
      latency: 28,
      jitter: 4.2,
      loss: 0,
      rsrp: -92,
      rsrq: -11,
      sinr: 17,
      pci: 217,
      cellId: '0x0A71C3',
      earfcn: 632628,
      temp: 44,
      uptime: 3 * 86400 + 5 * 3600 + 12 * 60,
      rxBps: 0,
      txBps: 0,
      totalRx: 184.3 * 1024 * 1024 * 1024,
      totalTx: 26.8 * 1024 * 1024 * 1024,
      wanIp: '10.42.7.19',
      publicIp: '5.23.184.76',
      cgnat: true,
      gateway: '10.42.0.1',
      dnsMs: 22,
      tlsDays: 74,
      lastSample: now0,
      wifi: {
        enabled: true,
        ssid: 'X28-Home',
        guest: { enabled: false, ssid: 'X28-Guest' },
        wps: false,
        channel24: 6,
        channel5: 44,
        w24: true,
        w5: true,
        txPower: 'high',
        security: 'WPA2/WPA3'
      },
      clients: CLIENTS_SEED.map((c, i) => ({
        id: c.id, name: c.name, kind: c.kind, mac: c.mac, ip: c.ip, channel: c.channel,
        online: i !== 6,
        rxBps: U.rand(0.2e6, 8e6),
        txBps: U.rand(0.05e6, 2e6),
        totalBytes: U.rand(0.4, 22) * 1024 * 1024 * 1024,
        connectedAt: now0 - U.randInt(10, 4000) * 60 * 1000,
        signal: U.randInt(2, 5)
      }))
    };

    const listeners = { sample: [], event: [], clients: [], status: [] };
    let timer = 0, running = false, phase = U.rand(0, Math.PI * 2), drift = 0;
    let nextBandSwitch = now0 + U.randInt(150, 420) * 1000;
    let nextRandomEvent = now0 + U.randInt(45, 180) * 1000;
    let outageUntil = 0;
    let speedTestActive = false;

    function emit(kind, payload) {
      (listeners[kind] || []).forEach((fn) => { try { fn(payload); } catch (e) { /* keep engine alive */ } });
    }

    function on(kind, fn) {
      (listeners[kind] = listeners[kind] || []).push(fn);
      return () => { listeners[kind] = (listeners[kind] || []).filter((f) => f !== fn); };
    }

    function bandCap() {
      return (BAND_PROFILE[model.band] || BAND_PROFILE.B3).cap;
    }

    function updateClients(dt, sampleTime) {
      let rx = 0, tx = 0;
      model.clients.forEach((c) => {
        if (!c.online) { c.rxBps = 0; c.txBps = 0; return; }
        const base = c.kind === 'tv' ? 5.2e6 : c.kind === 'laptop' ? 1.6e6 : c.kind === 'camera' ? 0.9e6 : 0.5e6;
        const target = base * U.rand(0.35, 2.4);
        c.rxBps = Math.max(0, U.lerp(c.rxBps, target, 0.35) + U.randn() * base * 0.12);
        c.txBps = Math.max(0, U.lerp(c.txBps, target * 0.28, 0.3) + U.randn() * base * 0.05);
        c.totalBytes += (c.rxBps + c.txBps) * dt;
        c.signal = U.clamp(Math.round(2 + (model.rsrp + 110) / 9 + U.rand(-0.6, 0.6)), 1, 5);
        rx += c.rxBps; tx += c.txBps;
      });
      /* ambient background traffic from the router itself */
      rx += U.rand(0.2e6, 1.4e6);
      tx += U.rand(0.05e6, 0.4e6);
      const cap = bandCap() * 1e6;
      model.rxBps = Math.min(cap * 0.94, Math.max(0.3e6, rx));
      model.txBps = Math.min(cap * 0.3, Math.max(0.05e6, tx));
      model.totalRx += model.rxBps * dt;
      model.totalTx += model.txBps * dt;
      if (sampleTime) emit('clients', model.clients.map((c) => Object.assign({}, c)));
    }

    function sample(ts, opts) {
      opts = opts || {};
      phase += 0.16;
      drift = U.clamp(drift * 0.985 + U.randn() * 0.18, -7, 7);
      if (ts > outageUntil && !model.online) {
        model.online = true;
        pushEvent({ level: 'ok', cat: 'system', title: 'اتصال برقرار شد', msg: 'مودم دوباره در دسترس است.' });
      }
      const prof = BAND_PROFILE[model.band] || BAND_PROFILE.B3;
      const wave = Math.sin(phase) * 2.4 + Math.sin(phase * 0.37) * 1.6;
      if (model.online) {
        model.rsrp = U.clamp(U.round(prof.rsrp + wave + drift + U.randn() * 1.1, 1), -120, -55);
        model.sinr = U.clamp(U.round(prof.sinr + wave * 0.8 - drift * 0.6 + U.randn() * 0.9, 1), -3, 32);
        model.rsrq = U.clamp(U.round(-9.5 + (model.sinr - 14) * 0.34 + U.randn() * 0.6, 1), -25, -6);
        const load = U.clamp(0.62 + Math.sin(phase * 0.23) * 0.18 + U.randn() * 0.06, 0.25, 0.98);
        model.latency = U.clamp(Math.round(prof.latency * (0.85 + load * 0.5) + U.randn() * 3), 9, 380);
        model.jitter = U.clamp(U.round(Math.abs(U.randn() * 2.6) + load * 3, 1), 0.3, 60);
        model.loss = U.clamp(U.round(Math.max(0, (load - 0.82) * 16 + U.randn() * 0.3), 1), 0, 22);
      } else {
        model.rsrp = null; model.sinr = null; model.rsrq = null; model.latency = null;
        model.jitter = null; model.loss = 100;
      }
      const dt = Math.max(0.5, Math.min(30, (ts - model.lastSample) / 1000));
      model.lastSample = ts;
      model.uptime += dt;
      if (model.online && !opts.historical) {
        updateClients(dt, true);
        model.temp = U.clamp(U.round(42 + (model.rxBps / 1e6) * 0.09 + U.randn() * 0.7, 1), 34, 68);
      } else if (!model.online) {
        model.rxBps = 0; model.txBps = 0;
      }
      if (model.online && !opts.historical && ts > nextRandomEvent) {
        nextRandomEvent = ts + U.randInt(50, 190) * 1000;
        if (U.chance(0.55)) {
          const e = U.pick(EVENT_POOL);
          pushEvent(Object.assign({}, e, { meta: { band: model.band } }));
        }
      }
      if (!opts.historical && model.bandLock === 'auto' && !model.cellLock && ts > nextBandSwitch) {
        nextBandSwitch = ts + U.randInt(150, 420) * 1000;
        const optionsBands = ['n78', 'n41', 'B3', 'B1', 'B7', 'B8'];
        const next = U.pick(optionsBands.filter((b) => b !== model.band));
        if (next) {
          model.band = next;
          model.network = next.indexOf('n') === 0 ? '5G' : '4G+';
          model.pci = U.randInt(50, 500);
          model.earfcn = next.indexOf('n') === 0 ? U.randInt(620000, 640000) : U.randInt(100, 6400);
          model.cellId = '0x' + U.randInt(0x10000, 0xFFFFF).toString(16).toUpperCase();
          pushEvent({
            level: 'warn', cat: 'band', title: 'تغییر باند توسط شبکه',
            msg: 'باند فعال از ' + X28.fmt.bandInfo(model.band).band + ' به حالت جدید تغییر کرد.',
            meta: { band: next }
          });
        }
      }
      return snapshot();
    }

    function snapshot() {
      const prof = BAND_PROFILE[model.band] || BAND_PROFILE.B3;
      return {
        online: model.online,
        operator: model.operator,
        network: model.network,
        band: model.band,
        bandName: prof.name,
        bandLock: model.bandLock,
        networkMode: model.networkMode,
        cellLock: model.cellLock,
        apn: model.apn,
        latency: model.latency,
        jitter: model.jitter,
        loss: model.loss,
        rsrp: model.rsrp,
        rsrq: model.rsrq,
        sinr: model.sinr,
        pci: model.pci,
        cellId: model.cellId,
        earfcn: model.earfcn,
        temp: model.temp,
        uptime: Math.round(model.uptime),
        rxBps: model.rxBps,
        txBps: model.txBps,
        totalRx: model.totalRx,
        totalTx: model.totalTx,
        wanIp: model.wanIp,
        publicIp: model.publicIp,
        cgnat: model.cgnat,
        gateway: model.gateway,
        dnsMs: model.dnsMs,
        tlsDays: model.tlsDays,
        ipv6: model.ipv6,
        mtu: model.mtu,
        wifi: JSON.parse(JSON.stringify(model.wifi)),
        clients: model.clients.map((c) => Object.assign({}, c)),
        profile: {
          model: 'ZLT X28 (X28-A01)',
          firmware: 'X28.1.0.8-2024.11',
          imei: '867543021234567',
          iccid: '8997101234567890123',
          serial: 'X28A01B2401V7',
          hardware: 'v1.3',
          bootloader: '2023.08'
        }
      };
    }

    function pushEvent(ev) {
      const event = {
        id: U.uid('ev'),
        ts: ev.ts || Date.now(),
        level: ev.level || 'info',
        cat: ev.cat || 'system',
        title: ev.title || 'رویداد',
        msg: ev.msg || '',
        source: ev.source || 'demo',
        meta: ev.meta || null
      };
      emit('event', event);
      return event;
    }

    let lastEmittedSampleTs = 0;

    function tick() {
      const ts = Date.now();
      const snap = sample(ts);
      if (ts > outageUntil && !model.online) model.online = true;
      emit('sample', { t: ts, live: snap, historical: false });
      lastEmittedSampleTs = ts;
    }

    function start() {
      if (running) return;
      running = true;
      tick();
      timer = setInterval(tick, 2000);
    }

    function stop() {
      running = false;
      clearInterval(timer);
      timer = 0;
    }

    /* 24h of believable history at 1-minute resolution */
    function backfill(hours) {
      hours = hours || 24;
      const pts = Math.max(1, Math.round(hours * 60));
      const stepMs = (hours * 3600 * 1000) / pts;
      const out = [];
      const savedState = { band: model.band, bandLock: model.bandLock, network: model.network };
      model.bandLock = 'auto';
      for (let i = pts; i >= 1; i--) {
        const ts = Date.now() - i * stepMs;
        const snap = sample(ts, { historical: true });
        out.push({
          t: ts,
          rtt: snap.online ? Math.round((snap.latency || 30) * (0.95 + Math.random() * 0.12)) : null,
          rx: snap.online ? Math.max(0.2e6, snap.rxBps * (0.6 + Math.random() * 0.7)) : 0,
          tx: snap.online ? Math.max(0.05e6, snap.txBps * (0.6 + Math.random() * 0.7)) : 0,
          rsrp: snap.rsrp, rsrq: snap.rsrq, sinr: snap.sinr, loss: snap.loss,
          clients: Math.max(1, snap.clients.filter((c) => c.online).length + Math.round(U.randn() * 0.6))
        });
      }
      model.band = savedState.band;
      model.bandLock = savedState.bandLock;
      model.network = savedState.network;
      return out;
    }

    function catchUp() {
      const gap = Date.now() - lastEmittedSampleTs;
      if (gap > 6000 && lastEmittedSampleTs) {
        const steps = Math.min(20, Math.floor(gap / 2000));
        for (let i = steps; i >= 1; i--) {
          const ts = Date.now() - i * 2000;
          const snap = sample(ts);
          emit('sample', { t: ts, live: snap, historical: false, catchup: true });
        }
      }
      tick();
    }

    function setOnline(online, seconds) {
      model.online = !!online;
      if (online) {
        outageUntil = 0;
        pushEvent({ level: 'ok', cat: 'system', title: 'اتصال برقرار شد', msg: 'ارتباط با مودم بازگشت.' });
      } else {
        outageUntil = seconds ? Date.now() + seconds * 1000 : 0;
        pushEvent({ level: 'crit', cat: 'network', title: 'قطع ارتباط با مودم', msg: seconds ? 'شبیه‌سازی قطعی به‌مدت ' + seconds + ' ثانیه.' : 'شبیه‌سازی قطعی دستی.' });
      }
      tick();
    }

    function speedTest(onProgress) {
      if (speedTestActive) return Promise.reject(new Error('آزمون سرعت در حال اجراست'));
      speedTestActive = true;
      const t0 = Date.now();
      const prof = BAND_PROFILE[model.band] || BAND_PROFILE.B3;
      const qualityFactor = U.clamp((model.sinr || 10) / 20, 0.25, 1.15);
      const down = U.round(prof.cap * qualityFactor * U.rand(0.55, 0.92), 1);
      const up = U.round(down * U.rand(0.16, 0.34), 1);
      const ping = Math.round((model.latency || 30) * U.rand(0.85, 1.25));
      return new Promise((resolve) => {
        let step = 0;
        const totalSteps = 26;
        const iv = setInterval(() => {
          step++;
          const pct = Math.min(100, Math.round((step / totalSteps) * 100));
          const phaseName = pct < 18 ? 'اتصال' : pct < 68 ? 'دانلود' : 'آپلود';
          const fakeDown = pct < 68 ? (down * pct) / 68 * U.rand(0.85, 1.1) : down;
          const fakeUp = pct >= 68 ? (up * (pct - 68)) / 32 * U.rand(0.8, 1.15) : 0;
          if (onProgress) onProgress({ pct, phase: phaseName, downMbps: Math.max(0, fakeDown), upMbps: Math.max(0, fakeUp), ping });
          if (pct >= 100) {
            clearInterval(iv);
            speedTestActive = false;
            const result = {
              ts: Date.now(), downMbps: down, upMbps: up, ping, jitter: U.round(U.rand(1, 8), 1),
              durationMs: Date.now() - t0, band: model.band, network: model.network,
              server: 'speed.cloudflare.com', demo: true
            };
            pushEvent({
              level: 'info', cat: 'speed', title: 'آزمون سرعت انجام شد',
              msg: 'دانلود ' + X28.fmt.fixed(down, 1) + ' مگابیت و آپلود ' + X28.fmt.fixed(up, 1) + ' مگابیت بر ثانیه.',
              meta: result
            });
            resolve(result);
          }
        }, 190);
      });
    }

    function runAction(name, params) {
      params = params || {};
      const key = String(name || '').toLowerCase();
      const ok = (message, data) => ({ ok: true, message, data: data || null });
      switch (key) {
        case 'reboot':
        case 'restart':
          pushEvent({ level: 'warn', cat: 'system', title: 'ریبوت مودم', msg: 'درخواست ریبوت ارسال شد؛ تا ۲۰ ثانیه دسترسی قطع می‌شود.' });
          setOnline(false, 18);
          return ok('درخواست ریبوت ارسال شد. مودم تا ~۲۰ ثانیه در دسترس نیست.');
        case 'band_lock':
        case 'lock_band': {
          const band = params.band || params.value || 'B3';
          model.bandLock = band;
          model.band = band;
          model.cellLock = !!params.cell;
          model.network = String(band).indexOf('n') === 0 ? '5G' : '4G+';
          pushEvent({ level: 'warn', cat: 'band', title: 'قفل باند اعمال شد', msg: 'باند ' + band + ' قفل شد.', meta: { band } });
          tick();
          return ok('باند ' + band + ' قفل شد.', { band });
        }
        case 'band_unlock':
        case 'unlock_band':
          model.bandLock = 'auto';
          pushEvent({ level: 'ok', cat: 'band', title: 'قفل باند برداشته شد', msg: 'انتخاب باند به شبکه سپرده شد.' });
          tick();
          return ok('قفل باند برداشته شد؛ انتخاب باند خودکار شد.');
        case 'network_mode': {
          const mode = params.mode || 'auto';
          model.networkMode = mode;
          model.network = mode === '5g' ? '5G' : mode === '4g' ? '4G+' : model.network;
          pushEvent({ level: 'info', cat: 'network', title: 'حالت شبکه تغییر کرد', msg: 'حالت شبکه روی ' + mode + ' تنظیم شد.' });
          tick();
          return ok('حالت شبکه ثبت شد.', { mode });
        }
        case 'set_apn':
        case 'apn':
          model.apn = params.apn || params.value || model.apn;
          pushEvent({ level: 'info', cat: 'network', title: 'APN به‌روزرسانی شد', msg: 'APN جدید: ' + model.apn });
          return ok('APN ذخیره شد.', { apn: model.apn });
        case 'wifi_onoff': {
          const on = params.on === undefined ? !model.wifi.enabled : !!params.on;
          model.wifi.enabled = on;
          pushEvent({ level: on ? 'ok' : 'warn', cat: 'wifi', title: on ? 'وای‌فای روشن شد' : 'وای‌فای خاموش شد', msg: 'وضعیت رادیو تغییر کرد.' });
          tick();
          return ok(on ? 'وای‌فای روشن شد.' : 'وای‌فای خاموش شد.');
        }
        case 'wps_push':
          model.wifi.wps = true;
          pushEvent({ level: 'info', cat: 'wifi', title: 'WPS فعال شد', msg: 'تا ۲ دقیقه می‌توانید دستگاه را وصل کنید.' });
          return ok('WPS تا ۲ دقیقه فعال است.');
        case 'wifi_guest': {
          model.wifi.guest.enabled = params.on === undefined ? !model.wifi.guest.enabled : !!params.on;
          pushEvent({ level: 'info', cat: 'wifi', title: 'شبکهٔ مهمان تغییر کرد', msg: model.wifi.guest.enabled ? 'شبکهٔ مهمان فعال شد.' : 'شبکهٔ مهمان خاموش شد.' });
          return ok('شبکهٔ مهمان به‌روزرسانی شد.');
        }
        case 'wifi_channel': {
          if (params.band === '5') model.wifi.channel5 = Number(params.channel) || 44;
          else model.wifi.channel24 = Number(params.channel) || 6;
          return ok('کانال وای‌فای تنظیم شد.');
        }
        case 'rescan':
        case 'scan':
          return ok('اسکن شبکه انجام شد.', { cells: [
            { band: 'n78', pci: 217, rsrp: model.rsrp, quality: 'good' },
            { band: 'B3', pci: 188, rsrp: model.rsrp - 6, quality: 'fair' },
            { band: 'B1', pci: 322, rsrp: model.rsrp - 11, quality: 'fair' }
          ] });
        case 'ping_test':
        case 'ping':
          return ok('تأخیر اندازه‌گیری شد.', { latency: model.latency, jitter: model.jitter, loss: model.loss });
        case 'clients':
        case 'refresh_clients':
          updateClients(1, true);
          return ok('فهرست دستگاه‌ها به‌روز شد.', { count: model.clients.filter((c) => c.online).length });
        case 'discovery':
        case 'detect':
          return ok('مودم شناسایی شد.', { model: 'ZLT X28', firmware: 'X28.1.0.8', family: 'ZLT' });
        case 'backup':
          return ok('پشتیبان پیکربندی ساخته شد.', { file: 'x28-backup-' + new Date().toISOString().slice(0, 10) + '.json' });
        case 'logout':
        case 'login':
          return ok('عملیات ثبت شد.');
        default:
          return ok('عملیات «' + name + '» با موفقیت اجرا شد.');
      }
    }

    return {
      model,
      snapshot,
      start, stop, tick, catchUp, backfill, setOnline, speedTest, runAction, pushEvent,
      on,
      get running() { return running; },
      setBand(band) { model.band = band; tick(); },
      addClient(patch) {
        const c = Object.assign({
          id: U.uid('c'), name: 'دستگاه جدید', kind: 'unknown', mac: 'AA:BB:CC:' + U.randInt(10, 99) + ':' + U.randInt(10, 99) + ':' + U.randInt(10, 99),
          ip: '192.168.1.' + U.randInt(110, 240), channel: '5G', online: true,
          rxBps: U.rand(0.1e6, 2e6), txBps: U.rand(0.05e6, 0.6e6),
          totalBytes: U.rand(0.01, 1) * 1024 * 1024 * 1024, connectedAt: Date.now(), signal: 4
        }, patch || {});
        model.clients.push(c);
        updateClients(1, true);
        return c;
      }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
