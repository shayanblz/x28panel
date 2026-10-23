/* X28 Mobile — formatting, bands, signal quality heuristics */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const F = (X28.fmt = {});

  const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let digitMode = 'en';

  F.setDigits = (mode) => { digitMode = mode === 'fa' ? 'fa' : 'en'; };
  F.digits = () => digitMode;
  F.toFa = (s) => String(s).replace(/[0-9]/g, (d) => FA[+d]);
  F.localizeDigits = (s) => (digitMode === 'fa' ? F.toFa(s) : String(s));

  F.num = function (value, decimals) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const d = decimals === undefined ? 0 : decimals;
    let out = Number(value).toFixed(d);
    if (d > 0) out = out.replace(/\.?0+$/, (m) => (m.indexOf('.') === 0 ? '' : m));
    out = out.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return F.localizeDigits(out);
  };

  F.fixed = function (value, decimals) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return F.localizeDigits(Number(value).toFixed(decimals === undefined ? 1 : decimals));
  };

  F.signed = function (value, decimals) {
    const v = Number(value);
    if (isNaN(v)) return '—';
    return (v > 0 ? '+' : '') + F.fixed(v, decimals === undefined ? 1 : decimals);
  };

  F.bytes = function (bytes, perSecond) {
    if (bytes === null || bytes === undefined || isNaN(bytes)) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let v = Math.abs(Number(bytes)), i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    const dec = i === 0 ? 0 : v >= 100 ? 0 : v >= 10 ? 1 : 2;
    return F.fixed(v, dec) + ' ' + units[i] + (perSecond ? '/s' : '');
  };

  F.bps = function (bps) {
    if (bps === null || bps === undefined || isNaN(bps)) return '—';
    const v = Math.abs(Number(bps));
    if (v >= 1e9) return F.fixed(v / 1e9, 2) + ' Gbps';
    if (v >= 1e6) return F.fixed(v / 1e6, v >= 1e7 ? 0 : 1) + ' Mbps';
    if (v >= 1e3) return F.fixed(v / 1e3, 0) + ' Kbps';
    return F.fixed(v, 0) + ' bps';
  };

  F.bpsValue = function (bps) {
    if (bps === null || bps === undefined || isNaN(bps)) return { value: 0, unit: 'Mbps' };
    const v = Math.abs(Number(bps));
    if (v >= 1e9) return { value: v / 1e9, unit: 'Gbps' };
    if (v >= 1e6) return { value: v / 1e6, unit: 'Mbps' };
    if (v >= 1e3) return { value: v / 1e3, unit: 'Kbps' };
    return { value: v, unit: 'bps' };
  };

  F.dbm = (v) => (v === null || v === undefined || isNaN(v) ? '—' : F.fixed(v, 0) + ' dBm');
  F.db = (v) => (v === null || v === undefined || isNaN(v) ? '—' : F.fixed(v, 1) + ' dB');
  F.ms = (v) => (v === null || v === undefined || isNaN(v) ? '—' : F.fixed(v, v < 10 ? 1 : 0) + ' ms');
  F.pct = (v, d) => (v === null || v === undefined || isNaN(v) ? '—' : F.fixed(v, d === undefined ? 0 : d) + '٪');

  F.temp = (v) => (v === null || v === undefined || isNaN(v) ? '—' : F.fixed(v, 0) + '°');

  F.ip = (v) => (v ? String(v) : '—');

  F.maskImei = (imei) => {
    if (!imei) return '—';
    const s = String(imei);
    return s.length > 6 ? s.slice(0, 4) + '••••••' + s.slice(-3) : s;
  };

  /* ── signal quality ─────────────────────────────────────────────────── */
  const TONE_LABEL = {
    good: 'عالی', ok: 'خوب', fair: 'متوسط', weak: 'ضعیف', bad: 'خیلی ضعیف'
  };

  function grader(value, steps) {
    if (value === null || value === undefined || isNaN(value)) {
      return { level: 0, label: 'نامشخص', tone: 'idle', pct: 0, color: 'var(--muted)' };
    }
    for (let i = 0; i < steps.length; i++) {
      if (value >= steps[i].min) {
        return {
          level: steps[i].level, label: steps[i].label, tone: steps[i].tone,
          pct: steps[i].pct, color: steps[i].color
        };
      }
    }
    const last = steps[steps.length - 1];
    return { level: 0, label: last.label, tone: 'bad', pct: 4, color: 'var(--rose)' };
  }

  F.rsrp = (v) => grader(v, [
    { min: -80, level: 4, label: TONE_LABEL.good, tone: 'ok', pct: 100, color: 'var(--brand)' },
    { min: -90, level: 3, label: TONE_LABEL.ok, tone: 'ok', pct: 78, color: 'var(--brand)' },
    { min: -100, level: 2, label: TONE_LABEL.fair, tone: 'warn', pct: 55, color: 'var(--amber)' },
    { min: -110, level: 1, label: TONE_LABEL.weak, tone: 'warn', pct: 30, color: 'var(--amber)' },
    { min: -140, level: 0, label: TONE_LABEL.bad, tone: 'bad', pct: 10, color: 'var(--rose)' }
  ]);

  F.rsrq = (v) => grader(v, [
    { min: -10, level: 4, label: TONE_LABEL.good, tone: 'ok', pct: 100, color: 'var(--brand)' },
    { min: -15, level: 3, label: TONE_LABEL.ok, tone: 'ok', pct: 74, color: 'var(--brand)' },
    { min: -20, level: 2, label: TONE_LABEL.fair, tone: 'warn', pct: 48, color: 'var(--amber)' },
    { min: -30, level: 1, label: TONE_LABEL.weak, tone: 'warn', pct: 22, color: 'var(--amber)' },
    { min: -60, level: 0, label: TONE_LABEL.bad, tone: 'bad', pct: 8, color: 'var(--rose)' }
  ]);

  F.sinr = (v) => grader(v, [
    { min: 20, level: 4, label: TONE_LABEL.good, tone: 'ok', pct: 100, color: 'var(--brand)' },
    { min: 13, level: 3, label: TONE_LABEL.ok, tone: 'ok', pct: 76, color: 'var(--brand)' },
    { min: 5, level: 2, label: TONE_LABEL.fair, tone: 'warn', pct: 50, color: 'var(--amber)' },
    { min: 0, level: 1, label: TONE_LABEL.weak, tone: 'warn', pct: 24, color: 'var(--amber)' },
    { min: -20, level: 0, label: TONE_LABEL.bad, tone: 'bad', pct: 8, color: 'var(--rose)' }
  ]);

  F.bars = function (rsrp) {
    const lv = F.rsrp(rsrp);
    const bars = [1, 2, 3, 4, 5];
    return { count: Math.max(0, lv.level), tone: lv.tone, bars };
  };

  F.signalToneClass = (tone) => (tone === 'ok' ? '' : tone === 'warn' ? 'warn' : tone === 'bad' ? 'bad' : '');

  /* ── bands ──────────────────────────────────────────────────────────── */
  const BANDS = {
    B1: { band: 'B1', mhz: 2100, kind: 'LTE', label: '۲۱۰۰' },
    B3: { band: 'B3', mhz: 1800, kind: 'LTE', label: '۱۸۰۰' },
    B5: { band: 'B5', mhz: 850, kind: 'LTE', label: '۸۵۰' },
    B7: { band: 'B7', mhz: 2600, kind: 'LTE', label: '۲۶۰۰' },
    B8: { band: 'B8', mhz: 900, kind: 'LTE', label: '۹۰۰' },
    B20: { band: 'B20', mhz: 800, kind: 'LTE', label: '۸۰۰' },
    B28: { band: 'B28', mhz: 700, kind: 'LTE', label: '۷۰۰' },
    B38: { band: 'B38', mhz: 2600, kind: 'LTE', label: '۲۶۰۰ TDD' },
    B40: { band: 'B40', mhz: 2300, kind: 'LTE', label: '۲۳۰۰ TDD' },
    B41: { band: 'B41', mhz: 2500, kind: 'LTE', label: '۲۵۰۰ TDD' },
    n28: { band: 'n28', mhz: 700, kind: '5G', label: '۷۰۰' },
    n41: { band: 'n41', mhz: 2500, kind: '5G', label: '۲۵۰۰' },
    n78: { band: 'n78', mhz: 3500, kind: '5G', label: '۳۵۰۰' },
    n79: { band: 'n79', mhz: 4700, kind: '5G', label: '۴۷۰۰' }
  };

  F.BANDS = BANDS;
  F.LOCKABLE = ['B1', 'B3', 'B5', 'B7', 'B8', 'B20', 'B28', 'B38', 'B40', 'B41', 'n28', 'n41', 'n78', 'n79'];

  F.bandInfo = function (band) {
    if (!band) return { band: '—', mhz: null, kind: '—', label: '—' };
    const key = String(band).trim();
    return BANDS[key] || { band: key, mhz: null, kind: key.toLowerCase().startsWith('n') ? '5G' : 'LTE', label: '—' };
  };

  F.bandLabel = function (band) {
    const b = F.bandInfo(band);
    return b.mhz ? b.kind + ' ' + b.band + ' · ' + b.mhz + ' MHz' : b.band;
  };

  F.networkLabel = function (net) {
    const map = {
      '4g': '4G', '4g+': '4G+', '5g': '5G', '5g+': '5G+', '3g': '3G', '2g': '2G',
      lte: '4G', nr: '5G', nr5g: '5G', auto: 'خودکار'
    };
    return map[String(net || '').toLowerCase()] || (net || '—');
  };

  F.operatorName = function (op) {
    const map = { mci: 'همراه اول', irancell: 'ایرانسل', rightel: 'رایتل', mtn: 'ایرانسل' };
    return map[String(op || '').toLowerCase()] || (op || '—');
  };

  F.deviceIcon = function (kind) {
    const map = {
      phone: 'smartphone', mobile: 'smartphone', tablet: 'tablet', laptop: 'laptop',
      desktop: 'monitor', tv: 'tv', camera: 'camera', printer: 'printer', iot: 'cpu',
      router: 'wifi', console: 'gamepad', speaker: 'speaker', watch: 'watch'
    };
    return map[String(kind || '').toLowerCase()] || 'device';
  };

  F.deviceKindLabel = function (kind) {
    const map = {
      phone: 'گوشی', mobile: 'گوشی', tablet: 'تبلت', laptop: 'لپ‌تاپ', desktop: 'کامپیوتر',
      tv: 'تلویزیون', camera: 'دوربین', printer: 'پرینتر', iot: 'اینترنت اشیا',
      router: 'روتر', console: 'کنسول بازی', speaker: 'اسپیکر', watch: 'ساعت هوشمند', unknown: 'ناشناس'
    };
    return map[String(kind || '').toLowerCase()] || 'دستگاه';
  };

  F.catLabel = function (cat) {
    const map = {
      alert: 'هشدار', session: 'اتصال', signal: 'سیگنال', band: 'باند', wifi: 'وای‌فای',
      client: 'کلاینت', system: 'سیستم', security: 'امنیت', network: 'شبکه', speed: 'سرعت',
      panel: 'پنل', plugin: 'پلاگین', info: 'اطلاع', warn: 'هشدار', critical: 'بحرانی', action: 'عملیات'
    };
    return map[String(cat || '').toLowerCase()] || (cat || 'رویداد');
  };

  F.levelLabel = function (level) {
    const map = { critical: 'بحرانی', crit: 'بحرانی', error: 'خطا', warn: 'هشدار', warning: 'هشدار', info: 'اطلاع', ok: 'سالم', debug: 'دیباگ' };
    return map[String(level || '').toLowerCase()] || (level || '—');
  };

  F.levelTone = function (level) {
    const l = String(level || '').toLowerCase();
    if (l === 'critical' || l === 'crit' || l === 'error') return 'err';
    if (l === 'warn' || l === 'warning') return 'warn';
    if (l === 'ok' || l === 'success') return 'ok';
    return 'info';
  };
})(typeof window !== 'undefined' ? window : globalThis);
