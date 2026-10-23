/* X28 Mobile — tab 3: band, cell and network mode */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  const BAND_CHOICES = ['B1', 'B3', 'B5', 'B7', 'B8', 'B20', 'B28', 'B38', 'B40', 'B41', 'n28', 'n41', 'n78', 'n79'];

  X28.tabs.register('band', {
    label: 'باند',
    icon: 'layers',
    mount(root) {
      root.innerHTML = ui.pageHead('باند و سلول', 'قفل باند، حالت شبکه و انتخاب سلول') +
        '<div class="stack">' +
        '<section class="hero" id="band-hero">' +
        '  <div class="hero-top"><div><div class="hero-label">باند فعال</div>' +
        '  <div class="hero-title" id="band-title">در حال خواندن…</div></div>' +
        '  <span class="status ok" id="band-lock-pill"><span class="dot"></span><span class="txt">خودکار</span></span></div>' +
        '  <div class="hero-metric"><div><span class="hero-value num" id="band-main">—</span>' +
        '  <span class="hero-unit" id="band-main-unit"></span></div>' +
        '  <div style="margin-inline-start:auto;text-align:end"><div class="tiny muted">کیفیت سیگنال</div>' +
        '  <div id="band-bars" style="display:flex;justify-content:flex-end;margin-top:4px">' + W.sigbars(0, '') + '</div></div></div>' +
        '  <div class="hero-foot">' +
        '    <span class="hero-pill">' + I('tower', 13) + ' سلول <b id="band-pci">—</b></span>' +
        '    <span class="hero-pill">' + I('hash', 13) + ' ARFCN <b id="band-arfcn">—</b></span>' +
        '    <span class="hero-pill">' + I('signal', 13) + ' RSRP <b id="band-rsrp">—</b></span>' +
        '    <span class="hero-pill">' + I('activity', 13) + ' SINR <b id="band-sinr">—</b></span>' +
        '  </div>' +
        '</section>' +

        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>قفل باند</div>' +
        '  <span class="badge neutral" id="band-pending-badge">—</span></div>' +
        '  <div class="hint" style="margin-bottom:9px">' + I('info', 13) + '<span>با قفل باند، مودم روی باند انتخابی ثابت می‌ماند. اگر سیگنال آن باند ضعیف شود، ممکن است اتصال قطع شود.</span></div>' +
        '  <div class="band-grid" id="band-grid"></div>' +
        '  <div class="btn-row" style="margin-top:12px">' +
        '    <button class="btn primary" id="band-apply" disabled>' + I('lock', 17) + ' اعمال قفل</button>' +
        '    <button class="btn ghost" id="band-auto">' + I('unlock', 17) + ' خودکار</button>' +
        '  </div>' +
        '</section>' +

        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>حالت شبکه</div></div>' +
        '  <div class="segmented" id="netmode" style="width:100%;display:flex">' +
        '    <button data-mode="auto" style="flex:1" class="active">خودکار</button>' +
        '    <button data-mode="4g" style="flex:1">فقط 4G</button>' +
        '    <button data-mode="5g" style="flex:1">فقط 5G</button>' +
        '  </div>' +
        '  <div class="row-between" style="margin-top:10px">' +
        '    <div class="tiny muted" id="netmode-now">حالت فعلی: —</div>' +
        '    <button class="link-btn" id="netmode-apply">اعمال</button>' +
        '  </div>' +
        '</section>' +

        '<section class="card">' +
        '  <div class="row" style="gap:11px">' +
        '    <span class="row-icon violet">' + I('mapPin', 19) + '</span>' +
        '    <div class="grow"><div class="row-title">قفل سلول (PCI)</div>' +
        '    <div class="row-sub">اتصال به سلول مشخص به‌جای انتخاب خودکار شبکه</div></div>' +
        '    <button class="switch" id="cell-lock" role="switch" aria-checked="false"></button>' +
        '  </div>' +
        '  <div class="hint" style="margin-top:9px">' + I('alert', 13) + '<span>قفل سلول فقط وقتی کار می‌کند که پنل مودم این قابلیت را در فریم‌ور شما فعال کرده باشد.</span></div>' +
        '</section>' +

        '<section class="card tight">' +
        '  <div class="row" style="gap:10px">' +
        '    <span class="row-icon amber">' + I('shield', 18) + '</span>' +
        '    <div class="grow"><div class="row-title" style="font-size:12.5px">قبل از تغییر، خودکار بکاپ گرفته می‌شود</div>' +
        '    <div class="row-sub" style="font-size:10.5px">عملیات حساس در پنل X28 با ثبت Audit و بکاپ پیکربندی اجرا می‌شوند.</div></div>' +
        '  </div>' +
        '</section>' +
        '</div>';

      X28.icons.mount(root);

      let pending = null;
      let pendingMode = null;
      let currentMode = 'auto';
      const grid = root.querySelector('#band-grid');
      const applyBtn = root.querySelector('#band-apply');

      grid.innerHTML = BAND_CHOICES.map((b) => {
        const info = F.bandInfo(b);
        return '<button class="band-btn" data-band="' + b + '">' + b + '<small>' + (info.mhz || '') + '</small></button>';
      }).join('');

      function paintGrid(current, lock) {
        grid.querySelectorAll('[data-band]').forEach((btn) => {
          const b = btn.getAttribute('data-band');
          const isCurrent = b === current;
          const isPending = pending === b;
          btn.classList.toggle('active', isPending || (!pending && b === lock && lock !== 'auto'));
          btn.classList.toggle('current', isCurrent);
        });
        applyBtn.disabled = !pending;
        const badge = root.querySelector('#band-pending-badge');
        if (pending) {
          badge.className = 'badge warn';
          badge.textContent = 'در انتظار اعمال: ' + pending;
        } else {
          badge.className = 'badge neutral';
          badge.textContent = lock && lock !== 'auto' ? 'قفل: ' + lock : 'خودکار';
        }
      }

      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-band]');
        if (!btn) return;
        const b = btn.getAttribute('data-band');
        pending = pending === b ? null : b;
        U.haptic('light');
        paintGrid(S.state.live.band, S.state.live.bandLock || 'auto');
      });

      function bandCandidates() {
        return ['band_lock', 'lock_band', 'bandlock', 'set_band', 'band'];
      }
      function unlockCandidates() {
        return ['band_unlock', 'unlock_band', 'band_auto', 'band_auto_select', 'auto_band'];
      }
      function modeCandidates() {
        return ['network_mode', 'set_network_mode', 'net_mode', 'set_mode'];
      }
      function cellCandidates() {
        return ['cell_lock', 'lock_cell', 'celllock'];
      }

      async function applyBand(band) {
        const confirmed = await ui.confirm({
          title: 'قفل باند ' + band + '؟',
          text: 'مودم تا زمان برداشتن قفل، فقط روی این باند کار می‌کند. در صورت ضعیف‌بودن سیگنال این باند، اتصال ممکن است قطع شود.',
          tone: 'warn', icon: 'lock', confirmText: 'قفل کن'
        });
        if (!confirmed) return;
        const action = S.state.conn.mode === 'device' ? W.resolveAction(bandCandidates()) : null;
        const params = {};
        if (action && action.params && action.params.length) {
          const key = (action.params.find((p) => /band/i.test(p.key + p.label)) || action.params[0]).key;
          params[key] = band;
        } else {
          params.band = band;
        }
        const res = await S.runAction(action ? action.name : 'band_lock', params, { label: 'قفل باند ' + band });
        ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'درخواست ارسال شد', res && res.ok ? 'ok' : 'err', 3800);
        if (res && res.ok) {
          S.state.live.bandLock = band;
          const engine = S.demoEngine();
          if (engine && S.state.conn.mode === 'demo') engine.setBand(band);
          pending = null;
          paintGrid(S.state.live.band, S.state.live.bandLock);
          S.notify();
        }
      }

      applyBtn.addEventListener('click', () => { if (pending) applyBand(pending); });

      root.querySelector('#band-auto').addEventListener('click', async () => {
        const action = S.state.conn.mode === 'device' ? W.resolveAction(unlockCandidates()) : null;
        const res = await S.runAction(action ? action.name : 'band_unlock', {}, { label: 'آزادکردن باند' });
        ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'درخواست ارسال شد', res && res.ok ? 'ok' : 'err', 3600);
        if (res && res.ok) {
          S.state.live.bandLock = 'auto';
          pending = null;
          paintGrid(S.state.live.band, 'auto');
          S.notify();
        }
      });

      root.querySelectorAll('#netmode [data-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          pendingMode = btn.getAttribute('data-mode');
          root.querySelectorAll('#netmode [data-mode]').forEach((b) => b.classList.toggle('active', b === btn));
        });
      });

      root.querySelector('#netmode-apply').addEventListener('click', async () => {
        const mode = pendingMode || currentMode;
        const action = S.state.conn.mode === 'device' ? W.resolveAction(modeCandidates()) : null;
        const res = await S.runAction(action ? action.name : 'network_mode', { mode }, { label: 'حالت شبکه ' + mode });
        ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'درخواست ارسال شد', res && res.ok ? 'ok' : 'err', 3600);
        if (res && res.ok) {
          S.state.live.networkMode = mode;
          pendingMode = null;
          S.notify();
        }
      });

      const cellSwitch = root.querySelector('#cell-lock');
      cellSwitch.addEventListener('click', async () => {
        const next = !cellSwitch.classList.contains('on');
        const ok = await ui.confirm({
          title: next ? 'قفل سلول فعال شود؟' : 'قفل سلول برداشته شود؟',
          text: next ? 'مودم به سلول فعلی (PCI) قفل می‌شود. اگر این سلول در دسترس نباشد، اتصال برقرار نمی‌شود.' : 'انتخاب سلول دوباره به شبکه سپرده می‌شود.',
          tone: next ? 'warn' : 'info', icon: 'mapPin', confirmText: 'تأیید'
        });
        if (!ok) return;
        const action = S.state.conn.mode === 'device' ? W.resolveAction(cellCandidates()) : null;
        const res = await S.runAction(action ? action.name : 'cell_lock', { on: next, pci: S.state.live.pci }, { label: 'قفل سلول' });
        ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'درخواست ارسال شد', res && res.ok ? 'ok' : 'err', 3600);
        if (res && res.ok) {
          S.state.live.cellLock = next;
          S.notify();
        }
      });

      function update(state) {
        const l = state.live;
        const info = F.bandInfo(l.band);
        root.querySelector('#band-title').textContent = info.mhz ? info.kind + ' · ' + info.mhz + ' MHz' + (l.network ? ' · ' + F.networkLabel(l.network) : '') : 'در حال خواندن…';
        root.querySelector('#band-main').textContent = info.band || '—';
        root.querySelector('#band-main-unit').textContent = info.kind !== '—' ? info.kind : '';
        root.querySelector('#band-pci').textContent = l.pci !== null && l.pci !== undefined ? F.num(l.pci) : '—';
        root.querySelector('#band-arfcn').textContent = l.earfcn !== null && l.earfcn !== undefined ? F.num(l.earfcn) : '—';
        root.querySelector('#band-rsrp').textContent = l.rsrp !== null && l.rsrp !== undefined ? F.fixed(l.rsrp, 0) + ' dBm' : '—';
        root.querySelector('#band-sinr').textContent = l.sinr !== null && l.sinr !== undefined ? F.fixed(l.sinr, 1) : '—';
        const q = F.rsrp(l.rsrp);
        root.querySelector('#band-bars').innerHTML = W.sigbars(q.level, q.tone);

        const lock = l.bandLock || 'auto';
        const pill = root.querySelector('#band-lock-pill');
        pill.className = 'status ' + (lock === 'auto' ? 'ok' : 'warn');
        pill.querySelector('.txt').textContent = lock === 'auto' ? 'انتخاب خودکار' : 'قفل: ' + lock;

        paintGrid(l.band, lock);

        currentMode = l.networkMode || 'auto';
        root.querySelector('#netmode-now').textContent = 'حالت فعلی: ' + (currentMode === 'auto' ? 'خودکار' : F.networkLabel(currentMode));
        if (!pendingMode) {
          root.querySelectorAll('#netmode [data-mode]').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-mode') === (currentMode === '5g' ? '5g' : currentMode === '4g' ? '4g' : 'auto'));
          });
        }

        cellSwitch.classList.toggle('on', !!l.cellLock);
        cellSwitch.setAttribute('aria-checked', String(!!l.cellLock));
      }

      update(S.state);
      return { update };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
