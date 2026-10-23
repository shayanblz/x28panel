/* X28 Mobile — tolerant adapter for the X28 Control Center REST API.
   The panel exposes /api/status, /api/events, /api/actions, /api/plugins,
   /api/config and /api/series. Their exact layout can evolve, so this file
   flattens whatever arrives and looks for well-known keys. Tweak the
   candidate lists below if your firmware/panel build uses other names. */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const A = (X28.adapt = {});

  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  function flatten(obj, prefix, out, depth) {
    out = out || {};
    prefix = prefix || '';
    depth = depth || 0;
    if (!obj || typeof obj !== 'object' || depth > 7) return out;
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      const path = prefix ? prefix + '.' + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out, depth + 1);
      else out[path] = v;
    });
    return out;
  }

  A.flatten = flatten;

  function find(flat, candidates, opts) {
    opts = opts || {};
    const keys = Object.keys(flat);
    const normalized = {};
    keys.forEach((k) => { normalized[norm(k)] = k; });
    for (let i = 0; i < candidates.length; i++) {
      const c = norm(candidates[i]);
      const direct = normalized[c];
      if (direct !== undefined && flat[direct] !== null && flat[direct] !== '') return flat[direct];
    }
    for (let i = 0; i < candidates.length; i++) {
      const c = norm(candidates[i]);
      for (let j = 0; j < keys.length; j++) {
        const nk = norm(keys[j]);
        if (nk.endsWith(c) && flat[keys[j]] !== null && flat[keys[j]] !== '') {
          const val = flat[keys[j]];
          if (opts.skipBooleans && typeof val === 'boolean') continue;
          return val;
        }
      }
    }
    return undefined;
  }

  A.find = find;

  function num(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    const s = String(v).replace(/[^\d.+-]/g, '');
    if (s === '' || s === '-' || s === '+') return null;
    const n = Number(s);
    return isFinite(n) ? n : null;
  }

  function bool(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    const s = String(v).toLowerCase().trim();
    if (['1', 'true', 'yes', 'on', 'up', 'online', 'connected', 'active', 'ok'].indexOf(s) >= 0) return true;
    if (['0', 'false', 'no', 'off', 'down', 'offline', 'disconnected', 'inactive', 'err'].indexOf(s) >= 0) return false;
    return null;
  }

  A.num = num;
  A.bool = bool;

  function normalizeBand(v) {
    if (v === null || v === undefined || v === '') return null;
    const s = String(v).toUpperCase().replace(/\s+/g, '');
    if (s === 'AUTO' || s === '0' || s === 'UNLOCKED') return 'auto';
    let m = s.match(/^N?(\d{1,2})$/);
    if (m) return (s[0] === 'N' ? 'n' : 'B') + Number(m[1]);
    m = s.match(/(?:LTE|5G|NR)[-_]?(?:B|N)?(\d{1,2})/);
    if (m) return (s.indexOf('NR') >= 0 || s.indexOf('5G') >= 0 || s[0] === 'N' ? 'n' : 'B') + Number(m[1]);
    return s.length <= 4 ? s : null;
  }

  A.band = normalizeBand;

  function guessKind(text) {
    const s = String(text || '').toLowerCase();
    if (/iphone|android|samsung|xiaomi|pixel|phone|mobile|redmi|huawei|oppo|vivo/.test(s)) return 'phone';
    if (/ipad|tablet|tab/.test(s)) return 'tablet';
    if (/macbook|laptop|notebook|thinkpad|windows|pc|desktop/.test(s)) return 'laptop';
    if (/tv|television|chromecast|roku|apple-tv/.test(s)) return 'tv';
    if (/camera|ipcam|cam/.test(s)) return 'camera';
    if (/printer|hp-|epson|canon/.test(s)) return 'printer';
    if (/watch/.test(s)) return 'watch';
    if (/speaker|echo|homepod|sonos/.test(s)) return 'speaker';
    if (/router|ap-|repeater|mesh/.test(s)) return 'router';
    if (/esp|shelly|tasmota|sonoff|iot|sensor|smart/.test(s)) return 'iot';
    return 'unknown';
  }

  A.guessKind = guessKind;

  /* find the first array of objects that looks like a device/client list */
  function findClientArray(obj, depth) {
    depth = depth || 0;
    if (!obj || typeof obj !== 'object' || depth > 5) return null;
    if (Array.isArray(obj)) {
      if (obj.length && obj.every((x) => x && typeof x === 'object') &&
          obj.some((x) => x.mac || x.MAC || x.ip || x.IP || x.hostname || x.host_name || x.device_name || x.name)) {
        const keys = Object.keys(obj[0]).map(norm);
        if (keys.some((k) => /mac|ip|host|dhcp|lease|device/.test(k))) return obj;
      }
      return null;
    }
    const priority = ['clients', 'devices', 'leases', 'dhcp_leases', 'hosts', 'stations', 'active_clients', 'wifi_clients'];
    for (let i = 0; i < priority.length; i++) {
      const key = Object.keys(obj).find((k) => norm(k) === norm(priority[i]));
      if (key) {
        const found = Array.isArray(obj[key]) ? obj[key] : findClientArray(obj[key], depth + 1);
        if (found && found.length) return found;
      }
    }
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') continue;
      const found = findClientArray(obj[keys[i]], depth + 1);
      if (found && found.length) return found;
    }
    return null;
  }

  A.status = function (raw) {
    const body = raw && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && Object.keys(raw).length === 1 ? raw.data : raw;
    const flat = flatten(body || {});
    const has = (v) => v !== undefined && v !== null && v !== '';
    const out = {
      online: true,
      operator: has(find(flat, ['operator', 'carrier', 'spn', 'plmn', 'provider'])) ? String(find(flat, ['operator', 'carrier', 'spn', 'plmn', 'provider'])) : null,
      network: has(find(flat, ['network_type', 'net_type', 'network_mode', 'network', 'rat'])) ? String(find(flat, ['network_type', 'net_type', 'network_mode', 'network', 'rat'])) : null,
      band: normalizeBand(find(flat, ['active_band', 'band', 'lte_band', 'nr_band', 'current_band'])),
      bandLock: normalizeBand(find(flat, ['band_lock', 'locked_band', 'bandlock'])),
      rsrp: num(find(flat, ['rsrp', 'rsrp_dbm', 'lte_rsrp', 'nr_rsrp', 'zlt.rsrp', 'signal.rsrp'])),
      rsrq: num(find(flat, ['rsrq', 'rsrq_db', 'lte_rsrq'])),
      sinr: num(find(flat, ['sinr', 'sinr_db', 'snr', 'lte_sinr', 'nr_sinr'])),
      pci: num(find(flat, ['pci', 'physical_cell_id', 'cell_pci'])),
      cellId: has(find(flat, ['cell_id', 'cid', 'cellid', 'cell_identity'])) ? String(find(flat, ['cell_id', 'cid', 'cellid', 'cell_identity'])) : null,
      earfcn: num(find(flat, ['nrarfcn', 'earfcn', 'arfcn', 'freq_earfcn'])),
      latency: num(find(flat, ['rtt_ms', 'latency_ms', 'avg_rtt', 'ping_ms', 'ping.rtt_ms', 'rtt'])),
      jitter: num(find(flat, ['jitter_ms', 'jitter', 'rtt_jitter'])),
      loss: num(find(flat, ['packet_loss', 'loss_pct', 'packet_loss_pct', 'loss'])),
      temp: num(find(flat, ['temperature', 'temp_c', 'temp', 'device_temp'])),
      uptime: num(find(flat, ['uptime', 'uptime_s', 'uptime_seconds', 'sys_uptime', 'system_uptime'])),
      rxBps: num(find(flat, ['rx_bps', 'wan_rx_bps', 'download_bps', 'rx_rate', 'rx_speed', 'snmp.rx_bps'])),
      txBps: num(find(flat, ['tx_bps', 'wan_tx_bps', 'upload_bps', 'tx_rate', 'tx_speed', 'snmp.tx_bps'])),
      totalRx: num(find(flat, ['rx_bytes', 'total_rx', 'wan_rx_bytes', 'wan_rx'])),
      totalTx: num(find(flat, ['tx_bytes', 'total_tx', 'wan_tx_bytes', 'wan_tx'])),
      wanIp: has(find(flat, ['wan_ip', 'wanip', 'wan_ipv4', 'wan.address', 'ipv4'])) ? String(find(flat, ['wan_ip', 'wanip', 'wan_ipv4', 'wan.address'])) : null,
      publicIp: has(find(flat, ['public_ip', 'external_ip', 'pub_ip', 'wan_public_ip'])) ? String(find(flat, ['public_ip', 'external_ip', 'pub_ip'])) : null,
      cgnat: bool(find(flat, ['cgnat', 'is_cgnat'])),
      gateway: has(find(flat, ['gateway', 'wan_gateway', 'default_gateway'])) ? String(find(flat, ['gateway', 'wan_gateway'])) : null,
      dnsMs: num(find(flat, ['dns_ms', 'dns_latency', 'dns_time'])),
      tlsDays: num(find(flat, ['tls_days', 'cert_days', 'certificate_days'])),
      apn: has(find(flat, ['apn', 'apn_name', 'current_apn'])) ? String(find(flat, ['apn', 'apn_name', 'current_apn'])) : null,
      ipv6: bool(find(flat, ['ipv6', 'ipv6_enabled'])),
      mtu: num(find(flat, ['mtu'])),
      networkMode: has(find(flat, ['network_mode', 'preferred_mode'])) ? String(find(flat, ['network_mode', 'preferred_mode'])) : null,
      cellLock: bool(find(flat, ['cell_lock', 'celllock'])) || false,
      clients: [],
      wifi: null,
      profile: {
        model: has(find(flat, ['model', 'device_model', 'model_name'])) ? String(find(flat, ['model', 'device_model'])) : null,
        firmware: has(find(flat, ['firmware', 'fw_version', 'software_version', 'version'])) ? String(find(flat, ['firmware', 'fw_version', 'software_version'])) : null,
        imei: has(find(flat, ['imei'])) ? String(find(flat, ['imei'])) : null,
        iccid: has(find(flat, ['iccid'])) ? String(find(flat, ['iccid'])) : null,
        serial: has(find(flat, ['serial', 'sn', 'serial_number'])) ? String(find(flat, ['serial', 'sn'])) : null
      },
      _flat: flat,
      _raw: body
    };

    const online = bool(find(flat, ['online', 'connected', 'link_up', 'modem_online'], { skipBooleans: true }));
    if (online !== null) out.online = online;
    if (out.loss !== null && out.loss >= 100 && out.latency === null) out.online = false;

    /* clients */
    const arr = findClientArray(body);
    if (arr) {
      out.clients = arr.slice(0, 100).map((c, i) => {
        const cf = flatten(c);
        const name = find(cf, ['hostname', 'host_name', 'name', 'device_name', 'client_name', 'host']) || 'دستگاه ' + (i + 1);
        const mac = find(cf, ['mac', 'mac_address', 'hwaddr', 'macaddr']);
        const ip = find(cf, ['ip', 'ip_address', 'ipv4', 'address']);
        const type = find(cf, ['type', 'device_type', 'category', 'kind', 'os']);
        const onlineV = bool(find(cf, ['online', 'active', 'connected', 'status']));
        return {
          id: String(mac || ip || i),
          name: String(name),
          kind: type ? guessKind(type) : guessKind(name),
          mac: mac ? String(mac) : null,
          ip: ip ? String(ip) : null,
          online: onlineV === null ? true : onlineV,
          rxBps: num(find(cf, ['rx_bps', 'download_bps', 'rx_rate', 'rx_speed', 'rx'])),
          txBps: num(find(cf, ['tx_bps', 'upload_bps', 'tx_rate', 'tx_speed', 'tx'])),
          totalBytes: num(find(cf, ['total_bytes', 'bytes', 'traffic', 'total'])),
          connectedAt: null,
          signal: num(find(cf, ['signal', 'rssi', 'signal_level']))
        };
      }).filter((c) => c.mac || c.ip);
    }

    /* wifi state */
    const ssid = find(flat, ['ssid', 'wifi_ssid', 'wlan_ssid']);
    if (ssid) {
      out.wifi = {
        enabled: bool(find(flat, ['wifi_enabled', 'wlan_enabled', 'wifi_on'])) !== false,
        ssid: String(ssid),
        guest: { enabled: bool(find(flat, ['guest_enabled', 'guest_wifi'])) === true },
        wps: bool(find(flat, ['wps_enabled', 'wps'])) === true,
        channel24: num(find(flat, ['channel_24', 'channel2g', 'wifi_channel_24'])),
        channel5: num(find(flat, ['channel_5', 'channel5g', 'wifi_channel_5'])),
        w24: true,
        w5: true,
        security: has(find(flat, ['security', 'encryption', 'wifi_security'])) ? String(find(flat, ['security', 'encryption'])) : 'WPA2/WPA3',
        txPower: has(find(flat, ['tx_power', 'txpower'])) ? String(find(flat, ['tx_power', 'txpower'])) : null
      };
    }

    return out;
  };

  /* ── series ─────────────────────────────────────────────────────────── */
  A.series = function (raw, keys) {
    keys = keys || [];
    const out = { t: [] };
    keys.forEach((k) => { out[k] = []; });
    if (!raw) return out;

    let src = raw;
    if (raw.data && (Array.isArray(raw.data) || raw.data.series || raw.data.points)) src = raw.data;
    const map = {};
    const push = (ts, key, value) => {
      if (!ts || value === null || value === undefined || isNaN(value)) return;
      map[key] = map[key] || [];
      map[key].push([Number(ts), Number(value)]);
    };

    if (Array.isArray(src)) {
      src.forEach((row) => {
        if (!row || typeof row !== 'object') return;
        const ts = num(row.t || row.ts || row.time || row.timestamp || row.x);
        keys.forEach((k) => {
          const short = k.split('.').pop();
          const v = num(row[k] !== undefined ? row[k] : row[short] !== undefined ? row[short] : row.value);
          if (v !== null) push(ts, k, v);
        });
      });
    } else if (src && typeof src === 'object') {
      const container = src.series || src.keys || src.data || {};
      keys.forEach((k) => {
        const short = k.split('.').pop();
        const arr = container[k] || container[short] || src[k] || src[short];
        if (!Array.isArray(arr)) return;
        arr.forEach((pt) => {
          if (Array.isArray(pt)) push(pt[0], k, num(pt[1]));
          else if (pt && typeof pt === 'object') push(num(pt.t || pt.ts || pt.time || pt.timestamp), k, num(pt.v !== undefined ? pt.v : pt.value));
          else if (typeof pt === 'number') push(null, k, pt);
        });
      });
    }

    /* merge all timestamps */
    const set = {};
    Object.keys(map).forEach((k) => map[k].forEach((p) => { set[p[0]] = true; }));
    const ts = Object.keys(set).map(Number).sort((a, b) => a - b);
    out.t = ts;
    keys.forEach((k) => {
      const lookup = {};
      (map[k] || []).forEach((p) => { lookup[p[0]] = p[1]; });
      out[k] = ts.map((t) => (lookup[t] === undefined ? null : lookup[t]));
    });
    return out;
  };

  /* ── events ─────────────────────────────────────────────────────────── */
  A.events = function (raw) {
    const body = raw && raw.data !== undefined ? raw.data : raw;
    let arr = [];
    if (Array.isArray(body)) arr = body;
    else if (body && Array.isArray(body.events)) arr = body.events;
    else if (body && Array.isArray(body.items)) arr = body.items;
    else if (body && body.data && Array.isArray(body.data.events)) arr = body.data.events;
    return arr.map((e, i) => ({
      id: String(e.id || e.uid || 'ev-' + i),
      ts: Number(e.ts || e.time || e.timestamp || e.created_at || Date.now()) * (String(e.ts || e.time || e.timestamp || '').length <= 10 ? 1000 : 1),
      level: String(e.level || e.severity || 'info').toLowerCase(),
      cat: String(e.category || e.cat || e.source || 'system').toLowerCase(),
      title: String(e.title || e.message || e.msg || 'رویداد'),
      msg: String(e.detail || e.description || e.msg || ''),
      source: String(e.source || 'panel')
    }));
  };

  /* ── actions ────────────────────────────────────────────────────────── */
  A.actions = function (raw) {
    const body = raw && raw.data !== undefined ? raw.data : raw;
    const arr = Array.isArray(body) ? body : (body && (body.actions || body.items)) || [];
    return arr.map((a) => ({
      name: String(a.name || a.id || ''),
      label: String(a.label || a.title || a.name || 'عملیات'),
      plugin: String(a.plugin || a.source || 'panel'),
      danger: !!a.danger,
      description: String(a.description || a.help || ''),
      params: Array.isArray(a.params) ? a.params.map((p) => ({
        key: p.key || p.name, label: p.label || p.key || '', type: p.type || 'str',
        default: p.default, help: p.help || '', options: p.options || null
      })) : []
    })).filter((a) => a.name);
  };

  /* ── plugins ────────────────────────────────────────────────────────── */
  A.plugins = function (raw) {
    const body = raw && raw.data !== undefined ? raw.data : raw;
    const arr = Array.isArray(body) ? body : (body && (body.plugins || body.items)) || [];
    return arr.map((p) => ({
      id: String(p.id || p.plugin || ''),
      name: String(p.name || p.id || ''),
      icon: p.icon || '★',
      description: String(p.description || ''),
      kind: String(p.kind || 'monitor'),
      interval: Number(p.interval || 0),
      enabled: p.enabled === undefined ? true : !!p.enabled,
      emits: p.emits || [],
      schema: Array.isArray(p.config_schema) ? p.config_schema : (Array.isArray(p.schema) ? p.schema : []),
      note: p.note || ''
    })).filter((p) => p.id);
  };

  A.config = function (raw) {
    const body = raw && raw.data !== undefined ? raw.data : raw;
    return body && typeof body === 'object' ? body : {};
  };
})(typeof window !== 'undefined' ? window : globalThis);
