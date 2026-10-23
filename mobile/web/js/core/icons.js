/* X28 Mobile — inline icon set (stroke, 24px grid) */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});

  const P = {
    dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="2.2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2"/>',
    signal: '<path d="M4 20v-3.5M9.3 20v-7M14.7 20V8.6M20 20V4.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12.6 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3.2 9h17.6M3.2 15h17.6"/><path d="M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    apps: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    wifi: '<path d="M2.5 8.5a15 15 0 0 1 19 0"/><path d="M5.5 12a10.5 10.5 0 0 1 13 0"/><path d="M8.5 15.4a6 6 0 0 1 7 0"/><circle cx="12" cy="19" r="1.1" fill="currentColor" stroke="none"/>',
    wifiOff: '<path d="M2.5 8.5a15 15 0 0 1 6-3.3M15.5 5.6a15 15 0 0 1 6 2.9"/><path d="M5.5 12a10.5 10.5 0 0 1 4.2-2.3M16.6 10.4a10.5 10.5 0 0 1 1.9 1.6"/><path d="M8.5 15.4a6 6 0 0 1 5.2-.9"/><circle cx="12" cy="19" r="1.1" fill="currentColor" stroke="none"/><path d="m3 3 18 18"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c0-3.4 2.8-5.6 6.2-5.6s6.2 2.2 6.2 5.6"/><path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.6"/><path d="M18.5 14.9c1.7.8 2.8 2.3 2.8 4.4"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.4 5.4 2 6.2.3.4 0 1-.5 1H4.5c-.5 0-.8-.6-.5-1C4.6 14.4 6 13 6 9Z"/><path d="M9.5 19.5a2.8 2.8 0 0 0 5 0"/>',
    list: '<path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12"/><circle cx="4" cy="6.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="17.5" r="1.1" fill="currentColor" stroke="none"/>',
    bolt: '<path d="M13.4 2.5 4.6 13.2c-.4.5 0 1.2.6 1.2H11l-1.2 7.1c-.1.7.8 1.1 1.2.5l8.8-10.7c.4-.5 0-1.2-.6-1.2H13l1.2-7.1c.1-.7-.8-1.1-1.2-.5Z"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.4"/><circle cx="8" cy="17" r="2.4"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.6v2.6M12 18.8v2.6M4.4 7.6l2.2 1.3M17.4 15.1l2.2 1.3M4.4 16.4l2.2-1.3M17.4 8.9l2.2-1.3M2.6 12h2.6M18.8 12h2.6"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.3"/><path d="M20 5.5V11h-5.5"/>',
    moon: '<path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.7 8.7 0 1 0 10.7 10.7Z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2M12 19.6v2M2.4 12h2M19.6 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
    chevronLeft: '<path d="m14.5 18-6-6 6-6"/>',
    chevronRight: '<path d="m9.5 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    alert: '<path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4.2"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.7" r="1" fill="currentColor" stroke="none"/>',
    activity: '<path d="M2.5 12h4l2.4-7 4.6 14 2.5-7h5.5"/>',
    download: '<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 17.5v1.6c0 1 .7 1.7 1.7 1.7h12.6c1 0 1.7-.7 1.7-1.7v-1.6"/>',
    upload: '<path d="M12 15.5v-11M7.5 8.5 12 4l4.5 4.5"/><path d="M4 17.5v1.6c0 1 .7 1.7 1.7 1.7h12.6c1 0 1.7-.7 1.7-1.7v-1.6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.2V12l3.2 2"/>',
    arrowDown: '<path d="M12 4.5v15M6 13.5l6 6 6-6"/>',
    arrowUp: '<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>',
    gauge: '<path d="M4.2 18.5a9 9 0 1 1 15.6 0"/><path d="m12 13.5 4-4"/><circle cx="12" cy="14" r="1.6"/>',
    speed: '<path d="M3.5 18a9.5 9.5 0 1 1 17 0"/><path d="m12 12.8 4.6-3.6"/><circle cx="12" cy="13.6" r="1.7"/><path d="M5.5 18h13"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10.5" rx="3"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none"/>',
    unlock: '<rect x="4.5" y="10" width="15" height="10.5" rx="3"/><path d="M8 10V7.5a4 4 0 0 1 7.7-1.5"/>',
    tower: '<path d="M7 20 10 8h4l3 12"/><path d="M8.5 15h7"/><path d="M6.4 5.2a7.9 7.9 0 0 1 11.2 0M3.8 2.6a11.6 11.6 0 0 1 16.4 0"/>',
    smartphone: '<rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.5 18.6h3"/>',
    tablet: '<rect x="3.5" y="3" width="17" height="18" rx="3"/><path d="M10.5 17.8h3"/>',
    laptop: '<rect x="4" y="5" width="16" height="10.5" rx="2"/><path d="M2.5 19h19l-1.3-2.2H3.8L2.5 19Z"/>',
    monitor: '<rect x="2.8" y="4" width="18.4" height="12" rx="2.2"/><path d="M8.5 20h7M12 16.2V20"/>',
    tv: '<rect x="3" y="5" width="18" height="12.5" rx="2.4"/><path d="m8 2.8 4 2.2 4-2.2M8.5 20.5h7"/>',
    camera: '<path d="M4 8.5h2.6L8.2 6h7.6l1.6 2.5H20a1.5 1.5 0 0 1 1.5 1.5v7.5A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5V10A1.5 1.5 0 0 1 4 8.5Z"/><circle cx="12" cy="13.6" r="3.4"/>',
    printer: '<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8" rx="2.2"/><path d="M7 13h10v7.5H7z"/><path d="M17.2 11h.2"/>',
    cpu: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/><rect x="9.8" y="9.8" width="4.4" height="4.4" rx="1"/><path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21"/>',
    gamepad: '<path d="M7.2 8.5h9.6c2.7 0 4.5 1.9 4.7 4.6l.2 3c.1 1.9-1.4 3.4-3.2 3-1.1-.2-2-1-2.6-2.1h-7.8c-.6 1.1-1.5 1.9-2.6 2.1-1.8.4-3.3-1.1-3.2-3l.2-3c.2-2.7 2-4.6 4.7-4.6Z"/><path d="M8 11.5v3M6.5 13h3M15.5 12.5h.1M18 14h.1"/>',
    speaker: '<rect x="6" y="2.8" width="12" height="18.4" rx="3"/><circle cx="12" cy="8.5" r="2.2"/><circle cx="12" cy="15.8" r="2.8"/>',
    watch: '<rect x="7" y="6.5" width="10" height="11" rx="3"/><path d="M9.5 6.5 10 2.8h4l.5 3.7M9.5 17.5 10 21.2h4l.5-3.7"/><path d="M12 10v2.3l1.6 1"/>',
    device: '<rect x="3" y="4" width="18" height="14" rx="2.5"/><path d="M9 21h6M12 18v3"/>',
    router: '<rect x="2.8" y="12" width="18.4" height="7.5" rx="2.4"/><path d="M6.5 15.7h.1M10 15.7h.1"/><path d="M8 9.5a5.6 5.6 0 0 1 8 0M5.4 6.8a9.4 9.4 0 0 1 13.2 0"/>',
    share: '<circle cx="18" cy="5.5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="18.5" r="2.6"/><path d="m8.3 10.7 7.4-3.9M8.3 13.3l7.4 3.9"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.6"/><path d="M15.5 5.5v-.4A2.6 2.6 0 0 0 12.9 2.5H6.1A2.6 2.6 0 0 0 3.5 5.1v6.8a2.6 2.6 0 0 0 2.6 2.6h.4"/>',
    trash: '<path d="M4 6.5h16M9.5 6.5V4.2c0-.9.7-1.7 1.7-1.7h1.6c1 0 1.7.8 1.7 1.7v2.3"/><path d="M6.3 6.5 7 19.2c.1 1.3 1.1 2.3 2.4 2.3h5.2c1.3 0 2.3-1 2.4-2.3l.7-12.7"/><path d="M10.2 10.5v7M13.8 10.5v7"/>',
    power: '<path d="M12 3v8.5"/><path d="M7.2 5.9a8 8 0 1 0 9.6 0"/>',
    reboot: '<path d="M3.5 11a8.5 8.5 0 1 1 2.6 7.4"/><path d="M3.2 5.6V11h5.4"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="3.2"/><path d="M4 5.5v6c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2v-6"/><path d="M4 11.5v6c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2v-6"/>',
    shield: '<path d="M12 2.8 4.8 5.6v6c0 4.4 3 8 7.2 9.6 4.2-1.6 7.2-5.2 7.2-9.6v-6L12 2.8Z"/><path d="m9 12 2.2 2.2L15.3 10"/>',
    server: '<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><path d="M7 7h.1M7 17h.1M11 7h6M11 17h6"/>',
    cloud: '<path d="M7.5 19a5 5 0 0 1-.6-9.9 6.2 6.2 0 0 1 11.8 1.7A4.1 4.1 0 0 1 18 19H7.5Z"/>',
    search: '<circle cx="11" cy="11" r="6.8"/><path d="m16 16 5 5"/>',
    play: '<path d="M7.5 4.8v14.4c0 .8.9 1.3 1.6.9l11-7.2c.6-.4.6-1.4 0-1.8l-11-7.2c-.7-.4-1.6.1-1.6.9Z"/>',
    pause: '<rect x="6.5" y="4.5" width="4" height="15" rx="1.4"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="m4 16.7-.8 4.1 4.1-.8L20 7.3a2.2 2.2 0 0 0-3.1-3.1L4 16.7Z"/><path d="m14.8 6.2 3 3"/>',
    external: '<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M18.5 14.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2h4.5"/>',
    file: '<path d="M13.5 2.8H7.2A2.2 2.2 0 0 0 5 5v14a2.2 2.2 0 0 0 2.2 2.2h9.6A2.2 2.2 0 0 0 19 19V8.3l-5.5-5.5Z"/><path d="M13.5 2.8V8.3H19M8.8 13h6.4M8.8 17h4.4"/>',
    terminal: '<rect x="2.8" y="4" width="18.4" height="16" rx="3"/><path d="m7 9 3 3-3 3M12.5 15h4"/>',
    calendar: '<rect x="3" y="4.8" width="18" height="16.4" rx="3"/><path d="M3 9.4h18M8 2.5v4M16 2.5v4"/><path d="M7.5 13h.1M12 13h.1M16.5 13h.1M7.5 17h.1M12 17h.1"/>',
    key: '<circle cx="8" cy="15.5" r="4.5"/><path d="m11.3 12.3 8.2-8.2M16.5 7l2.5 2.5M14 9.5l2.5 2.5"/>',
    eye: '<path d="M2.5 12S5.6 5.8 12 5.8 21.5 12 21.5 12 18.4 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.2"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c6.4 0 9.5 6 9.5 6a17 17 0 0 1-3.3 3.9M6.2 7.7A16 16 0 0 0 2.5 12S5.6 18 12 18a9.7 9.7 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    thermometer: '<path d="M10 13.9V4.8a2.4 2.4 0 0 1 4.8 0v9.1a4.6 4.6 0 1 1-4.8 0Z"/><circle cx="12.4" cy="17.6" r="1.6" fill="currentColor" stroke="none"/>',
    sim: '<path d="M6.5 3h7.1L19 8.4v10.1a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3Z"/><rect x="8.5" y="11.5" width="7" height="6" rx="1"/>',
    link: '<path d="M10 13.8a4.4 4.4 0 0 0 6.2 0l2.4-2.4a4.4 4.4 0 0 0-6.2-6.2l-1.3 1.3"/><path d="M14 10.2a4.4 4.4 0 0 0-6.2 0l-2.4 2.4a4.4 4.4 0 0 0 6.2 6.2l1.3-1.3"/>',
    sparkles: '<path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/>',
    filter: '<path d="M3.5 5.5h17l-6.5 7.6v6.2L10 17v-3.9L3.5 5.5Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c0-3.9 3.4-6.4 7.5-6.4s7.5 2.5 7.5 6.4"/>',
    logout: '<path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14"/><path d="M17.5 8.5 21 12l-3.5 3.5M21 12H9.5"/>',
    login: '<path d="M10 4.5h7.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H10"/><path d="M6.5 8.5 3 12l3.5 3.5M3 12h11.5"/>',
    hash: '<path d="M9.2 3 7.5 21M16.5 3l-1.7 18M3.5 8.5h17M3 15.5h17"/>',
    thermometerOutline: '<path d="M10 13.9V4.8a2.4 2.4 0 0 1 4.8 0v9.1a4.6 4.6 0 1 1-4.8 0Z"/>',
    signalOff: '<path d="M4 20v-3.5M9.3 20v-4M14.7 20v-2M20 20V4.5"/><path d="m3 3 18 18"/>',
    battery: '<rect x="2.5" y="7" width="17" height="10" rx="2.6"/><path d="M22 10.5v3"/><path d="M6 10.5v3M9.5 10.5v3M13 10.5v3"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    mapPin: '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    save: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7.5 3v6h8V3M7.5 21v-6h9v6"/>',
    rotate: '<path d="M20.5 11A8.5 8.5 0 0 0 6 6.2L3.5 8.5"/><path d="M3.5 3.5v5h5"/><path d="M3.5 13a8.5 8.5 0 0 0 14.5 4.8l2.5-2.3"/><path d="M20.5 20.5v-5h-5"/>'
  };

  const FILLED = { bolt: true };

  function svg(name, size) {
    const path = P[name] || P.info;
    const s = size || 20;
    const fill = FILLED[name] ? 'currentColor' : 'none';
    const stroke = FILLED[name] ? 'none' : 'currentColor';
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="' + fill +
      '" stroke="' + stroke + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      path + '</svg>';
  }

  function mount(root) {
    (root || document).querySelectorAll('[data-icon]').forEach((node) => {
      node.innerHTML = svg(node.getAttribute('data-icon'), Number(node.getAttribute('data-size')) || 20);
    });
  }

  X28.icons = { get: P, names: Object.keys(P), svg, mount };
  X28.icon = svg;
})(typeof window !== 'undefined' ? window : globalThis);
