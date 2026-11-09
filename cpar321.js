/* CPAR321 app v1（2026-11-09）：321 App 內容逐句中英並讀（通用引擎）
   繁／简頁並讀英文、英文頁並讀繁體中文。每個 App 在載入本檔之前設定 window.CPAR321_CFG：
     { ui:'tc'|'sc'|'en', alt:'en.html', altLang:'en'|'zh-Hant', seed:['localStorage key',…],
       strip:['script id',…], unit:'.sen', views:[{ root:fn→元素, code:fn→在另一語言頁執行的程式字串（null＝不並讀）,
       wait:fn→另一語言頁要等出現的選擇器, grab:'選擇器', bar:fn(root)→{parent,before} }] }
   作法：把另一語言頁（同一套程式）放進隱藏的沙盒 iframe（假的 localStorage，不碰真正的紀錄），
   在裡面重放同一個畫面，取回 HTML；兩邊依段落（葉節點區塊）LCS 配對，再逐句依長度比例對齊，
   把對應句子以 <span class="cps"> 插在主要句子後面。朗讀、畫線只作用在主要內容（.cps 不包句子）。
   設定存 localStorage 'cpar321'（'1' 或 ''，所有 321 App 共用）。ES5。 */
(function () {
  var C = window.CPAR321_CFG;
  if (!C || window.CPAR321) return;
  var UI = C.ui || 'tc', EN = UI === 'en', ALT_LANG = C.altLang || (EN ? 'zh-Hant' : 'en');
  var STR = {
    tc: { btn: '中英並讀', on: '開', off: '關', loading: '英文內容載入中…', fail: '英文內容載入失敗，請檢查網路後再試' },
    sc: { btn: '中英并读', on: '开', off: '关', loading: '英文内容载入中…', fail: '英文内容载入失败，请检查网络后再试' },
    en: { btn: 'Chinese parallel', on: 'On', off: 'Off', loading: 'Loading the Chinese text…', fail: 'Couldn’t load the Chinese text — check your connection' }
  };
  function T(k) { return (STR[UI] || STR.tc)[k]; }
  function isOn() { try { return localStorage.getItem('cpar321') === '1'; } catch (e) { return false; } }
  function setOn(v) { try { localStorage.setItem('cpar321', v ? '1' : ''); } catch (e) {} }
  var UNIT = C.unit || '.sen,.gxs-s,.ms[data-s],[data-k],.sent';
  var EXCL = '.cps,.cparbar,.cpar-st,button,select,textarea,input,option,script,style,svg,canvas,nav,[contenteditable],[data-nocpar]' + (C.skip ? ',' + C.skip : '');
  var BLK = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th,dt,dd,div,section,article,summary,figcaption,details,pre';

  /* ── 另一語言頁：沙盒 iframe ── */
  var SRC = null, srcLoading = false, srcFailed = false, IFR = null, READY = false, Q = [], CB = {}, SEQ = 0, CACHE = {}, CKEYS = [];
  var SHIM = '(function(){var P=parent;function mk(){var m={};return{getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[String(k)]=String(v)},removeItem:function(k){delete m[String(k)]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}}}'
    + 'var LS=mk(),SS=mk();function def(o,k,v){try{Object.defineProperty(o,k,{value:v,configurable:true,writable:true})}catch(e){}}'
    + 'def(window,"localStorage",LS);def(window,"sessionStorage",SS);def(window,"indexedDB",undefined);def(window,"caches",undefined);'
    + 'var sw={register:function(){return Promise.reject(new Error("x"))},getRegistration:function(){return Promise.resolve(undefined)},getRegistrations:function(){return Promise.resolve([])},addEventListener:function(){},removeEventListener:function(){},controller:null,ready:new Promise(function(){})};'
    + 'try{Object.defineProperty(Navigator.prototype,"serviceWorker",{get:function(){return sw},configurable:true})}catch(e){def(navigator,"serviceWorker",sw)}'
    + 'try{Object.defineProperty(Document.prototype,"cookie",{get:function(){return""},set:function(){},configurable:true})}catch(e){}'
    + 'window.alert=function(){};window.confirm=function(){return false};window.prompt=function(){return null};window.open=function(){return null};'
    + 'try{window.speechSynthesis&&(window.speechSynthesis.speak=function(){})}catch(e){}'
    + 'function post(o){try{P.postMessage(o,"*")}catch(e){}}'
    + 'window.addEventListener("message",function(ev){var d=ev.data;if(!d||!d.cparRun)return;var k;if(d.seed)for(k in d.seed)if(d.seed[k]!=null)LS.setItem(k,d.seed[k]);'
    + 'var err=null;try{(0,eval)(d.code)}catch(e){err=String(e&&e.message||e)}'
    + 'var t0=Date.now();(function poll(){var g=document.querySelector(d.grab),ok=g&&(g.textContent||"").replace(/\\s+/g,"").length>0,i;'
    + 'if(ok&&d.wait)for(i=0;i<d.wait.length;i++){var w=document.querySelector(d.wait[i]);if(!w||!(w.textContent||"").replace(/\\s+/g,"")){ok=false;break}}'
    + 'if(ok||Date.now()-t0>9000){setTimeout(function(){var g2=document.querySelector(d.grab);post({cparRes:d.id,html:g2?g2.innerHTML:null,err:err})},60);return}setTimeout(poll,80)})()});'
    + 'window.addEventListener("load",function(){setTimeout(function(){post({cparReady:1})},150)});'
    + '})();';
  function strip(html) {
    var ids = C.strip || [], hb = html.search(/<body[\s>]/i);
    html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, function (all, attrs, body, at) {
      if (/\bsrc\s*=/i.test(attrs)) return '';                                   // 外部 JS 一律不載（共讀、更新、小智、朗讀等）
      var m = attrs.match(/\bid\s*=\s*["']?([\w-]+)/i);
      if (m && ids.indexOf(m[1]) >= 0) return '';
      if ((hb < 0 || at < hb) && body.length < 3000 && /location\.(replace|assign)\s*\(|location\.href\s*=/.test(body)) return '';   // <head> 裡的語言導向
      return all;
    });
    html = html.replace(/<link\b[^>]*rel=["']?(manifest|preload|prefetch|modulepreload)[^>]*>/gi, '');
    /* 被拿掉的外部共用套件留個空殼，免得頁面裡呼叫它們的小段程式出錯 */
    var stub = 'window.UPD321=window.UPD321||{mountWhen:function(){},mount:function(){},check:function(){}};window.XZM=window.XZM||{install:function(){},preset:{}};' + (C.stub || '');
    var shim = '<script>' + SHIM + '</script><script>' + stub + '</script>';
    return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, function (h) { return h + shim; }) : shim + html;
  }
  function loadSrc(cb) {
    if (SRC) return cb(true);
    if (srcLoading) { setTimeout(function () { loadSrc(cb); }, 150); return; }
    srcLoading = true;
    fetch(C.alt, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (s) {
      SRC = strip(s); srcLoading = false; srcFailed = false; cb(true);
    })['catch'](function () {
      fetch(C.alt).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (s) { SRC = strip(s); srcLoading = false; srcFailed = false; cb(true); })
        ['catch'](function () { srcLoading = false; srcFailed = true; cb(false); });
    });
  }
  function frame() {
    if (IFR) return;
    IFR = document.createElement('iframe');
    IFR.setAttribute('sandbox', 'allow-scripts');
    IFR.setAttribute('aria-hidden', 'true'); IFR.setAttribute('tabindex', '-1'); IFR.title = 'cpar';
    IFR.style.cssText = 'position:fixed;left:-10000px;top:0;width:390px;height:700px;border:0;opacity:0;pointer-events:none;visibility:hidden';
    IFR.srcdoc = SRC;
    document.body.appendChild(IFR);
    setTimeout(function () { if (!READY) { READY = true; flush(); } }, 15000);   // load 沒來也試著送
  }
  window.addEventListener('message', function (e) {
    if (!IFR || e.source !== IFR.contentWindow) return;
    var d = e.data || {};
    if (d.cparReady) { READY = true; flush(); return; }
    if (d.cparRes) { var f = CB[d.cparRes]; delete CB[d.cparRes]; if (f) f(d.html); }
  });
  function flush() { while (READY && Q.length) { var m = Q.shift(); try { IFR.contentWindow.postMessage(m, '*'); } catch (e) {} } }
  function seedNow() {
    var o = {}, ks = C.seed || [], i;
    for (i = 0; i < ks.length; i++) { try { o[ks[i]] = localStorage.getItem(ks[i]); } catch (e) {} }
    return o;
  }
  /* 依序執行，一次一個（另一語言頁只有一個畫面） */
  var BUSY = false, WAITQ = [];
  function altHtml(code, grab, wait, cb) {
    var key = code + '\u0001' + grab;
    if (CACHE.hasOwnProperty(key)) return cb(CACHE[key]);
    WAITQ.push([code, grab, wait, cb]); pump();
  }
  function pump() {
    if (BUSY || !WAITQ.length) return;
    var j = WAITQ.shift(), key = j[0] + '\u0001' + j[1];
    if (CACHE.hasOwnProperty(key)) { j[3](CACHE[key]); return pump(); }
    BUSY = true;
    loadSrc(function (ok) {
      if (!ok) { BUSY = false; j[3](null); return pump(); }
      frame();
      var id = 'c' + (++SEQ), done = false;
      var fin = function (h) {
        if (done) return; done = true; BUSY = false;
        if (h) { CACHE[key] = h; CKEYS.push(key); if (CKEYS.length > 40) delete CACHE[CKEYS.shift()]; }
        j[3](h || null); pump();
      };
      CB[id] = fin;
      setTimeout(function () { if (CB[id]) { delete CB[id]; fin(null); } }, 30000);
      Q.push({ cparRun: 1, id: id, code: j[0], grab: j[1], wait: j[2] || null, seed: seedNow() }); flush();
    });
  }

  /* ── 段落配對 ── */
  function excluded(e) { return !!(e.closest && e.closest(EXCL)); }
  function tx(e) {
    var w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, null), n, s = '';
    while ((n = w.nextNode())) { var p = n.parentElement; if (p && p !== e && p.closest(EXCL) && e.contains(p.closest(EXCL))) continue; if (p && p.closest('.cps,.cparbar')) continue; s += n.nodeValue; }
    return s.replace(/\s+/g, ' ').trim();
  }
  function blocks(root) {
    var all = root.querySelectorAll(BLK), out = [], i;
    for (i = 0; i < all.length; i++) {
      var e = all[i];
      if (excluded(e)) continue;
      var kids = e.querySelectorAll(BLK), leaf = true, k;
      for (k = 0; k < kids.length; k++) if (!excluded(kids[k])) { leaf = false; break; }
      if (!leaf) continue;
      out.push(e);
    }
    return out;
  }
  var STATE = /^(on|active|show|open|sel|selected|cur|current|done|hasnote|collapsed|expanded|hl|hl-.*|gx.*|tts-.*|spk.*|mks|ms|sen|gxs-s|fade.*|anim.*)$/;
  function sig(e) { return e.tagName + '.' + String(e.getAttribute('class') || '').split(/\s+/).filter(function (c) { return c && !STATE.test(c); }).sort().join('.'); }
  function lcs(a, b) {
    var n = a.length, m = b.length, i, j, L = [];
    for (i = 0; i <= n; i++) L.push(new Uint16Array(m + 1));
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var pairs = []; i = 0; j = 0;
    while (i < n && j < m) { if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    return pairs;
  }
  var CJK = /[㐀-鿿]/, LAT = /[A-Za-z]{2}/;
  function removeAll(root) {
    var old = (root || document).querySelectorAll('.cps'), o; for (o = 0; o < old.length; o++) old[o].parentNode.removeChild(old[o]);
    var fw = (root || document).querySelectorAll('[data-cpw]'); for (o = 0; o < fw.length; o++) { var v = fw[o].getAttribute('data-cpw'); fw[o].style.flexWrap = v === '-' ? '' : v; fw[o].removeAttribute('data-cpw'); }
  }
  function pairInto(root, altHtml) {
    if (!root || !altHtml) return 0;
    removeAll(root);
    var box = document.createElement('div'); box.innerHTML = altHtml;
    var rm = box.querySelectorAll('.cps,.cparbar,.cpar-st'), r; for (r = 0; r < rm.length; r++) rm[r].parentNode.removeChild(rm[r]);
    var A = blocks(root), B = blocks(box);
    if (!A.length || !B.length) return 0;
    var cut = 1200, pairs = [], s;
    for (s = 0; s < Math.max(A.length, B.length); s += cut) {
      lcs(A.slice(s, s + cut).map(sig), B.slice(s, s + cut).map(sig)).forEach(function (p) { pairs.push([p[0] + s, p[1] + s]); });
    }
    var n = 0;
    pairs.forEach(function (p) {
      var me = A[p[0]], al = B[p[1]], t1 = tx(me), t2 = tx(al);
      if (!t1 || !t2 || t1 === t2) return;
      if (EN ? !LAT.test(t1) || !CJK.test(t2) : !CJK.test(t1) || !LAT.test(t2)) return;
      n += sentPair(me, t2);
    });
    return n;
  }
  /* ── 逐句對齊 ── */
  var PUN = /[\s　-〿＀-￯‐-‧!-\/:-@\[-`{-~·•…—–“”‘’「」『』（）《》〈〉【】]/g;
  var ZH_END = /[。！？；!?]+(?:[」』”’）)】〕]*)/g, EN_END = /[.!?;](?:["”’)\]]*)(?=\s|$)/g;
  function splitSents(t, zh) {
    t = t.replace(/\s+/g, ' ').trim(); if (!t) return [];
    var re = zh ? ZH_END : EN_END, m, pos = 0, raw = [];   // 只在句尾切，不丟字
    re.lastIndex = 0;
    while ((m = re.exec(t))) { var e = m.index + m[0].length; raw.push(t.slice(pos, e)); pos = e; if (!m[0].length) re.lastIndex++; }
    if (pos < t.length) raw.push(t.slice(pos));
    var out = raw.map(function (x) { return x.trim(); }).filter(Boolean), merged = [];
    out.forEach(function (x) {
      if (merged.length && x.replace(PUN, '').length < (zh ? 3 : 6)) merged[merged.length - 1] += (zh ? '' : ' ') + x;
      else merged.push(x);
    });
    return merged;
  }
  function plen(t, zh) { return Math.max(1, zh ? t.replace(PUN, '').length : t.replace(/\s+/g, ' ').length); }
  function mainBounds(block) {
    var re = EN ? EN_END : ZH_END, w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null), node, out = [], acc = '';
    while ((node = w.nextNode())) {
      var pe = node.parentElement;
      if (pe && pe !== block && pe.closest(EXCL) && block.contains(pe.closest(EXCL))) continue;
      if (pe && pe.closest('.cps,.cparbar')) continue;
      var t = node.nodeValue, m, pos = 0, unit = pe && pe.closest(UNIT);
      if (unit && (unit === block || !block.contains(unit))) unit = null;
      re.lastIndex = 0;
      while ((m = re.exec(t))) {
        var end = m.index + m[0].length;
        acc += t.slice(pos, end); pos = end;
        out.push({ node: node, off: end, unit: unit, text: acc }); acc = '';
      }
      acc += t.slice(pos);
      if (unit && acc.replace(/\s/g, '') && unit.lastChild === node && !(node.nextSibling)) {   // 句子單位在這裡結束、但沒有句尾標點：單位本身當一句
        out.push({ node: node, off: t.length, unit: unit, text: acc }); acc = '';
      }
    }
    if (acc.replace(/\s/g, '')) out.push({ node: null, off: 0, unit: null, text: acc, tail: true });
    var res = [];
    out.forEach(function (b) {
      var last = res[res.length - 1];
      if (last && b.unit && last.unit === b.unit) { last.text += b.text; return; }
      if (b.tail && last && !last.unit && !last.node) { last.text += b.text; return; }
      res.push(b);
    });
    return res;
  }
  function align(ma, al) {
    var M = ma.map(function (t) { return plen(t, !EN); }), A2 = al.map(function (t) { return plen(t, EN); });
    var sm = 0, sa = 0, i, j; for (i = 0; i < M.length; i++) sm += M[i]; for (j = 0; j < A2.length; j++) sa += A2[j];
    var r = sa / sm, m = M.length, n = A2.length, INF = 1e9, Cs = [], B = [];
    for (i = 0; i <= m; i++) { var row = new Float64Array(n + 1); for (j = 0; j <= n; j++) row[j] = INF; Cs.push(row); B.push(new Array(n + 1)); }
    Cs[0][0] = 0;
    var moves = [[1, 1, 0], [1, 2, .6], [2, 1, .6], [1, 3, 1.4], [3, 1, 1.4], [2, 2, 1], [1, 0, 3], [0, 1, 3]];
    for (i = 0; i <= m; i++) for (j = 0; j <= n; j++) {
      if (Cs[i][j] >= INF) continue;
      for (var q = 0; q < moves.length; q++) {
        var mv = moves[q], a = i + mv[0], b = j + mv[1]; if (a > m || b > n) continue;
        var x = 0, y = 0, k; for (k = i; k < a; k++) x += M[k]; for (k = j; k < b; k++) y += A2[k];
        var c = Cs[i][j] + mv[2] + Math.abs(y - r * x) / Math.sqrt(r * x + y + 1);
        if (c < Cs[a][b]) { Cs[a][b] = c; B[a][b] = [i, j]; }
      }
    }
    var groups = []; i = m; j = n;
    while (i > 0 || j > 0) { var p = B[i][j]; if (!p) break; groups.unshift([p[0], i, p[1], j]); i = p[0]; j = p[1]; }
    return groups;
  }
  /* 插在 flex 容器裡（例如「📖 出處」「🎯 標題」那種橫排標題）：自成一行，不要擠在旁邊 */
  function flexFix(sp) {
    var par = sp.parentNode; if (!par || par.nodeType !== 1) return;
    var cs = null; try { cs = getComputedStyle(par); } catch (e) {}
    if (!cs || !/flex/.test(cs.display)) return;
    sp.style.flexBasis = '100%'; sp.style.width = '100%'; sp.style.order = '0';
    if (cs.flexWrap === 'nowrap' && /row/.test(cs.flexDirection || 'row')) { par.setAttribute('data-cpw', par.style.flexWrap || '-'); par.style.flexWrap = 'wrap'; }
  }
  function mkSpan(t) { var d = document.createElement('span'); d.className = 'cps'; d.setAttribute('lang', ALT_LANG); d.setAttribute('data-noread', ''); d.textContent = t; return d; }
  function sentPair(me, altText) {
    var bounds = mainBounds(me), alts = splitSents(altText, EN);
    if (!bounds.length || !alts.length) return 0;
    var groups = bounds.length === 1 ? [[0, 1, 0, alts.length]] : align(bounds.map(function (b) { return b.text; }), alts);
    var ins = [];
    groups.forEach(function (g) {
      var t = alts.slice(g[2], g[3]).join(EN ? '' : ' ');
      if (!t) return;
      var at = g[1] > g[0] ? g[1] - 1 : Math.max(0, g[0] - 1);
      if (ins.length && ins[ins.length - 1][0] === at) ins[ins.length - 1][1] += (EN ? '' : ' ') + t; else ins.push([at, t]);
    });
    for (var k = ins.length - 1; k >= 0; k--) {
      var b = bounds[ins[k][0]], sp = mkSpan(ins[k][1]);
      if (b.unit) b.unit.parentNode.insertBefore(sp, b.unit.nextSibling);
      else if (b.node) { var rest = b.node.splitText(b.off); rest.parentNode.insertBefore(sp, rest); }
      else me.appendChild(sp);
      flexFix(sp);
    }
    return ins.length;
  }

  /* ── 介面 ── */
  function css() {
    if (document.getElementById('cparCss')) return;
    var st = document.createElement('style'); st.id = 'cparCss';
    st.textContent = '.cps{display:block;margin:2px 0 8px;padding:1px 0 1px 9px;border-left:3px solid rgba(128,128,128,.45);font-size:.88em;line-height:1.65;opacity:.74;font-weight:400;font-style:normal;letter-spacing:0;text-transform:none;text-align:left;white-space:normal;word-break:normal;overflow-wrap:anywhere;cursor:auto;background:none!important}'
      + 'h1 .cps,h2 .cps,h3 .cps,h4 .cps,h5 .cps,h6 .cps{font-weight:600}'
      + '.cparbar{display:flex;justify-content:flex-end;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 10px}'
      + '.cparbtn{border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit;border-radius:999px;padding:6px 14px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;line-height:1.3}'
      + '.cparbtn.on{border-color:currentColor}.cpar-st{flex-basis:100%;text-align:right;font-size:12.5px;opacity:.75}';
    document.head.appendChild(st);
  }
  function btnLabel() { var on = isOn(); return '🌐 ' + T('btn') + (EN ? ': ' : '：') + (on ? T('on') : T('off')); }
  function ensureBar(v, root) {
    var bar = root.querySelector('.cparbar');
    if (bar) { var b0 = bar.querySelector('.cparbtn'); if (b0 && b0.textContent !== btnLabel()) { b0.textContent = btnLabel(); b0.className = 'cparbtn' + (isOn() ? ' on' : ''); } return bar; }
    var at = null; try { at = v.bar ? v.bar(root) : null; } catch (e) {}
    if (!at) at = { parent: root, before: root.firstChild };
    if (!at.parent) return null;
    bar = document.createElement('div'); bar.className = 'cparbar'; bar.setAttribute('data-noread', '');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'cparbtn' + (isOn() ? ' on' : ''); b.textContent = btnLabel();
    b.onclick = function (e) { e.stopPropagation(); toggle(); };
    bar.appendChild(b);
    at.parent.insertBefore(bar, at.before || null);
    return bar;
  }
  function status(root, msg) {
    var bar = root.querySelector('.cparbar'); if (!bar) return;
    var s = bar.querySelector('.cpar-st');
    if (!msg) { if (s) s.parentNode.removeChild(s); return; }
    if (!s) { s = document.createElement('div'); s.className = 'cpar-st'; bar.appendChild(s); }
    s.textContent = msg;
  }
  function hash(s) { var h = 2166136261, i; for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; } return h.toString(36) + ':' + s.length; }
  function structSig(root) { return hash(tx(root).replace(/[0-9]/g, '')); }
  function visible(el) { return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)); }

  var MO = null, TM = null, DOING = 0;
  function quiet(fn) { DOING++; try { fn(); } finally { DOING--; if (MO) MO.takeRecords(); } }
  function pass() {
    css();
    var vs = C.views || [], i;
    for (i = 0; i < vs.length; i++) (function (v) {
      var root = null; try { root = v.root(); } catch (e) {}
      if (!root || !visible(root)) return;
      var code = null; try { code = v.code(); } catch (e) {}
      if (code == null) { quiet(function () { var b = root.querySelector('.cparbar'); if (b) b.parentNode.removeChild(b); removeAll(root); }); return; }
      quiet(function () { ensureBar(v, root); });
      if (!isOn()) { if (root.querySelector('.cps')) quiet(function () { removeAll(root); }); return; }
      var sg = structSig(root);
      if (root.__cpk === code && root.__cps === sg && (root.__cpn === 0 || root.querySelector('.cps'))) return;
      if (root.__cpw === code + sg) return;                // 已經在等這一份
      root.__cpw = code + sg;
      var wait = null; try { wait = v.wait ? v.wait() : null; } catch (e) {}
      var grab = v.grab || '#' + root.id, key = code + '\u0001' + grab;
      if (!CACHE.hasOwnProperty(key)) quiet(function () { status(root, (srcFailed ? T('fail') : T('loading'))); });
      altHtml(code, grab, wait, function (h) {
        root.__cpw = null;
        var code2 = null; try { code2 = v.code(); } catch (e) {}
        if (!root.isConnected || code2 !== code || !isOn()) { quiet(function () { status(root, ''); }); schedule(); return; }
        var y = window.scrollY;
        quiet(function () {
          status(root, h ? '' : T('fail'));
          var n = h ? pairInto(root, h) : 0;
          root.__cpk = code; root.__cps = structSig(root); root.__cpn = h ? n : -1;
        });
        if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
      });
    })(vs[i]);
  }
  function schedule() { clearTimeout(TM); TM = setTimeout(function () { try { pass(); } catch (e) {} }, C.delay || 450); }
  function toggle() {
    var on = !isOn(); setOn(on);
    var y = window.scrollY;
    quiet(function () {
      if (!on) removeAll(document);
      var bs = document.querySelectorAll('.cparbtn'), i;
      for (i = 0; i < bs.length; i++) { bs[i].textContent = btnLabel(); bs[i].className = 'cparbtn' + (on ? ' on' : ''); }
      var rs = document.querySelectorAll('.cparbar'); for (i = 0; i < rs.length; i++) { var s = rs[i].querySelector('.cpar-st'); if (s) s.parentNode.removeChild(s); }
    });
    if (on) pass();
    window.scrollTo(0, y);
  }
  function start() {
    try { MO = new MutationObserver(function () { if (!DOING) schedule(); }); MO.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    schedule();
  }
  window.CPAR321 = { toggle: toggle, pass: pass, isOn: isOn, _pair: pairInto, _alt: altHtml, _blocks: blocks };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
