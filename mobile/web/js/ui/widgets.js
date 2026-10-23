/* X28 Mobile — shared UI building blocks */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util;
  const F = X28.fmt;
  const I = X28.icon;
  const W = (X28.widgets = {});
  W.icon = I;

  W.rangeChips = function (current) {
    const opts = [['10m', '۱۰ دقیقه'], ['30m', '۳۰ دقیقه'], ['1h', '۱ ساعت'], ['6h', '۶ ساعت'], ['24h', '۲۴ ساعت']];
    return '<div class="segmented" data-range-chips>' + opts.map((o) =>
      '<button data-range="' + o[0] + '" class="' + (o[0] === current ? 'active' : '') + '">' + o[1] + '</button>').join('') + '</div>';
  };

  W.bindRange = function (root, onChange) {
    root.querySelectorAll('[data-range]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const range = btn.getAttribute('data-range');
        root.querySelectorAll('[data-range]').forEach((b) => b.classList.toggle('active', b === btn));
        X28.store.setSetting('chartRange', range);
        onChange(range);
      });
    });
  };

  W.sigbars = function (level, tone) {
    const cls = tone === 'warn' ? 'warn' : tone === 'bad' ? 'bad' : '';
    return '<div class="sigbars ' + cls + '">' + [1, 2, 3, 4, 5].map((i) =>
      '<i class="' + (i <= level ? 'on' : '') + '"></i>').join('') + '</div>';
  };

  W.levelBadge = function (level) {
    const tone = F.levelTone(level);
    return '<span class="badge ' + tone + '">' + U.esc(F.levelLabel(level)) + '</span>';
  };

  W.catBadge = function (cat) {
    return '<span class="badge outline">' + U.esc(F.catLabel(cat)) + '</span>';
  };

  W.eventRow = function (e) {
    const tone = e.level === 'critical' || e.level === 'crit' || e.level === 'error' ? 'crit' : e.level === 'warn' ? 'warn' : e.level === 'ok' ? 'ok' : 'info';
    const icon = e.cat === 'band' ? 'layers' : e.cat === 'wifi' ? 'wifi' : e.cat === 'client' ? 'users' :
      e.cat === 'network' ? 'globe' : e.cat === 'signal' ? 'signal' : e.cat === 'speed' ? 'speed' :
        e.cat === 'security' ? 'shield' : e.cat === 'system' ? 'settings' : 'info';
    return '<button class="ev" data-event="' + U.esc(e.id) + '" style="width:100%;text-align:start;background:none">' +
      '<span class="ev-rail"><span class="ev-dot ' + tone + '">' + I(icon, 15) + '</span></span>' +
      '<span class="ev-body"><span class="ev-title"><b>' + U.esc(e.title) + '</b>' + (e.msg ? ' — ' + U.esc(e.msg) : '') + '</span>' +
      '<span class="ev-meta">' + W.levelBadge(e.level) + W.catBadge(e.cat) +
      '<span class="dot-sep"></span><span>' + U.esc(U.relTime(e.ts)) + '</span>' +
      '<span class="dot-sep"></span><span class="num">' + U.esc(U.timeLabel(e.ts)) + '</span></span></span>' +
      '<span style="flex:0 0 auto;color:var(--muted-2);align-self:center;display:grid;place-items:center;width:16px">' + I('chevronLeft', 15) + '</span>' +
      '</button>';
  };

  W.eventDetail = function (e) {
    const rows = [
      ['زمان', new Date(e.ts).toLocaleString('fa-IR')],
      ['سطح', F.levelLabel(e.level)],
      ['دسته', F.catLabel(e.cat)],
      ['منبع', e.source || '—']
    ].map((r) => '<div class="kv-row"><span class="k">' + r[0] + '</span><span class="v">' + U.esc(r[1]) + '</span></div>').join('');
    return '<div class="stack">' +
      '<div class="card tight"><div class="row-title" style="font-size:15px">' + U.esc(e.title) + '</div>' +
      (e.msg ? '<div class="small muted" style="margin-top:4px;line-height:1.9">' + U.esc(e.msg) + '</div>' : '') + '</div>' +
      '<div class="card tight"><div class="kv">' + rows + '</div></div>' +
      (e.meta ? '<div class="card tight"><div class="tiny muted" style="margin-bottom:6px">داده‌های همراه رویداد</div><pre class="code">' + U.esc(JSON.stringify(e.meta, null, 2)) + '</pre></div>' : '') +
      '</div>';
  };

  W.clientRow = function (c, openSheet) {
    const tone = c.kind === 'tv' ? 'sky' : c.kind === 'phone' ? 'brand' : c.kind === 'laptop' ? 'violet' : c.kind === 'camera' ? 'amber' : '';
    const rx = F.bps(c.rxBps), tx = F.bps(c.txBps);
    return '<div class="client-row" data-client="' + U.esc(c.id) + '" role="button" tabindex="0">' +
      '<span class="dev-avatar ' + tone + ' ' + (c.online ? '' : 'off') + '">' + I(F.deviceIcon(c.kind), 20) +
      '<span class="on-dot"></span></span>' +
      '<span class="row-main"><span class="row-title">' + U.esc(c.name) + '</span>' +
      '<span class="row-sub"><span class="mono" style="font-size:10.5px">' + U.esc(c.ip || '—') + '</span>' +
      '<span class="dot-sep"></span><span>' + U.esc(F.deviceKindLabel(c.kind)) + '</span></span></span>' +
      '<span class="row-end" style="flex-direction:column;align-items:flex-end;gap:1px">' +
      '<span class="dev-traffic" style="color:var(--brand)">↓ ' + U.esc(rx) + '</span>' +
      '<span class="dev-traffic" style="color:var(--sky)">↑ ' + U.esc(tx) + '</span></span>' +
      '<span style="color:var(--muted-2);display:grid;place-items:center">' + I('chevronLeft', 15) + '</span>' +
      '</div>';
  };

  W.openClient = function (c) {
    const rows = [
      ['آدرس IP', c.ip || '—'],
      ['آدرس MAC', c.mac || '—'],
      ['نوع دستگاه', F.deviceKindLabel(c.kind)],
      ['باند وای‌فای', c.channel || '—'],
      ['دریافت', F.bps(c.rxBps)],
      ['ارسال', F.bps(c.txBps)],
      ['ترافیک کل', c.totalBytes ? F.bytes(c.totalBytes) : '—'],
      ['متصل از', c.connectedAt ? U.relTime(c.connectedAt) : '—'],
      ['کیفیت سیگنال', c.signal ? c.signal + ' از ۵' : '—']
    ].map((r) => '<div class="kv-row"><span class="k">' + r[0] + '</span><span class="v">' + U.esc(r[1]) + '</span></div>').join('');

    X28.ui.sheet({
      title: c.name,
      sub: F.deviceKindLabel(c.kind) + (c.channel ? ' · وای‌فای ' + c.channel : ''),
      icon: F.deviceIcon(c.kind),
      body: '<div class="stack">' +
        '<div class="card tight row" style="gap:12px">' +
        '<span class="dev-avatar ' + (c.online ? '' : 'off') + '" style="width:46px;height:46px;background:var(--brand-soft);color:var(--brand)">' + I(F.deviceIcon(c.kind), 24) + '</span>' +
        '<div class="grow"><div class="row-title" style="font-size:15px">' + U.esc(c.name) + '</div>' +
        '<div class="row-sub">' + (c.online ? '<span class="badge ok">متصل</span>' : '<span class="badge neutral">آفلاین</span>') +
        (c.signal ? ' <span class="badge info">' + F.num(c.signal) + '/۵ آنتن</span>' : '') + '</div></div></div>' +
        '<div class="card tight"><div class="kv">' + rows + '</div></div>' +
        (c.mac ? '<button class="btn ghost block" data-copy-mac>' + I('copy', 16) + ' کپی آدرس MAC</button>' : '') +
        '</div>',
      onMount(body) {
        const btn = body.querySelector('[data-copy-mac]');
        if (btn) btn.addEventListener('click', () => {
          U.copy(c.mac).then((ok) => X28.ui.toast(ok ? 'کپی شد' : 'کپی نشد', ok ? 'ok' : 'err'));
        });
      }
    });
  };

  W.kv = function (rows) {
    return '<div class="kv">' + rows.map((r) =>
      '<div class="kv-row"><span class="k">' + r[0] + '</span><span class="v">' + (r[2] === true ? r[1] : U.esc(r[1])) + '</span></div>').join('') + '</div>';
  };

  W.jsonBlock = function (obj) {
    return '<pre class="code">' + U.esc(JSON.stringify(obj, null, 2)) + '</pre>';
  };

  W.toggle = function (on, attrs) {
    return '<button class="switch ' + (on ? 'on' : '') + '" role="switch" aria-checked="' + (!!on) + '" ' + (attrs || '') + '></button>';
  };

  W.loadingCard = function (label) {
    return '<div class="card"><div class="stack-sm">' +
      '<div class="sk sk-line" style="width:40%"></div>' +
      '<div class="sk sk-line" style="width:80%;height:22px"></div>' +
      '<div class="sk sk-line" style="width:60%"></div>' +
      '<div class="tiny muted" style="margin-top:4px">' + U.esc(label || 'در حال دریافت داده…') + '</div>' +
      '</div></div>';
  };

  W.modeHint = function () {
    const st = X28.store.state.conn;
    if (st.mode === 'demo') {
      return '<div class="alert">' + I('info', 16) + '<span><b>حالت نمایشی:</b> داده‌ها شبیه‌سازی شده‌اند. برای اتصال واقعی، از تنظیمات «اتصال به پنل» را انتخاب کنید.</span></div>';
    }
    return '';
  };

  W.spinner = function (size) {
    const s = size || 18;
    return '<span class="spin" style="width:' + s + 'px;height:' + s + 'px;border:2px solid var(--line);border-top-color:var(--brand);border-radius:50%;display:inline-block;animation:spin .8s linear infinite"></span>';
  };

  W.resolveAction = function (candidates) {
    const actions = X28.store.state.actions || [];
    for (let i = 0; i < candidates.length; i++) {
      const found = actions.find((a) => a.name === candidates[i]) ||
        actions.find((a) => a.name.toLowerCase().indexOf(candidates[i].toLowerCase()) >= 0) ||
        actions.find((a) => a.label.indexOf(candidates[i]) >= 0);
      if (found) return found;
    }
    return null;
  };

  W.fmtBand = (b) => {
    const info = F.bandInfo(b);
    return info.mhz ? info.band + ' · ' + info.mhz + ' MHz' : (b || '—');
  };

  W.speedTestSheet = function () {
    const ui = X28.ui;
    const sheet = ui.sheet({
      title: 'آزمون سرعت',
      sub: 'دانلود، آپلود و تأخیر — نتیجه در تاریخچه ذخیره می‌شود',
      icon: 'speed',
      body: '<div class="stack">' +
        '<div class="card" style="text-align:center;padding:20px 16px">' +
        '<div class="ring-wrap" style="margin:0 auto 8px;width:160px;height:160px" id="speed-ring"></div>' +
        '<div class="row" style="justify-content:center;gap:22px;margin-top:6px">' +
        '<div><div class="metric-big" id="st-down" style="color:var(--brand)">0</div><div class="metric-cap">دانلود Mbps</div></div>' +
        '<div><div class="metric-big" id="st-up" style="color:var(--sky)">0</div><div class="metric-cap">آپلود Mbps</div></div>' +
        '<div><div class="metric-big" id="st-ping" style="color:var(--violet)">—</div><div class="metric-cap">تأخیر ms</div></div>' +
        '</div>' +
        '<div class="progress" style="margin-top:14px"><i id="st-progress" style="width:0%"></i></div>' +
        '<div class="tiny muted" style="margin-top:8px" id="st-phase">آماده…</div>' +
        '</div>' +
        '<div class="card tight" id="st-history"></div>' +
        '<div class="hint">' + I('info', 13) + '<span>آزمون حدود ۵ ثانیه طول می‌کشد و مصرف داده دارد (حدود ۲۵ مگابایت در حالت واقعی).</span></div>' +
        '</div>',
      footer: '<button class="btn primary" id="st-run">' + I('play', 17) + ' شروع آزمون</button>',
      onMount(body, close) {
        const ringHost = body.querySelector('#speed-ring');
        const ring = X28.charts.ring(ringHost, { size: 160, stroke: 11, colorFrom: '#38bdf8', colorMid: '#22d3a6', colorTo: '#5eead4' });
        ringHost.insertAdjacentHTML('beforeend', '<div class="ring-center"><b id="st-ring-val" style="font-size:28px">0</b><span>درصد</span></div>');
        const downEl = body.querySelector('#st-down');
        const upEl = body.querySelector('#st-up');
        const pingEl = body.querySelector('#st-ping');
        const prog = body.querySelector('#st-progress');
        const phase = body.querySelector('#st-phase');
        const ringVal = body.querySelector('#st-ring-val');
        const histEl = body.querySelector('#st-history');
        const runBtn = document.querySelector('#st-run');

        function renderHistory() {
          const hist = X28.store.state.speed.history || [];
          if (!hist.length) {
            histEl.innerHTML = '<div class="tiny muted">هنوز آزمونی ثبت نشده است.</div>';
            return;
          }
          histEl.innerHTML = '<div class="row-between" style="margin-bottom:6px"><span class="sec-title" style="font-size:12px">آزمون‌های اخیر</span></div>' +
            hist.slice(0, 4).map((h) => '<div class="kv-row"><span class="k">' + U.relTime(h.ts) + '</span>' +
              '<span class="v" style="display:flex;gap:10px"><span style="color:var(--brand)">↓ ' + F.fixed(h.downMbps, 1) + '</span>' +
              '<span style="color:var(--sky)">↑ ' + F.fixed(h.upMbps, 1) + '</span></span></div>').join('');
        }
        renderHistory();

        let running = false;
        runBtn.addEventListener('click', () => {
          if (running) return;
          running = true;
          runBtn.disabled = true;
          runBtn.innerHTML = W.spinner(16) + ' در حال آزمون…';
          const off = X28.store.subscribe((st) => {
            const s = st.speed;
            downEl.textContent = F.fixed(s.downMbps || 0, 1);
            upEl.textContent = F.fixed(s.upMbps || 0, 1);
            pingEl.textContent = s.ping ? F.num(s.ping) : '—';
            prog.style.width = (s.pct || 0) + '%';
            phase.textContent = s.phase ? s.phase + ' · ' + F.num(s.pct) + '٪' : '';
            ringVal.textContent = F.num(s.pct || 0);
            ring.set(s.pct || 0);
          });
          X28.store.speedTest().then((res) => {
            off();
            running = false;
            runBtn.disabled = false;
            runBtn.innerHTML = I('rotate', 17) + ' آزمون دوباره';
            if (res && res.ok === false) {
              X28.ui.toast(res.error || 'آزمون انجام نشد', 'err', 4000);
              phase.textContent = 'خطا';
            } else if (res) {
              downEl.textContent = F.fixed(res.downMbps || 0, 1);
              upEl.textContent = F.fixed(res.upMbps || 0, 1);
              pingEl.textContent = res.ping ? F.num(res.ping) : '—';
              prog.style.width = '100%';
              ringVal.textContent = '100';
              ring.set(100);
              phase.textContent = 'پایان آزمون';
              renderHistory();
              U.haptic('light');
            }
          });
        });
      },
      onClose() {}
    });
    return sheet;
  };
})(typeof window !== 'undefined' ? window : globalThis);
