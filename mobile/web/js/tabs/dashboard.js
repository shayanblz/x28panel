/* X28 Mobile — tab 1: live dashboard */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  X28.tabs.register('dashboard', {
    label: 'داشبورد',
    icon: 'dashboard',
    mount(root) {
      root.innerHTML = ui.pageHead('داشبورد', 'وضعیت زندهٔ مودم و شبکه', '<button class="icon-btn" id="dash-speed" style="background:var(--brand-soft);border-color:var(--brand-line);color:var(--brand)" aria-label="آزمون سرعت">' + I('speed', 20) + '</button>') +
        '<div class="stack">' +
        '<section class="hero" id="hero">' +
        '  <div class="hero-top">' +
        '    <div><div class="hero-label">تأخیر اتصال به شبکه</div>' +
        '    <div class="hero-title"><span id="hero-op">—</span><span class="dot-sep"></span><span id="hero-net">—</span></div></div>' +
        '    <span class="status demo" id="hero-status"><span class="dot"></span><span class="txt">حالت نمایشی</span></span>' +
        '  </div>' +
        '  <div class="hero-metric">' +
        '    <div><span class="hero-value num" id="hero-rtt">—</span><span class="hero-unit" style="margin-inline-start:6px">ms</span></div>' +
        '    <canvas class="hero-spark" id="hero-spark" aria-hidden="true"></canvas>' +
        '  </div>' +
        '  <div class="hero-foot">' +
        '    <span class="hero-pill">' + I('layers', 13) + ' باند <b id="hero-band">—</b></span>' +
        '    <span class="hero-pill">' + I('signal', 13) + ' RSRP <b id="hero-rsrp">—</b></span>' +
        '    <span class="hero-pill">' + I('users', 13) + ' کلاینت <b id="hero-clients">—</b></span>' +
        '    <span class="hero-pill" id="hero-up-pill">' + I('clock', 13) + ' آپ‌تایم <b id="hero-uptime">—</b></span>' +
        '  </div>' +
        '</section>' +

        '<div id="dash-alert"></div>' +

        '<div class="grid2">' +
        W.kpiCard('kpi-rsrp', 'signal', 'قدرت سیگنال', 'dBm', '', '<span id="kpi-rsrp-level" class="badge ok">—</span>', '<div id="kpi-rsrp-foot" class="kpi-foot">—</div>') +
        W.kpiCard('kpi-sinr', 'activity', 'کیفیت سیگنال', 'dB', '', '<span id="kpi-sinr-level" class="badge ok">—</span>', '<div class="qbar" style="margin-top:6px"><i id="kpi-sinr-bar" style="width:0%"></i></div>') +
        W.kpiCard('kpi-down', 'download', 'سرعت دریافت', 'Mbps', '', '<span class="badge info" id="kpi-up">↑ —</span>', '<div class="kpi-foot" id="kpi-total">—</div>') +
        W.kpiCard('kpi-clients', 'users', 'کلاینت‌های متصل', '', '', '<span class="badge violet" id="kpi-clients-badge">—</span>', '<div class="kpi-foot" id="kpi-clients-foot">—</div>') +
        '</div>' +

        '<section class="card chart-card">' +
        '  <div class="chart-head"><div><div class="chart-title">ترافیک زنده</div><div class="tiny muted">دریافت و ارسال مودم</div></div>' +
        '  <div class="chart-legend"><span><i style="background:var(--brand)"></i>دریافت</span><span><i style="background:var(--sky)"></i>ارسال</span></div></div>' +
        '  <div class="row-between" style="margin-bottom:6px">' + W.rangeChips(S.state.settings.chartRange) + '</div>' +
        '  <div class="chart-wrap" style="height:152px"><canvas id="dash-chart"></canvas></div>' +
        '</section>' +

        '<div class="grid2" style="gap:9px">' +
        '  <button class="action-item" id="qa-speed"><span class="row-icon brand">' + I('speed', 19) + '</span><span class="grow"><span class="row-title" style="font-size:12.5px">آزمون سرعت</span><span class="row-sub" style="font-size:10px">دانلود و آپلود</span></span></button>' +
        '  <button class="action-item" id="qa-band"><span class="row-icon violet">' + I('layers', 19) + '</span><span class="grow"><span class="row-title" style="font-size:12.5px">قفل باند</span><span class="row-sub" style="font-size:10px">پروفایل سلول</span></span></button>' +
        '  <button class="action-item" id="qa-events"><span class="row-icon amber">' + I('bell', 19) + '</span><span class="grow"><span class="row-title" style="font-size:12.5px">رویدادها</span><span class="row-sub" style="font-size:10px">لاگ زنده</span></span></button>' +
        '  <button class="action-item" id="qa-clients"><span class="row-icon sky">' + I('users', 19) + '</span><span class="grow"><span class="row-title" style="font-size:12.5px">کلاینت‌ها</span><span class="row-sub" style="font-size:10px">دستگاه‌های متصل</span></span></button>' +
        '</div>' +

        '<section>' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>آخرین رویدادها</div>' +
        '  <button class="sec-link" id="dash-all-events">همه <span data-icon="chevronLeft"></span></button></div>' +
        '  <div class="card list" id="dash-events" style="padding:2px 4px"></div>' +
        '</section>' +
        '</div>';

      X28.icons.mount(root);

      /* hero sparkline */
      let spark = X28.charts.sparkline(root.querySelector('#hero-spark'), [], { color: 'var(--brand)', fill: false, width: 1.6 });

      /* traffic chart */
      const chart = X28.charts.line(root.querySelector('#dash-chart'), {
        height: 152,
        series: [
          { key: 'rx', label: 'دریافت', color: 'var(--brand)' },
          { key: 'tx', label: 'ارسال', color: 'var(--sky)' }
        ],
        fmtY: (v) => F.fixed(v, v >= 10 ? 0 : 1),
        tooltip: (v) => F.fixed(v, 1) + ' Mbps'
      });

      function chartData(range) {
        const data = S.rangeSeries(range || S.state.settings.chartRange, ['rx', 'tx']);
        const mb = (arr) => arr.map((v) => (v === null ? null : v / 1e6));
        return { t: data.t, series: { rx: mb(data.rx), tx: mb(data.tx) } };
      }

      let lastChartPaint = 0;
      function updateChart(range, force) {
        if (!force && Date.now() - lastChartPaint < 4500) return;
        lastChartPaint = Date.now();
        const d = chartData(range);
        chart.setData(d.t, d.series);
      }

      W.bindRange(root, (r) => updateChart(r, true));

      const openSpeed = () => W.speedTestSheet();
      root.querySelector('#dash-speed').addEventListener('click', openSpeed);
      root.querySelector('#qa-speed').addEventListener('click', openSpeed);
      root.querySelector('#qa-band').addEventListener('click', () => ui.activate('band'));
      root.querySelector('#qa-events').addEventListener('click', () => ui.activate('events'));
      root.querySelector('#qa-clients').addEventListener('click', () => ui.activate('clients'));
      root.querySelector('#dash-all-events').addEventListener('click', () => ui.activate('events'));
      root.querySelector('#hero-status').addEventListener('click', () => {
        if (S.state.conn.mode === 'device') ui.activate('settings');
        else ui.toast('حالت نمایشی فعال است — برای اتصال واقعی به تنظیمات بروید', 'info', 3400);
      });

      U.on(root.querySelector('#dash-events'), 'click', '[data-event]', (e, el) => {
        const ev = S.state.events.find((x) => x.id === el.getAttribute('data-event'));
        if (!ev) return;
        ui.sheet({ title: 'جزئیات رویداد', sub: U.relTime(ev.ts), icon: 'bell', body: W.eventDetail(ev) });
      });

      let lastEventsKey = '';

      function renderEvents() {
        const host = root.querySelector('#dash-events');
        const list = S.state.events.slice(0, 4);
        const key = list.map((e) => e.id).join('|');
        if (key === lastEventsKey) return;
        lastEventsKey = key;
        host.innerHTML = list.length
          ? list.map((e) => W.eventRow(e)).join('')
          : ui.empty({ icon: 'bell', title: 'رویدادی ثبت نشده', sub: 'با ادامهٔ پایش، رویدادهای شبکه اینجا نمایش داده می‌شوند.' });
      }

      function update(state) {
        const l = state.live;
        const online = l.online !== false;
        const demo = state.conn.mode === 'demo';
        const heroStatus = root.querySelector('#hero-status');
        const tone = !online ? 'err' : demo ? 'demo' : 'ok';
        heroStatus.className = 'status ' + tone;
        heroStatus.querySelector('.txt').textContent = !online ? 'قطع ارتباط' : demo ? 'حالت نمایشی' : 'متصل';
        root.querySelector('#hero-op').textContent = F.operatorName(l.operator) || 'X28';
        root.querySelector('#hero-net').textContent = F.networkLabel(l.network) || '—';
        root.querySelector('#hero-rtt').textContent = online && l.latency !== null ? F.num(l.latency) : '—';
        root.querySelector('#hero-band').textContent = l.band ? F.bandInfo(l.band).band : '—';
        root.querySelector('#hero-rsrp').textContent = l.rsrp !== null && l.rsrp !== undefined ? F.fixed(l.rsrp, 0) + ' dBm' : '—';
        root.querySelector('#hero-clients').textContent = F.num((l.clients || []).filter((c) => c.online).length);
        root.querySelector('#hero-uptime').textContent = l.uptime ? U.formatDurationShort(l.uptime) : '—';

        /* kpi: rsrp */
        const rsrpQ = F.rsrp(l.rsrp);
        root.querySelector('#kpi-rsrp-level').className = 'badge ' + (rsrpQ.tone === 'ok' ? 'ok' : rsrpQ.tone === 'warn' ? 'warn' : 'err');
        root.querySelector('#kpi-rsrp-level').textContent = rsrpQ.label;
        root.querySelector('#kpi-rsrp-value').textContent = l.rsrp !== null && l.rsrp !== undefined ? F.fixed(l.rsrp, 0) : '—';
        root.querySelector('#kpi-rsrp-foot').innerHTML = W.sigbars(rsrpQ.level, rsrpQ.tone) + '<span>' + U.esc(rsrpQ.label) + '</span>';

        /* kpi: sinr */
        const sinrQ = F.sinr(l.sinr);
        root.querySelector('#kpi-sinr-level').className = 'badge ' + (sinrQ.tone === 'ok' ? 'ok' : sinrQ.tone === 'warn' ? 'warn' : 'err');
        root.querySelector('#kpi-sinr-level').textContent = sinrQ.label;
        root.querySelector('#kpi-sinr-value').textContent = l.sinr !== null && l.sinr !== undefined ? F.fixed(l.sinr, 1) : '—';
        const bar = root.querySelector('#kpi-sinr-bar');
        bar.style.width = sinrQ.pct + '%';
        bar.parentElement.className = 'qbar ' + (sinrQ.tone === 'ok' ? '' : sinrQ.tone);

        /* kpi: download */
        const down = F.bpsValue(l.rxBps);
        root.querySelector('#kpi-down-value').textContent = F.fixed(down.value, down.value >= 100 ? 0 : 1);
        root.querySelector('#kpi-down-unit').textContent = down.unit;
        const up = F.bpsValue(l.txBps);
        root.querySelector('#kpi-up').textContent = '↑ ' + F.fixed(up.value, up.value >= 100 ? 0 : 1) + ' ' + up.unit;
        root.querySelector('#kpi-total').textContent = 'کل مصرف: ' + F.bytes((l.totalRx || 0) + (l.totalTx || 0));

        /* kpi: clients */
        const clients = l.clients || [];
        const onlineCount = clients.filter((c) => c.online).length;
        root.querySelector('#kpi-clients-value').textContent = F.num(onlineCount);
        root.querySelector('#kpi-clients-badge').textContent = clients.length ? F.num(clients.length) + ' کل' : '—';
        root.querySelector('#kpi-clients-foot').textContent = clients.length
          ? (onlineCount === clients.length ? 'همهٔ دستگاه‌ها آنلاین هستند' : F.num(clients.length - onlineCount) + ' دستگاه آفلاین')
          : 'اطلاعات دستگاه‌ها در دسترس نیست';

        /* offline alert */
        const alertHost = root.querySelector('#dash-alert');
        if (!online) {
          alertHost.innerHTML = '<div class="alert err">' + I('alert', 16) +
            '<span><b>مودم پاسخ نمی‌دهد.</b> آخرین دادهٔ ثبت‌شده نمایش داده می‌شود. ' +
            (state.conn.mode === 'device' ? 'اتصال پنل را بررسی کنید.' : 'می‌توانید شبیه‌سازی قطعی را از تنظیمات خاموش کنید.') +
            '</span></div>';
        } else alertHost.innerHTML = '';

        /* sparkline */
        const rttArr = state.series.rtt.slice(-48).map((v) => (v === null ? null : v));
        spark.setData(rttArr);

        updateChart();
        renderEvents();
      }

      update(S.state);
      return {
        update,
        destroy() { chart.destroy(); }
      };
    }
  });

  /* kpi card builder */
  X28.widgets.kpiCard = function (id, icon, label, unit, unitInline, badgeHtml, footHtml) {
    return '<div class="kpi">' +
      '<div class="kpi-head"><span>' + U.esc(label) + '</span><span class="kpi-icon">' + I(icon, 15) + '</span></div>' +
      '<div class="kpi-value num"><span id="' + id + '-value">—</span>' + (unit ? '<small id="' + id + '-unit">' + U.esc(unit) + '</small>' : '') + '</div>' +
      '<div class="row-between" style="margin-top:6px">' + badgeHtml + '</div>' +
      (footHtml ? footHtml : '') +
      '</div>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
