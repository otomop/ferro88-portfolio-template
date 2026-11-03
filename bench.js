// FERRO-88 on-device benchmark overlay. Loaded only with ?f88bench (index.html appends this file; site.min.js
// then exposes window.__f88, the driver). Plain ES5-style code so iOS Safari and Android Chrome both run it.
// Shows live frame stats in a small panel, runs a scripted ~26 s tour through the site, and copies a plain-text
// report. window.__f88bench = {report, rows, running, device} for scripted use.
(function () {
  'use strict';
  if (window.__f88bench) return;
  var B = { report: '', rows: [], running: false, device: null };
  window.__f88bench = B;

  // ------------------------------------------------------------------ helpers
  function f88() { return window.__f88 || null; }
  function ctl() { var d = f88(); return d && d.ctl ? d.ctl : null; }
  function stats() { var c = ctl(); if (!c || typeof c.stats !== 'function') return null; try { return c.stats() || null; } catch (e) { return null; } }
  function gov() { var c = ctl(); if (!c || typeof c.gov !== 'function') return null; try { return c.gov() || null; } catch (e) { return null; } }
  function fix(v, n) { return (typeof v === 'number' && isFinite(v)) ? v.toFixed(n == null ? 1 : n) : '-'; }
  function pct(sorted, p) { if (!sorted.length) return NaN; return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]; }
  function sortNum(a) { return a.slice().sort(function (x, y) { return x - y; }); }
  function median(a) { return pct(sortNum(a), 0.5); }
  function el(tag, css, text) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; }
  function stageCanvas() { return document.querySelector('[data-ferro-stage="orb"]'); }
  function bootDone() { var b = document.getElementById('f8-boot'); return !b || b.style.display === 'none'; }

  // ------------------------------------------------------------------ device line (throwaway GL context for the renderer name)
  function readDevice() {
    var ua = navigator.userAgent || '', plat = 'unknown', brow = 'unknown', m;
    if ((m = /\(([^;)]*(?:iPhone|iPad|Android|Windows|Macintosh|Linux)[^;)]*)/.exec(ua))) plat = m[1];
    if ((m = /\bAndroid [\d.]+; ([^;)]+)/.exec(ua))) plat = 'Android ' + m[1];
    if ((m = /\b(CriOS|FxiOS|EdgiOS|OPR|Edg|SamsungBrowser|Firefox|HeadlessChrome|Chrome)\/([\d.]+)/.exec(ua))) brow = m[1] + ' ' + m[2];
    else if ((m = /\bVersion\/([\d.]+).*Safari/.exec(ua))) brow = 'Safari ' + m[1];
    var renderer = 'n/a', timer = false, webgl2 = false;
    try {
      var cv = document.createElement('canvas'), gl = cv.getContext('webgl2');
      if (gl) webgl2 = true; else gl = cv.getContext('webgl');
      if (gl) {
        var dbg = gl.getExtension('WEBGL_debug_renderer_info');
        renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        timer = webgl2 && !!gl.getExtension('EXT_disjoint_timer_query_webgl2');
        var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      }
    } catch (e) { renderer = 'error'; }
    B.device = { platform: plat, browser: brow, renderer: String(renderer), timer: timer, webgl2: webgl2, dpr: window.devicePixelRatio || 1,
      cores: navigator.hardwareConcurrency || 0, mem: navigator.deviceMemory || 0, coarse: !!(window.matchMedia && matchMedia('(pointer: coarse)').matches) };
    return B.device;
  }
  function sizes() {
    var s = stageCanvas(), f = document.querySelector('.f8-field'), st = stats();
    return { vw: window.innerWidth, vh: window.innerHeight, stage: s ? s.width + 'x' + s.height : '-', scene: st ? st.w + 'x' + st.h : '-', field: f ? f.width + 'x' + f.height : '-' };
  }

  // ------------------------------------------------------------------ panel
  var Z = 2147483647;
  var panel = el('div', 'position:fixed;top:0;left:0;top:env(safe-area-inset-top,0px);left:env(safe-area-inset-left,0px);z-index:' + Z +
    ';margin:6px;padding:8px;max-width:calc(100vw - 12px);box-sizing:border-box;background:rgba(8,9,12,0.9);color:#dfe3ea;' +
    'font:11px/1.45 ui-monospace,Menlo,Consolas,monospace;border:1px solid rgba(255,255,255,0.25);border-radius:6px;pointer-events:auto;' +
    'user-select:text;-webkit-user-select:text;touch-action:manipulation;white-space:pre-wrap;word-break:break-word');
  panel.id = 'f88bench';
  var live = el('div', 'min-height:2.9em'), dev = el('div', 'opacity:0.8;margin-top:4px'), status = el('div', 'margin-top:4px;color:#ffd27a');
  var bar = el('div', 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap');
  var pre = el('pre', 'margin:8px 0 0;max-height:38vh;overflow:auto;font:inherit;white-space:pre-wrap;word-break:break-word;display:none;border-top:1px solid rgba(255,255,255,0.2);padding-top:6px');
  function button(label, fn) {
    var b = el('button', 'min-width:44px;min-height:44px;padding:0 14px;background:#1e2430;color:#fff;border:1px solid rgba(255,255,255,0.35);border-radius:6px;' +
      'font:inherit;letter-spacing:0.08em;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent', label);
    b.type = 'button'; b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); fn(); }); bar.appendChild(b); return b;
  }
  var btnRun = button('RUN TOUR', runTour), btnCopy = button('COPY', copyReport), btnHide = button('HIDE', hide);
  panel.appendChild(live); panel.appendChild(dev); panel.appendChild(status); panel.appendChild(bar); panel.appendChild(pre);
  var tab = el('button', 'position:fixed;top:0;left:0;top:env(safe-area-inset-top,0px);left:env(safe-area-inset-left,0px);z-index:' + Z +
    ';margin:6px;width:44px;height:44px;background:rgba(8,9,12,0.85);color:#fff;border:1px solid rgba(255,255,255,0.35);border-radius:6px;' +
    'font:11px ui-monospace,monospace;display:none;cursor:pointer;touch-action:manipulation;pointer-events:auto', 'B');
  tab.type = 'button'; tab.setAttribute('aria-label', 'Show benchmark panel');
  tab.addEventListener('click', function () { tab.style.display = 'none'; panel.style.display = ''; });
  function hide() { panel.style.display = 'none'; tab.style.display = 'block'; }
  function mount() { if (!document.body) { setTimeout(mount, 30); return; } document.body.appendChild(panel); document.body.appendChild(tab); }
  mount();
  function say(t) { status.textContent = t; }

  // ------------------------------------------------------------------ frame sampling (rAF gaps + kit stats)
  var lastT = 0, recent = [], tour = null, longTasksTotal = 0, longTaskSupport = false, txEnds = 0;
  try {
    var po = new PerformanceObserver(function (list) {
      var es = list.getEntries(); for (var i = 0; i < es.length; i++) { longTasksTotal++; if (tour && tour.cur) tour.cur.longTasks++; }
    });
    longTaskSupport = !!(PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.indexOf('longtask') >= 0);
    if (longTaskSupport) po.observe({ type: 'longtask', buffered: false });
  } catch (e) { longTaskSupport = false; }
  try {
    var pm = new PerformanceObserver(function (list) {
      var es = list.getEntries(); for (var i = 0; i < es.length; i++) if (es[i].name === 'f8-tx-end') txEnds++;
    });
    pm.observe({ type: 'mark', buffered: false });
  } catch (e) {}
  function txEndCount() { try { return performance.getEntriesByName('f8-tx-end').length || txEnds; } catch (e) { return txEnds; } }

  function onFrame(t) {
    requestAnimationFrame(onFrame);
    if (lastT) {
      var gap = t - lastT;
      recent.push(t);
      while (recent.length && t - recent[0] > 1000) recent.shift();
      if (tour && tour.cur) {
        var c = tour.cur; c.gaps.push(gap);
        if (gap > 20) c.over20++; if (gap > 34) c.over34++;
        if (c.tick) { try { c.tick((t - c.t0) / 1000); } catch (e) {} }
      }
    }
    lastT = t;
    if (tour) tourStep(t);
  }
  requestAnimationFrame(onFrame);

  var lastLive = 0;
  function liveUpdate() {
    var now = performance.now(); if (now - lastLive < 250) return; lastLive = now;
    var d = f88(), st = stats(), g = gov();
    if (!d) { live.textContent = 'rAF ' + recent.length + ' fps | waiting for window.__f88 (site not booted yet, or the f88bench hook is missing)'; return; }
    var gpu = (g && g.gpuMs > 0) ? fix(g.gpuMs, 2) + ' ms' : (B.device && B.device.timer ? '- ms' : 'no timer');
    live.textContent = 'rAF ' + recent.length + ' fps | drawn ' + (st ? fix(st.fps, 1) : '-') + ' fps | refresh ' + (g && g.refreshMs ? fix(g.refreshMs, 1) + ' ms' : '-') +
      ' N=' + (g ? g.N : '-') + ' | gpu ' + gpu + ' | scale ' + (st ? fix(st.scale, 2) : '-') + ' comp ' + (st ? fix(st.comp, 2) : '-') + ' baked ' + (st ? (st.baked ? 'y' : 'n') : '-') +
      ' | cur ' + (d.cur || '-') + (d.tx ? ' (tx)' : '') + ' | long tasks ' + (longTaskSupport ? longTasksTotal : 'n/a');
  }
  function devUpdate() {
    var D = B.device || readDevice(), z = sizes();
    dev.textContent = D.platform + ' / ' + D.browser + ' / ' + D.renderer + ' | dpr ' + D.dpr + ' | ' + z.vw + 'x' + z.vh + ' | stage ' + z.stage + ' scene ' + z.scene + ' field ' + z.field +
      ' | cores ' + (D.cores || '?') + ' mem ' + (D.mem || '?') + ' | timer ' + (D.timer ? 'yes' : 'no') + (D.webgl2 ? '' : ' | NO WEBGL2');
  }
  setInterval(function () { liveUpdate(); }, 250);
  setInterval(devUpdate, 2000); readDevice(); devUpdate();

  // ------------------------------------------------------------------ the tour
  function cursorAt(x, y) { var c = ctl(); if (!c || !c.state) return; c.state.mouse = [x, y]; c.state.hover = true; }
  function cursorOff() { var c = ctl(); if (c && c.state) c.state.hover = false; }
  function dropPointer(cx, cy) {
    var ev = null;
    try { ev = new PointerEvent('pointermove', { clientX: cx, clientY: cy, bubbles: true, pointerType: 'mouse' }); } catch (e) {
      try { ev = new MouseEvent('pointermove', { clientX: cx, clientY: cy, bubbles: true }); } catch (e2) { ev = null; }
    }
    if (ev) window.dispatchEvent(ev);
  }
  function goTo(name, selector) {
    var d = f88(); if (!d || typeof d.go !== 'function') return false;
    var src = null; try { src = document.querySelector(selector); } catch (e) {}
    try { d.go(name, src); return true; } catch (e) { return false; }
  }
  function nthChan(i) { var cs = document.querySelectorAll('.f8-chan'); return cs[i] || null; }

  var STATES = [
    { name: 'home idle', dur: 4 },
    { name: 'home cursor', dur: 4, tick: function (t) { var w = Math.PI * 2 / 4; cursorAt(0.7 * Math.sin(w * t), 0.45 * Math.sin(2 * w * t)); }, exit: cursorOff },
    { name: 'in', dur: 3, tx: true, enter: function () { return goTo('about', '[data-go=about] .f8-label'); } },
    { name: 'about rest', dur: 3 },
    { name: 'about drop moves', dur: 3, tick: function (t) { var w = Math.PI * 2 / 3, W = window.innerWidth, H = window.innerHeight; dropPointer(W * (0.5 + 0.3 * Math.sin(w * t)), H * (0.5 + 0.2 * Math.sin(2 * w * t))); } },
    { name: 'hop', dur: 2.5, tx: true, enter: function () { var d = f88(); var c = nthChan(1); if (!d || !c) return false; try { d.go('philosophy', c); return true; } catch (e) { return false; } } },
    { name: 'out', dur: 3, tx: true, enter: function () { return goTo('home', '.f8-back'); } },
    { name: 'home again', dur: 3 }
  ];

  function runTour() {
    if (tour) { say('tour already running'); return; }
    if (!f88()) { say('no window.__f88: the site has not booted or the hook is missing'); return; }
    tour = { i: -1, cur: null, rows: [], waitUntil: 0, start: 0 };
    B.rows = []; B.running = true; pre.style.display = 'none';
    say('tour: waiting for the boot to finish...');
  }
  function sampleKit(c) {
    var st = stats(), g = gov();
    if (st) { if (typeof st.fps === 'number') c.fps.push(st.fps); c.scaleMin = Math.min(c.scaleMin, st.scale); c.baked = !!st.baked; c.comp = st.comp; }
    if (g) { if (g.gpuMs > 0) c.gpu.push(g.gpuMs); c.N = Math.max(c.N, g.N || 1); if (g.refreshMs) c.refresh = g.refreshMs; }
  }
  function beginState(t, def) {
    var c = { name: def.name, def: def, t0: t, gaps: [], over20: 0, over34: 0, longTasks: 0, fps: [], gpu: [], N: 1, scaleMin: 9, baked: false, comp: 0, refresh: 0,
      tick: def.tick || null, txStart: 0, txEndBase: txEndCount(), txMs: 0, entered: true, lastSample: 0 };
    if (def.enter) { c.entered = def.enter() !== false; c.txStart = performance.now(); }
    tour.cur = c; say('tour: ' + def.name);
  }
  function endState(t) {
    var c = tour.cur; if (!c) return;
    if (c.def.exit) { try { c.def.exit(); } catch (e) {} }
    c.ms = t - c.t0; sampleKit(c);
    var s = sortNum(c.gaps);
    var row = { name: c.name, p50: pct(s, 0.5), p95: pct(s, 0.95), max: pct(s, 1), frames: c.gaps.length, fps: median(c.fps), gpuMs: median(c.gpu), N: c.N, scale: c.scaleMin < 9 ? c.scaleMin : NaN,
      baked: c.baked, over20: c.over20, over34: c.over34, longTasks: longTaskSupport ? c.longTasks : -1, ms: c.ms, txMs: c.txMs, tx: !!c.def.tx, entered: c.entered, refresh: c.refresh };
    tour.rows.push(row); tour.cur = null;
  }
  function tourStep(t) {
    if (tour.i < 0) {
      var d = f88();
      if (!d || !bootDone() || d.tx || d.cur !== 'home' || !document.querySelector('[data-go=about] .f8-label')) {
        if (tour.waitUntil && t > tour.waitUntil) { say('tour aborted: site not at the home menu (cur ' + (d && d.cur) + ')'); tour = null; B.running = false; }
        else if (!tour.waitUntil) tour.waitUntil = t + 60000;
        return;
      }
      tour.i = 0; tour.start = t; beginState(t, STATES[0]); return;
    }
    var c = tour.cur; if (!c) return;
    if (t - c.lastSample > 100) { c.lastSample = t; sampleKit(c); }
    var el = (t - c.t0) / 1000, done = el >= c.def.dur;
    if (c.def.tx && c.entered) {
      var ended = txEndCount() > c.txEndBase;
      if (ended && !c.txMs) { c.txMs = performance.now() - c.txStart; }
      if (done && !ended && el < c.def.dur + 4) done = false;   // let a slow transition finish (at most +4 s)
    }
    if (!done) return;
    endState(t);
    if (++tour.i >= STATES.length) { finishTour(t); return; }
    beginState(t, STATES[tour.i]);
  }
  function finishTour(t) {
    B.rows = tour.rows; var total = (t - tour.start) / 1000; tour = null; B.running = false;
    B.report = buildReport(B.rows, total);
    pre.textContent = B.report; pre.style.display = 'block';
    say('tour done in ' + fix(total, 1) + ' s. COPY puts the report on the clipboard.');
    var d = f88(); if (d && d.cur !== 'home') say('tour done (ended on ' + d.cur + ', not home). COPY puts the report on the clipboard.');
  }
  function buildReport(rows, total) {
    var D = B.device || readDevice(), z = sizes(), g = gov(), ref = g && g.refreshMs ? fix(g.refreshMs, 1) + 'ms' : '-';
    var lines = ['F8BENCH ' + D.platform + ' / ' + D.browser + ' / ' + D.renderer + ' | dpr ' + D.dpr + ' | ' + z.vw + 'x' + z.vh + ' | stage ' + z.stage + ' scene ' + z.scene + ' field ' + z.field +
      ' | refresh ' + ref + ' | timer ' + (D.timer ? 'yes' : 'no') + ' | cores ' + (D.cores || '?') + ' mem ' + (D.mem || '?') + ' | tour ' + fix(total, 1) + 's | long tasks ' + (longTaskSupport ? longTasksTotal : 'n/a')];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      lines.push(r.name + ' | rAF ' + fix(r.p50) + '/' + fix(r.p95) + '/' + fix(r.max) + ' ms | drawn ' + fix(r.fps, 1) + ' fps | gpu ' + (isFinite(r.gpuMs) ? fix(r.gpuMs, 2) : (D.timer ? '-' : 'no timer')) +
        ' | N ' + r.N + ' | scale ' + fix(r.scale, 2) + ' | baked ' + (r.baked ? 'y' : 'n') + ' | >20ms ' + r.over20 + ' | long ' + (r.longTasks < 0 ? 'n/a' : r.longTasks) +
        ' | >34ms ' + r.over34 + ' | ' + r.frames + ' frames in ' + fix(r.ms / 1000, 1) + 's' + (r.txMs ? ' tx ' + fix(r.txMs / 1000, 2) + 's' : (r.tx ? ' tx ?' : '')) + (r.entered ? '' : ' (go failed)'));
    }
    return lines.join('\n');
  }

  // ------------------------------------------------------------------ copy
  function copyReport() {
    var text = B.report || ('F8BENCH (no tour yet)\n' + live.textContent + '\n' + dev.textContent);
    function ok() { say('copied'); setTimeout(function () { if (status.textContent === 'copied') say(''); }, 1500); }
    function fallback() {
      try {
        var ta = el('textarea', 'position:fixed;top:0;left:0;width:2em;height:2em;opacity:0;font-size:16px'); ta.value = text; ta.setAttribute('readonly', '');
        panel.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
        var done = document.execCommand && document.execCommand('copy'); panel.removeChild(ta);
        if (done) ok(); else say('copy failed: select the text above and copy it by hand');
      } catch (e) { say('copy failed: select the text above and copy it by hand'); }
    }
    pre.textContent = text; pre.style.display = 'block';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  }
})();
