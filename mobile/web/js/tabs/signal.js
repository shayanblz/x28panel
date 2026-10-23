/* X28 Mobile — tab 2: signal & quality */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  X28.tabs.register('signal', {
    label: 'سیگنال',
    icon: 'signal',
    mount(root) {
      root.innerHTML = ui.pageHead('سیگنال و کیفیت', 'RSRP · SINR · RSRQ به‌صورت زنده') +
        '<div class="stack">' +
        '<section class="card">' +
        '  <div class="gauge-wrap">' +
        '    <div class="gauge" id="sig-gauge"></div>' +
        '    <div class="gauge-side">' +
        '      <div><div class="metric-line"><span class="k">RSRQ</span><span class="v" id="sig-rsrq">—</span></div><div class="qbar" id="sig-rsrq-bar"><i style="width:0%"></i></div></div>' +
        '      <div><div class="metric-line"><span class="k">SINR</span><span class="v" id="sig-sinr">—</span></div><div class="qbar" id="sig-sinr-bar"><i style="width:0%"></i></div></div>' +
        '      <div><div class="metric-line"><span class="k">آنتن</span><span class="v" id="sig-bars-label">—</span></div><div id="sig-bars" style="margin-top:4px">' + W.sigbars(0, '') + '</div></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="divider"></div>' +
        '  <div class="row-between">' +
        '    <div><div class="tiny muted">کیفیت کلی اتصال</div><div class="row-title" id="sig-quality" style="font-size:15px">—</div></div>' +
        '    <div class="pill-row" id="sig-pills"></div>' +
        '  </div>' +
        '</section>' +

        '<section class="card chart-card">' +
        '  <div class="chart-head"><div><div class="chart-title">قدرت سیگنال (RSRP)</div><div class="tiny muted">محدودهٔ -۱۲۰ تا -۶۰ dBm</div></div>' +
        '  <div class="chart-legend"><span><i style="background:var(--brand)"></i>متوسط</span></div></div>' +
        '  <div class="row-between" style="margin-bottom:6px">' + W.rangeChips(S.state.settings.chartRange) + '</div>' +
        '  <div class="chart-wrap" style="height:140px"><canvas id="sig-chart-rsrp"></canvas></div>' +
        '</section>' +

        '<section class="card chart-card">' +
        '  <div class="chart-head"><div class="chart-title">کیفیت (SINR / RSRQ)</div>' +
        '  <div class="chart-legend"><span><i style="background:var(--violet)"></i>SINR</span><span><i style="background:var(--amber)"></i>RSRQ</span></div></div>' +
        '  <div class="chart-wrap" style="height:132px"><canvas id="sig-chart-sinr"></canvas></div>' +
        '</section>' +

        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>اطلاعات سلول</div><span class="badge outline" id="sig-serv">—</span></div>' +
        '  <div class="kv" id="sig-cell"></div>' +
        '</section>' +

        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>پیشنهاد بهبود</div></div>' +
        '  <div id="sig-advice" class="stack-sm"></div>' +
        '</section>' +
        '</div>';

      X28.icons.mount(root);

      /* gauge */
      const gaugeHost = root.querySelector('#sig-gauge');
      const gauge = X28.charts.ring(gaugeHost, {
        size: 132, stroke: 10,
        colorFrom: '#fb7185', colorMid: '#fbbf24', colorTo: '#2ee6ae'
      });
      gaugeHost.insertAdjacentHTML('beforeend',
        '<div class="gauge-center"><div class="gauge-value num"><span id="sig-rsrp">—</span></div>' +
        '<div class="gauge-label" id="sig-label">در حال خواندن…</div></div>');

      const chartRsrp = X28.charts.line(root.querySelector('#sig-chart-rsrp'), {
        height: 140, min: -120, max: -55,
        series: [{ key: 'rsrp', label: 'RSRP', color: 'var(--brand)' }],
        fmtY: (v) => F.fixed(v, 0),
        tooltip: (v) => F.fixed(v, 1) + ' dBm'
      });
      const chartQ = X28.charts.line(root.querySelector('#sig-chart-sinr'), {
        height: 132, min: -25, max: 32,
        series: [
          { key: 'sinr', label: 'SINR', color: 'var(--violet)' },
          { key: 'rsrq', label: 'RSRQ', color: 'var(--amber)' }
        ],
        fmtY: (v) => F.fixed(v, 0),
        tooltip: (v) => F.fixed(v, 1) + ' dB'
      });

      let lastChartPaint = 0;
      function redrawCharts(force) {
        if (!force && Date.now() - lastChartPaint < 4500) return;
        lastChartPaint = Date.now();
        const range = S.state.settings.chartRange;
        const d1 = S.rangeSeries(range, ['rsrp']);
        chartRsrp.setData(d1.t, { rsrp: d1.rsrp });
        const d2 = S.rangeSeries(range, ['sinr', 'rsrq']);
        chartQ.setData(d2.t, { sinr: d2.sinr, rsrq: d2.rsrq });
      }
      W.bindRange(root, () => redrawCharts(true));

      function advice(l) {
        const tips = [];
        if (l.online === false) {
          tips.push({ tone: 'err', icon: 'alert', title: 'اتصال قطع است', text: 'اطلاعات سیگنال تا زمان برقراری دوبارهٔ ارتباط، آخرین مقدار ثبت‌شده است.' });
        }
        const rsrp = l.rsrp, sinr = l.sinr, band = l.band;
        if (rsrp !== null && rsrp !== undefined) {
          if (rsrp < -105) tips.push({ tone: 'err', icon: 'signal', title: 'سیگنال ضعیف', text: 'مودم را نزدیک پنجره یا ارتفاع بالاتر ببرید؛ مانع‌های بتنی و فلزی سیگنال را به‌شدت کم می‌کنند.' });
          else if (rsrp < -95) tips.push({ tone: 'warn', icon: 'signal', title: 'سیگنال متوسط', text: 'جابه‌جایی چند متری یا چرخاندن مودم می‌تواند ۳ تا ۶ دسی‌بل بهبود بدهد.' });
          else tips.push({ tone: 'ok', icon: 'check', title: 'قدرت سیگنال مطلوب', text: 'RSRP در محدودهٔ سالم است؛ برای پایداری بیشتر، قفل باند را امتحان کنید.' });
        }
        if (sinr !== null && sinr !== undefined) {
          if (sinr < 5) tips.push({ tone: 'warn', icon: 'activity', title: 'نویز و تداخل بالا', text: 'SINR پایین است. باند شلوغ را از تب «باند» قفل کنید یا فاصلهٔ مودم از منابع تداخل را زیاد کنید.' });
          else if (sinr > 20) tips.push({ tone: 'ok', icon: 'sparkles', title: 'کیفیت سیگنال عالی', text: 'نسبت سیگنال به نویز بالاست؛ سرعت واقعی نزدیک به ظرفیت سلول خواهد بود.' });
        }
        if (band && /^(n78|n41)$/.test(band)) {
          tips.push({ tone: 'info', icon: 'tower', title: 'باند ۵G فعال', text: 'باند‌های فرکانس بالا سرعت زیاد اما برد کم دارند؛ نزدیک پنجره بهترین نتیجه را می‌دهد.' });
        } else if (band && /^(B8|B20|B28)$/.test(band)) {
          tips.push({ tone: 'info', icon: 'layers', title: 'باند پوشش (فرکانس پایین)', text: 'این باند پایداری خوبی دارد ولی سرعت کمتری می‌دهد. اگر سرعت مهم است، باند B3 یا ۵G را امتحان کنید.' });
        }
        if (l.temp !== null && l.temp !== undefined && l.temp > 58) {
          tips.push({ tone: 'warn', icon: 'thermometer', title: 'دمای مودم بالا', text: 'تهویهٔ مودم را بررسی کنید؛ دمای بالا باعث افت عملکرد و قطعی می‌شود.' });
        }
        if (!tips.length) {
          tips.push({ tone: 'info', icon: 'info', title: 'در انتظار داده', text: 'پس از دریافت اولین نمونهٔ سیگنال، پیشنهادها اینجا ظاهر می‌شوند.' });
        }
        return tips;
      }

      function renderAdvice(l) {
        const host = root.querySelector('#sig-advice');
        const tips = advice(l);
        const key = tips.map((t) => t.title).join('|');
        if (host.dataset.key === key) return;
        host.dataset.key = key;
        host.innerHTML = tips.map((t) =>
          '<div class="alert ' + (t.tone === 'err' ? 'err' : t.tone === 'warn' ? 'warn' : t.tone === 'ok' ? 'ok' : '') + '">' +
          I(t.icon, 16) + '<span><b>' + U.esc(t.title) + ':</b> ' + U.esc(t.text) + '</span></div>').join('');
      }

      function update(state) {
        const l = state.live;
        const q = F.rsrp(l.rsrp);
        const hasSignal = l.rsrp !== null && l.rsrp !== undefined;
        root.querySelector('#sig-rsrp').textContent = hasSignal ? F.fixed(l.rsrp, 0) : '—';
        root.querySelector('#sig-label').textContent = hasSignal ? q.label : 'نامشخص';
        gauge.set(hasSignal ? q.pct : 0);

        const rsrqQ = F.rsrq(l.rsrq);
        const sinrQ = F.sinr(l.sinr);
        root.querySelector('#sig-rsrq').textContent = l.rsrq !== null && l.rsrq !== undefined ? F.fixed(l.rsrq, 1) + ' dB' : '—';
        const rqBar = root.querySelector('#sig-rsrq-bar');
        rqBar.className = 'qbar ' + (rsrqQ.tone === 'ok' ? '' : rsrqQ.tone);
        rqBar.firstElementChild.style.width = rsrqQ.pct + '%';
        root.querySelector('#sig-sinr').textContent = l.sinr !== null && l.sinr !== undefined ? F.fixed(l.sinr, 1) + ' dB' : '—';
        const snrBar = root.querySelector('#sig-sinr-bar');
        snrBar.className = 'qbar ' + (sinrQ.tone === 'ok' ? '' : sinrQ.tone);
        snrBar.firstElementChild.style.width = sinrQ.pct + '%';

        root.querySelector('#sig-bars').innerHTML = W.sigbars(q.level, q.tone);
        root.querySelector('#sig-bars-label').textContent = hasSignal ? F.num(Math.max(1, q.level)) + ' از ۵' : '—';
        root.querySelector('#sig-quality').textContent = hasSignal ? q.label : 'در انتظار داده';
        root.querySelector('#sig-pills').innerHTML =
          '<span class="badge info">' + U.esc(F.networkLabel(l.network)) + '</span>' +
          (l.band ? '<span class="badge violet">' + U.esc(F.bandInfo(l.band).band) + '</span>' : '') +
          (l.temp !== null && l.temp !== undefined ? '<span class="badge neutral">' + I('thermometer', 11) + ' ' + F.temp(l.temp) + '</span>' : '');

        root.querySelector('#sig-serv').textContent = l.online === false ? 'قطع' : (F.networkLabel(l.network) || '—');
        const rows = [
          ['باند فعال', l.band ? F.bandLabel(l.band) : '—'],
          ['PCI', l.pci !== null && l.pci !== undefined ? F.num(l.pci) : '—'],
          ['EARFCN / NR-ARFCN', l.earfcn !== null && l.earfcn !== undefined ? F.num(l.earfcn) : '—'],
          ['Cell ID', l.cellId || '—'],
          ['اپراتور', F.operatorName(l.operator)],
          ['حالت شبکه', F.networkLabel(l.networkMode)],
          ['آپ‌تایم مودم', l.uptime ? U.formatDuration(l.uptime) : '—']
        ];
        root.querySelector('#sig-cell').innerHTML = W.kv(rows);

        redrawCharts();
        renderAdvice(l);
      }

      update(S.state);
      return { update, destroy() { chartRsrp.destroy(); chartQ.destroy(); } };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
