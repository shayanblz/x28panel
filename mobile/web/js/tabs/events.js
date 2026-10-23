/* X28 Mobile — tab 7: events & log */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  const CATS = [
    ['all', 'همه'], ['signal', 'سیگنال'], ['band', 'باند'], ['network', 'شبکه'],
    ['client', 'کلاینت'], ['wifi', 'وای‌فای'], ['system', 'سیستم'], ['security', 'امنیت'], ['speed', 'سرعت']
  ];

  X28.tabs.register('events', {
    label: 'رویدادها',
    icon: 'bell',
    mount(root) {
      root.innerHTML = ui.pageHead('رویدادها و لاگ', 'تاریخچهٔ رخدادهای مودم و پنل',
        '<div class="row" style="gap:7px">' +
        '<button class="icon-btn" id="ev-import" aria-label="ورود لاگ">' + I('upload', 19) + '</button>' +
        '<button class="icon-btn" id="ev-more" aria-label="بیشتر">' + I('more', 19) + '</button></div>') +
        '<div class="stack">' +
        '<div class="input-group"><input class="input" id="ev-search" placeholder="جست‌وجو در رویدادها…" style="height:42px;font-size:12.5px" />' +
        '<span class="input-suffix">' + I('search', 16) + '</span></div>' +
        '<div class="chips" id="ev-cats"></div>' +
        '<div class="row-between" style="margin-top:-2px">' +
        '  <div class="tiny muted" id="ev-count">—</div>' +
        '  <div class="pill-row" id="ev-levels"></div>' +
        '</div>' +
        '<section class="card" id="ev-list-card" style="padding:12px 14px"></section>' +
        '<button class="btn ghost block" id="ev-more-btn" hidden>نمایش رویدادهای بیشتر</button>' +
        '<input type="file" id="ev-file" accept=".log,.txt,.json" hidden />' +
        '</div>';

      X28.icons.mount(root);
      const listCard = root.querySelector('#ev-list-card');
      const catsHost = root.querySelector('#ev-cats');
      const countEl = root.querySelector('#ev-count');
      const moreBtn = root.querySelector('#ev-more-btn');
      const searchInput = root.querySelector('#ev-search');

      let cat = 'all';
      let level = 'all';
      let query = '';
      let limit = 60;
      let renderedKey = '';
      let visibleEvents = [];

      function levelFilters() {
        return [['all', 'همه'], ['warn', 'هشدار'], ['crit', 'بحرانی']];
      }

      function isCrit(e) { return e.level === 'critical' || e.level === 'crit' || e.level === 'error'; }
      function isWarn(e) { return e.level === 'warn' || e.level === 'warning'; }

      function filtered() {
        let arr = S.state.events.slice();
        if (cat !== 'all') arr = arr.filter((e) => String(e.cat).toLowerCase() === cat);
        if (level === 'warn') arr = arr.filter((e) => isWarn(e) || isCrit(e));
        if (level === 'crit') arr = arr.filter(isCrit);
        if (query) {
          const q = query.toLowerCase();
          arr = arr.filter((e) => (e.title + ' ' + e.msg + ' ' + e.cat + ' ' + (e.source || '')).toLowerCase().indexOf(q) >= 0);
        }
        return arr;
      }

      function render(state) {
        const all = state.events || [];
        const arr = filtered();
        visibleEvents = arr.slice(0, limit);

        const counts = {};
        all.forEach((e) => { counts[e.cat] = (counts[e.cat] || 0) + 1; });
        const catsKey = cat + '|' + CATS.map((c) => (counts[c[0]] || 0) + (c[0] === 'all' ? all.length : 0)).join(',');
        if (catsHost.dataset.key !== catsKey) {
          catsHost.dataset.key = catsKey;
          catsHost.innerHTML = CATS.map((c) =>
          '<button class="chip ' + (cat === c[0] ? 'active' : '') + '" data-cat="' + c[0] + '">' + c[1] +
            '<span class="count">' + F.num(c[0] === 'all' ? all.length : counts[c[0]] || 0) + '</span></button>').join('');
        }
        if (!catsHost.dataset.bound) {
          catsHost.dataset.bound = '1';
          U.on(catsHost, 'click', '[data-cat]', (e, btn) => {
            cat = btn.getAttribute('data-cat');
            limit = 60;
            renderedKey = '';
            render(S.state);
          });
        }

        root.querySelector('#ev-levels').innerHTML = levelFilters().map((l) =>
          '<button class="badge ' + (level === l[0] ? (l[0] === 'crit' ? 'err' : l[0] === 'warn' ? 'warn' : 'info') : 'neutral') + '" data-level="' + l[0] + '" style="border:0;cursor:pointer">' + l[1] + '</button>').join('');
        root.querySelectorAll('[data-level]').forEach((btn) => {
          btn.addEventListener('click', () => { level = btn.getAttribute('data-level'); limit = 60; renderedKey = ''; render(S.state); });
        });

        countEl.textContent = arr.length ? F.num(arr.length) + ' رویداد' + (arr.length > visibleEvents.length ? ' · ' + F.num(visibleEvents.length) + ' نمایش داده شده' : '') : 'رویدادی مطابق فیلتر نیست';

        const key = visibleEvents.map((e) => e.id).join('|') + ':' + cat + ':' + level + ':' + query;
        if (key !== renderedKey) {
          renderedKey = key;
          let html = '';
          let lastDay = '';
          visibleEvents.forEach((e) => {
            const dk = U.dayKey(e.ts);
            if (dk !== lastDay) {
              lastDay = dk;
              html += '<div class="day-sep">' + U.esc(U.dayLabel(e.ts)) + '</div>';
            }
            html += W.eventRow(e);
          });
          listCard.innerHTML = html || ui.empty({
            icon: 'bell', title: 'رویدادی پیدا نشد',
            sub: query ? 'عبارت دیگری را جست‌وجو کنید.' : 'با تغییر دسته یا سطح، رویدادهای بیشتری ببینید.'
          });
        }

        moreBtn.hidden = arr.length <= visibleEvents.length;
        moreBtn.textContent = 'نمایش رویدادهای بیشتر (' + F.num(Math.min(60, arr.length - visibleEvents.length)) + ')';
      }

      moreBtn.addEventListener('click', () => { limit += 60; renderedKey = ''; render(S.state); });

      let t = 0;
      searchInput.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { query = searchInput.value.trim(); limit = 60; renderedKey = ''; render(S.state); }, 180);
      });

      U.on(listCard, 'click', '[data-event]', (e, el) => {
        const ev = S.state.events.find((x) => x.id === el.getAttribute('data-event'));
        if (!ev) return;
        ui.sheet({ title: 'جزئیات رویداد', sub: U.relTime(ev.ts), icon: 'bell', body: W.eventDetail(ev) });
      });

      root.querySelector('#ev-more').addEventListener('click', () => {
        ui.sheet({
          title: 'ابزارهای لاگ',
          sub: 'خروجی، ورود و نگهداری رویدادها',
          icon: 'list',
          body: '<div class="action-list">' +
            '<button class="action-item" id="ev-export-json"><span class="row-icon sky">' + I('file', 19) + '</span>' +
            '<span class="grow"><span class="row-title" style="font-size:12.5px">خروجی JSON</span><span class="row-sub" style="font-size:10px">همهٔ رویدادهای فیلترشده</span></span></button>' +
            '<button class="action-item" id="ev-export-csv"><span class="row-icon brand">' + I('download', 19) + '</span>' +
            '<span class="grow"><span class="row-title" style="font-size:12.5px">خروجی CSV</span><span class="row-sub" style="font-size:10px">مناسب اکسل</span></span></button>' +
            '<button class="action-item" id="ev-import-2"><span class="row-icon violet">' + I('upload', 19) + '</span>' +
            '<span class="grow"><span class="row-title" style="font-size:12.5px">ورود فایل لاگ</span><span class="row-sub" style="font-size:10px">متن یا JSON از مودم</span></span></button>' +
            '<button class="action-item" id="ev-share"><span class="row-icon amber">' + I('share', 19) + '</span>' +
            '<span class="grow"><span class="row-title" style="font-size:12.5px">اشتراک‌گذاری خلاصه</span><span class="row-sub" style="font-size:10px">آخرین ۲۰ رویداد</span></span></button>' +
            '</div>'
        });
        const close = () => ui.closeSheet();
        document.querySelector('#ev-export-json').addEventListener('click', () => {
          const data = JSON.stringify(filtered(), null, 2);
          const res = U.download('x28-events-' + new Date().toISOString().slice(0, 10) + '.json', data, 'application/json');
          if (res && res.error) ui.toast(res.error, 'err'); else ui.toast('خروجی JSON ساخته شد', 'ok');
          close();
        });
        document.querySelector('#ev-export-csv').addEventListener('click', () => {
          const rows = [['time', 'level', 'category', 'title', 'message', 'source']].concat(
            filtered().map((e) => [new Date(e.ts).toISOString(), e.level, e.cat, e.title, e.msg, e.source || '']));
          const res = U.download('x28-events-' + new Date().toISOString().slice(0, 10) + '.csv', U.csv(rows), 'text/csv;charset=utf-8');
          if (res && res.error) ui.toast(res.error, 'err'); else ui.toast('خروجی CSV ساخته شد', 'ok');
          close();
        });
        document.querySelector('#ev-import-2').addEventListener('click', () => { close(); openImport(); });
        document.querySelector('#ev-share').addEventListener('click', () => {
          const text = filtered().slice(0, 20).map((e) => '• ' + U.timeLabel(e.ts) + ' — ' + e.title).join('\n');
          const ok = U.share(text || 'رویدادی موجود نیست', 'X28 — رویدادها');
          if (!ok) U.copy(text).then((c) => ui.toast(c ? 'در کلیپ‌بورد کپی شد' : 'اشتراک‌گذاری ممکن نشد', c ? 'ok' : 'err'));
          close();
        });
      });

      const fileInput = root.querySelector('#ev-file');
      function openImport() { fileInput.value = ''; fileInput.click(); }
      root.querySelector('#ev-import').addEventListener('click', openImport);

      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) { ui.toast('فایل بزرگ است (بیشتر از ۴ مگابایت)', 'warn', 3600); return; }
        const reader = new FileReader();
        reader.onload = () => {
          const text = String(reader.result || '');
          const lines = text.split(/\r?\n/).filter((l) => l.trim());
          if (S.state.conn.mode === 'device') {
            X28.device.rawImportLog(file.name, text).then((r) => {
              ui.toast(r.ok ? 'فایل برای پنل ارسال شد' : (r.error || 'ورود ناموفق'), r.ok ? 'ok' : 'err', 4200);
              if (r.ok) S.loadDeviceMeta();
            });
          } else {
            S.addEvent({
              id: U.uid('imp'), ts: Date.now(), level: 'info', cat: 'system',
              title: 'فایل لاگ بررسی شد', msg: 'فایل «' + file.name + '» با ' + F.num(lines.length) + ' خط خوانده شد. در حالت نمایشی فقط خلاصه ثبت می‌شود؛ برای ورود کامل از پنل استفاده کنید.',
              source: 'import'
            });
            ui.toast('فایل بررسی شد (' + F.num(lines.length) + ' خط)', 'ok', 3200);
          }
        };
        reader.readAsText(file);
      });

      function update(state) { render(state); }
      update(S.state);
      return { update };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
