/* X28 Mobile — tiny canvas charts (line / sparkline) + SVG ring gauge */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util;
  const C = (X28.charts = {});

  function resolveColor(c) {
    if (!c) return '#888';
    if (c.indexOf('var(') === 0) {
      const name = c.slice(4, -1).split(',')[0].trim();
      const v = U.cssVar(name);
      return v || '#888';
    }
    return c;
  }

  C.resolveColor = resolveColor;

  function smoothPath(ctx, pts) {
    if (!pts.length) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length < 3) {
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      return;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const t = 0.17;
      const c1x = p1.x + (p2.x - p0.x) * t;
      const c1y = p1.y + (p2.y - p0.y) * t;
      const c2x = p2.x - (p3.x - p1.x) * t;
      const c2y = p2.y - (p3.y - p1.y) * t;
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
    }
  }

  function niceMax(v) {
    if (!v || v <= 0) return 1;
    const exp = Math.floor(Math.log10(v));
    const base = Math.pow(10, exp);
    const n = v / base;
    let m;
    if (n <= 1) m = 1; else if (n <= 2) m = 2; else if (n <= 2.5) m = 2.5;
    else if (n <= 5) m = 5; else m = 10;
    return m * base;
  }

  /* ── line chart ─────────────────────────────────────────────────────── */
  C.line = function (canvas, opts) {
    opts = opts || {};
    const wrap = canvas.parentElement;
    const tip = document.createElement('div');
    tip.className = 'chart-tip';
    wrap.appendChild(tip);

    let t = [], series = {}, hover = -1, view = { t: [], series: [] };
    const state = { destroyed: false };
    const pad = { t: 12, r: opts.axisRight === false ? 8 : 42, b: 18, l: 8 };
    const fmtY = opts.fmtY || ((v) => (X28.fmt ? X28.fmt.fixed(v, v < 10 && v % 1 ? 1 : 0) : String(Math.round(v))));
    const fmtX = opts.fmtX || ((ts) => U.timeLabel(ts));

    function downsample() {
      const n = t.length;
      if (!n) { view = { t: [], series: [] }; return; }
      const maxPts = Math.max(40, Math.floor((canvas.clientWidth || 300) / 2.4));
      const step = Math.max(1, Math.ceil(n / maxPts));
      const vt = [], vs = (opts.series || []).map(() => []);
      for (let i = 0; i < n; i += step) {
        vt.push(t[i]);
        (opts.series || []).forEach((s, si) => {
          const arr = series[s.key] || [];
          let sum = 0, cnt = 0;
          for (let k = i; k < Math.min(n, i + step); k++) {
            const v = arr[k];
            if (v !== null && v !== undefined && !isNaN(v)) { sum += +v; cnt++; }
          }
          vs[si].push(cnt ? sum / cnt : null);
        });
      }
      /* last real sample always included */
      if (vt[vt.length - 1] !== t[n - 1]) {
        vt.push(t[n - 1]);
        (opts.series || []).forEach((s, si) => {
          const arr = series[s.key] || [];
          vs[si].push(arr[n - 1]);
        });
      }
      view = { t: vt, series: vs };
    }

    function dims() {
      const w = canvas.clientWidth || wrap.clientWidth || 300;
      const h = canvas.clientHeight || opts.height || 150;
      return { w, h, plotW: Math.max(10, w - pad.l - pad.r), plotH: Math.max(10, h - pad.t - pad.b) };
    }

    function draw() {
      if (state.destroyed) return;
      const dpr = Math.min(3, global.devicePixelRatio || 1);
      const { w, h, plotW, plotH } = dims();
      if (!w || !h) return;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      downsample();
      const defs = opts.series || [];
      const all = [];
      view.series.forEach((arr) => arr.forEach((v) => { if (v !== null && v !== undefined && !isNaN(v)) all.push(+v); }));
      if (!all.length) {
        ctx.fillStyle = resolveColor('var(--muted)');
        ctx.font = '11px Vazirmatn, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(opts.emptyText || 'داده‌ای برای نمایش نیست', w / 2, h / 2);
        return;
      }
      let min = opts.min !== undefined ? opts.min : 0;
      let max = opts.max !== undefined ? opts.max : niceMax(Math.max.apply(null, all) * 1.12);
      if (max <= min) max = min + 1;

      const xAt = (i) => pad.l + (view.t.length <= 1 ? plotW : (i / (view.t.length - 1)) * plotW);
      const yAt = (v) => pad.t + plotH - ((v - min) / (max - min)) * plotH;

      /* grid + y labels (right side, RTL friendly) */
      ctx.font = '9.5px Vazirmatn, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const steps = opts.gridLines === undefined ? 3 : opts.gridLines;
      for (let i = 0; i <= steps; i++) {
        const val = min + ((max - min) * i) / steps;
        const y = Math.round(yAt(val)) + 0.5;
        ctx.strokeStyle = resolveColor('var(--line-soft)');
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(pad.l + plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = resolveColor('var(--muted-2)');
        ctx.fillText(fmtY(val), pad.l + plotW + 6, y);
      }

      /* x labels */
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xCount = Math.min(4, view.t.length);
      for (let i = 0; i < xCount; i++) {
        const idx = Math.round((i / Math.max(1, xCount - 1)) * (view.t.length - 1));
        const ts = view.t[idx];
        if (!ts) continue;
        const x = xAt(idx);
        ctx.fillStyle = resolveColor('var(--muted-2)');
        ctx.fillText(fmtX(ts), U.clamp(x, pad.l + 14, pad.l + plotW - 14), h - 14);
      }

      /* series */
      defs.forEach((def, si) => {
        const arr = view.series[si] || [];
        const color = resolveColor(def.color);
        const pts = [];
        arr.forEach((v, i) => {
          if (v === null || v === undefined || isNaN(v)) return;
          pts.push({ x: xAt(i), y: yAt(v), v: +v, i });
        });
        if (!pts.length) return;
        const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
        grad.addColorStop(0, hexA(color, def.fillAlpha === undefined ? 0.24 : def.fillAlpha));
        grad.addColorStop(1, hexA(color, 0));
        if (def.fill !== false) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pad.t + plotH);
          smoothPath(ctx, pts);
          ctx.lineTo(pts[pts.length - 1].x, pad.t + plotH);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
        }
        ctx.beginPath();
        smoothPath(ctx, pts);
        ctx.strokeStyle = color;
        ctx.lineWidth = def.width || 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowColor = hexA(color, 0.45);
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (def.dot !== false) {
          const last = pts[pts.length - 1];
          ctx.beginPath();
          ctx.arc(last.x, last.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(last.x, last.y, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = hexA(color, 0.16);
          ctx.fill();
        }
      });

      /* crosshair */
      if (hover >= 0 && view.t[hover]) {
        const x = xAt(hover);
        ctx.strokeStyle = hexA(resolveColor('var(--text)'), 0.18);
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(x, pad.t);
        ctx.lineTo(x, pad.t + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        defs.forEach((def, si) => {
          const v = view.series[si] && view.series[si][hover];
          if (v === null || v === undefined || isNaN(v)) return;
          ctx.beginPath();
          ctx.arc(x, yAt(v), 3.4, 0, Math.PI * 2);
          ctx.fillStyle = resolveColor(def.color);
          ctx.fill();
          ctx.strokeStyle = resolveColor('var(--bg)');
          ctx.lineWidth = 1.6;
          ctx.stroke();
        });
      }
    }

    function hexA(color, alpha) {
      if (!color) return 'rgba(0,0,0,0)';
      let c = color;
      if (c.indexOf('#') === 0) {
        if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
        const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
      }
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(',').map((s) => s.trim());
        return 'rgba(' + parts[0] + ',' + parts[1] + ',' + parts[2] + ',' + alpha + ')';
      }
      return c;
    }

    function nearestIndex(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const { plotW } = dims();
      const ratio = U.clamp((x - pad.l) / plotW, 0, 1);
      return Math.round(ratio * (view.t.length - 1));
    }

    function showTip(clientX) {
      if (!view.t.length || !opts.tooltip) return;
      hover = nearestIndex(clientX);
      const idx = hover;
      const ts = view.t[idx];
      if (!ts) return;
      const rows = (opts.series || []).map((s, si) => {
        const v = view.series[si] ? view.series[si][idx] : null;
        return { name: s.label || s.key, color: s.color, value: v === null || v === undefined ? '—' : (opts.tooltip(v)) };
      });
      tip.innerHTML = '<div style="color:var(--muted);margin-bottom:2px">' + U.esc(opts.fmtX ? opts.fmtX(ts) : U.timeLabel(ts)) + '</div>' +
        rows.map((r) => '<div style="display:flex;gap:6px;align-items:center;justify-content:space-between"><span style="display:flex;align-items:center;gap:4px"><i style="width:6px;height:6px;border-radius:50%;background:' + r.color + '"></i>' + U.esc(r.name) + '</span><b>' + U.esc(r.value) + '</b></div>').join('');
      const rect = canvas.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const { plotW } = dims();
      const xInWrap = (rect.left - wrapRect.left) + pad.l + (view.t.length <= 1 ? plotW : (idx / (view.t.length - 1)) * plotW);
      tip.style.left = U.clamp(xInWrap, 60, wrapRect.width - 60) + 'px';
      tip.style.top = (rect.top - wrapRect.top) + 16 + 'px';
      tip.classList.add('show');
      draw();
    }

    function hideTip() {
      hover = -1;
      tip.classList.remove('show');
      draw();
    }

    canvas.style.touchAction = 'pan-y';
    let pointerDown = false;
    const onDown = (e) => { pointerDown = true; showTip(e.clientX); };
    const onMove = (e) => { if (pointerDown) { e.preventDefault(); showTip(e.clientX); } };
    const onUp = () => { pointerDown = false; };
    const onLeave = () => { pointerDown = false; hideTip(); };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);

    let ro = null;
    if (global.ResizeObserver) {
      ro = new ResizeObserver(U.debounce(draw, 80));
      ro.observe(wrap);
    } else {
      global.addEventListener('resize', draw);
    }
    setTimeout(draw, 0);

    return {
      setData(nt, ns) {
        t = nt || [];
        series = ns || {};
        draw();
      },
      draw,
      redraw: draw,
      destroy() {
        state.destroyed = true;
        if (ro) ro.disconnect(); else global.removeEventListener('resize', draw);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        canvas.removeEventListener('pointerleave', onLeave);
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      }
    };
  };

  /* ── sparkline ──────────────────────────────────────────────────────── */
  C.sparkline = function (canvas, values, opts) {
    opts = opts || {};
    function draw() {
      const w = canvas.clientWidth || 90, h = canvas.clientHeight || 36;
      const dpr = Math.min(3, global.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const arr = (values || []).filter((v) => v !== null && v !== undefined && !isNaN(v));
      if (arr.length < 2) return;
      const min = Math.min.apply(null, arr), max = Math.max.apply(null, arr);
      const span = max - min || 1;
      const color = resolveColor(opts.color || 'var(--brand)');
      const padY = 4;
      const pts = arr.map((v, i) => ({
        x: 1 + (i / (arr.length - 1)) * (w - 2),
        y: padY + (1 - (v - min) / span) * (h - padY * 2)
      }));
      if (opts.fill !== false) {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, opts.fillColor || hexAlpha(color, 0.28));
        grad.addColorStop(1, hexAlpha(color, 0));
        ctx.beginPath();
        ctx.moveTo(pts[0].x, h);
        smoothPath(ctx, pts);
        ctx.lineTo(pts[pts.length - 1].x, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.beginPath();
      smoothPath(ctx, pts);
      ctx.strokeStyle = color;
      ctx.lineWidth = opts.width || 1.8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    function hexAlpha(c, a) {
      if (c.indexOf('#') === 0) {
        if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
        return 'rgba(' + parseInt(c.slice(1, 3), 16) + ',' + parseInt(c.slice(3, 5), 16) + ',' + parseInt(c.slice(5, 7), 16) + ',' + a + ')';
      }
      return c;
    }
    setTimeout(draw, 0);
    return {
      setData(v) { values = v; draw(); },
      draw,
      destroy() {}
    };
  };

  /* ── ring gauge (SVG) ───────────────────────────────────────────────── */
  C.ring = function (container, opts) {
    opts = opts || {};
    const size = opts.size || 132;
    const stroke = opts.stroke || 10;
    const r = (size - stroke) / 2 - 4;
    const cx = size / 2, cy = size / 2;
    const start = 135, sweep = 270;
    const circumference = 2 * Math.PI * r * (sweep / 360);
    container.innerHTML =
      '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
      '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + (opts.colorFrom || '#fb7185') + '"/>' +
      '<stop offset=".5" stop-color="' + (opts.colorMid || '#fbbf24') + '"/>' +
      '<stop offset="1" stop-color="' + (opts.colorTo || '#2ee6ae') + '"/></linearGradient></defs>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--card-3)" stroke-width="' + stroke + '" ' +
      'stroke-linecap="round" stroke-dasharray="' + circumference + ' ' + (circumference * 2) + '" transform="rotate(' + start + ' ' + cx + ' ' + cy + ')"/>' +
      '<circle class="ring-val" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="url(#ringGrad)" stroke-width="' + stroke + '" ' +
      'stroke-linecap="round" stroke-dasharray="0 ' + (circumference * 3) + '" transform="rotate(' + start + ' ' + cx + ' ' + cy + ')" style="transition:stroke-dasharray .7s cubic-bezier(.22,.9,.24,1)"/>' +
      '</svg>';
    const arc = container.querySelector('.ring-val');
    return {
      set(pct) {
        const p = U.clamp(pct, 0, 100);
        arc.setAttribute('stroke-dasharray', (circumference * p / 100) + ' ' + (circumference * 3));
      }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
