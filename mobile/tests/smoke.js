#!/usr/bin/env node
/**
 * X28 Mobile — UI smoke test (jsdom)
 *
 * Serves the static web app, loads it in jsdom, walks every tab and asserts
 * that the key widgets render without JavaScript errors.
 *
 *   npm install jsdom   # once
 *   node tests/smoke.js
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const WEB = path.join(__dirname, '..', 'web');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.json': 'application/json'
};

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; failures.push(name + (extra ? ' — ' + extra : '')); console.log('  ❌ ' + name + (extra ? ' — ' + extra : '')); }
}
function section(t) { console.log('\n▶ ' + t); }

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(WEB, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(WEB) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.statusCode = 404; res.end('not found'); return;
      }
      res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const server = await serve();
  const port = server.address().port;
  const errors = [];

  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (e) => {
    const msg = String(e && e.message || e);
    if (/Not implemented: HTMLCanvasElement/.test(msg)) return;    // no canvas in jsdom
    if (/Not implemented: Window's scrollTo/.test(msg)) return;    // no layout in jsdom
    errors.push(msg);
  });
  virtualConsole.on('error', (...args) => errors.push(args.join(' ')));

  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/index.html`, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole
  });
  const { window } = dom;
  const doc = window.document;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => Array.from(doc.querySelectorAll(s));

  section('boot');
  for (let i = 0; i < 60 && !window.X28; i++) await sleep(50);
  check('X28 namespace is available', !!window.X28);
  for (let i = 0; i < 80 && !$('#splash.hide'); i++) await sleep(50);
  check('splash screen hides', !!$('#splash.hide'));
  check('5 navigation tabs are rendered', $$('#tabbar .tab-btn').length === 5, String($$('#tabbar .tab-btn').length));

  section('onboarding');
  await sleep(400);
  const ob = $('#onboarding');
  check('onboarding is shown on first run', !!ob && !ob.hidden);
  check('onboarding shows mode choices', $$('#onboarding [data-mode]').length === 2);
  const skip = $('#ob-skip');
  check('skip button exists', !!skip);
  if (skip) skip.click();
  await sleep(400);
  check('onboarding closes after skip', !$('#onboarding') || $('#onboarding').hidden);
  check('app container is visible', !$('#app').hidden);

  section('dashboard');
  check('hero latency value exists', !!$('#hero-rtt'));
  check('4 KPI cards render', $$('.kpi').length >= 4, String($$('.kpi').length));
  check('traffic chart canvas exists', !!$('#dash-chart'));
  check('recent events list is filled', ($('#dash-events') || {}).children.length > 0);
  const rttBefore = $('#hero-rtt').textContent;
  check('latency has a numeric value in demo mode', /\d|۰-۹/.test(rttBefore), rttBefore);

  section('live updates');
  const sampleCountBefore = window.X28.store.state.series.t.length;
  await window.X28.store.demoEngine().tick();
  await sleep(300);
  check('new sample is pushed to history', window.X28.store.state.series.t.length >= sampleCountBefore);
  check('clients are simulated', (window.X28.store.state.live.clients || []).length >= 5);
  check('speed history array exists', Array.isArray(window.X28.store.state.speed.history));

  const tabs = ['signal', 'band', 'network', 'wifi', 'clients', 'events', 'actions', 'plugins', 'settings', 'dashboard'];
  const expect = {
    signal: ['#sig-gauge svg', '#sig-cell', '#sig-advice'],
    band: ['#band-grid .band-btn', '#netmode', '#band-auto'],
    network: ['#net-apn', '#net-tests', '#net-info'],
    wifi: ['#wifi-master-switch', '#wifi-radios', '#wifi-clients'],
    clients: ['#cl-list', '#cl-search', '#cl-filters'],
    events: ['#ev-search', '#ev-cats', '#ev-levels'],
    actions: ['#ac-list', '#ac-audit'],
    plugins: ['#pl-list', '#pl-summary'],
    settings: ['#st-mode', '#st-url', '#st-theme', '#st-about'],
    dashboard: ['#hero-rtt', '#dash-chart']
  };
  for (const tab of tabs) {
    section('tab: ' + tab);
    window.X28.ui.activate(tab, { force: true });
    await sleep(260);
    check('page mounted', !!$('#view .page'), 'no .page');
    (expect[tab] || []).forEach((sel) => check('renders ' + sel, !!$(sel)));
  }

  section('navigation');
  window.X28.ui.activate('dashboard', { force: true });
  await sleep(150);
  const navBtns = $$('#tabbar .tab-btn');
  navBtns[1].click();
  await sleep(300);
  check('bottom navigation switches tabs', window.X28.store.state.ui.tab === 'signal', window.X28.store.state.ui.tab);
  navBtns[4].click();
  await sleep(300);
  check('"more" opens the sheet', !!$('.sheet'));
  check('"more" lists all sections', $$('.sheet [data-more]').length === 6, String($$('.sheet [data-more]').length));
  const wifiMore = $('.sheet [data-more="wifi"]');
  if (wifiMore) wifiMore.click();
  await sleep(400);
  check('selecting a section navigates', window.X28.store.state.ui.tab === 'wifi', window.X28.store.state.ui.tab);

  section('theme + digits');
  const themeBefore = doc.documentElement.getAttribute('data-theme');
  $('#btn-theme').click();
  await sleep(120);
  check('theme toggles', doc.documentElement.getAttribute('data-theme') !== themeBefore);
  window.X28.store.setSetting('theme', themeBefore);
  const digitsBefore = window.X28.fmt.digits();
  window.X28.store.setSetting('digits', digitsBefore === 'fa' ? 'en' : 'fa');
  check('digit mode switches', window.X28.fmt.digits() !== digitsBefore);
  window.X28.store.setSetting('digits', 'en');

  section('actions (demo)');
  const actionRes = await window.X28.store.runAction('band_lock', { band: 'B7' }, { label: 'قفل باند B7' });
  check('band lock action succeeds in demo', !!actionRes.ok, JSON.stringify(actionRes));
  check('live band follows the action', window.X28.store.state.live.band === 'B7', window.X28.store.state.live.band);
  check('audit trail records the action', window.X28.store.state.audit.length > 0);
  const unlock = await window.X28.store.runAction('band_unlock', {}, { label: 'آزادسازی باند' });
  check('band unlock action succeeds', !!unlock.ok);

  section('data export helpers');
  const csv = window.X28.util.csv([['a', 'b'], ['1', '2']]);
  check('csv helper works', csv === 'a,b\n1,2', csv);
  const parsed = window.X28.adapt.status({ signal: { rsrp: -95, sinr: 12 }, network_type: '4G', wan_ip: '10.0.0.2' });
  check('status adapter maps rsrp', parsed.rsrp === -95, String(parsed.rsrp));
  check('status adapter maps network', parsed.network === '4G', parsed.network);
  const events = window.X28.adapt.events({ events: [{ ts: 1700000000, title: 'x', level: 'warn' }] });
  check('events adapter normalises timestamps', events[0].ts === 1700000000000, String(events[0].ts));

  section('errors');
  const relevant = errors.filter((e) =>
    !/Could not load font|css parsing|Could not parse CSS|Not implemented/i.test(e));
  check('no JavaScript errors during the run', relevant.length === 0, relevant.slice(0, 4).join(' | '));

  console.log('\n──────────────────────────────');
  console.log(`  passed: ${pass}   failed: ${fail}`);
  if (failures.length) {
    console.log('  failures:');
    failures.forEach((f) => console.log('   · ' + f));
  }
  console.log('──────────────────────────────');

  window.close();
  server.close();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
