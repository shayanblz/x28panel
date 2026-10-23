/* X28 Mobile — tab 9: plugins */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  const DEMO_PLUGINS = [
    { id: 'ping', name: 'پینگ', icon: 'activity', kind: 'monitor', interval: 5, enabled: true, description: 'آنلاین/آفلاین، تأخیر، افت بسته و نوسان (jitter) با جایگزین TCP وقتی ICMP مسدود است.', emits: ['rtt_ms', 'loss_pct', 'jitter_ms'], schema: [{ key: 'count', label: 'تعداد بسته', type: 'int', default: 3 }, { key: 'target', label: 'هدف (خالی = مودم)', type: 'str', default: '' }] },
    { id: 'zlt', name: 'کنترل مودم ZLT', icon: 'tower', kind: 'monitor', interval: 15, enabled: true, description: 'ورود به پنل مودم، خواندن سیگنال و باند، قفل باند، APN، ریبوت و وای‌فای.', emits: ['rsrp', 'sinr', 'band'], schema: [{ key: 'login_path', label: 'مسیر ورود', type: 'str', default: '/cgi-bin/login.cgi' }, { key: 'interval', label: 'بازهٔ اجرا (ثانیه)', type: 'int', default: 15 }] },
    { id: 'bandwatch', name: 'نگهبان باند', icon: 'layers', kind: 'monitor', interval: 60, enabled: true, description: 'هشدار ناپایداری باند و ضعف سیگنال و اعمال خودکار پروفایل در بازهٔ خلوت.', emits: ['switch_count'], schema: [{ key: 'rsrp_low', label: 'آستانهٔ ضعف (dBm)', type: 'int', default: -108 }, { key: 'dry_run', label: 'فقط هشدار (بدون تغییر)', type: 'bool', default: true }] },
    { id: 'speed', name: 'آزمون سرعت', icon: 'speed', kind: 'monitor', interval: 0, enabled: true, description: 'دانلود، آپلود و تأخیر با ذخیرهٔ نتیجه در تاریخچه برای مقایسهٔ باندها.', emits: ['down_mbps', 'up_mbps'], schema: [{ key: 'max_seconds', label: 'حداکثر مدت آزمون', type: 'int', default: 12 }] },
    { id: 'netinfo', name: 'تشخیص شبکه', icon: 'globe', kind: 'monitor', interval: 60, enabled: true, description: 'IP عمومی و CGNAT، سنجش DNS، پینگ TCP و اعتبار گواهی TLS.', emits: ['dns_ms', 'public_ip'], schema: [{ key: 'dns_servers', label: 'سرورهای DNS', type: 'str', default: '1.1.1.1,8.8.8.8' }] },
    { id: 'devwatch', name: 'رصد دستگاه‌ها', icon: 'users', kind: 'monitor', interval: 5, enabled: true, description: 'نوع دستگاه و پهنای باند لحظه‌ای هر کلاینت شبکه.', emits: ['clients'], schema: [{ key: 'poll_sec', label: 'بازهٔ نمونه‌گیری', type: 'int', default: 20 }] },
    { id: 'logwatch', name: 'پایش لاگ', icon: 'file', kind: 'monitor', interval: 300, enabled: true, description: 'خواندن web_event_super.log، ذخیرهٔ رویدادها و هشدار روی رخدادهای حساس.', emits: ['events'], schema: [{ key: 'alert_sensitive', label: 'هشدار روی رویداد حساس', type: 'bool', default: true }] },
    { id: 'snmp', name: 'SNMP', icon: 'server', kind: 'monitor', interval: 30, enabled: true, description: 'ترافیک WAN، آپ‌تایم و نام سیستم با پیاده‌سازی BER خالص.', emits: ['rx_bps', 'tx_bps'], schema: [{ key: 'community', label: 'Community', type: 'str', default: 'public' }, { key: 'if_index', label: 'شمارهٔ اینترفیس', type: 'int', default: 1 }] },
    { id: 'telegram', name: 'هشدار تلگرام', icon: 'share', kind: 'notifier', interval: 0, enabled: false, description: 'ارسال هشدارهای بحرانی و مهم به چت تلگرام.', emits: [], schema: [{ key: 'chat_id', label: 'شناسهٔ چت', type: 'str', default: '' }, { key: 'only_levels', label: 'سطوح ارسالی', type: 'str', default: 'critical,warn' }] },
    { id: 'ai', name: 'دستیار هوشمند', icon: 'sparkles', kind: 'assistant', interval: 0, enabled: false, description: 'تحلیل وضعیت و پیشنهاد فارسی؛ آفلاین یا با کلید API.', emits: [], schema: [{ key: 'mode', label: 'حالت', type: 'select', options: ['offline', 'online'], default: 'offline' }, { key: 'model', label: 'مدل', type: 'str', default: 'gpt-4o-mini' }] },
    { id: 'ssh', name: 'SSH / Telnet', icon: 'terminal', kind: 'monitor', interval: 0, enabled: false, description: 'اجرای دستور روی مودم و ریبوت از طریق SSH یا Telnet.', emits: ['info'], schema: [{ key: 'port', label: 'پورت', type: 'int', default: 22 }] },
    { id: 'tr069', name: 'TR-069 (GenieACS)', icon: 'cloud', kind: 'monitor', interval: 0, enabled: false, description: 'خواندن پارامترها از سرور مدیریت GenieACS.', emits: [], schema: [{ key: 'genieacs_url', label: 'آدرس ACS', type: 'str', default: 'http://127.0.0.1:7557' }] }
  ];

  X28.tabs.register('plugins', {
    label: 'پلاگین‌ها',
    icon: 'apps',
    mount(root) {
      root.innerHTML = ui.pageHead('پلاگین‌ها', 'افزونه‌های پایش، هشدار و کنترل',
        '<button class="icon-btn" id="pl-reload" aria-label="بارگذاری مجدد">' + I('rotate', 20) + '</button>') +
        '<div class="stack">' +
        '<section class="card tight">' +
        '  <div class="row" style="gap:11px">' +
        '    <span class="row-icon brand">' + I('apps', 19) + '</span>' +
        '    <div class="grow"><div class="row-title" style="font-size:13px" id="pl-summary">—</div>' +
        '    <div class="row-sub" style="font-size:10.5px">هر پلاگین مستقل اجرا می‌شود و می‌تواند فرم تنظیمات خودش را داشته باشد</div></div>' +
        '  </div>' +
        '</section>' +
        '<div id="pl-list" class="card list" style="padding:4px 0"></div>' +
        '<div class="hint" style="padding:0 4px">' + I('info', 13) + '<span>برای افزودن قابلیت جدید، کافی است یک فایل در پوشهٔ plugins پنل بگذارید؛ همین برنامه بدون تغییر، آن را نمایش می‌دهد.</span></div>' +
        '</div>';

      X28.icons.mount(root);
      const listHost = root.querySelector('#pl-list');

      function plugins(state) {
        if (state.conn.mode === 'device' && state.plugins && state.plugins.length) return state.plugins;
        if (state.conn.mode === 'device') return [];
        return DEMO_PLUGINS;
      }

      function findPlugin(id) { return plugins(S.state).find((p) => p.id === id); }

      function fieldHtml(p, value) {
        if (p.type === 'bool') {
          return '<div class="row-between"><span class="small">' + U.esc(p.label) + '</span>' +
            '<button class="switch ' + (value ? 'on' : '') + '" data-cfg-bool="' + U.esc(p.key) + '"></button></div>';
        }
        if (p.type === 'select' || (p.options && p.options.length)) {
          return '<div class="field"><label>' + U.esc(p.label) + '</label><select class="select" data-cfg="' + U.esc(p.key) + '">' +
            (p.options || []).map((o) => {
              const val = typeof o === 'object' ? (o.value !== undefined ? o.value : o.key) : o;
              const lab = typeof o === 'object' ? (o.label || o.value || o.key) : o;
              return '<option value="' + U.esc(val) + '" ' + (String(value) === String(val) ? 'selected' : '') + '>' + U.esc(lab) + '</option>';
            }).join('') + '</select></div>';
        }
        return '<div class="field"><label>' + U.esc(p.label) + '</label>' +
          '<input class="input" data-cfg="' + U.esc(p.key) + '" type="' + (p.type === 'int' ? 'number' : 'text') + '" value="' + U.esc(value === undefined || value === null ? '' : value) + '" placeholder="' + U.esc(p.default === undefined ? '' : p.default) + '" /></div>';
      }

      function openConfig(plugin) {
        const cfg = plugin.config || {};
        const schema = plugin.schema || [];
        const body = U.el('div', { class: 'stack' });
        body.innerHTML = '<div class="hint">' + I('info', 13) + '<span>' + U.esc(plugin.description || '') + '</span></div>' +
          (schema.length ? '<div class="form-grid">' + schema.map((p) => fieldHtml(p, cfg[p.key] !== undefined ? cfg[p.key] : p.default)).join('') + '</div>'
            : '<div class="alert">' + I('info', 16) + '<span>این پلاگین تنظیمات قابل ویرایش ندارد.</span></div>');
        body.querySelectorAll('[data-cfg-bool]').forEach((el) => el.addEventListener('click', () => {
          el.classList.toggle('on');
          el.setAttribute('aria-checked', String(el.classList.contains('on')));
        }));
        const sheet = ui.sheet({
          title: plugin.name,
          sub: 'تنظیمات پلاگین · ' + (plugin.kind === 'notifier' ? 'هشداردهنده' : plugin.kind === 'assistant' ? 'دستیار' : 'پایشگر'),
          icon: 'apps',
          body,
          footer: '<button class="btn primary" id="pl-save">' + I('save', 16) + ' ذخیرهٔ تنظیمات</button>',
          onMount() {
            document.querySelector('#pl-save').addEventListener('click', async () => {
              const patch = {};
              body.querySelectorAll('[data-cfg]').forEach((el) => {
                patch[el.getAttribute('data-cfg')] = el.type === 'number' ? Number(el.value) : el.value;
              });
              body.querySelectorAll('[data-cfg-bool]').forEach((el) => {
                patch[el.getAttribute('data-cfg-bool')] = el.classList.contains('on');
              });
              plugin.config = Object.assign({}, plugin.config || {}, patch);
              if (S.state.conn.mode === 'device') {
                const r = await X28.device.setPlugin(plugin.id, { config: patch });
                if (!r.ok) { ui.toast(r.error || 'ذخیره نشد', 'err'); return; }
              }
              ui.toast('تنظیمات ' + plugin.name + ' ذخیره شد', 'ok');
              sheet.close();
            });
          }
        });
      }

      let lastKey = '';
      function render(state) {
        const list = plugins(state);
        const enabled = list.filter((p) => p.enabled).length;
        const key = state.conn.mode + '|' + list.map((p) => p.id + (p.enabled ? '1' : '0') + JSON.stringify(p.config || {})).join(',') + '|' + list.length;
        root.querySelector('#pl-summary').textContent = list.length
          ? F.num(enabled) + ' از ' + F.num(list.length) + ' پلاگین فعال است'
          : 'در حال دریافت پلاگین‌ها از پنل…';

        if (!list.length) {
          if (lastKey === key) return;
          lastKey = key;
          listHost.innerHTML = state.conn.mode === 'device'
            ? W.loadingCard('در انتظار پاسخ پنل…')
            : ui.empty({ icon: 'apps', title: 'پلاگینی پیدا نشد' });
          return;
        }
        if (lastKey === key) return;
        lastKey = key;

        listHost.innerHTML = list.map((p) => {
          const tone = p.enabled ? 'brand' : '';
          const kindLabel = p.kind === 'notifier' ? 'هشداردهنده' : p.kind === 'assistant' ? 'دستیار' : 'پایشگر';
          return '<div class="plugin">' +
            '<span class="row-icon ' + tone + '" style="width:40px;height:40px">' + I(/hot|ping|activity/i.test(p.id) ? 'activity' : /zlt|modem/i.test(p.id) ? 'tower' : /wifi/i.test(p.id) ? 'wifi' : /speed/i.test(p.id) ? 'speed' : /net|tr069/i.test(p.id) ? 'globe' : /log|file/i.test(p.id) ? 'file' : /telegram|share/i.test(p.id) ? 'share' : /ai|sparkle/i.test(p.id) ? 'sparkles' : /ssh|terminal/i.test(p.id) ? 'terminal' : /client|dev/i.test(p.id) ? 'users' : 'apps', 19) + '</span>' +
            '<div class="grow">' +
            '<div class="row-title" style="font-size:13px">' + U.esc(p.name) +
            (p.enabled ? '' : ' <span class="badge neutral">خاموش</span>') + '</div>' +
            '<div class="plugin-meta">' +
            '<span class="badge outline">' + kindLabel + '</span>' +
            (p.interval ? '<span class="badge outline">هر ' + F.num(p.interval) + ' ثانیه</span>' : '<span class="badge outline">دستی</span>') +
            (p.emits && p.emits.length ? '<span class="badge info">' + F.num(p.emits.length) + ' متریک</span>' : '') +
            '</div>' +
            '<div class="plugin-desc">' + U.esc(p.description || '') + '</div>' +
            (p.schema && p.schema.length ? '<div class="row" style="margin-top:8px;gap:8px">' +
              '<button class="btn sm ghost" data-config="' + U.esc(p.id) + '" style="flex:0 0 auto">' + I('gear', 14) + ' تنظیمات</button></div>' : '') +
            '</div>' +
            '<button class="switch ' + (p.enabled ? 'on' : '') + '" data-toggle="' + U.esc(p.id) + '" role="switch" aria-checked="' + (!!p.enabled) + '"></button>' +
            '</div>';
        }).join('');
      }

      U.on(listHost, 'click', '[data-toggle]', (e, el) => {
        const id = el.getAttribute('data-toggle');
        const p = findPlugin(id);
        if (!p) return;
        const next = !p.enabled;
        el.classList.toggle('on', next);
        p.enabled = next;
        S.togglePlugin(id, next).then((r) => {
          if (!r.ok) { p.enabled = !next; ui.toast(r.error || 'تغییر اعمال نشد', 'err'); S.notify(); return; }
          ui.toast(p.name + (next ? ' روشن شد' : ' خاموش شد'), next ? 'ok' : 'info', 2000);
          U.haptic('light');
          S.notify();
        });
      });

      U.on(listHost, 'click', '[data-config]', (e, el) => {
        const p = findPlugin(el.getAttribute('data-config'));
        if (p) openConfig(p);
      });

      root.querySelector('#pl-reload').addEventListener('click', () => {
        root.querySelector('#pl-reload').classList.add('spinning');
        S.reloadPlugins().then((r) => {
          setTimeout(() => root.querySelector('#pl-reload').classList.remove('spinning'), 700);
          ui.toast(r.ok ? 'پلاگین‌ها بارگذاری مجدد شدند' : (r.error || 'بارگذاری نشد'), r.ok ? 'ok' : 'err', 3000);
          render(S.state);
        });
        if (S.state.conn.mode === 'demo') setTimeout(() => render(S.state), 300);
      });

      render(S.state);
      return { update: render };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
