/* X28 Mobile — tab 10: settings, connection, data */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  X28.tabs.register('settings', {
    label: 'تنظیمات',
    icon: 'gear',
    mount(root) {
      root.innerHTML = ui.pageHead('تنظیمات', 'اتصال، ظاهر، داده‌ها و درباره') +
        '<div class="stack">' +

        /* ── connection ─────────────────────────────────────────── */
        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>اتصال</div><span id="st-conn-pill"></span></div>' +
        '  <div class="segmented" id="st-mode" style="width:100%;display:flex">' +
        '    <button data-mode="demo" style="flex:1">حالت نمایشی</button>' +
        '    <button data-mode="device" style="flex:1">اتصال به پنل</button>' +
        '  </div>' +
        '  <div id="st-demo-box" style="margin-top:12px">' +
        '    <div class="hint">' + I('info', 13) + '<span>در حالت نمایشی همهٔ تب‌ها با دادهٔ شبیه‌سازی‌شده کار می‌کنند؛ برای اتصال به مودم واقعی، پنل X28 را روی شبکه اجرا کنید و آدرس آن را وارد کنید.</span></div>' +
        '  </div>' +
        '  <div id="st-device-box" class="form-grid" style="margin-top:12px" hidden>' +
        '    <div class="field"><label>آدرس پنل</label>' +
        '      <div class="input-group"><input class="input" id="st-url" placeholder="http://192.168.1.10:8080" inputmode="url" autocomplete="off" spellcheck="false" />' +
        '      <span class="input-suffix">URL</span></div>' +
        '      <div class="hint">' + I('info', 13) + '<span>آدرس کامپیوتری که app.py روی آن اجراست، همراه با پورت (پیش‌فرض ۸۰۸۰).</span></div>' +
        '    </div>' +
        '    <div class="field"><label>توکن عملیات <span class="tiny muted">(اختیاری)</span></label>' +
        '      <div class="input-group"><input class="input" id="st-token" placeholder="X-Token" autocomplete="off" spellcheck="false" />' +
        '      <button class="input-suffix" id="st-token-eye" style="pointer-events:auto;padding:4px" aria-label="نمایش">' + I('eye', 16) + '</button></div>' +
        '    </div>' +
        '    <div class="field"><label>رمز ورود پنل <span class="tiny muted">(اگر تنظیم شده)</span></label>' +
        '      <div class="input-group"><input class="input" id="st-pass" type="password" placeholder="••••••••" autocomplete="off" />' +
        '      <button class="input-suffix" id="st-pass-eye" style="pointer-events:auto;padding:4px" aria-label="نمایش">' + I('eye', 16) + '</button></div>' +
        '    </div>' +
        '    <div class="row-between" style="padding:2px 0">' +
        '      <div><div class="small">ذخیرهٔ رمز در دستگاه</div><div class="tiny muted">برای اتصال خودکار در اجرای بعدی</div></div>' +
        '      <button class="switch" id="st-remember" role="switch"></button>' +
        '    </div>' +
        '    <div id="st-device-error"></div>' +
        '    <div class="btn-row">' +
        '      <button class="btn primary" id="st-connect">' + I('link', 17) + ' اتصال و تست</button>' +
        '      <button class="btn ghost" id="st-logout">' + I('logout', 17) + ' خروج</button>' +
        '    </div>' +
        '    <div class="tiny muted" id="st-device-info"></div>' +
        '  </div>' +
        '</section>' +

        /* ── appearance ─────────────────────────────────────────── */
        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>ظاهر و نمایش</div></div>' +
        '  <div class="stack-sm">' +
        '    <div class="row-between"><div><div class="small">تم برنامه</div><div class="tiny muted">تاریک یا روشن</div></div>' +
        '      <div class="segmented" id="st-theme"><button data-theme="dark">تاریک</button><button data-theme="light">روشن</button></div></div>' +
        '    <div class="row-between"><div><div class="small">ارقام</div><div class="tiny muted">نمایش اعداد فارسی یا لاتین</div></div>' +
        '      <div class="segmented" id="st-digits"><button data-digits="en">123</button><button data-digits="fa">۱۲۳</button></div></div>' +
        '    <div class="row-between"><div><div class="small">بازهٔ پیش‌فرض نمودار</div><div class="tiny muted">برای داشبورد و سیگنال</div></div>' +
        '      <select class="select" id="st-range" style="width:118px;height:36px;font-size:12px">' +
        '        <option value="10m">۱۰ دقیقه</option><option value="30m">۳۰ دقیقه</option><option value="1h">۱ ساعت</option><option value="6h">۶ ساعت</option><option value="24h">۲۴ ساعت</option>' +
        '      </select></div>' +
        '    <div class="row-between"><div><div class="small">هشدارهای زنده</div><div class="tiny muted">نمایش هشدار روی رویدادهای مهم</div></div>' +
        '      <button class="switch" id="st-alerts" role="switch"></button></div>' +
        '    <div class="row-between"><div><div class="small">تأیید قبل از عملیات</div><div class="tiny muted">پرسش تأیید برای هر تغییر روی مودم</div></div>' +
        '      <button class="switch" id="st-confirm" role="switch"></button></div>' +
        '    <div class="row-between"><div><div class="small">روشن نگه‌داشتن صفحه</div><div class="tiny muted">فقط در نسخهٔ اندروید</div></div>' +
        '      <button class="switch" id="st-keep" role="switch"></button></div>' +
        '  </div>' +
        '</section>' +

        /* ── demo tools ─────────────────────────────────────────── */
        '<section class="card" id="st-demo-tools">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>ابزار شبیه‌سازی</div><span class="badge violet">دمو</span></div>' +
        '  <div class="action-list">' +
        '    <button class="action-item" id="st-sim-outage"><span class="row-icon rose">' + I('signalOff', 18) + '</span>' +
        '      <span class="grow"><span class="row-title" style="font-size:12.5px">شبیه‌سازی قطعی ۳۰ ثانیه‌ای</span><span class="row-sub" style="font-size:10px">آزمودن حالت آفلاین و هشدارها</span></span></button>' +
        '    <button class="action-item" id="st-sim-event"><span class="row-icon amber">' + I('bell', 18) + '</span>' +
        '      <span class="grow"><span class="row-title" style="font-size:12.5px">ساخت رویداد هشدار</span><span class="row-sub" style="font-size:10px">ثبت یک رویداد نمونه در لاگ</span></span></button>' +
        '    <button class="action-item" id="st-sim-client"><span class="row-icon sky">' + I('users', 18) + '</span>' +
        '      <span class="grow"><span class="row-title" style="font-size:12.5px">افزودن دستگاه آزمایشی</span><span class="row-sub" style="font-size:10px">یک کلاینت جدید به فهرست اضافه می‌شود</span></span></button>' +
        '    <button class="action-item" id="st-sim-refresh"><span class="row-icon brand">' + I('rotate', 18) + '</span>' +
        '      <span class="grow"><span class="row-title" style="font-size:12.5px">ساخت دوبارهٔ تاریخچه</span><span class="row-sub" style="font-size:10px">۲۴ ساعت دادهٔ نمونه از نو</span></span></button>' +
        '  </div>' +
        '</section>' +

        /* ── data ───────────────────────────────────────────────── */
        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>داده‌ها</div><span class="badge neutral" id="st-storage">—</span></div>' +
        '  <div class="action-list">' +
        '    <button class="action-item" id="st-export"><span class="row-icon brand">' + I('download', 18) + '</span>' +
        '      <span class="grow"><span class="row-title" style="font-size:12.5px">خروجی کامل (JSON)</span><span class="row-sub" style="font-size:10px">وضعیت، رویدادها، تنظیمات و تاریخچهٔ سرعت</span></span></button>' +
        '    <button class="action-item" id="st-export-events"><span class="row-icon sky">' + I('file', 18) + '</span>' +
        '      <span class="grow"><span class="row-title" style="font-size:12.5px">خروجی رویدادها (CSV)</span><span class="row-sub" style="font-size:10px">قابل باز شدن در اکسل</span></span></button>' +
        '    <button class="action-item" id="st-clear"><span class="row-icon rose">' + I('trash', 18) + '</span>' +
        '      <span class="grow"><span class="row-title" style="font-size:12.5px">پاک‌کردن داده‌های برنامه</span><span class="row-sub" style="font-size:10px">تنظیمات، تاریخچه و رمزهای ذخیره‌شده</span></span></button>' +
        '  </div>' +
        '</section>' +

        /* ── about ──────────────────────────────────────────────── */
        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>دربارهٔ برنامه</div><span class="badge info" id="st-version">—</span></div>' +
        '  <div class="kv" id="st-about"></div>' +
        '  <div class="btn-row" style="margin-top:12px">' +
        '    <button class="btn ghost" id="st-open-panel">' + I('external', 16) + ' بازکردن پنل</button>' +
        '    <button class="btn ghost" id="st-github">' + I('link', 16) + ' مخزن پروژه</button>' +
        '  </div>' +
        '  <div class="hint" style="margin-top:10px">' + I('shield', 13) + '<span>این برنامه یک کلاینت موبایل برای پنل X28 است؛ هیچ داده‌ای به سرور بیرونی فرستاده نمی‌شود. تمام ارتباط‌ها فقط با پنل خودتان در شبکهٔ محلی انجام می‌شود.</span></div>' +
        '</section>' +
        '</div>';

      X28.icons.mount(root);

      const refs = {
        modeBtns: root.querySelectorAll('#st-mode [data-mode]'),
        demoBox: root.querySelector('#st-demo-box'),
        deviceBox: root.querySelector('#st-device-box'),
        url: root.querySelector('#st-url'),
        token: root.querySelector('#st-token'),
        pass: root.querySelector('#st-pass'),
        remember: root.querySelector('#st-remember'),
        error: root.querySelector('#st-device-error'),
        info: root.querySelector('#st-device-info'),
        pill: root.querySelector('#st-conn-pill'),
        themeBtns: root.querySelectorAll('#st-theme [data-theme]'),
        digitBtns: root.querySelectorAll('#st-digits [data-digits]'),
        range: root.querySelector('#st-range'),
        alerts: root.querySelector('#st-alerts'),
        confirm: root.querySelector('#st-confirm'),
        keep: root.querySelector('#st-keep'),
        demoBoxTools: root.querySelector('#st-demo-tools'),
        storage: root.querySelector('#st-storage')
      };

      /* ── init values ─────────────────────────────────────────── */
      const st = S.state.settings;
      refs.url.value = st.panelUrl || '';
      refs.token.value = st.token || '';
      refs.pass.value = st.panelPassword || '';
      refs.range.value = st.chartRange || '10m';
      refs.remember.classList.toggle('on', !!st.rememberPassword);
      refs.alerts.classList.toggle('on', !!st.alerts);
      refs.confirm.classList.toggle('on', !!st.confirmActions);
      refs.keep.classList.toggle('on', !!st.keepAwake);

      function persistInputs() {
        S.state.settings.panelUrl = X28.device.normalizeBase(refs.url.value.trim());
        S.state.settings.token = refs.token.value.trim();
        S.state.settings.panelPassword = refs.remember.classList.contains('on') ? refs.pass.value : '';
        S.state.settings.rememberPassword = refs.remember.classList.contains('on');
        S.saveSettings();
      }

      [refs.url, refs.token, refs.pass].forEach((el) => {
        el.addEventListener('change', persistInputs);
        el.addEventListener('blur', persistInputs);
      });

      root.querySelector('#st-pass-eye').addEventListener('click', () => {
        refs.pass.type = refs.pass.type === 'password' ? 'text' : 'password';
      });
      root.querySelector('#st-token-eye').addEventListener('click', () => {
        refs.token.type = refs.token.type === 'password' ? 'text' : 'password';
      });
      refs.remember.addEventListener('click', () => {
        refs.remember.classList.toggle('on');
        if (!refs.remember.classList.contains('on')) refs.pass.value = '';
        persistInputs();
      });

      refs.modeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-mode');
          if (mode === 'device' && !X28.device.normalizeBase(refs.url.value)) {
            if (!S.state.settings.panelUrl) {
              refs.modeBtns.forEach((b) => b.classList.toggle('active', b === btn));
              ui.toast('ابتدا آدرس پنل را وارد کنید', 'warn', 3000);
              refs.url.focus();
              return;
            }
          }
          persistInputs();
          S.state.settings.mode = mode;
          S.saveSettings();
          S.switchMode(mode);
          ui.toast(mode === 'device' ? 'در حال اتصال به پنل…' : 'حالت نمایشی فعال شد', 'info', 2200);
        });
      });

      root.querySelector('#st-connect').addEventListener('click', () => {
        persistInputs();
        if (!S.state.settings.panelUrl) { ui.toast('آدرس پنل را وارد کنید', 'warn'); refs.url.focus(); return; }
        const btn = root.querySelector('#st-connect');
        btn.disabled = true;
        btn.innerHTML = W.spinner(16) + ' در حال اتصال…';
        S.state.settings.mode = 'device';
        S.saveSettings();
        S.connectDevice({ force: true }).then(async (conn) => {
          btn.disabled = false;
          btn.innerHTML = I('link', 17) + ' اتصال و تست';
          if (conn.status === 'online') ui.toast('اتصال به پنل برقرار شد', 'ok');
          else if (conn.authRequired && refs.pass.value) {
            const r = await S.login(refs.pass.value);
            ui.toast(r.ok ? 'ورود موفق بود' : (r.error || 'ورود ناموفق'), r.ok ? 'ok' : 'err', 3400);
          } else {
            ui.toast(conn.error || 'اتصال برقرار نشد', 'err', 4200);
          }
        });
      });

      root.querySelector('#st-logout').addEventListener('click', async () => {
        const ok = await ui.confirm({ title: 'خروج از پنل؟', text: 'نشست فعلی بسته می‌شود و برنامه به حالت نمایشی برمی‌گردد.', tone: 'warn', icon: 'logout', confirmText: 'خروج' });
        if (!ok) return;
        if (S.state.conn.mode === 'device') X28.device.logout();
        S.state.settings.panelPassword = '';
        refs.pass.value = '';
        S.saveSettings();
        S.switchMode('demo');
        ui.toast('به حالت نمایشی برگشتید', 'info');
      });

      /* appearance */
      refs.themeBtns.forEach((btn) => btn.addEventListener('click', () => {
        S.setSetting('theme', btn.getAttribute('data-theme'));
        document.documentElement.classList.add('theme-anim');
        setTimeout(() => document.documentElement.classList.remove('theme-anim'), 400);
      }));
      refs.digitBtns.forEach((btn) => btn.addEventListener('click', () => {
        S.setSetting('digits', btn.getAttribute('data-digits'));
        ui.refresh();
      }));
      refs.range.addEventListener('change', () => S.setSetting('chartRange', refs.range.value));
      refs.alerts.addEventListener('click', () => {
        const next = !refs.alerts.classList.contains('on');
        refs.alerts.classList.toggle('on', next);
        S.setSetting('alerts', next);
      });
      refs.confirm.addEventListener('click', () => {
        const next = !refs.confirm.classList.contains('on');
        refs.confirm.classList.toggle('on', next);
        S.setSetting('confirmActions', next);
      });
      refs.keep.addEventListener('click', () => {
        const next = !refs.keep.classList.contains('on');
        refs.keep.classList.toggle('on', next);
        S.setSetting('keepAwake', next);
        if (U.bridge.has('setKeepAwake')) U.bridge.call('setKeepAwake', next);
        if (!U.bridge.has('setKeepAwake')) ui.toast('این گزینه فقط در نسخهٔ اندروید کار می‌کند', 'info');
      });

      /* demo tools */
      root.querySelector('#st-sim-outage').addEventListener('click', async () => {
        const ok = await ui.confirm({ title: 'شبیه‌سازی قطعی؟', text: 'داده‌ها به مدت ۳۰ ثانیه آفلاین می‌شوند تا حالت هشدار را ببینید.', tone: 'warn', icon: 'signalOff', confirmText: 'شبیه‌سازی کن' });
        if (!ok) return;
        const e = S.demoEngine();
        if (e) { e.setOnline(false, 30); ui.toast('قطعی شبیه‌سازی شد', 'warn', 2600); }
      });
      root.querySelector('#st-sim-event').addEventListener('click', () => {
        const ev = {
          id: U.uid('ev'), ts: Date.now(), level: 'warn', cat: 'signal',
          title: 'هشدار آزمایشی', msg: 'این رویداد برای آزمودن فید زنده ساخته شد.', source: 'sim'
        };
        if (S.demoEngine()) S.demoEngine().pushEvent(ev); else S.addEvent(ev);
        ui.toast('رویداد آزمایشی ساخته شد', 'ok');
      });
      root.querySelector('#st-sim-client').addEventListener('click', () => {
        const e = S.demoEngine();
        if (!e) return;
        const names = ['Pixel 9', 'Xiaomi 14', 'iPad Air', 'Galaxy Tab', 'Echo Dot', 'ThinkPad'];
        const kinds = ['phone', 'phone', 'tablet', 'tablet', 'speaker', 'laptop'];
        const i = U.randInt(0, names.length - 1);
        e.addClient({ name: names[i], kind: kinds[i], channel: U.chance(0.5) ? '5G' : '2.4G' });
        ui.toast('دستگاه آزمایشی اضافه شد: ' + names[i], 'ok');
      });
      root.querySelector('#st-sim-refresh').addEventListener('click', () => {
        const e = S.demoEngine();
        if (!e) return;
        S.startDemo();
        ui.toast('تاریخچه از نو ساخته شد', 'ok');
      });

      /* data */
      root.querySelector('#st-export').addEventListener('click', () => {
        const payload = {
          exportedAt: new Date().toISOString(),
          app: 'X28 Mobile',
          version: ui.version(),
          mode: S.state.conn.mode,
          live: S.state.live,
          settings: Object.assign({}, S.state.settings, { panelPassword: undefined, token: undefined }),
          events: S.state.events,
          speed: S.state.speed.history,
          audit: S.state.audit
        };
        const res = U.download('x28-mobile-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(payload, null, 2), 'application/json');
        ui.toast(res && res.error ? res.error : 'خروجی ساخته شد', res && res.error ? 'err' : 'ok');
      });
      root.querySelector('#st-export-events').addEventListener('click', () => {
        const rows = [['time', 'level', 'category', 'title', 'message']].concat(
          S.state.events.map((e) => [new Date(e.ts).toISOString(), e.level, e.cat, e.title, e.msg]));
        const res = U.download('x28-events.csv', U.csv(rows), 'text/csv;charset=utf-8');
        ui.toast(res && res.error ? res.error : 'خروجی ساخته شد', res && res.error ? 'err' : 'ok');
      });
      root.querySelector('#st-clear').addEventListener('click', async () => {
        const ok = await ui.confirm({
          title: 'پاک‌کردن همهٔ داده‌ها؟',
          text: 'تنظیمات، آدرس پنل، رمزهای ذخیره‌شده، تاریخچه و لاگ‌های محلی حذف می‌شوند. این کار برگشت‌پذیر نیست.',
          tone: 'danger', icon: 'trash', confirmText: 'پاک کن'
        });
        if (!ok) return;
        S.resetAll();
        setTimeout(() => global.location.reload(), 300);
      });

      /* about */
      const native = U.bridge.has('info') ? (U.bridge.call('info') || {}) : null;
      const aboutRows = [
        ['نسخهٔ برنامه', ui.version()],
        ['پوسته', native ? 'اندروید (WebView)' : 'مرورگر'],
        ['دستگاه', native ? (native.device || '—') : (navigator.userAgent.indexOf('Android') >= 0 ? 'Android' : 'مرورگر')],
        ['نسخهٔ اندروید', native && native.sdk ? F.num(native.sdk) : '—'],
        ['آدرس پنل', S.state.settings.panelUrl || 'تنظیم نشده'],
        ['وضعیت اتصال', ui.connLabel()],
        ['آخرین به‌روزرسانی', S.state.conn.lastOk ? U.relTime(S.state.conn.lastOk) : '—']
      ];
      root.querySelector('#st-about').innerHTML = W.kv(aboutRows);
      root.querySelector('#st-version').textContent = 'v' + ui.version();

      root.querySelector('#st-open-panel').addEventListener('click', () => {
        if (!S.state.settings.panelUrl) { ui.toast('آدرس پنل تنظیم نشده است', 'warn'); return; }
        if (U.bridge.has('openUrl')) U.bridge.call('openUrl', S.state.settings.panelUrl);
        else global.open(S.state.settings.panelUrl, '_blank', 'noopener');
      });
      root.querySelector('#st-github').addEventListener('click', () => {
        const url = 'https://github.com/shayanblz/x28panel/tree/main/mobile';
        if (U.bridge.has('openUrl')) U.bridge.call('openUrl', url);
        else global.open(url, '_blank', 'noopener');
      });

      /* ── live updates ───────────────────────────────────────── */
      function update(state) {
        const s = state.settings;
        refs.modeBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-mode') === s.mode));
        refs.themeBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-theme') === s.theme));
        refs.digitBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-digits') === s.digits));
        refs.range.value = s.chartRange;
        refs.alerts.classList.toggle('on', !!s.alerts);
        refs.confirm.classList.toggle('on', !!s.confirmActions);
        refs.keep.classList.toggle('on', !!s.keepAwake);

        const isDevice = s.mode === 'device';
        refs.demoBox.hidden = isDevice;
        refs.deviceBox.hidden = !isDevice;
        refs.demoBoxTools.hidden = isDevice;

        refs.pill.innerHTML = ui.statusPill(state.conn.status === 'boot' ? 'connecting' : state.conn.status);
        if (document.activeElement !== refs.url) refs.url.value = s.panelUrl || '';
        if (document.activeElement !== refs.token) refs.token.value = s.token || '';
        if (document.activeElement !== refs.pass) refs.pass.value = s.panelPassword || '';

        const c = state.conn;
        if (c.mode === 'device' && c.error) {
          refs.error.innerHTML = '<div class="alert err">' + I('alert', 15) + '<span>' + U.esc(c.error) + '</span></div>';
        } else if (c.mode === 'device' && c.status === 'online') {
          refs.error.innerHTML = '<div class="alert ok">' + I('check', 15) + '<span>اتصال برقرار است' + (c.ms ? ' · پاسخ ' + F.num(c.ms) + ' میلی‌ثانیه' : '') + '</span></div>';
        } else refs.error.innerHTML = '';

        refs.info.textContent = c.mode === 'device'
          ? ('وضعیت: ' + ui.connLabel() + (c.lastOk ? ' · آخرین پاسخ ' + U.relTime(c.lastOk) : '') + (state.live.profile && state.live.profile.firmware ? ' · فریم‌ور ' + state.live.profile.firmware : ''))
          : 'حالت نمایشی فعال است';

        let size = 0;
        try { size = JSON.stringify(global.localStorage).length; } catch (e) { size = 0; }
        refs.storage.textContent = F.bytes(size);
      }

      update(S.state);
      return { update, destroy() {} };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
