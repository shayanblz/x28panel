/* X28 Mobile — tab 6: connected clients */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  X28.tabs.register('clients', {
    label: 'کلاینت‌ها',
    icon: 'users',
    mount(root) {
      root.innerHTML = ui.pageHead('کلاینت‌ها', 'دستگاه‌های متصل به شبکهٔ محلی',
        '<button class="icon-btn" id="cl-refresh" aria-label="به‌روزرسانی">' + I('refresh', 20) + '</button>') +
        '<div class="stack">' +
        '<section class="card">' +
        '  <div class="row" style="gap:12px">' +
        '    <div class="ring-wrap" style="width:74px;height:74px" id="cl-ring">' +
        '      <div class="ring-center"><b id="cl-online" style="font-size:21px">—</b><span>آنلاین</span></div>' +
        '    </div>' +
        '    <div class="grow">' +
        '      <div class="row-title" id="cl-summary">در حال خواندن…</div>' +
        '      <div class="row-sub" id="cl-sub">—</div>' +
        '      <div class="pill-row" style="margin-top:7px" id="cl-pills"></div>' +
        '    </div>' +
        '  </div>' +
        '</section>' +

        '<div class="row" style="gap:8px">' +
        '  <div class="input-group grow"><input class="input" id="cl-search" placeholder="جست‌وجوی دستگاه…" style="height:40px;font-size:12.5px" />' +
        '  <span class="input-suffix">' + I('search', 15) + '</span></div>' +
        '  <button class="icon-btn" id="cl-sort" style="height:40px;width:40px" aria-label="ترتیب">' + I('filter', 18) + '</button>' +
        '</div>' +

        '<div class="chips" id="cl-filters"></div>' +

        '<section class="card list" id="cl-list" style="padding:2px 4px"></section>' +
        '<div id="cl-empty" hidden></div>' +
        '</div>';

      X28.icons.mount(root);
      const list = root.querySelector('#cl-list');
      const emptyHost = root.querySelector('#cl-empty');
      const filtersHost = root.querySelector('#cl-filters');
      const searchInput = root.querySelector('#cl-search');

      let filter = 'all';
      let sort = 'traffic';
      let query = '';
      let renderedKey = '';
      let rowsById = {};

      const ringHost = root.querySelector('#cl-ring');
      const ring = X28.charts.ring(ringHost, { size: 74, stroke: 6, colorFrom: '#38bdf8', colorMid: '#22d3a6', colorTo: '#2ee6ae' });
      ringHost.insertAdjacentHTML('beforeend', '<div class="ring-center"><b id="cl-online" style="font-size:21px">—</b><span>آنلاین</span></div>');

      function clients(state) { return state.live.clients || []; }

      function filtered(state) {
        let arr = clients(state).slice();
        if (filter === 'online') arr = arr.filter((c) => c.online);
        if (filter === 'offline') arr = arr.filter((c) => !c.online);
        if (query) {
          const q = query.toLowerCase();
          arr = arr.filter((c) => (c.name + ' ' + (c.ip || '') + ' ' + (c.mac || '')).toLowerCase().indexOf(q) >= 0);
        }
        if (sort === 'traffic') arr.sort((a, b) => (b.rxBps + b.txBps) - (a.rxBps + a.txBps));
        else if (sort === 'name') arr.sort((a, b) => String(a.name).localeCompare(String(b.name), 'fa'));
        else arr.sort((a, b) => (a.online === b.online ? 0 : a.online ? -1 : 1));
        return arr;
      }

      function rowFor(c) {
        const tone = c.kind === 'tv' ? 'sky' : c.kind === 'phone' ? 'brand' : c.kind === 'laptop' ? 'violet' : c.kind === 'camera' ? 'amber' : '';
        return '<div class="client-row" data-client="' + U.esc(c.id) + '" role="button" tabindex="0">' +
          '<span class="dev-avatar ' + tone + ' ' + (c.online ? '' : 'off') + '">' + I(F.deviceIcon(c.kind), 20) + '<span class="on-dot"></span></span>' +
          '<span class="row-main"><span class="row-title">' + U.esc(c.name) + '</span>' +
          '<span class="row-sub"><span class="mono" style="font-size:10.5px">' + U.esc(c.ip || '—') + '</span>' +
          '<span class="dot-sep"></span><span>' + U.esc(F.deviceKindLabel(c.kind)) + '</span>' +
          (c.channel ? '<span class="dot-sep"></span><span>' + U.esc(c.channel) + '</span>' : '') + '</span></span>' +
          '<span class="row-end" style="flex-direction:column;align-items:flex-end;gap:1px">' +
          '<span class="dev-traffic js-rx" style="color:var(--brand)">↓ ' + U.esc(F.bps(c.rxBps)) + '</span>' +
          '<span class="dev-traffic js-tx" style="color:var(--sky)">↑ ' + U.esc(F.bps(c.txBps)) + '</span></span>' +
          '<span style="color:var(--muted-2);display:grid;place-items:center">' + I('chevronLeft', 15) + '</span>' +
          '</div>';
      }

      function render(state) {
        const all = clients(state);
        const online = all.filter((c) => c.online).length;
        const arr = filtered(state);
        const key = sort + '|' + filter + '|' + query + '|' + arr.map((c) => c.id + (c.online ? '1' : '0')).join(',');
        rowsById = {};
        arr.forEach((c) => { rowsById[c.id] = c; });

        if (key !== renderedKey) {
          renderedKey = key;
          list.innerHTML = arr.length ? arr.map(rowFor).join('') : '';
          emptyHost.innerHTML = arr.length ? '' : ui.empty({
            icon: all.length ? 'search' : 'wifi',
            title: all.length ? 'دستگاهی با این مشخصات پیدا نشد' : 'هنوز دستگاهی متصل نشده',
            sub: all.length ? 'فیلتر یا عبارت جست‌وجو را تغییر دهید.' : 'پس از اتصال گوشی یا لپ‌تاپ به وای‌فای، اینجا نمایش داده می‌شود.'
          });
          emptyHost.hidden = !!arr.length;
          list.hidden = !arr.length;
        } else {
          arr.forEach((c) => {
            const row = Array.prototype.find.call(list.querySelectorAll('[data-client]'), (r) => r.getAttribute('data-client') === String(c.id));
            if (!row) return;
            row.querySelector('.js-rx').textContent = '↓ ' + F.bps(c.rxBps);
            row.querySelector('.js-tx').textContent = '↑ ' + F.bps(c.txBps);
            row.querySelector('.on-dot').parentElement.classList.toggle('off', !c.online);
          });
        }

        root.querySelector('#cl-online').textContent = F.num(online);
        ring.set(all.length ? Math.round((online / all.length) * 100) : 0);
        const best = all.slice().sort((a, b) => (b.rxBps + b.txBps) - (a.rxBps + a.txBps))[0];
        root.querySelector('#cl-summary').textContent = all.length ? F.num(all.length) + ' دستگاه شناسایی شد' : 'در انتظار دستگاه‌ها';
        root.querySelector('#cl-sub').textContent = all.length
          ? (best ? 'پرمصرف‌ترین: ' + best.name + ' · ' + F.bps(best.rxBps + best.txBps) : '')
          : 'با روشن‌بودن وای‌فای، فهرست به‌صورت خودکار تکمیل می‌شود';
        root.querySelector('#cl-pills').innerHTML =
          '<span class="badge ok">' + F.num(online) + ' آنلاین</span>' +
          (all.length - online ? '<span class="badge neutral">' + F.num(all.length - online) + ' آفلاین</span>' : '') +
          '<span class="badge info">' + F.num(all.length) + ' کل</span>';

        const counts = { all: all.length, online, offline: all.length - online };
        filtersHost.innerHTML = [
          ['all', 'همه', counts.all],
          ['online', 'آنلاین', counts.online],
          ['offline', 'آفلاین', counts.offline]
        ].map((f) => '<button class="chip ' + (filter === f[0] ? 'active' : '') + '" data-filter="' + f[0] + '">' +
          f[1] + '<span class="count">' + F.num(f[2]) + '</span></button>').join('');
        filtersHost.querySelectorAll('[data-filter]').forEach((btn) => {
          btn.addEventListener('click', () => { filter = btn.getAttribute('data-filter'); render(S.state); });
        });
      }

      root.querySelector('#cl-sort').addEventListener('click', () => {
        sort = sort === 'traffic' ? 'name' : sort === 'name' ? 'status' : 'traffic';
        ui.toast('چیدمان: ' + (sort === 'traffic' ? 'پرمصرف‌ترین' : sort === 'name' ? 'نام' : 'آنلاین‌ها'), 'info', 1600);
        render(S.state);
      });

      let t = 0;
      searchInput.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { query = searchInput.value.trim(); render(S.state); }, 180);
      });

      root.querySelector('#cl-refresh').addEventListener('click', () => {
        if (S.state.conn.mode === 'demo') {
          const e = S.demoEngine();
          if (e) e.tick();
          ui.toast('فهرست به‌روز شد', 'ok', 1600);
        } else {
          const action = W.resolveAction(['clients', 'refresh_clients', 'devwatch']);
          S.runAction(action ? action.name : 'clients', {}, { label: 'به‌روزرسانی کلاینت‌ها' }).then((r) => {
            ui.toast(r && r.ok ? 'درخواست ارسال شد' : (r && (r.error || r.message)) || 'ناموفق', r && r.ok ? 'ok' : 'err', 2600);
          });
        }
      });

      function open(c) {
        if (!c) return;
        W.openClient(c);
      }

      U.on(list, 'click', '[data-client]', (e, row) => open(rowsById[row.getAttribute('data-client')]));
      U.on(list, 'keydown', '[data-client]', (e, row) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(rowsById[row.getAttribute('data-client')]); }
      });

      function update(state) { render(state); }
      update(S.state);
      return { update };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
