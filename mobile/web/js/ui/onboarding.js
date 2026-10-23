/* X28 Mobile — first-run onboarding */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, I = X28.icon, F = X28.fmt;

  const OB = (X28.onboarding = {});
  let step = 0;
  let mode = 'demo';
  let url = '';
  let token = '';
  let password = '';
  let theme = 'dark';
  let digits = 'en';
  let testing = false;
  let testResult = null;
  let done = null;

  const ART = {
    1: '<svg viewBox="0 0 340 168" fill="none">' +
      '<defs><linearGradient id="ob1" x1="40" y1="20" x2="300" y2="160"><stop stop-color="#2ee6ae"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>' +
      '<radialGradient id="ob1b" cx=".5" cy=".5" r=".5"><stop stop-color="#2ee6ae" stop-opacity=".35"/><stop offset="1" stop-color="#2ee6ae" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="170" cy="88" r="76" fill="url(#ob1b)"/>' +
      '<rect x="140" y="42" width="60" height="102" rx="14" stroke="url(#ob1)" stroke-width="2.4" opacity=".95"/>' +
      '<rect x="148" y="52" width="44" height="82" rx="8" fill="rgba(46,230,174,.08)"/>' +
      '<path d="M158 100c0-8 5.5-13 12-13s12 5 12 13" stroke="#5eead4" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="170" cy="108" r="2.6" fill="#5eead4"/>' +
      '<path d="M74 128V96M92 128V80M110 128V60M128 128V40" stroke="url(#ob1)" stroke-width="5" stroke-linecap="round" opacity=".55"/>' +
      '<path d="M212 128V104M230 128V88M248 128V68M266 128V48" stroke="url(#ob1)" stroke-width="5" stroke-linecap="round" opacity=".3"/>' +
      '<circle cx="86" cy="66" r="3" fill="#5eead4"/><circle cx="252" cy="70" r="2.4" fill="#38bdf8" opacity=".8"/>' +
      '<path d="M96 42c8-8 22-8 30 0M240 34c8-8 22-8 30 0" stroke="#5eead4" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>' +
      '</svg>',
    2: '<svg viewBox="0 0 340 168" fill="none">' +
      '<defs><linearGradient id="ob2" x1="20" y1="40" x2="320" y2="140"><stop stop-color="#38bdf8"/><stop offset="1" stop-color="#2ee6ae"/></linearGradient></defs>' +
      '<rect x="26" y="58" width="106" height="66" rx="10" stroke="url(#ob2)" stroke-width="2.2"/>' +
      '<path d="M42 58V46h74v12" stroke="url(#ob2)" stroke-width="2.2"/>' +
      '<path d="M50 108h58M50 96h34M50 84h46" stroke="#5eead4" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>' +
      '<circle cx="114" cy="72" r="3.2" fill="#2ee6ae"/>' +
      '<rect x="212" y="30" width="66" height="112" rx="14" stroke="url(#ob2)" stroke-width="2.4"/>' +
      '<rect x="220" y="40" width="50" height="92" rx="8" fill="rgba(56,189,248,.07)"/>' +
      '<path d="M228 88h34M228 102h22" stroke="#5eead4" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>' +
      '<circle cx="245" cy="120" r="3" fill="#2ee6ae"/>' +
      '<path d="M136 92h66" stroke="url(#ob2)" stroke-width="1.6" stroke-dasharray="4 5" opacity=".7"/>' +
      '<path d="m192 84 10 8-10 8" stroke="#5eead4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="170" cy="92" r="24" stroke="#2ee6ae" stroke-width="1.2" opacity=".22"/>' +
      '</svg>',
    3: '<svg viewBox="0 0 340 168" fill="none">' +
      '<defs><linearGradient id="ob3" x1="80" y1="20" x2="260" y2="150"><stop stop-color="#2ee6ae"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>' +
      '<circle cx="170" cy="86" r="66" fill="rgba(46,230,174,.06)"/>' +
      '<circle cx="170" cy="86" r="45" stroke="url(#ob3)" stroke-width="2.4" stroke-dasharray="208 300" stroke-linecap="round" transform="rotate(-215 170 86)" opacity=".9"/>' +
      '<path d="m150 86 14 14 28-30" stroke="#5eead4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="m248 40 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8ZM84 108l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4 2.4-6Z" fill="#5eead4" opacity=".8"/>' +
      '</svg>'
  };

  OB.show = function (opts) {
    opts = opts || {};
    done = opts.onDone || function () {};
    step = 0;
    const host = document.getElementById('onboarding');
    host.hidden = false;
    render();
  };

  OB.hide = function () {
    const host = document.getElementById('onboarding');
    if (host) host.hidden = true;
  };

  function seg(id, options, current) {
    return '<div class="segmented" id="' + id + '" style="width:100%;display:flex">' +
      options.map((o) => '<button data-val="' + o[0] + '" style="flex:1" class="' + (o[0] === current ? 'active' : '') + '">' + o[1] + '</button>').join('') + '</div>';
  }

  function bodyForStep() {
    if (step === 0) {
      return '<div class="ob-content">' +
        '<button class="mode-card ' + (mode === 'demo' ? 'active' : '') + '" data-mode="demo">' +
        '<span class="row-icon brand">' + I('sparkles', 20) + '</span>' +
        '<span class="grow"><span class="mode-title">حالت نمایشی' + (mode === 'demo' ? ' <span class="badge ok">انتخاب‌شده</span>' : '') + '</span>' +
        '<span class="mode-desc">بدون نیاز به مودم یا پنل؛ همهٔ تب‌ها با دادهٔ نمونه و نمودارهای زنده کار می‌کنند. برای آشنایی و آزمودن رابط.</span></span></button>' +
        '<button class="mode-card ' + (mode === 'device' ? 'active' : '') + '" data-mode="device">' +
        '<span class="row-icon sky">' + I('link', 20) + '</span>' +
        '<span class="grow"><span class="mode-title">اتصال به پنل X28' + (mode === 'device' ? ' <span class="badge info">انتخاب‌شده</span>' : '') + '</span>' +
        '<span class="mode-desc">اتصال واقعی به پنل Control Center روی شبکهٔ محلی: وضعیت مودم، سیگنال، قفل باند، عملیات و لاگ.</span></span></button>' +
        '</div>';
    }
    if (step === 1 && mode === 'device') {
      return '<div class="ob-content">' +
        '<div class="field"><label>آدرس پنل</label>' +
        '<div class="input-group"><input class="input" id="ob-url" placeholder="http://192.168.1.10:8080" inputmode="url" autocomplete="off" spellcheck="false" value="' + U.esc(url) + '" />' +
        '<span class="input-suffix">URL</span></div></div>' +
        '<div class="field"><label>توکن عملیات <span class="tiny muted">(اختیاری)</span></label>' +
        '<input class="input" id="ob-token" placeholder="X-Token" autocomplete="off" spellcheck="false" value="' + U.esc(token) + '" /></div>' +
        '<div class="field"><label>رمز ورود پنل <span class="tiny muted">(اگر تنظیم شده)</span></label>' +
        '<input class="input" id="ob-pass" type="password" placeholder="••••••••" autocomplete="off" value="' + U.esc(password) + '" /></div>' +
        '<div id="ob-test-result">' + (testResult ? resultHtml() : '') + '</div>' +
        '<button class="btn soft block" id="ob-test">' + (testing ? X28.widgets.spinner(16) + ' در حال آزمایش…' : I('activity', 17) + ' آزمایش اتصال') + '</button>' +
        '<div class="hint">' + I('info', 13) + '<span>پنل را با دستور <span class="mono">python app.py --host 0.0.0.0</span> اجرا کنید تا از گوشی در شبکهٔ محلی دیده شود.</span></div>' +
        '</div>';
    }
    return '<div class="ob-content">' +
      '<div class="row-between"><div><div class="small">تم برنامه</div><div class="tiny muted">قابل تغییر از تنظیمات</div></div>' +
      seg('ob-theme', [['dark', 'تاریک'], ['light', 'روشن']], theme) + '</div>' +
      '<div class="row-between" style="margin-top:6px"><div><div class="small">ارقام</div><div class="tiny muted">نمایش اعداد</div></div>' +
      seg('ob-digits', [['en', '123'], ['fa', '۱۲۳']], digits) + '</div>' +
      '<div class="alert" style="margin-top:4px">' + I('info', 15) +
      '<span>' + (mode === 'device'
        ? 'پس از شروع، از تب «تنظیمات» می‌توانید آدرس را تغییر دهید یا به حالت نمایشی برگردید.'
        : 'در حالت نمایشی، بخش «ابزار شبیه‌سازی» در تنظیمات می‌تواند قطعی، هشدار و دستگاه آزمایشی بسازد.') + '</span></div>' +
      '</div>';
  }

  function resultHtml() {
    if (!testResult) return '';
    if (testResult.ok) {
      return '<div class="alert ok">' + I('check', 15) + '<span>اتصال برقرار شد' + (testResult.ms ? ' · ' + F.num(testResult.ms) + ' میلی‌ثانیه' : '') +
        (testResult.authRequired ? ' (نیاز به ورود با رمز)' : '') + '</span></div>';
    }
    return '<div class="alert err">' + I('alert', 15) + '<span>' + U.esc(testResult.error || 'اتصال برقرار نشد') + '</span></div>';
  }

  function render() {
    const host = document.getElementById('onboarding');
    if (!host) return;
    const titles = [
      'به مرکز کنترل X28 خوش آمدید',
      mode === 'device' ? 'پنل را به برنامه وصل کنید' : 'ظاهر دلخواه را انتخاب کنید',
      'همه چیز آماده است'
    ];
    const descs = [
      'پایش زندهٔ سیگنال، باند، شبکه، وای‌فای و کلاینت‌ها — با امکان قفل باند، اجرای عملیات و بررسی لاگ، همه از گوشی.',
      mode === 'device'
        ? 'آدرس پنل روی شبکهٔ محلی را وارد کنید. اگر ورود با رمز فعال است، رمز را هم بگذارید.'
        : 'این نسخه کاملاً مستقل کار می‌کند؛ حتی بدون اینترنت و بدون مودم داده‌های واقع‌نما نمایش می‌دهد.',
      'اکنون می‌توانید داشبورد را باز کنید؛ داده‌ها به‌صورت خودکار به‌روز می‌شوند.'
    ];
    host.innerHTML = '<div class="ob-wrap">' +
      '<button class="ob-skip" id="ob-skip">رد کردن</button>' +
      '<div class="ob-body">' +
      '<div class="ob-art">' + ART[step + 1] + '</div>' +
      '<div class="ob-title">' + titles[step] + '</div>' +
      '<div class="ob-desc">' + descs[step] + '</div>' +
      bodyForStep() +
      '</div>' +
      '<div class="ob-dots">' + [0, 1, 2].map((i) => '<i class="' + (i === step ? 'on' : '') + '"></i>').join('') + '</div>' +
      '<div class="ob-foot">' +
      '<button class="btn primary block" id="ob-next">' + (step === 2 ? I('check', 18) + ' شروع' : 'ادامه') + '</button>' +
      (step > 0 ? '<button class="btn ghost block" id="ob-back">مرحلهٔ قبل</button>' : '<div class="ob-note">بدون حساب کاربری · بدون ارسال داده به بیرون</div>') +
      '</div>' +
      '</div>';
    X28.icons.mount(host);
    bind();
  }

  function bind() {
    const host = document.getElementById('onboarding');
    const nextBtn = host.querySelector('#ob-next');
    const skip = host.querySelector('#ob-skip');
    const back = host.querySelector('#ob-back');

    if (skip) skip.addEventListener('click', () => finish(true));
    if (back) back.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });

    host.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.getAttribute('data-mode');
        if (mode === 'demo' && !url) url = '';
        render();
      });
    });

    host.querySelectorAll('#ob-theme [data-val]').forEach((btn) => {
      btn.addEventListener('click', () => {
        theme = btn.getAttribute('data-val');
        document.documentElement.setAttribute('data-theme', theme);
        render();
      });
    });
    host.querySelectorAll('#ob-digits [data-val]').forEach((btn) => {
      btn.addEventListener('click', () => { digits = btn.getAttribute('data-val'); F.setDigits(digits); render(); });
    });

    const urlEl = host.querySelector('#ob-url');
    const tokenEl = host.querySelector('#ob-token');
    const passEl = host.querySelector('#ob-pass');
    if (urlEl) urlEl.addEventListener('input', () => { url = urlEl.value.trim(); });
    if (tokenEl) tokenEl.addEventListener('input', () => { token = tokenEl.value.trim(); });
    if (passEl) passEl.addEventListener('input', () => { password = passEl.value; });

    const testBtn = host.querySelector('#ob-test');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        if (!url) { testResult = { ok: false, error: 'آدرس پنل را وارد کنید.' }; render(); return; }
        testing = true;
        testResult = null;
        render();
        X28.device.setConfig({ panelUrl: url, token });
        X28.device.probe().then((r) => {
          testing = false;
          testResult = r;
          render();
        }).catch((e) => {
          testing = false;
          testResult = { ok: false, error: String(e && e.message || e) };
          render();
        });
      });
    }

    nextBtn.addEventListener('click', () => {
      if (step === 1 && mode === 'device') {
        if (!url) { testResult = { ok: false, error: 'آدرس پنل را وارد کنید.' }; render(); return; }
        // keep whatever the user typed even if they skipped the test
      }
      if (step < 2) { step += 1; render(); return; }
      finish(false);
    });
  }

  function finish(skipped) {
    const settings = X28.store.state.settings;
    settings.onboarded = true;
    if (!skipped) {
      settings.mode = mode;
      settings.panelUrl = X28.device.normalizeBase(url);
      settings.token = token;
      settings.panelPassword = password;
      settings.rememberPassword = true;
      settings.theme = theme;
      settings.digits = digits;
    } else {
      settings.mode = 'demo';
    }
    F.setDigits(settings.digits);
    X28.store.applyTheme(settings.theme);
    X28.store.saveSettings();
    OB.hide();
    if (done) done(settings);
  }
})(typeof window !== 'undefined' ? window : globalThis);
