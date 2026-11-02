/* 321健康新生活 · 一起共讀
   帶領者開房間 → 6 位數共讀碼／連結／QR；加入者的手機跟著帶領者換到同一個畫面、同一個捲動位置。
   只同步「在哪個畫面」與捲動比例；個人的健康紀錄、打卡、日誌、設定一律不傳，也不同步那些頁面。
   傳輸：peerjs.min.js（相容 PeerJS 介面的 Cloudflare 中繼站連線層）。Peer id 前綴 hl321-（繁／简／EN 三版共用，互通）。
   ES5。 */
(function () {
  var VER = (function () { try { var s = document.currentScript || document.querySelector('script[src*="coread.js"]'); var m = s && s.src.match(/[?&]v=([^&]+)/); return m ? m[1] : '1'; } catch (e) { return '1'; } })();
  var PEER_JS = ['peerjs.min.js?v=' + VER];
  var QR_JS = ['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js', 'https://unpkg.com/qrcode-generator@1.4.4/qrcode.js', 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'];
  window.CR_SCREEN_APP = true;        /* 投影螢幕模式由本檔自己處理（peerjs.min.js 內建的會把覆蓋層也藏掉） */
  var PFX = 'hl321-', COOL = 8000, SKEY = 'hl321co';
  /* 會同步的畫面（其餘一律不同步）：飲食、斷食、情緒（兩個分頁）、30天靈修（含第幾天）、478呼吸 */
  var SYNC_TABS = { food: 1, fast: 1 };

  var TX = {
    zh: { title: '一起共讀', desc: '開一個共讀房間，把共讀碼或連結傳給弟兄姊妹。他們打開後，手機畫面會跟著你換到同一個頁面、同一個位置。個人的健康紀錄不會被同步。', host: '開共讀房間（我來帶領）', join: '加入', codePH: '輸入 6 位數共讀碼', orJoin: '或加入別人的共讀', code: '共讀碼', people: '已有 {0} 人加入', waiting: '等待弟兄姊妹加入…', invite: '傳送邀請', copyLink: '複製連結', end: '結束共讀', leave: '離開共讀', close: '關閉', inviteMsg: '📡 一起來共讀《321健康新生活》！\n點連結加入：{0}\n或打開 App 按上方「📡」輸入共讀碼：{1}', following: '跟著帶領共讀', paused: '你自己操作中 · 點這裡回到帶領者', connecting: '連線中…', hostChip: '共讀 {0} · {1} 人', ended: '共讀已結束', joined: '已加入共讀，畫面會跟著帶領者', noRtc: '這支手機的瀏覽器不支援共讀，請改用 Chrome 或 Safari', loadErr: '共讀功能載入失敗，請確認網路後再試', badCode: '請輸入 6 位數共讀碼', notFound: '找不到這個共讀房間，請確認共讀碼，或請帶領者重新開房間', followOnly: '你正在跟著共讀', back2: '回到帶領者', tip: '提示：帶領者的手機請保持 App 開著、螢幕不要關，大家才會一直同步。', qrTip: '用手機相機掃描加入', joinedOne: '有一位弟兄姊妹加入共讀', hostLeft: '帶領者暫時離線，正在重新連線…', hostNoSync: '此頁不同步（個人頁面）', otherPage: '帶領者在其他頁面', scrT: '🖥 投影螢幕', scrD: '在連接投影機或電視的電腦／平板瀏覽器打開投影連結，畫面會變成大字、沒有按鈕、自動跟著帶領者換頁。', scrB: '複製投影連結', scrChk: '作為投影螢幕（大字、隱藏介面）', copied: '已複製', scrName: '投影螢幕' },
    zs: { title: '一起共读', desc: '开一个共读房间，把共读码或链接传给弟兄姊妹。他们打开后，手机画面会跟着你换到同一个页面、同一个位置。个人的健康记录不会被同步。', host: '开共读房间（我来带领）', join: '加入', codePH: '输入 6 位数共读码', orJoin: '或加入别人的共读', code: '共读码', people: '已有 {0} 人加入', waiting: '等待弟兄姊妹加入…', invite: '发送邀请', copyLink: '复制链接', end: '结束共读', leave: '离开共读', close: '关闭', inviteMsg: '📡 一起来共读《321健康新生活》！\n点链接加入：{0}\n或打开 App 按上方「📡」输入共读码：{1}', following: '跟着带领共读', paused: '你自己操作中 · 点这里回到带领者', connecting: '连线中…', hostChip: '共读 {0} · {1} 人', ended: '共读已结束', joined: '已加入共读，画面会跟着带领者', noRtc: '这支手机的浏览器不支持共读，请改用 Chrome 或 Safari', loadErr: '共读功能载入失败，请确认网络后再试', badCode: '请输入 6 位数共读码', notFound: '找不到这个共读房间，请确认共读码，或请带领者重新开房间', followOnly: '你正在跟着共读', back2: '回到带领者', tip: '提示：带领者的手机请保持 App 开着、屏幕不要关，大家才会一直同步。', qrTip: '用手机相机扫描加入', joinedOne: '有一位弟兄姊妹加入共读', hostLeft: '带领者暂时离线，正在重新连线…', hostNoSync: '此页不同步（个人页面）', otherPage: '带领者在其他页面', scrT: '🖥 投影荧幕', scrD: '在连接投影机或电视的电脑／平板浏览器打开投影链接，画面会变成大字、没有按钮、自动跟着带领者换页。', scrB: '复制投影链接', scrChk: '作为投影荧幕（大字、隐藏界面）', copied: '已复制', scrName: '投影荧幕' },
    en: { title: 'Read together', desc: 'Open a room and send the room code or link to others. When they open it, their phones follow you to the same screen and scroll position. Personal health records are never shared.', host: 'Open a room (I’ll lead)', join: 'Join', codePH: 'Enter the 6-digit room code', orJoin: 'Or join someone else’s room', code: 'Room code', people: '{0} joined', waiting: 'Waiting for others to join…', invite: 'Send invite', copyLink: 'Copy link', end: 'End session', leave: 'Leave', close: 'Close', inviteMsg: '📡 Come explore 321 Healthy New Life together!\nTap to join: {0}\nOr open the app, tap “📡” at the top and enter code {1}', following: 'Following the leader', paused: 'You’re on your own · tap to return to the leader', connecting: 'Connecting…', hostChip: 'Room {0} · {1}', ended: 'Session ended', joined: 'Joined — your screen will follow the leader', noRtc: 'This browser cannot join a room. Please use Chrome or Safari.', loadErr: 'Could not load Read together. Check your connection and try again.', badCode: 'Please enter the 6-digit room code', notFound: 'Room not found. Check the code, or ask the leader to open a new room.', followOnly: 'You are following', back2: 'Back to leader', tip: 'Tip: the leader should keep the app open with the screen on so everyone stays in sync.', qrTip: 'Scan with a phone camera to join', joinedOne: 'Someone joined the room', hostLeft: 'The leader is offline for a moment — reconnecting…', hostNoSync: 'Not synced (personal page)', otherPage: 'Leader is on another page', scrT: '🖥 Projector screen', scrD: 'Open the projector link in the browser of the computer or tablet connected to a projector or TV: big text, no buttons, and it follows the leader automatically.', scrB: 'Copy projector link', scrChk: 'Use as projector screen (big text, no controls)', copied: 'Copied', scrName: 'Projector' }
  };
  function lang() { var l = String(document.documentElement.getAttribute('lang') || '').toLowerCase(); return /hans|zh-cn|zh-sg/.test(l) ? 'zs' : (/^zh/.test(l) ? 'zh' : 'en'); }
  function X(k) { var s = (TX[lang()] || TX.zh)[k]; if (s == null) s = TX.zh[k] || k; for (var i = 1; i < arguments.length; i++) s = s.replace('{' + (i - 1) + '}', arguments[i]); return s; }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ss(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function $(id) { return document.getElementById(id); }

  var tt = null;
  function toast(m) {
    var t = $('crtoast'); if (!t) { t = document.createElement('div'); t.id = 'crtoast'; document.body.appendChild(t); }
    t.textContent = m; t.className = 'show'; clearTimeout(tt); tt = setTimeout(function () { t.className = ''; }, 2600);
  }
  var loaded = {};
  function loadJs(urls, test, cb) {
    if (test()) { cb(true); return; } var i = 0;
    (function nx() {
      if (i >= urls.length) { cb(false); return; } var u = urls[i++];
      if (loaded[u]) { setTimeout(function () { cb(test()); }, 0); return; }
      var s = document.createElement('script'); s.src = u; s.async = true;
      s.onload = function () { loaded[u] = 1; if (test()) cb(true); else nx(); }; s.onerror = function () { nx(); };
      document.head.appendChild(s);
    })();
  }

  /* ---------- CSS ---------- */
  var css = document.createElement('style'); css.id = 'crcss';
  css.textContent =
    '.crtop{flex:none;width:34px;height:34px;border:0;border-radius:50%;background:var(--surface2,#e8f0e6);color:inherit;font-size:1.05rem;line-height:1;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center;margin-left:auto}' +
    '@media(max-width:360px){.appbar{gap:4px}.appbar .brand{font-size:1rem}.crtop{width:30px;height:30px}.crtop+.lsw{margin-left:2px}}' +
    '.crtop+.lsw{margin-left:6px}.crtop.live{background:var(--brand,#1b5e20);box-shadow:0 0 0 2px rgba(76,194,107,.55)}' +
    '#crchip{position:fixed;left:50%;transform:translateX(-50%);top:calc(3px + env(safe-area-inset-top));z-index:3500;border:0;border-radius:999px;padding:5px 14px 5px 10px;font:inherit;font-size:.82rem;font-weight:700;background:#1b5e20;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.25);max-width:62vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}' +
    '#crchip .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#5BD38A;margin-right:6px;vertical-align:1px;animation:crp 1.6s infinite}' +
    '#crchip.wait .dot{background:#F2C14E}#crchip.off{background:#b26a00}#crchip.off .dot{background:#fff;animation:none}' +
    '@keyframes crp{0%,100%{opacity:1}50%{opacity:.35}}' +
    'body.crOn .wrap{padding-top:calc(34px + env(safe-area-inset-top))}body.crOn .header{top:calc(30px + env(safe-area-inset-top))}' +
    '#crmask{position:fixed;inset:0;z-index:3600;background:rgba(0,0,0,.45);display:flex;align-items:flex-end}' +
    '#crmask .crcard{background:var(--surface,#fff);color:var(--text,#222);width:100%;max-width:560px;margin:0 auto;max-height:88vh;overflow-y:auto;border-radius:20px 20px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));font-size:1rem;line-height:1.6}' +
    '.crh{font-weight:800;font-size:1.15rem;color:var(--brand-d,#14421a);margin-bottom:8px}.crk{font-size:.9rem;color:var(--muted,#667);text-align:center;margin-top:6px}' +
    '.crcode{font-size:2.3rem;font-weight:800;letter-spacing:.12em;text-align:center;color:var(--brand,#1b5e20);margin:2px 0 8px;font-variant-numeric:tabular-nums}' +
    '.crqr{display:flex;justify-content:center;margin:4px 0}.crqr img{width:180px;height:180px;image-rendering:pixelated;background:#fff;border-radius:10px;padding:4px}' +
    '.crcnt{text-align:center;font-weight:700;margin:10px 0 4px}.crdesc{margin-bottom:12px;line-height:1.7;font-size:.95rem}.crtip{margin-top:10px;font-size:.88rem;color:var(--muted,#667);line-height:1.6}' +
    '.crrow{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px}.crb{flex:1 1 auto;min-width:120px;min-height:46px;border:1px solid var(--border,#cfd8cf);border-radius:12px;background:var(--surface2,#f1f5f0);color:var(--text,#222);font:inherit;font-size:1rem;font-weight:700;padding:8px 14px;cursor:pointer}' +
    '.crb.pri{background:var(--brand,#1b5e20);border-color:var(--brand,#1b5e20);color:#fff}.crb.blk{display:block;width:100%}' +
    '.crjoin{display:flex;gap:8px;margin-top:6px}.crjoin input{flex:1;min-width:0;font:inherit;font-size:1.15rem;letter-spacing:.1em;padding:10px 12px;border:1px solid var(--border,#cfd8cf);border-radius:12px;background:var(--surface,#fff);color:var(--text,#222);text-align:center}' +
    '.crchk{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:.92rem}.crchk input{width:20px;height:20px}' +
    '#crtoast{position:fixed;left:50%;bottom:calc(120px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:3700;background:rgba(30,40,30,.92);color:#fff;border-radius:12px;padding:10px 16px;font-size:.95rem;max-width:84vw;text-align:center;opacity:0;pointer-events:none;transition:opacity .25s}#crtoast.show{opacity:1}' +
    /* 投影螢幕模式 */
    'body.crScreen .botbar,body.crScreen .header .topnav,body.crScreen .appbar .lsw,body.crScreen .appbar .sec,body.crScreen #crchip,body.crScreen .crtop,body.crScreen #crmask{display:none!important}' +
    'body.crScreen .wrap{padding-top:12px;padding-bottom:50vh}body.crScreen .header{position:static}body.crScreen .wrap *{pointer-events:none!important}' +
    '#crscr{position:fixed;right:10px;bottom:10px;z-index:3800;display:flex;align-items:center;gap:6px;background:rgba(20,51,111,.9);color:#fff;border-radius:999px;padding:6px 10px;font:13px/1.4 sans-serif;opacity:.55}#crscr:hover,#crscr:active{opacity:1}' +
    '#crscr button{border:0;border-radius:999px;background:rgba(255,255,255,.22);color:#fff;padding:3px 9px;font:inherit;font-weight:700;cursor:pointer}#crscr i{width:9px;height:9px;border-radius:50%;background:#e0a030;display:inline-block}#crscr i.on{background:#4cc26b}';
  document.head.appendChild(css);

  /* ---------- 狀態 ---------- */
  var C = { role: '', code: '', peer: null, conns: [], host: null, last: null, retry: 0, rt: null, manualAt: 0, status: '', want: null, wkey: '', free: false, scr: !!window.CR_SCREEN, sentKey: '~', goAt: 0, lastRx: 0 };
  function baseUrl() { return location.origin + location.pathname.replace(/[^\/]*\.html?$/i, ''); }
  function joinUrl(code) { return baseUrl() + '?join=' + code; }
  function newCode() { var c = ''; for (var i = 0; i < 6; i++) c += Math.floor(Math.random() * 10); return c.charAt(0) === '0' ? '1' + c.slice(1) : c; }
  function live() { var o = []; for (var i = 0; i < C.conns.length; i++) if (C.conns[i].open) o.push(C.conns[i]); return o; }

  /* ---------- 這個 App 的導覽狀態 ---------- */
  function curTab() { var b = document.querySelector('.tnrow button.on'); return b ? b.getAttribute('data-tab') : ''; }
  /* 回傳 {t,n?}；個人頁面回 null（不同步） */
  function pageNow() {
    if ($('devo-overlay')) { var v = 1; try { v = S.devo.view || 1; } catch (e) { } return { t: 'devo', n: v }; }
    if ($('breath-overlay')) return { t: 'breath' };
    if ($('bed-overlay') || $('temp-overlay')) return null;
    var v2 = $('view');
    if (v2 && $('emo-body2') && v2.contains($('emo-body2'))) { var s = $('emo-tb-s'); return { t: 'emo', n: s && /(^|\s)on(\s|$)/.test(s.className) ? 'stress' : 'emotion' }; }
    var tab = curTab(); return SYNC_TABS[tab] ? { t: 'tab', n: tab } : null;
  }
  function keyOf(p) { return p ? p.t + '|' + (p.n == null ? '' : p.n) : ''; }
  function call(f) { try { if (typeof window[f] === 'function') { window[f](); return true; } } catch (e) { } return false; }
  function closeOverlays(except) {
    if (except !== 'devo' && $('devo-overlay')) { if (!call('_devoClose')) $('devo-overlay').remove(); }
    if (except !== 'breath' && $('breath-overlay')) { if (!call('_brClose')) $('breath-overlay').remove(); }
    if ($('bed-overlay')) { if (!call('_bedClose')) $('bed-overlay').remove(); }
    if ($('temp-overlay')) { if (!call('_tempClose')) $('temp-overlay').remove(); }
  }
  /* 加入者：用 App 自己的導覽函式跟過去 */
  function goTo(p) {
    C.goAt = Date.now();
    try {
      if (p.t === 'devo') {
        closeOverlays('devo');
        if (!$('devo-overlay')) openDevo();
        if ((S.devo.view || 1) !== p.n && typeof window._devoView === 'function') window._devoView(p.n);
      } else if (p.t === 'breath') {
        closeOverlays('breath'); if (!$('breath-overlay')) openBreath();
      } else if (p.t === 'emo') {
        closeOverlays('');
        var cur = pageNow();
        if (!cur || cur.t !== 'emo') { go('emo'); setTimeout(function () { if (p.n === 'stress' && window._et) window._et('stress'); C.goAt = Date.now(); }, 140); }
        else if (cur.n !== p.n && window._et) window._et(p.n);
      } else if (p.t === 'tab') {
        closeOverlays(''); go(p.n);
      }
    } catch (e) { if (window.console) console.error(e); }
  }

  /* ---------- 捲動 ---------- */
  function scroller() { var d = $('devo-overlay'); if (d) { var e = d.querySelector('div[style*="overflow-y:auto"]'); if (e) return e; } return null; }
  function fNow() {
    var s = scroller(), top, mx;
    if (s) { top = s.scrollTop; mx = s.scrollHeight - s.clientHeight; } else { top = window.scrollY || document.documentElement.scrollTop || 0; mx = document.documentElement.scrollHeight - (window.innerHeight || 600); }
    if (top < 12 || mx <= 8) return 0; return Math.max(0, Math.min(1, Math.round(top / mx * 1000) / 1000));
  }
  function scrollTo(f, instant) {
    var s = scroller(), mx, top;
    if (s) { mx = s.scrollHeight - s.clientHeight; top = Math.round(Math.max(0, mx) * f); try { s.scrollTo({ top: top, behavior: instant ? 'auto' : 'smooth' }); } catch (e) { s.scrollTop = top; } }
    else { mx = document.documentElement.scrollHeight - (window.innerHeight || 600); top = Math.round(Math.max(0, mx) * f); try { window.scrollTo({ top: top, behavior: instant ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, top); } }
  }

  /* ---------- 帶領者 ---------- */
  function host(code, quiet) {
    loadJs(PEER_JS, function () { return !!window.Peer; }, function (ok) {
      if (!ok) { toast(X('loadErr')); return; }
      teardown(); C.role = 'host'; C.scr = false; window.CR_SCREEN = false; C.code = code || newCode(); C.status = 'connecting'; C.last = null; C.sentKey = '~'; ss(SKEY, { r: 'host', c: C.code }); chip();
      var p = C.peer = new Peer(PFX + C.code, { debug: 0 });
      p.on('open', function () { C.retry = 0; C.status = 'ok'; chip(); if (!quiet) sheet(); snap(true); });
      p.on('connection', function (c) {
        C.conns.push(c);
        c.on('open', function () { chip(); toast(X('joinedOne')); paintCount(); snap(true); });
        c.on('close', function () { drop(c); }); c.on('error', function () { drop(c); });
      });
      p.on('disconnected', function () { if (C.role === 'host' && !p.destroyed) setTimeout(function () { try { p.reconnect(); } catch (e) { } }, 1500); });
      p.on('error', function (e) {
        if (C.role !== 'host') return;
        if (e && e.type === 'unavailable-id') { if (C.retry++ < 25) { C.status = 'connecting'; chip(); clearTimeout(C.rt); C.rt = setTimeout(function () { host(C.code, true); }, 3000); } else { toast(X('loadErr')); end(); } return; }
        if (e && (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' || e.type === 'socket-closed')) { clearTimeout(C.rt); C.rt = setTimeout(function () { if (C.role === 'host') host(C.code, true); }, 4000); }
      });
    });
  }
  function drop(c) { var o = []; for (var i = 0; i < C.conns.length; i++) if (C.conns[i] !== c) o.push(C.conns[i]); C.conns = o; chip(); paintCount(); }
  function bcast(m) { if (C.role !== 'host') return; m.ts = Date.now(); if (m.t === 'st') C.last = m; var cs = live(); for (var i = 0; i < cs.length; i++) try { cs[i].send(m); } catch (e) { } }
  /* 全量狀態：目前畫面（個人頁面時 pg=null）＋捲動比例 */
  function snap(force) {
    if (C.role !== 'host') return;
    var pg = pageNow(), k = keyOf(pg);
    if (!force && k === C.sentKey) return;
    C.sentKey = k; bcast({ t: 'st', pg: pg, f: pg ? fNow() : 0 });
    chip();
  }
  var scT = null;
  function onScroll() {
    if (C.role !== 'host') return; clearTimeout(scT);
    scT = setTimeout(function () { var pg = pageNow(); if (!pg) return; if (keyOf(pg) !== C.sentKey) { snap(); return; } var f = fNow(); if (C.last) C.last.f = f; bcast({ t: 'pos', k: keyOf(pg), f: f }); }, 220);
  }
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 加入者 ---------- */
  function join(code, scr) {
    code = String(code || '').replace(/\D/g, ''); if (code.length !== 6) { toast(X('badCode')); return; }
    if (scr != null) C.scr = !!scr; if (C.scr) window.CR_SCREEN = true; else window.CR_SCREEN = false;
    loadJs(PEER_JS, function () { return !!window.Peer; }, function (ok) {
      if (!ok) { toast(X('loadErr')); return; }
      teardown(); C.role = 'follow'; C.code = code; C.status = 'connecting'; C.first = true; C.misses = 0; C.free = false; C.wkey = '~'; ss(SKEY, { r: 'follow', c: code, s: C.scr ? 1 : 0 }); closeSheet(); screenSync(); chip();
      var p = C.peer = new Peer({ debug: 0 });
      p.on('open', function () { dial(); });
      p.on('disconnected', function () { if (C.role === 'follow' && !p.destroyed) setTimeout(function () { try { p.reconnect(); } catch (e) { } }, 1500); });
      p.on('error', function (e) {
        if (C.role !== 'follow') return;
        if (e && e.type === 'peer-unavailable') { C.misses++; if (C.first && C.misses >= 3) { toast(X('notFound')); leave(true); return; } C.status = 'connecting'; chip(); redial(4000); return; }
        redial(4000);
      });
    });
  }
  function redial(ms) { clearTimeout(C.rt); C.rt = setTimeout(function () { if (C.role === 'follow') dial(); }, ms || 3000); }
  function dial() {
    var p = C.peer; if (!p || p.destroyed || C.role !== 'follow') return;
    if (p.disconnected) { try { p.reconnect(); } catch (e) { } redial(3000); return; }
    try { if (C.host) C.host.close(); } catch (e) { }
    var c = C.host = p.connect(PFX + C.code, { reliable: true });
    var to = setTimeout(function () { if (!c.open && C.role === 'follow' && C.host === c) { try { c.close(); } catch (e) { } redial(1000); } }, 12000);
    c.on('open', function () { clearTimeout(to); C.misses = 0; C.lastRx = Date.now(); C.status = 'ok'; if (C.first) { C.first = false; toast(X('joined')); } chip(); });
    c.on('data', function (m) {
      C.lastRx = Date.now(); if (C.status !== 'ok') { C.status = 'ok'; chip(); } if (!m) return;
      if (m.t === 'st') onState(m); else if (m.t === 'pos') onPos(m); else if (m.t === 'end') leave();
    });
    c.on('close', function () { clearTimeout(to); if (C.role === 'follow' && C.host === c) { C.status = 'lost'; chip(); redial(2500); } });
    c.on('error', function () { });
  }
  function onState(m) {
    var k = keyOf(m.pg), changed = k !== C.wkey;
    C.want = m; C.wkey = k;
    if (!m.pg) { chip(); return; }
    if (changed) C.free = false;                       /* 帶領者換了新畫面 → 一定跟過去 */
    if (!C.free) apply(false);
    chip();
  }
  function onPos(m) {
    if (!C.want || !C.want.pg || m.k !== C.wkey) return;
    C.want.f = m.f;
    if (!C.free && keyOf(pageNow()) === C.wkey && Date.now() - C.manualAt > COOL) scrollTo(m.f);
  }
  /* 換到帶領者的畫面（需要時），再捲到同一比例 */
  function apply(force) {
    var w = C.want; if (C.role !== 'follow' || !w || !w.pg) return;
    if (force) { C.free = false; C.manualAt = 0; }
    if (keyOf(pageNow()) !== C.wkey) { goTo(w.pg); setTimeout(function () { settle(force); }, 420); return; }
    settle(force);
  }
  function settle(force) {
    var w = C.want; if (!w || !w.pg || C.free) return;
    if (keyOf(pageNow()) !== C.wkey) return;
    if (force || Date.now() - C.manualAt > COOL) scrollTo(w.f || 0);
    chip();
  }
  function userMove() { if (C.role === 'follow') { C.manualAt = Date.now(); chip(); } }
  ['touchstart', 'touchmove', 'wheel', 'keydown', 'mousedown'].forEach(function (n) { window.addEventListener(n, function (e) { if (e.target && e.target.closest && e.target.closest('#crchip,#crmask,#crscr')) return; userMove(); }, { passive: true, capture: true }); });

  /* ---------- 重畫鉤子：主內容容器與 body（覆蓋層）的 childList，debounce 150ms ---------- */
  var obT = null;
  function onMut() {
    clearTimeout(obT);
    obT = setTimeout(function () {
      if (C.role === 'host') snap();
      else if (C.role === 'follow') {
        var cur = keyOf(pageNow());
        if (C.want && C.want.pg && cur !== C.wkey && Date.now() - C.goAt > 1200) { if (!C.free) { C.free = true; } chip(); }       /* 加入者自己切到別頁 */
        else if (C.want && C.want.pg && cur === C.wkey && !C.free && Date.now() - C.manualAt > COOL && Math.abs(fNow() - (C.want.f || 0)) > .04 && Date.now() - C.goAt < 4000) scrollTo(C.want.f || 0);
        else chip();
      }
    }, 150);
  }
  function watch() {
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(onMut), v = $('view'); if (v) mo.observe(v, { childList: true });
    mo.observe(document.body, { childList: true });
    document.querySelectorAll('.tnrow button').forEach(function (b) { mo.observe(b, { attributes: true, attributeFilter: ['class'] }); });
  }
  setInterval(function () { if (C.role === 'host') snap(); }, 800);            /* 保險：偵測不到 DOM 變化的狀態（如靈修第幾天） */

  /* 心跳：帶領者每 5 秒報平安；加入者 15 秒沒收到就重新連線 */
  setInterval(function () {
    if (C.role === 'host') { var cs = live(); for (var i = 0; i < cs.length; i++) try { cs[i].send({ t: 'hb' }); } catch (e) { } }
    else if (C.role === 'follow' && C.host && C.lastRx && Date.now() - C.lastRx > 15000) { C.lastRx = 0; C.status = 'lost'; chip(); dial(); }
  }, 5000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    if (C.role === 'follow' && C.status !== 'ok') dial();
    if (C.role === 'host' && C.peer && C.peer.disconnected) try { C.peer.reconnect(); } catch (e) { }
    if (C.scr && C.role) wake();
  });

  /* ---------- 結束 ---------- */
  function teardown() { clearTimeout(C.rt); try { if (C.peer) C.peer.destroy(); } catch (e) { } C.peer = null; C.conns = []; C.host = null; C.want = null; C.wkey = ''; }
  function reset() { teardown(); C.role = ''; C.code = ''; C.last = null; C.free = false; ss(SKEY, null); screenSync(); chip(); closeSheet(); }
  function end() { var cs = live(); for (var i = 0; i < cs.length; i++) try { cs[i].send({ t: 'end' }); } catch (e) { } setTimeout(function () { reset(); toast(X('ended')); }, cs.length ? 300 : 0); }
  function leave(quiet) { reset(); if (!quiet) toast(X('ended')); }

  /* ---------- 狀態 chip ---------- */
  function chip() {
    var tb = $('crTop'); if (tb) tb.className = 'crtop' + (C.role ? ' live' : '');
    document.body.className = document.body.className.replace(/\s*crOn/g, '') + (C.role && !C.scr ? ' crOn' : '');
    var el = $('crchip');
    if (!C.role) { if (el) el.parentNode.removeChild(el); return; }
    if (!el) { el = document.createElement('button'); el.id = 'crchip'; el.onclick = function () { if (C.role === 'follow' && (C.free || Date.now() - C.manualAt < COOL || keyOf(pageNow()) !== C.wkey) && C.want && C.want.pg) { apply(true); return; } sheet(); }; document.body.appendChild(el); }
    var t, cls = '';
    if (C.role === 'host') { t = C.status === 'ok' ? X('hostChip', C.code, live().length) : X('connecting'); if (C.status === 'ok' && !pageNow()) { t += ' · ' + X('hostNoSync'); cls = ' off'; } }
    else if (C.status !== 'ok') { t = C.status === 'lost' ? X('hostLeft') : X('connecting'); cls = ' wait'; }
    else if (C.want && !C.want.pg) { t = X('otherPage'); cls = ' wait'; }
    else if (C.free || (C.manualAt && Date.now() - C.manualAt < COOL) || (C.want && keyOf(pageNow()) !== C.wkey)) { t = X('paused'); cls = ' off'; }
    else t = X('following');
    el.className = cls; el.innerHTML = '<span class="dot"></span>📡 ' + E(t);
    if (C.scr && window.__crScrSet) __crScrSet();
  }
  setInterval(function () { if (C.role === 'follow') chip(); }, 2000);

  /* ---------- 投影螢幕 ---------- */
  var scrZ = 1, wl = null, scrBadge = null, scrIsOn = false;
  function zoomApply() { document.body.style.zoom = Math.max(1.3, Math.min(3.2, (window.innerWidth || 900) / 520)) * scrZ; }
  function wake() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wl = w; }, function () { }); } catch (e) { } }
  function screenSync() {
    var want = !!(C.scr && C.role === 'follow');
    if (want === scrIsOn) { if (want) chip(); return; }
    scrIsOn = want;
    document.body.className = document.body.className.replace(/\s*crScreen/g, '') + (want ? ' crScreen' : '');
    if (want) {
      try { scrZ = parseFloat(localStorage.getItem('hl321_crz') || '1') || 1; } catch (e) { scrZ = 1; }
      zoomApply(); window.addEventListener('resize', zoomApply); wake();
      scrBadge = document.createElement('div'); scrBadge.id = 'crscr';
      scrBadge.innerHTML = '<i id="crscrd"></i><span id="crscrt"></span><button data-a="m">A−</button><button data-a="p">A＋</button><button data-a="x">✕</button>';
      scrBadge.onclick = function (e) {
        var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
        if (a === 'x') { leave(true); return; }
        scrZ = Math.min(2, Math.max(.6, scrZ + (a === 'p' ? .1 : -.1))); try { localStorage.setItem('hl321_crz', String(scrZ)); } catch (e2) { } zoomApply();
      };
      document.body.appendChild(scrBadge);
      window.__crScrSet = function () { var t = $('crscrt'), d = $('crscrd'); if (t) t.textContent = C.code; if (d) d.className = C.status === 'ok' ? 'on' : ''; };
    } else {
      window.removeEventListener('resize', zoomApply); document.body.style.zoom = ''; try { if (wl) wl.release(); } catch (e) { } wl = null;
      if (scrBadge && scrBadge.parentNode) scrBadge.parentNode.removeChild(scrBadge); scrBadge = null; window.__crScrSet = null; C.scr = false; window.CR_SCREEN = false;
    }
    chip();
  }

  /* ---------- 面板 ---------- */
  function closeSheet() { var m = $('crmask'); if (m) m.parentNode.removeChild(m); }
  function qrInto(id, text) {
    loadJs(QR_JS, function () { return typeof window.qrcode === 'function'; }, function (ok) {
      var box = $(id); if (!box || !ok) { if (box) box.style.display = 'none'; return; }
      try { var q = qrcode(0, 'M'); q.addData(text); q.make(); box.innerHTML = q.createImgTag(5, 10); } catch (e) { box.style.display = 'none'; }
    });
  }
  function paintCount() { var e = $('crcount'); if (e) { var n = live().length; e.textContent = n ? X('people', n) : X('waiting'); } }
  function copy(t) {
    var done = function () { toast(X('copied')); };
    try { navigator.clipboard.writeText(t).then(done, fb); } catch (e) { fb(); }
    function fb() { try { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); done(); } catch (e) { window.prompt('', t); } }
  }
  function sheet() {
    closeSheet();
    var h = '<div class="crh">📡 ' + E(X('title')) + '</div>';
    if (C.role === 'host') {
      h += '<div class="crk">' + E(X('code')) + '</div><div class="crcode">' + E(C.code.slice(0, 3) + ' ' + C.code.slice(3)) + '</div>' +
        '<div class="crqr" id="crqr"></div><div class="crk">' + E(X('qrTip')) + '</div><div class="crcnt" id="crcount"></div>' +
        '<div class="crrow"><button class="crb pri" data-a="invite">↗ ' + E(X('invite')) + '</button><button class="crb" data-a="copy">⧉ ' + E(X('copyLink')) + '</button></div>' +
        '<div style="margin-top:12px"><div class="crk" style="text-align:left;font-weight:700">' + E(X('scrT')) + '</div><div class="crtip" style="margin-top:2px">' + E(X('scrD')) + '</div><button class="crb blk" style="margin-top:6px" data-a="scr">' + E(X('scrB')) + '</button></div>' +
        '<div class="crtip">' + E(X('tip')) + '</div>' +
        '<div class="crrow"><button class="crb" data-a="end">■ ' + E(X('end')) + '</button><button class="crb" data-a="close">' + E(X('close')) + '</button></div>';
    } else if (C.role === 'follow') {
      h += '<div class="crk">' + E(X('followOnly')) + '</div><div class="crcode">' + E(C.code.slice(0, 3) + ' ' + C.code.slice(3)) + '</div>' +
        '<div class="crrow"><button class="crb pri" data-a="back">' + E(X('back2')) + '</button><button class="crb" data-a="leave">' + E(X('leave')) + '</button></div>' +
        '<div class="crrow"><button class="crb" data-a="close">' + E(X('close')) + '</button></div>';
    } else {
      h += '<div class="crdesc">' + E(X('desc')) + '</div><button class="crb pri blk" data-a="host">📡 ' + E(X('host')) + '</button>' +
        '<div class="crk" style="margin-top:16px">' + E(X('orJoin')) + '</div>' +
        '<div class="crjoin"><input id="crin" type="tel" inputmode="numeric" maxlength="7" autocomplete="off" placeholder="' + E(X('codePH')) + '"><button class="crb pri" style="flex:none;min-width:80px" data-a="join">' + E(X('join')) + '</button></div>' +
        '<label class="crchk"><input type="checkbox" id="crscrchk"> ' + E(X('scrChk')) + '</label>' +
        '<div class="crrow"><button class="crb" data-a="close">' + E(X('close')) + '</button></div>';
    }
    var m = document.createElement('div'); m.id = 'crmask'; m.innerHTML = '<div class="crcard">' + h + '</div>'; document.body.appendChild(m);
    m.onclick = function (e) {
      if (e.target === m) { closeSheet(); return; }
      var n = e.target; while (n && n !== m && !(n.getAttribute && n.getAttribute('data-a'))) n = n.parentNode; if (!n || n === m) return;
      var a = n.getAttribute('data-a');
      if (a === 'host') { closeSheet(); host(); }
      else if (a === 'join') { var i = $('crin'), c = $('crscrchk'); join(i ? i.value : '', c && c.checked); }
      else if (a === 'invite') { var t = X('inviteMsg', joinUrl(C.code), C.code); if (navigator.share) { navigator.share({ text: t }).then(null, function () { }); } else copy(t); }
      else if (a === 'copy') copy(joinUrl(C.code));
      else if (a === 'scr') copy(joinUrl(C.code) + '&screen=1');
      else if (a === 'end') end();
      else if (a === 'leave') leave();
      else if (a === 'back') { closeSheet(); apply(true); }
      else if (a === 'close') closeSheet();
    };
    if (C.role === 'host') { paintCount(); qrInto('crqr', joinUrl(C.code)); }
    var inp = $('crin'); if (inp) inp.onkeydown = function (e) { if (e.keyCode === 13) join(inp.value, $('crscrchk') && $('crscrchk').checked); };
  }

  /* ---------- 頂端列 📡 按鈕（每個畫面都有） ---------- */
  function mountBtn() {
    if ($('crTop')) return; var bar = document.querySelector('.appbar'); if (!bar) return;
    var b = document.createElement('button'); b.id = 'crTop'; b.className = 'crtop'; b.type = 'button'; b.setAttribute('aria-label', 'co-read'); b.textContent = '📡';
    b.onclick = function () { sheet(); };
    var l = bar.querySelector('.lsw'); if (l) bar.insertBefore(b, l); else bar.appendChild(b);
  }

  window.CR = {
    on: function () { return !!C.role; }, role: function () { return C.role; }, sheet: sheet, join: join, host: host, end: end, leave: leave,
    page: pageNow, text: X
  };
  window.CR_BUSY = function () { return !!C.role; };      /* 自動更新／重載前請先問這個 */

  function boot() {
    mountBtn(); watch(); chip();
    /* 連結 ?join=CODE（&screen=1）或語言頁轉址暫存的 cr_j → 600ms 後自動加入，並清掉網址參數 */
    var j = null, q = location.search, m = q.match(/[?&]join=(\d{6})/);
    if (m) j = { c: m[1], s: /[?&]screen=1/.test(q) ? 1 : 0 };
    else { var o = ss('cr_j'); if (o && o.j && Date.now() - o.t < 20000 && /^\d{6}$/.test(o.j)) j = { c: o.j, s: o.s ? 1 : 0 }; }
    if (m) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { } }
    var keep = ss(SKEY);
    if (j) setTimeout(function () { join(j.c, j.s); }, 600);
    else if (keep && keep.c) setTimeout(function () { if (keep.r === 'host') host(keep.c, true); else join(keep.c, keep.s); }, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
