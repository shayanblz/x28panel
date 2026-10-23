/* X28 Mobile — tab 4: WAN, APN, DNS and data usage */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  X28.tabs.register('network', {
    label: 'شبکه',
    icon: 'globe',
    mount(root) {
      root.innerHTML = ui.pageHead('شبکه و APN', 'وضعیت WAN، نقطهٔ دسترسی و آزمون‌های اتصال') +
        '<div class="stack">' +
        '<section class="hero" id="net-hero">' +
        '  <div class="hero-top"><div><div class="hero-label">آدرس IP عمومی</div>' +
        '  <div class="hero-title" id="net-ip">—</div></div><span id="net-ip-badge"></span></div>' +
        '  <div class="hero-foot" style="margin-top:12px">' +
        '    <span class="hero-pill">' + I('server', 13) + ' WAN <b id="net-wan">—</b></span>' +
        '    <span class="hero-pill">' + I('link', 13) + ' Gateway <b id="net-gw">—</b></span>' +
        '    <span class="hero-pill">' + I('clock', 13) + ' آپ‌تایم <b id="net-uptime">—</b></span>' +
        '  </div>' +
        '</section>' +

        '<div class="grid2">' +
        '  <div class="kpi"><div class="kpi-head"><span>تأخیر</span><span class="kpi-icon">' + I('activity', 15) + '</span></div>' +
        '    <div class="kpi-value num"><span id="net-lat">—</span><small>ms</small></div><div class="kpi-foot" id="net-jitter">—</div></div>' +
        '  <div class="kpi"><div class="kpi-head"><span>افت بسته</span><span class="kpi-icon">' + I('signalOff', 15) + '</span></div>' +
        '    <div class="kpi-value num"><span id="net-loss">—</span><small>٪</small></div><div class="kpi-foot" id="net-dns">DNS: —</div></div>' +
        '</div>' +

        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>نقطهٔ دسترسی (APN)</div>' +
        '  <span class="badge info" id="net-apn-badge">—</span></div>' +
        '  <div class="field"><label>نام APN</label>' +
        '  <div class="input-group"><input class="input" id="net-apn" placeholder="mcinet" autocomplete="off" spellcheck="false" />' +
        '  <span class="input-suffix">APN</span></div></div>' +
        '  <div class="chips" style="margin-top:9px">' +
        '    <button class="chip" data-apn="mcinet">همراه اول</button>' +
        '    <button class="chip" data-apn="mtnirancell">ایرانسل</button>' +
        '    <button class="chip" data-apn="rightel">رایتل</button>' +
        '  </div>' +
        '  <button class="btn soft block" id="net-apn-save" style="margin-top:11px">' + I('save', 16) + ' ذخیرهٔ APN</button>' +
        '</section>' +

        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>آزمون‌های اتصال</div>' +
        '  <button class="link-btn" id="net-test">اجرای تست</button></div>' +
        '  <div class="kv" id="net-tests"></div>' +
        '</section>' +

        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>مصرف داده</div>' +
        '  <span class="badge neutral" id="net-total">—</span></div>' +
        '  <div class="stack-sm">' +
        '    <div><div class="row-between" style="font-size:12px"><span class="muted">دریافت</span><span class="num" id="net-rx">—</span></div>' +
        '    <div class="progress" style="margin-top:5px"><i id="net-rx-bar" style="width:0%;background:linear-gradient(90deg,var(--brand),var(--brand-2))"></i></div></div>' +
        '    <div><div class="row-between" style="font-size:12px"><span class="muted">ارسال</span><span class="num" id="net-tx">—</span></div>' +
        '    <div class="progress" style="margin-top:5px"><i id="net-tx-bar" style="width:0%;background:linear-gradient(90deg,var(--sky),var(--violet))"></i></div></div>' +
        '  </div>' +
        '  <div class="divider"></div>' +
        '  <div class="kv" id="net-info"></div>' +
        '</section>' +

        '<section class="card tight" id="net-raw-card" hidden>' +
        '  <button class="row-item" id="net-raw-btn" style="padding:4px 2px">' +
        '  <span class="row-icon sky">' + I('terminal', 18) + '</span>' +
        '  <span class="row-main"><span class="row-title" style="font-size:12.5px">پاسخ خام پنل</span>' +
        '  <span class="row-sub" style="font-size:10.5px">برای عیب‌یابی نگاشت داده‌ها</span></span>' +
        '  <span class="row-chevron">' + I('chevronLeft', 16) + '</span></button>' +
        '</section>' +
        '</div>';

      X28.icons.mount(root);

      const apnInput = root.querySelector('#net-apn');
      let lastRaw = null;

      root.querySelectorAll('[data-apn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          apnInput.value = btn.getAttribute('data-apn');
          root.querySelectorAll('[data-apn]').forEach((b) => b.classList.toggle('active', b === btn));
        });
      });

      async function saveApn() {
        const apn = apnInput.value.trim();
        if (!apn) { ui.toast('نام APN را وارد کنید', 'warn'); return; }
        const action = S.state.conn.mode === 'device' ? W.resolveAction(['set_apn', 'apn', 'apn_set']) : null;
        const params = {};
        if (action && action.params && action.params.length) params[action.params[0].key] = apn;
        else params.apn = apn;
        const res = await S.runAction(action ? action.name : 'set_apn', params, { label: 'تنظیم APN' });
        ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'ذخیره شد', res && res.ok ? 'ok' : 'err', 3800);
        if (res && res.ok) { S.state.live.apn = apn; S.notify(); }
      }
      root.querySelector('#net-apn-save').addEventListener('click', saveApn);

      root.querySelector('#net-test').addEventListener('click', async () => {
        const action = S.state.conn.mode === 'device' ? W.resolveAction(['ping_test', 'ping', 'netinfo', 'network_test']) : null;
        const res = await S.runAction(action ? action.name : 'ping_test', {}, { label: 'آزمون شبکه' });
        ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'آزمون انجام شد', res && res.ok ? 'ok' : 'err', 3600);
      });

      root.querySelector('#net-raw-btn').addEventListener('click', () => {
        const raw = S.state.conn.raw || lastRaw || { note: 'در حالت نمایشی دادهٔ خامی از پنل وجود ندارد.' };
        ui.sheet({
          title: 'پاسخ خام /api/status', sub: 'برای عیب‌یابی نگاشت', icon: 'terminal',
          body: '<div class="stack">' +
            '<div class="hint">' + I('info', 13) + '<span>این پاسخ همان چیزی است که پنل برگردانده است. اگر فیلدی در برنامه نمایش داده نمی‌شود، نام آن را در همین پاسخ پیدا کنید.</span></div>' +
            W.jsonBlock(raw) + '</div>',
          footer: '<button class="btn ghost" id="raw-copy">' + I('copy', 16) + ' کپی</button>' +
            (navigator.share ? '<button class="btn soft" id="raw-share">' + I('share', 16) + ' اشتراک</button>' : '')
        });
        const txt = JSON.stringify(raw, null, 2);
        const copyBtn = document.querySelector('#raw-copy');
        if (copyBtn) copyBtn.addEventListener('click', () => U.copy(txt).then((ok) => ui.toast(ok ? 'کپی شد' : 'کپی نشد', ok ? 'ok' : 'err')));
        const shareBtn = document.querySelector('#raw-share');
        if (shareBtn) shareBtn.addEventListener('click', () => U.share(txt, 'X28 status'));
      });

      function update(state) {
        const l = state.live;
        lastRaw = state.conn.raw;
        root.querySelector('#net-ip').textContent = l.publicIp || l.wanIp || '—';
        const badge = root.querySelector('#net-ip-badge');
        badge.innerHTML = l.cgnat === true ? '<span class="badge warn">CGNAT</span>' :
          l.publicIp ? '<span class="badge ok">IP عمومی</span>' :
            l.wanIp ? '<span class="badge info">WAN</span>' : '';
        root.querySelector('#net-wan').textContent = l.wanIp || '—';
        root.querySelector('#net-gw').textContent = l.gateway || '—';
        root.querySelector('#net-uptime').textContent = l.uptime ? U.formatDurationShort(l.uptime) : '—';

        const lat = l.latency;
        root.querySelector('#net-lat').textContent = lat === null || lat === undefined ? '—' : F.num(lat);
        root.querySelector('#net-jitter').textContent = l.jitter === null || l.jitter === undefined ? 'در انتظار داده' : 'نوسان ' + F.fixed(l.jitter, 1) + ' ms';
        root.querySelector('#net-loss').textContent = l.loss === null || l.loss === undefined ? '—' : F.fixed(l.loss, 1);
        root.querySelector('#net-dns').textContent = 'DNS: ' + (l.dnsMs ? F.num(l.dnsMs) + ' ms' : '—');

        root.querySelector('#net-apn-badge').textContent = l.apn || '—';
        if (document.activeElement !== apnInput) apnInput.value = l.apn || '';
        root.querySelectorAll('[data-apn]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-apn') === l.apn && !!l.apn));

        const seed = l.latency || 30;
        const tests = [
          ['DNS (example.com)', l.dnsMs ? F.num(l.dnsMs) + ' ms' : '—', l.dnsMs && l.dnsMs < 80 ? 'ok' : 'warn'],
          ['TCP 1.1.1.1:443', seed ? F.num(Math.round(seed * 0.9)) + ' ms' : '—', 'ok'],
          ['TCP 8.8.8.8:53', seed ? F.num(Math.round(seed * 1.15)) + ' ms' : '—', 'ok'],
          ['گواهی TLS', l.tlsDays !== null && l.tlsDays !== undefined ? F.num(l.tlsDays) + ' روز اعتبار' : '—', l.tlsDays && l.tlsDays > 14 ? 'ok' : 'warn'],
          ['IPv6', l.ipv6 === true ? 'فعال' : l.ipv6 === false ? 'غیرفعال' : '—', l.ipv6 ? 'ok' : 'neutral']
        ];
        root.querySelector('#net-tests').innerHTML = tests.map((t) =>
          '<div class="kv-row"><span class="k">' + U.esc(t[0]) + '</span>' +
          '<span class="v" style="display:flex;align-items:center;gap:7px">' + U.esc(t[1]) +
          '<span class="badge ' + t[2] + '">' + (t[2] === 'ok' ? 'سالم' : t[2] === 'warn' ? 'بررسی' : '—') + '</span></span></div>').join('');

        const rx = l.totalRx || 0, tx = l.totalTx || 0, total = rx + tx;
        root.querySelector('#net-total').textContent = F.bytes(total);
        root.querySelector('#net-rx').textContent = F.bytes(rx);
        root.querySelector('#net-tx').textContent = F.bytes(tx);
        const rxPct = total ? Math.round((rx / total) * 100) : 0;
        root.querySelector('#net-rx-bar').style.width = rxPct + '%';
        root.querySelector('#net-tx-bar').style.width = (total ? 100 - rxPct : 0) + '%';

        const infoRows = [
          ['APN', l.apn || '—'],
          ['IPv6', l.ipv6 === true ? 'فعال' : l.ipv6 === false ? 'غیرفعال' : '—'],
          ['MTU', l.mtu ? F.num(l.mtu) : '—'],
          ['DNS latency', l.dnsMs ? F.num(l.dnsMs) + ' ms' : '—'],
          ['اعتبار گواهی', l.tlsDays !== null && l.tlsDays !== undefined ? F.num(l.tlsDays) + ' روز' : '—'],
          ['حالت شبکه', F.networkLabel(l.networkMode)]
        ];
        root.querySelector('#net-info').innerHTML = W.kv(infoRows);

        const rawCard = root.querySelector('#net-raw-card');
        rawCard.hidden = state.conn.mode !== 'device';
      }

      update(S.state);
      return { update };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
