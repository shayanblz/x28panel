/* X28 Mobile — tab 5: Wi-Fi */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  const CHANNELS = {
    '2.4': [1, 3, 6, 9, 11, 13],
    '5': [36, 40, 44, 48, 52, 100, 116, 149, 157]
  };

  X28.tabs.register('wifi', {
    label: 'وای‌فای',
    icon: 'wifi',
    mount(root) {
      root.innerHTML = ui.pageHead('وای‌فای', 'شبکهٔ محلی، مهمان و اتصال سریع WPS') +
        '<div class="stack">' +
        '<section class="card" id="wifi-master">' +
        '  <div class="row" style="gap:12px">' +
        '    <span class="row-icon brand" id="wifi-master-icon" style="width:44px;height:44px">' + I('wifi', 22) + '</span>' +
        '    <div class="grow"><div class="row-title" style="font-size:15px" id="wifi-master-title">وای‌فای</div>' +
        '    <div class="row-sub" id="wifi-master-sub">—</div></div>' +
        '    <button class="switch" id="wifi-master-switch" role="switch" aria-checked="true"></button>' +
        '  </div>' +
        '</section>' +

        '<div id="wifi-body" class="stack">' +
        '  <section class="card">' +
        '    <div class="sec-head"><div class="sec-title"><span class="bar"></span>شبکهٔ اصلی</div>' +
        '    <span class="badge ok" id="wifi-sec-badge">—</span></div>' +
        '    <div class="kv" id="wifi-main-info"></div>' +
        '  </section>' +

        '  <section class="card">' +
        '    <div class="sec-head"><div class="sec-title"><span class="bar"></span>رادیوها</div></div>' +
        '    <div class="stack-sm" id="wifi-radios"></div>' +
        '  </section>' +

        '  <section class="card">' +
        '    <div class="row" style="gap:11px">' +
        '      <span class="row-icon violet">' + I('users', 19) + '</span>' +
        '      <div class="grow"><div class="row-title">شبکهٔ مهمان</div>' +
        '      <div class="row-sub" id="wifi-guest-sub">—</div></div>' +
        '      <button class="switch" id="wifi-guest" role="switch" aria-checked="false"></button>' +
        '    </div>' +
        '  </section>' +

        '  <section class="card">' +
        '    <div class="row" style="gap:11px">' +
        '      <span class="row-icon amber">' + I('key', 19) + '</span>' +
        '      <div class="grow"><div class="row-title">اتصال سریع (WPS)</div>' +
        '      <div class="row-sub" id="wifi-wps-sub">دکمهٔ WPS مودم را تا ۲ دقیقه فعال می‌کند</div></div>' +
        '      <button class="btn sm soft" id="wifi-wps">فعال</button>' +
        '    </div>' +
        '  </section>' +

        '  <section class="card">' +
        '    <div class="sec-head"><div class="sec-title"><span class="bar"></span>دستگاه‌های متصل</div>' +
        '    <button class="sec-link" id="wifi-clients-link">مشاهدهٔ همه <span data-icon="chevronLeft"></span></button></div>' +
        '    <div id="wifi-clients"></div>' +
        '  </section>' +
        '</div>' +

        '<div id="wifi-unavailable" hidden></div>' +
        '</div>';

      X28.icons.mount(root);

      const masterSwitch = root.querySelector('#wifi-master-switch');
      const guestSwitch = root.querySelector('#wifi-guest');
      const body = root.querySelector('#wifi-body');
      const unavailable = root.querySelector('#wifi-unavailable');

      async function setWifi(on) {
        const res = await S.runAction('wifi_onoff', { on }, { label: on ? 'روشن‌کردن وای‌فای' : 'خاموش‌کردن وای‌فای' });
        ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'وضعیت تغییر کرد', res && res.ok ? 'ok' : 'err', 3200);
        if (res && res.ok && S.state.live.wifi) {
          S.state.live.wifi.enabled = on;
          S.notify();
        }
      }

      masterSwitch.addEventListener('click', () => setWifi(!masterSwitch.classList.contains('on')));

      guestSwitch.addEventListener('click', async () => {
        const next = !guestSwitch.classList.contains('on');
        if (!S.state.live.wifi) return;
        const action = S.state.conn.mode === 'device' ? W.resolveAction(['wifi_guest', 'guest_wifi', 'guest']) : null;
        const res = await S.runAction(action ? action.name : 'wifi_guest', { on: next }, { label: 'شبکهٔ مهمان' });
        ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'تغییر کرد', res && res.ok ? 'ok' : 'err', 3200);
        if (res && res.ok) { S.state.live.wifi.guest.enabled = next; S.notify(); }
      });

      root.querySelector('#wifi-wps').addEventListener('click', async () => {
        const res = await S.runAction('wps_push', {}, { label: 'WPS' });
        ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'WPS فعال شد', res && res.ok ? 'ok' : 'err', 4200);
        if (res && res.ok && S.state.live.wifi) { S.state.live.wifi.wps = true; S.notify(); }
      });

      root.querySelector('#wifi-clients-link').addEventListener('click', () => ui.activate('clients'));

      function openChannelSheet(band, current) {
        const list = CHANNELS[band] || [];
        const bodyEl = U.el('div', { class: 'stack-sm' });
        bodyEl.innerHTML = list.map((ch) =>
          '<button class="row-item" data-ch="' + ch + '" style="border:1px solid ' + (ch === current ? 'var(--brand-line)' : 'var(--line)') + ';border-radius:13px;background:' + (ch === current ? 'var(--brand-soft)' : 'var(--card)') + '">' +
          '<span class="row-icon ' + (ch === current ? 'brand' : '') + '">' + I('wifi', 17) + '</span>' +
          '<span class="row-main"><span class="row-title" style="font-size:13px">کانال ' + F.num(ch) + '</span>' +
          '<span class="row-sub" style="font-size:10.5px">' + (band === '5' ? 'باند ۵ گیگاهرتز' : 'باند ۲.۴ گیگاهرتز') + '</span></span>' +
          (ch === current ? '<span class="badge ok">فعال</span>' : '<span class="row-chevron">' + I('chevronLeft', 15) + '</span>') +
          '</button>').join('');
        const sheet = ui.sheet({
          title: 'انتخاب کانال وای‌فای',
          sub: band === '5' ? 'کانال‌های ۵ گیگاهرتز' : 'کانال‌های ۲.۴ گیگاهرتز',
          icon: 'wifi',
          body: bodyEl
        });
        bodyEl.querySelectorAll('[data-ch]').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const ch = Number(btn.getAttribute('data-ch'));
            const action = S.state.conn.mode === 'device' ? W.resolveAction(['wifi_channel', 'channel']) : null;
            const params = action && action.params && action.params.length ? {} : { band, channel: ch };
            if (action && action.params && action.params.length) {
              action.params.forEach((p) => {
                if (/band|radio/i.test(p.key + p.label)) params[p.key] = band;
                else if (/chan/i.test(p.key + p.label)) params[p.key] = ch;
              });
            }
            const res = await S.runAction(action ? action.name : 'wifi_channel', params, { label: 'کانال وای‌فای' });
            ui.toast(res && (res.message || res.error) ? (res.message || res.error) : 'کانال تغییر کرد', res && res.ok ? 'ok' : 'err', 3200);
            if (res && res.ok) {
              if (band === '5') S.state.live.wifi.channel5 = ch; else S.state.live.wifi.channel24 = ch;
              S.notify();
            }
            sheet.close();
          });
        });
      }

      function update(state) {
        const l = state.live;
        const wifi = l.wifi;
        if (!wifi) {
          body.hidden = true;
          unavailable.hidden = false;
          unavailable.innerHTML = '<div class="stack">' +
            '<div class="card empty"><div class="empty-art">' + I('wifiOff', 32) + '</div>' +
            '<div class="empty-title">اطلاعات وای‌فای در دسترس نیست</div>' +
            '<div class="empty-sub">' + (state.conn.mode === 'demo'
              ? 'در حالت نمایشی این بخش باید فعال باشد؛ یک‌بار برنامه را دوباره باز کنید.'
              : 'پنل فعلی این اطلاعات را برنمی‌گرداند. در پنل X28 تب «وای‌فای» را باز کنید و مسیرهای Wi-Fi را در تنظیمات پلاگین zlt وارد کنید، یا از «کنترل مودم» عملیات مربوطه را اجرا کنید.') +
            '</div><button class="btn ghost" id="wifi-refresh">' + I('refresh', 16) + ' تلاش دوباره</button></div></div>';
          const btn = unavailable.querySelector('#wifi-refresh');
          if (btn) btn.addEventListener('click', () => {
            if (state.conn.mode === 'device') S.connectDevice({ force: true });
            else { const e = S.demoEngine(); if (e) e.tick(); }
          });
          return;
        }
        body.hidden = false;
        unavailable.hidden = true;

        const on = wifi.enabled !== false;
        masterSwitch.classList.toggle('on', on);
        masterSwitch.setAttribute('aria-checked', String(on));
        root.querySelector('#wifi-master-icon').className = 'row-icon ' + (on ? 'brand' : '');
        root.querySelector('#wifi-master-icon').innerHTML = I(on ? 'wifi' : 'wifiOff', 22);
        root.querySelector('#wifi-master-title').textContent = on ? (wifi.ssid || 'وای‌فای') : 'وای‌فای خاموش است';
        root.querySelector('#wifi-master-sub').textContent = on
          ? 'شبکهٔ محلی فعال · امنیت ' + (wifi.security || 'WPA2')
          : 'برای اتصال دستگاه‌ها، وای‌فای را روشن کنید';
        body.style.opacity = on ? '1' : '.55';
        body.style.pointerEvents = on ? '' : 'none';

        root.querySelector('#wifi-sec-badge').textContent = wifi.security || 'WPA2/WPA3';
        const clients = l.clients || [];
        const c24 = clients.filter((c) => c.online && String(c.channel || '').indexOf('2.4') === 0).length;
        const c5 = clients.filter((c) => c.online && String(c.channel || '').indexOf('5') === 0).length;

        root.querySelector('#wifi-main-info').innerHTML = W.kv([
          ['نام شبکه (SSID)', wifi.ssid || '—'],
          ['امنیت', wifi.security || '—'],
          ['کانال ۲.۴ گیگاهرتز', wifi.channel24 ? F.num(wifi.channel24) : '—'],
          ['کانال ۵ گیگاهرتز', wifi.channel5 ? F.num(wifi.channel5) : '—'],
          ['قدرت ارسال', wifi.txPower === 'high' ? 'بیشینه' : wifi.txPower === 'low' ? 'کمینه' : (wifi.txPower || 'خودکار')],
          ['دستگاه‌های متصل', F.num(clients.filter((c) => c.online).length)]
        ]);

        const radios = [
          { band: '2.4', name: 'باند ۲.۴ گیگاهرتز', ch: wifi.channel24, on: wifi.w24 !== false, count: c24, icon: 'wifi' },
          { band: '5', name: 'باند ۵ گیگاهرتز', ch: wifi.channel5, on: wifi.w5 !== false, count: c5, icon: 'signal' }
        ];
        root.querySelector('#wifi-radios').innerHTML = radios.map((r) =>
          '<div class="row-item" style="border:1px solid var(--line);border-radius:14px;background:var(--card);min-height:60px">' +
          '<span class="row-icon ' + (r.on ? 'brand' : '') + '">' + I(r.icon, 18) + '</span>' +
          '<span class="row-main"><span class="row-title" style="font-size:12.5px">' + r.name + '</span>' +
          '<span class="row-sub" style="font-size:10.5px">' + (r.count ? F.num(r.count) + ' دستگاه متصل' : 'بدون دستگاه') + '</span></span>' +
          '<button class="btn sm ghost" data-ch-band="' + r.band + '" style="flex:0 0 auto">کانال ' + (r.ch ? F.num(r.ch) : '—') + '</button>' +
          '</div>').join('');
        root.querySelectorAll('[data-ch-band]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const band = btn.getAttribute('data-ch-band');
            openChannelSheet(band, band === '5' ? wifi.channel5 : wifi.channel24);
          });
        });

        guestSwitch.classList.toggle('on', !!wifi.guest.enabled);
        guestSwitch.setAttribute('aria-checked', String(!!wifi.guest.enabled));
        root.querySelector('#wifi-guest-sub').textContent = wifi.guest.enabled
          ? 'فعال · ' + (wifi.guest.ssid || 'X28-Guest')
          : 'غیرفعال · برای مهمان‌ها یک شبکهٔ جدا بسازید';

        root.querySelector('#wifi-wps-sub').textContent = wifi.wps
          ? 'فعال است — دستگاه را از دکمهٔ WPS مودم وصل کنید'
          : 'دکمهٔ WPS مودم را تا ۲ دقیقه فعال می‌کند';

        const top = clients.filter((c) => c.online).slice(0, 3);
        root.querySelector('#wifi-clients').innerHTML = top.length
          ? top.map((c) => W.clientRow(c)).join('')
          : ui.empty({ icon: 'users', title: 'دستگاهی متصل نیست', sub: 'پس از اتصال، فهرست دستگاه‌ها اینجا نمایش داده می‌شود.' });
      }

      update(S.state);
      return { update };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
