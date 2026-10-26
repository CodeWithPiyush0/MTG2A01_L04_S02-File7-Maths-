/* [pause] user 2026-10-23: "when I switch tab or minimise the browser the game should be paused, and when I come back it
   should resume". While the page is hidden: every timer the game set is frozen with the time it had left (the steps of a
   page, its waits, its 7s reminders, the clip watchdogs), every animation (CSS and WAAPI) is paused, the voice, the sound
   effects and the music pause and WebAudio is suspended. Back on the page all of it carries on from where it stopped -
   the voice-synced steps follow the clip's own time, so they stay in sync. (setInterval is left alone: the blinks and
   twinkles it drives already skip a hidden page.) */
const GamePause = (function(){
  const _st = window.setTimeout.bind(window), _ct = window.clearTimeout.bind(window);
  const T = new Map(); let seq = 1e7, paused = false, anims = [], media = [], ctxs = [];
  const arm = (id, t)=>{ t.at = performance.now(); t.real = _st(()=>{ T.delete(id); t.fn(...t.args); }, t.ms); };
  window.setTimeout = function(fn, ms, ...args){
    if(typeof fn !== "function") return _st(fn, ms);
    const id = ++seq, t = { fn, args, ms: Math.max(0, +ms || 0), at: 0, real: 0 };
    T.set(id, t); if(!paused) arm(id, t); return id; };
  window.clearTimeout = function(id){ const t = T.get(id); if(t){ _ct(t.real); T.delete(id); } else _ct(id); };
  function pause(){
    if(paused) return; paused = true; const now = performance.now();
    T.forEach(t =>{ _ct(t.real); t.ms = Math.max(0, t.ms - (now - t.at)); });
    try{ anims = document.getAnimations().filter(a => a.playState === "running"); anims.forEach(a => a.pause()); }catch(e){ anims = []; }
    media = [...document.querySelectorAll("audio, video")].concat(typeof voEl !== "undefined" ? [voEl] : [],
              typeof _sfxPool !== "undefined" ? _sfxPool : [], (typeof BGM !== "undefined" && BGM.el) ? [BGM.el] : []);
    media = [...new Set(media)].filter(m => m && !m.paused && !m.ended); media.forEach(m =>{ try{ m.pause(); }catch(e){} });
    ctxs = [typeof _juiceAC !== "undefined" ? _juiceAC : null, typeof _actx !== "undefined" ? _actx : null].filter(c => c && c.state === "running");
    ctxs.forEach(c =>{ try{ c.suspend(); }catch(e){} });
  }
  function resume(){
    if(!paused) return; paused = false;
    ctxs.forEach(c =>{ try{ c.resume(); }catch(e){} }); ctxs = [];
    media.forEach(m =>{ try{ m.play().catch(()=>{}); }catch(e){} }); media = [];
    anims.forEach(a =>{ try{ if(a.playState === "paused") a.play(); }catch(e){} }); anims = [];
    T.forEach((t, id)=> arm(id, t));
  }
  document.addEventListener("visibilitychange", ()=>{ if(document.hidden) pause(); else resume(); });
  return { pause, resume, get paused(){ return paused; } };
})();
const CARD = JSON.parse(document.getElementById('cardData').textContent);
  const AUDIO_EXT = (CARD.assets && CARD.assets.audio_ext) || "ogg";  // Ogg/Opus (every lesson's audio since 2026-10-06; Chrome/Edge/Firefox, Safari 18.4+)
  const IMG_EXT   = (CARD.assets && CARD.assets.img_ext)   || "webp"; // WebP (all still art; Chrome/Edge/Firefox/Safari 14+) — twin of AUDIO_EXT (fixes A3)
  const ENGINE_VERSION = "2026.07.16i-r4-unified";  // ENGINE STAMP — the receipt (verify_bundle.py) asserts a built game carries THIS exact string; a stale/divergent engine → hard FAIL, so the wrong engine can never silently ship. BUMP IN LOCKSTEP with engine_guard.py + swiftpal_build.py + unified_build.py + verify_bundle.py on EVERY engine change (r2: drag/pattern feedback standard + PHASE_TRANSITION; r3c: off-white toybox bg, dual-coded counting options numeral+hand, full-body landing mascot, true-corner square/rect; r3d: Swiftie mouth-stops-when-silent (still frame), Arabic display numerals 1/2/3, landing shows full 1..n hand row, volume-chip aligned in header pill); r4: additive number-sequence path modules MEET_SEQUENCE + SEQUENCE_COMPLETE + SEQUENCE_NEXT (MTKGA01_L02_S04 "completes a number sequence within 20") — purely additive, existing lessons untouched. r4-landing (16c): landing recomposed to match reference — small corner mascot (230px, was 300), content re-centered (dropped padding-left:300 right-shift hack), VO chip moved from top-right to the mascot's shoulder (left:150/bottom:34, 58px). CSS-only; supersedes the 16b right-shift overlap fix.; 16d: TRUNK MERGE — unified the two diverged engine lines at base 12d: the 15e mechanics trunk (CONSERVE_COUNT + COUNT_ACTION + COUNT_DRAG_MATCH + ORDER_BY_WEIGHT + PICK_SET_BY_NUMBER, per_row/dense count-set grouping, bigNumCell numeral-only test options, title_first landing order) + the 16c r4 design trunk (boot loader, peek phase-transition, concept-strip landing, DS header, flat CTAs, sunburst/star-burst celebration, recomposed corner-mascot landing). Nothing dropped from either line. 16e: landing count-hero hand sizing FIXED — the .sg-hero sizing selectors never matched (template uses .sg-art); hands rendered natural-size, overflowing the card (title pushed outside the box, numeral-1 hidden behind the mascot — user-visible on MTKGA01_L02_S01). Retargeted to .sg-art .sg-hand/.sg-hand-cell/.sg-hand-num (112px; image-hero landings untouched). CSS-only. 16f: INTRO strip fit-or-wrap — old sizing assumed 1220px + a -100px breakout and punched wide strips (10 numerals, 7+ letters) through the tut-frame borders; now sized to the frame (960) and wrapping into two balanced rows below the 110px touch floor. Fixes MTKGA01_L02_S01 s00 (user-caught live) AND the HIKGH04_P2 letter-row daylight item.
  try { window.SWIFTPAL_ENGINE = ENGINE_VERSION; } catch(e){}
const $ = id => document.getElementById(id);

/* ---------- 1. SCALE THE 1333x750 STAGE - ON EVERY SCREEN ----------
   [responsive] (review 2026-10-01: "make my game all screen responsive"). The lesson is ONE fixed 1333x750 stage,
   scaled as a whole to the largest size the screen holds (contain-fit) and never re-laid-out: in a measuring game
   the sizes ARE the content (each object is exactly n blocks long), so nothing may reflow on a phone. Every other
   shape of screen is handled AROUND the stage:
   - viewport-fit=cover (index.html): the page fills the whole screen, notch and home bar included, and the STAGE is
     fitted inside the safe area (env(safe-area-inset-*)) - no button ever sits under a notch or the home bar.
   - the bands a stage leaves (above and below it on a 4:3 iPad, beside it on a 20:9 phone) show the slide's OWN
     backdrop, mirrored at the stage's edge (bleed below): the room, the yard, the fridge door simply carry on.
   - a phone or tablet held upright: a "turn it" card over the lesson (html.ask-rotate); a voice line that was
     speaking waits for the turn back, then goes on.
   - a phone/tablet BROWSER goes full screen on the play tap, and stays landscape where it can (Android).
   Pointer maths everywhere reads --scale at the moment it runs, so drags stay exact at every size. */
const Screen = (function(){
  const root = document.documentElement;
  let probe = null, asking = false, heldVO = false, bleedQueued = false;
  function safe(){
    if(!probe){ probe = document.createElement("div"); probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
        "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
      (document.body || root).appendChild(probe); }
    const cs = getComputedStyle(probe);
    return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }
  function touch(){ try{ return matchMedia("(pointer: coarse)").matches; }catch(e){ return false; } }
  function fit(){
    const vw = (window.visualViewport ? window.visualViewport.width  : root.clientWidth)  || window.innerWidth;
    const vh = (window.visualViewport ? window.visualViewport.height : root.clientHeight) || window.innerHeight;
    const sa = safe(), aw = Math.max(1, vw - sa.l - sa.r), ah = Math.max(1, vh - sa.t - sa.b);
    // contain-fit, scaling UP to fill the screen (no 1x cap, no margin) so a 16:9 viewport is covered edge-to-edge
    const s = Math.min(aw / 1333, ah / 750);
    root.style.setProperty("--scale", s);
    root.style.setProperty("--safe-dx", (sa.l - sa.r) / 2 + "px");   // centred in the safe area, not the whole screen
    root.style.setProperty("--safe-dy", (sa.t - sa.b) / 2 + "px");
    root.classList.toggle("bands-x", vw - 1333 * s > 1);              // (QA hooks: which bands the bleed fills)
    root.classList.toggle("bands-y", vh - 750 * s > 1);
    rotate(touch() && vh > vw * 1.1);
  }
  function rotate(on){
    if(on === asking) return;
    asking = on; root.classList.toggle("ask-rotate", on);
    try{                                                              // (voEl: the one VO element, below - not there yet on the first fit)
      if(on && !voEl.paused && !voEl.ended){ voEl.pause(); heldVO = true; }
      else if(!on && heldVO){ heldVO = false; voEl.play().catch(()=>{}); }
    }catch(e){}
  }
  /* a phone/tablet browser: full screen, landscape-locked where the browser can (Android Chrome). Called from a tap.
     Never on a desktop, inside an embedding page, or in a host app's WebView - those run the screen themselves. */
  function fullscreen(){
    try{
      const bridge = window.SwiftPAL && window.SwiftPAL._platform;
      if(!touch() || window.self !== window.top || (bridge && bridge !== "web") || /; wv\)/.test(navigator.userAgent)) return;
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      if(!req || document.fullscreenElement || document.webkitFullscreenElement) return;
      const lock = ()=>{ try{ screen.orientation.lock("landscape").catch(()=>{}); }catch(e){} };
      const p = req.call(root, { navigationUI: "hide" });
      if(p && p.then) p.then(lock, ()=>{}); else lock();
    }catch(e){}
  }
  /* the bands: 8 mirrored copies of the stage's own backdrop around it (index.html #stageBleed), kept in step with every
     change of it - a slide's data-bg and --horizon, the tutorial's white, the landing's and the end's transparency.
     While a hint card dims the stage, they dim with it (.dim). */
  function bleed(){
    bleedQueued = false;
    const st = document.getElementById("stage"), b = document.getElementById("stageBleed");
    if(!st || !b) return;
    /* (review 2026-10-07 "fix these line cuts": at a fractional --scale the stage's background COLOUR was painted to its
       very edge but its picture stopped short of the last device column, so the colour - the floor's, under every room
       picture - showed as a 1px line down the stage's right side. The colour now lies on an underlay 1px inside the
       stage (.stage-wrap.bg-under::before, --stage-bg) and the stage's own is transparent: the edge column is picture
       + band only. The wrap is not observed, so toggling its class to read the slide's colour starts no loop.) */
    const wrap = st.parentElement; wrap.classList.remove("bg-under");
    const cs = getComputedStyle(st), color = cs.backgroundColor;
    const css = "background-color:" + color + ";background-image:" + cs.backgroundImage + ";background-size:" + cs.backgroundSize +
                ";background-position:" + cs.backgroundPosition + ";background-repeat:" + cs.backgroundRepeat;
    wrap.style.setProperty("--stage-bg", color); wrap.classList.add("bg-under");
    if(b._css === css) return;
    b._css = css; b.dataset.bg = st.dataset.bg || "";
    for(const i of b.children) i.style.cssText = css;
  }
  function queueBleed(){ if(!bleedQueued){ bleedQueued = true; requestAnimationFrame(bleed); } }
  function watch(){
    const st = document.getElementById("stage");
    if(!st || !window.MutationObserver) return;
    const mo = new MutationObserver(queueBleed);
    mo.observe(st, { attributes: true, attributeFilter: ["class", "style", "data-bg"] });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const ra = document.getElementById("rotateAsk"); if(ra) ra.addEventListener("click", fullscreen);   // Android: the tap itself turns the screen
    queueBleed();
  }
  window.addEventListener("resize", fit);
  window.addEventListener("load", fit);
  if(window.visualViewport) window.visualViewport.addEventListener("resize", fit);
  fit(); watch();
  return { fit: fit, fullscreen: fullscreen, bleed: queueBleed };
})();

/* ---------- 2. SIGNAL BUS + OFFLINE TELEMETRY ---------- */
/* TELEMETRY: offline self-capture. Every signal is buffered to localStorage so
   the run survives a reload / works with NO host app. A full results record can
   be pulled via GameBus.downloadResults() (or the ?dev=1 button on the end
   screen). If `endpoint` is set AND the device is online, the final record is
   also POSTed — left null so the lesson is fully offline by default. */
const TELEMETRY = {
  endpoint: null,   // e.g. "https://lrs.example.com/swiftpal" — null = offline only
  storageKey: "swiftpal:run:" + CARD.skill_code + "_" + (CARD.part_label || "P1")
};
/* ===== QA CHECKLIST [14]: xAPI VERB LAYER =================================
   The engine emits 36 GameBus signals but none of the seven required xAPI
   verbs. This layer maps the ones that already have a signal and fires the
   rest explicitly. context echoes context_id / journey_id / medium straight
   off the launch URL and always carries skill_code. */
const XAPI = window.XAPI = (function(){
  var q; try{ q = new URLSearchParams(location.search); }catch(e){ q = { get:function(){ return null; } }; }
  var startedAt = Date.now();
  var ctx = { skill_code: CARD.skill_code, lo_code: CARD.lo_code,
              context_id: q.get("context_id"), journey_id: q.get("journey_id"),
              medium: q.get("medium") || CARD.medium || "hi" };
  /* [QA 14] question_format per answerable slide type (HI01's enum). */
  var QUESTION_FORMAT = { PV_SUB:"mcq", MENTAL_SUB:"mcq" };
  var log = [], fired = {};
  /* send(verb, object, result): builds the standard { verb, object, result, context } statement
     (HI01 shape) and hands it to the platform bridge - SwiftPAL.sendEvent -> Android / iOS / web.
     Falls back to a direct postMessage only if the bridge is absent (standalone dev).
     context echoes context_id / journey_id / medium off the launch URL, always carries skill_code,
     and on a slide-level verb adds question_id / question_index / template / question_format / phase. */
  function send(verb, object, result){
    var o = object || {}, sl = null;
    try{ if(o.slide_id) sl = CARD.slides.find(function(x){ return x.id === o.slide_id; }) || null; }catch(e){}
    var c = Object.assign({}, ctx, { session_ms: Date.now() - startedAt });
    if(sl){ Object.assign(c, { question_id: sl.id, question_index: CARD.slides.indexOf(sl), template: sl.type,
                               question_format: (sl.data && sl.data.answer === "numpad") ? "numeric_input" : (QUESTION_FORMAT[sl.type] || null), phase: sl.phase }); }
    var statement = { verb: verb, object: o, result: result || {}, context: c };
    log.push(Object.assign({ ts: Date.now() }, statement));
    try{
      if(window.SwiftPAL && typeof window.SwiftPAL.sendEvent === "function") window.SwiftPAL.sendEvent(statement);
      else window.parent && window.parent.postMessage({ type:"swiftpal:xapi", statement: statement }, "*");
    }catch(e){}
    try{ console.log("[xapi]", verb, statement); }catch(e){}
    return statement;
  }
  return { ctx:ctx, log:log, send:send,
           once:function(v,o,r){ if(fired[v]) return null; fired[v]=1; return send(v,o,r); },
           hasFired:function(v){ return !!fired[v]; } };
})();
/* signal -> verb, for the three that already have a 1:1 signal */
const XAPI_MAP = { slide_entered:"screen_viewed", hint_shown:"hint_used", audio_replay:"audio_replayed" };
const XAPI_ANSWERABLE = ["PV_SUB","MENTAL_SUB"];   /* slide types that send question_started */

/* [QA 01] The game's internal bus is GameBus (window.GameBus). The global SwiftPAL name belongs to
   the platform bridge (swiftpal-bridge.js, loaded first), which XAPI.send() hands each statement to.
   This bus used to be called SwiftPAL itself, which took the name the host bridge needs. */
const GameBus = window.GameBus = {
  signals: [],
  validatorReport: { missing_signals: [], errors: [], passed: false },
  firedSet: new Set(),
  startedAt: Date.now(),
  emit(name, payload){
    const evt = Object.assign({
      ts: Date.now(),
      skill_code: CARD.skill_code,
      lo_code: CARD.lo_code,
      signal: name
    }, payload || {});
    this.signals.push(evt);
    this.firedSet.add(name);
    /* [14] fan the mapped signals out as xAPI verbs */
    /* a MANUAL hint_shown is a bulb tap, whose hint_used the capture listener on #hintBtn already
       sent - mapping it too would log the verb twice ([QA 14] no duplicated verbs). */
    /* [QA 14] one verb per screen, as HI01 does: an answerable slide sends question_started
       (mountSlide), everything else screen_viewed - never both for the same slide. */
    try{ if(XAPI_MAP[name] && !(name === "hint_shown" && payload && payload.manual)
            && !(name === "slide_entered" && payload && XAPI_ANSWERABLE.indexOf(payload.type) >= 0))
           XAPI.send(XAPI_MAP[name], { slide_id: payload && payload.slide_id }, payload || {}); }catch(e){}
    try{ console.log("[signal]", name, evt); }catch(e){}
    /* [QA 14] NOISE CONTROL (as HI01): the raw signal firehose is DEV-ONLY. Production hosts receive
       only the 7 xAPI verbs through the bridge. */
    if(new URLSearchParams(location.search).has("dev")){
      try{ window.parent?.postMessage({type:"swiftpal:signal", payload: evt}, "*"); }catch(e){}
    }
    this.persist();
  },
  /* full results record (used for download / POST / end-of-lesson dump) */
  exportResults(){
    const ms = (typeof state!=="undefined") ? state.masteryAttempts : 0;
    const mh = (typeof state!=="undefined") ? state.masteryHits : 0;
    return {
      skill_code: CARD.skill_code, lo_code: CARD.lo_code, part: CARD.part_label || null,
      started_at: this.startedAt, exported_at: Date.now(),
      mastery: { hits: mh, attempts: ms, score: ms ? mh/ms : 0 },
      validatorReport: this.validatorReport,
      signals: this.signals
    };
  },
  /* silent: flush the running buffer to localStorage (survives reload / offline) */
  persist(){
    try{ localStorage.setItem(TELEMETRY.storageKey, JSON.stringify(this.exportResults())); }
    catch(e){ /* private mode / quota — non-fatal, postMessage + memory still work */ }
  },
  /* pull the run as a JSON file (teacher/dev; not in the child's flow) */
  downloadResults(){
    try{
      const blob = new Blob([JSON.stringify(this.exportResults(), null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = CARD.skill_code + "_" + (CARD.part_label||"P1") + "_results.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=> URL.revokeObjectURL(url), 1000);
    }catch(e){ console.error("[telemetry] download failed", e); }
  }
};

/* ---------- 3. AUDIO ---------- */
let isPlaying=false, currentAudio=null;
function setPlaying(on){
  // the dynamic Swiftie sits header-left; the audio chips pulse to signal playback. r4/F1: share the
  // .playing toggle across the header chip AND the tut-card replay chip (the header is hidden in the
  // tut frame, so the in-card .tut-audio is the only visible affordance and must react to VO too).
  isPlaying=on;
  bgmDuck();
  /* [QA 05] only the chip the audio is actually coming FROM animates, and only one at a time.
     It used to pulse every chip for every sound - option words, feedback, the count-aloud. */
  const src = on && currentAudio ? srcOf(currentAudio) : null;
  const from = on ? chipFor(src) : null;
  document.querySelectorAll(".audio-chip, .tut-audio, .sg-vo").forEach(c => c.classList.toggle("playing", c === from));
  swApplyPose();   // freeze/unfreeze Swiftie's mouth: animate only while a clip is sounding
}
/* [QA 15] ONE reusable VO element, not a new Audio() per clip. Every clip used to get its own
   element and none was ever released: ~150 live media players by the last question, and the
   renderer crashed there on every full playthrough (Android WebViews cap players far lower).
   _playTok retires a superseded clip's callbacks, so a stopped clip can never fire onEnd late. */
const voEl = new Audio(); voEl.preload = "auto";
let _playTok = 0;
/* chipFor(src): the ONE chip a clip belongs to, or null. The landing greeting belongs to the
   landing chip; a slide's own lines (prompt / ask / conclude ...) to that slide's chip - the in-card
   tutorial chip when the tutorial frame is up, else the header chip. Feedback, option words and
   the count-aloud belong to no chip, so no chip moves for them. */
const _FEEDBACK_KEYS = { correct:1, try_again:1, hint:1, hint1:1, reveal:1, sfx:1 };
function chipFor(src){
  if(!src || typeof CARD === "undefined") return null;
  const gate = document.getElementById("startGate");
  if(gate && !gate.classList.contains("hidden")){
    const land = (CARD.assets && CARD.assets.audio && CARD.assets.audio.vo_landing) || "";
    return land && src.indexOf(land) >= 0 ? document.getElementById("sgVo") : null;
  }
  const sl = CARD.slides[state.idx];
  if(!sl || !sl.audio) return null;
  const own = Object.keys(sl.audio).some(k => !_FEEDBACK_KEYS[k] && src === audioFor(sl, k));
  if(!own) return null;
  return document.querySelector("#slideHost .tut-audio") || document.getElementById("audioChip");
}
/* [QA 11] replay-chip guard (HI01 [24a N8]): a replay tap while a clip is sounding is ignored.
   play() stops the current clip, and a paused clip never fires its end callback - so a replay
   mid-count froze DEMO_COUNT (आगे never unlocked) and mid-answer-word lost the auto-advance.
   The tap still reports audio_replayed (flagged ignored), so every tap is logged. */
function replayTap(slide, src){
  state.audioReplays++;
  const busy = isPlaying;
  GameBus.emit("audio_replay", { slide_id: slide ? slide.id : "landing", phase: slide ? slide.phase : "landing",
    count: state.audioReplays, src: src, ignored_while_playing: busy });
  return !busy;
}
function stopAudio(){
  _playTok++;
  if(currentAudio){ try{ currentAudio.pause(); }catch(e){} currentAudio=null; }
  setPlaying(false);
}
/* play(src, onEnd): real clip if the path exists; silent beat if missing/blocked. */
function play(src, onEnd){
  stopAudio(); setPlaying(true);
  const tok = _playTok;
  let done=false; const fire=()=>{ if(done || tok !== _playTok) return; done=true; currentAudio=null; setPlaying(false); if(onEnd) onEnd(); };
  if(src){
    const a = voEl; currentAudio = a;
    let retried = false;
    a.onended = fire;
    /* the clip's blob: copy failed (Assets): the file's own URL, once; anything else - a silent beat, then on */
    a.onerror = ()=>{ if(tok !== _playTok) return;
      if(!retried && /^blob:/.test(a.src)){ retried = true; a.src = src; a.play().catch(()=>{ if(tok === _playTok) setTimeout(fire, 1200); }); return; }
      setTimeout(fire, 1200); };
    a.setAttribute("data-asset", src);
    a.src = Assets.url(src); setPlaying(true);   // re-apply now the src is known, so the right chip lights
    a.play().catch(()=>{ if(tok === _playTok) setTimeout(fire, 1200); });
    /* WATCHDOG: whatever waits on this clip's end (आगे, the next line, the play button) can never be stranded by a clip
       that stalls mid-way or never reports `ended`: the clip's remaining length + 3s grace, re-armed while it is still
       really moving on. No length yet (metadata stuck): 15s. */
    let lastT = -1;
    const watch = ()=>{ if(done || tok !== _playTok) return;
      const left = isFinite(a.duration) && a.duration > 0 ? (a.duration - a.currentTime) / (a.playbackRate || 1) : 12;
      setTimeout(()=>{ if(done || tok !== _playTok) return;
        if(!a.paused && !a.ended && a.currentTime > lastT + 0.05){ lastT = a.currentTime; watch(); } else fire(); }, Math.max(0, left) * 1000 + 3000);
    };
    watch();
  } else { setTimeout(fire, 800); }
}
/* playSfx(id): fire-and-forget sound effect that can overlap the spoken VO (does NOT touch
   currentAudio / the play() chain). Two pooled elements, reused - never one per call.
   Silently no-ops if the file is missing or playback is blocked. */
const _sfxPool = [new Audio(), new Audio(), new Audio(), new Audio()]; let _sfxNext = 0;
function playSfx(id, onEnd){
  if(!id) return;
  try{
    const a = _sfxPool[_sfxNext++ % _sfxPool.length];
    a.pause(); a.volume = 0.7; a.onended = onEnd ? ()=>{ a.onended = null; onEnd(); } : null;
    const f = "assets/voiceover/" + id + "." + AUDIO_EXT;
    a.onerror = ()=>{ a.onerror = null; if(/^blob:/.test(a.src)){ a.src = f; a.play().catch(()=>{}); } };   // blob: copy failed - the file, once
    a.setAttribute("data-asset", f); a.src = Assets.url(f);
    a.play().catch(()=>{});
  }catch(e){}
}
/* ---------- game-feel: procedural SFX (no audio files) + success particle burst ----------
   WebAudio resumes on the first user tap (autoplay policy), so taps/answers always sound. */
let _juiceAC = null;
function _ac(){ if(!_juiceAC){ try{ _juiceAC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} }
  if(_juiceAC && _juiceAC.state === "suspended"){ try{ _juiceAC.resume(); }catch(e){} } return _juiceAC; }
function _tone(freqs, type, dur, vol){ const c = _ac(); if(!c) return; const t0 = c.currentTime;
  freqs.forEach((f, i)=>{ const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
    const t = t0 + i*(dur/freqs.length); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur/freqs.length); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur/freqs.length); }); }
const sfxTap       = ()=> _tone([520], "sine", 0.09, 0.09);
/* ===== QA checklist 2026-10-05: the STANDARD SFX + background music, as files in assets/sfx/ =====
   sfx_correct / sfx_wrong (correct + incorrect feedback), sfx_confetti (with every confetti burst), sfx_play (the play
   button), sfx_nudge (a soft, encouraging chime with each nudge hand), bgm (the lesson's background track, from the play
   tap on) and bgm_game (the practice game's track - the lesson track carries on if it is not shipped). A file that
   is missing or blocked is silent; correct / wrong fall back to the old procedural tones so feedback is never mute. */
const SFX_DIR = "assets/sfx/";
function playSfxFile(name, vol, fallback){
  try{
    const a = _sfxPool[_sfxNext++ % _sfxPool.length];
    a.pause(); a.volume = vol == null ? 0.8 : vol;
    const f = SFX_DIR + name + "." + AUDIO_EXT;
    /* its blob: copy failed (Assets): the file's own URL, once; the file itself failed: the procedural fallback */
    a.onerror = ()=>{ if(/^blob:/.test(a.src)){ a.src = f; a.play().catch(()=>{}); return; } a.onerror = null; if(fallback) fallback(); };
    a.setAttribute("data-asset", f); a.src = Assets.url(f);
    a.play().catch(()=>{});
  }catch(e){ if(fallback) fallback(); }
}
const sfxCorrect   = ()=> playSfxFile("sfx_correct", 0.8, ()=> _tone([660, 880, 1180], "sine", 0.42, 0.13));
const sfxWrongSoft = ()=> playSfxFile("sfx_wrong", 0.6, ()=> _tone([300, 235], "triangle", 0.20, 0.08));   // gentle, never harsh
/* 2026-10-07: the team's Standard SFX pack (correct / incorrect / confetti / play / next). Its confetti is mastered
   ~8dB hotter than the kit's and lands on top of sfx_correct + the VO, so it plays lower to sit under them. */
const sfxConfetti  = ()=> playSfxFile("sfx_confetti", 0.45);
const sfxPlay      = ()=> playSfxFile("sfx_play", 0.9);
const sfxNext      = ()=> playSfxFile("sfx_next", 0.9);   // the आगे tap (a disabled आगे fires no click, so no sound)
const sfxNudge     = ()=> playSfxFile("sfx_nudge", 0.45);
/* background music: one looping element, started by the play tap (never before it), ducked under every VO clip,
   paused while the app is in the background. bgmFor(phase) picks the track: the practice game has its own. */
/* 2026-10-07: bgm.ogg is the team's "Standard Background Music 2" (bouncy, seamless 4-min loop; "1" is an 18s lo-fi loop
   that would repeat ~30x a lesson). Its quietness is BAKED INTO THE FILE (-33 LUFS, ~14.5dB under the VO's -18.5): iOS
   Safari ignores media .volume, so a loud file would play at full VO level there. VOL/DUCK only add the dip under VO
   (0.35 = -9dB, ~24dB under the voice); the dip is a short fade, not a jump, so the bed never pumps. */
var BGM = { el: null, track: "", VOL: 0.3, DUCK: 0.1, raf: 0 };   // user 2026-10-23: the music at 30 % (was 100 %); under the voice 0.1 (was .35 of 1 - the same dip)   // (var: setPlaying, above, may reach it)
function bgmDuck(){
  if(!BGM || !BGM.el) return;
  const el = BGM.el, from = el.volume, to = isPlaying ? BGM.DUCK : BGM.VOL, ms = to < from ? 180 : 600, t0 = performance.now();
  cancelAnimationFrame(BGM.raf);
  const step = now =>{ if(BGM.el !== el) return; const k = Math.max(0, Math.min(1, (now - t0) / ms));   // (a frame's timestamp can be a little BEFORE t0: k < 0 set volume > 1 and threw - BGM duck clamp
    el.volume = from + (to - from) * k; if(k < 1) BGM.raf = requestAnimationFrame(step); };
  BGM.raf = requestAnimationFrame(step);
}
function bgmFor(phase){
  const want = phase === "practice" ? "bgm_game" : "bgm";
  if(!BGM.el || BGM.track === want) return;
  bgmPlay(want, ()=>{ if(want !== "bgm" && BGM.track !== "bgm") bgmPlay("bgm"); });          // no game track shipped: keep the lesson one
}
function bgmPlay(track, onMissing){
  /* only a track that ships (ASSET_SIZES = the files on disk): bgm.ogg / bgm_game.ogg are not in this lesson yet, and
     asking for them was a 404 on every play tap. Drop a file into assets/sfx/ and run tools/gen_asset_sizes.js. */
  if(!Object.prototype.hasOwnProperty.call(ASSET_SIZES, SFX_DIR + track + "." + AUDIO_EXT)){ if(onMissing) onMissing(); return; }
  try{
    const old = BGM.el; if(old){ old.pause(); old.onerror = null; }
    const a = new Audio(); a.loop = true; a.preload = "auto";
    a.onerror = ()=>{ a.onerror = null; if(BGM.el === a && onMissing) onMissing(); };
    a.src = Assets.url(SFX_DIR + track + "." + AUDIO_EXT);
    a.volume = isPlaying ? BGM.DUCK : BGM.VOL;   // start at the right level - a new track never fades in from 1
    BGM.el = a; BGM.track = track; bgmDuck();
    a.play().catch(()=>{});
  }catch(e){}
}
function bgmStart(){ if(!BGM.el) bgmPlay("bgm"); }
/* (the music pauses / resumes with the rest of the game while the page is hidden: GamePause, at the top) */
/* dynamic Swiftie buddy: swap pose + a little pop on every reaction (correct/wrong/explain/celebrate) */
// [20a mascot-01] moods -> production EXPRESSIONS (head webp), not idle-gif basenames.
//   Ported verbatim from HI01H01_L02_S04_dist (its app lines 2474-2493) together with the
//   .mascot-wrap > .mascot-circle > .mascot-img markup. The old sw_anim_*.gif scheme and the
//   isPlaying mouth-coupling go with it - heads are now driven by setSwMood alone.
const SW_POSE = { talk:"talking", point:"talking", idle:"talking", happy:"celebrate", celebrate:"celebrate",
                  hint:"hint", teach:"hint", idea:"hint", tryagain:"tryagain" };
const SW_STILL = (() => { try { const q=new URLSearchParams(location.search);
  return q.has("still") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch(e){ return false; } })();
let swMood = "point", _celebUrl = "", _celebKey = null;
function swApplyPose(){ /* [20a] retired: heads no longer couple to isPlaying (setSwMood drives them). */ }
function setSwMood(m){ swMood = m;
  const img = document.getElementById("swBuddyImg"), w = document.getElementById("swBuddy");
  if(!img) return;
  const expr = SW_POSE[m] || "talking";
  const animated = expr !== "talking" && !SW_STILL;   // resting face is the static talking head
  img.onerror = () => { img.onerror = null; img.src = "assets/mascot.webp"; };   // [mascot-10]
  const src = "assets/" + (animated ? "gif/" : "") + "sw_head_" + expr + (animated ? "_anim" : "") + ".webp";
  /* [mascot-08] replay play-once: a slide's first cheer plays from frame 0 - a fresh blob: URL of the one download
     ([loading]: it was "?r=<slide start>", a new 380KB download on every slide that cheered) */
  if(animated && expr === "celebrate"){
    if(_celebKey !== state.slideStart){ if(_celebUrl.indexOf("blob:") === 0) URL.revokeObjectURL(_celebUrl);
      _celebUrl = Assets.fresh(src); _celebKey = state.slideStart; }
    img.src = _celebUrl;
  } else img.src = src;
  if(w){ w.dataset.expr = expr; w.classList.toggle("anim", animated);
         w.classList.remove("react"); void w.offsetWidth; w.classList.add("react"); } }   // .react pop kept from MTG
/* ===== FLN ANIMATION KIT: confetti (call site) BEGIN =====
   Recipe 7 REPLACES the correct-answer celebration rather than tuning it, so the
   two-sided .conf-shot cannon below is retired to _confettiCannonOld. The kit
   gates itself to guided/practice/mastery, so the phase of the live slide is
   passed through; in tutorial the tile-level confirm (recipe 19) is the feedback.
   The old function is kept, unreferenced, so the change is reversible in one line. */
function confettiCannon(){
  var sl = CARD.slides[state.idx] || {};
  /* [13] the kit's recipe 7 with its own shapes (star 40%, rectangle, line, square), sizes, depth and fall - review
     2026-09-30: "all square-shaped and not covering the full horizontal space". It falls over the WHOLE window
     (#fxLayer, body-level: the stage is letterboxed and clips at its edges), so ~100 pieces keep the density of the
     kit's 80 across the wider field. phases:[] because the checklist asks for confetti on every correct answer,
     including tutorial. The palette is the kit's own VIBGYOR pairs. */
  /* fall: seconds to cross the window, before the depth divisor - the kit's [1.1, 1.8] made ~40% slower (review
     2026-09-30: "reduce its speed a bit"); pieces cross in ~1.4-3.5s, the burst clears in ~3.8s */
  FLNMotion.confetti.burst({
    host: "#fxLayer", phase: sl.phase, phases: [], count: 100, fall: [1.6, 2.6]
  });
  sfxConfetti();   // QA checklist 2026-10-05: the standard confetti SFX with the standard confetti
}
// pitch climbs one step per block — HEAR the count
/* slide audio path: per slide, we look at slide.audio.prompt / .phoneme / etc.
   In this v0.1 the embedded card holds short ids; the compiler would replace
   them with base64 data URIs. We resolve to assets/voiceover/{id}.mp3 with fallback. */
function audioFor(slide, key){
  if(!slide.audio || !slide.audio[key]) return null;
  return "assets/voiceover/" + slide.audio[key] + "." + AUDIO_EXT;
}
/* Play a SEQUENCE of audio sources back-to-back. Each one finishes (or
   falls back to silent beat if missing) before the next starts. */
function playChain(srcs, i, onDone){
  i = i || 0;
  if(i >= srcs.length){ if(onDone) onDone(); return; }
  play(srcs[i], () => playChain(srcs, i+1, onDone));
}
/* On slide mount, play prompt → phoneme/word_name → instruction in order.
   KG learners can't read prompt_hi — the chain gives them both the
   instruction AND the cue (letter sound or picture name) audibly.
   onDone fires after the whole chain finishes (used to gate the नav button). */
function autoPlayChain(slide, onDone){
  const order = ["prompt","phoneme","shape_name","word_name","instruction"];
  const chain = [];
  for(const k of order){
    const src = audioFor(slide, k);
    if(src) chain.push(src);
  }
  if(chain.length) playChain(chain, 0, onDone);
  else if(onDone) onDone();
}

/* nav button: enable/disable the kit-style pill. When it becomes active (the
   activity is done) but the child doesn't tap आगे, the hand-nudge points at it. */
function setNavActive(on){
  const btn = $("navBtn");
  btn.disabled = !on;
  btn.classList.toggle("active", on);
  /* user 2026-10-26 (page 1: the "?" and the next button pulsed together) - as HI02H11_L02_S02's r138: while the VISIBLE next
     button pulses, every other animation on the page is stopped (.nav-live in the styles) */
  document.body.classList.toggle("nav-live", !!on && btn.style.display !== "none");
  clearTimeout(state.navNudgeTimer);
  if(on) state.navNudgeTimer = setTimeout(nudgeNavBtn, 4500);
}
function nudgeNavBtn(){
  /* [04] QA CHECKLIST: "Nudge hand only ever points at interactive tiles/objects
     - never at आगे, शुरू करें, or any other button." This pointed it straight at
     #navBtn, so it is now a no-op. Kept as a function because setNavActive()
     schedules it and several modules clear its timer. */
  return;
  /* eslint-disable no-unreachable */
  const btn = $("navBtn");
  if(!btn.classList.contains("active") || state.hintActive) return;
  const nh = $("nudgeHand");
  const r = btn.getBoundingClientRect();
  const sw = document.querySelector(".slide-stage").getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  nh.style.left = ((r.left - sw.left)/scale + r.width/scale/2 - 48) + "px";
  nh.style.top  = ((r.top  - sw.top )/scale + r.height/scale/2 - 6) + "px";
  nh.classList.add("show");
}

/* ---------- 4. STATE ---------- */
const state = {
  idx: 0,
  slideStart: Date.now(),
  attempts: 0,
  audioReplays: 0,
  hintUsed: false,
  nudgeUsed: false,
  scaffoldLevel: 0,   // 0 none, 1 nudge, 2 hint, 3 reveal
  selectedKey: null,
  locked: false,
  hintActive: false,
  masteryHits: 0,
  masteryAttempts: 0,
  nudgeTimer: null
};
/* [QA 06] SCORE = first-try correctness over every ANSWERABLE question (guided + practice here).
   It used to count only phase==="mastery" slides - this card has none, so hits/attempts stayed
   0/0 and every run scored 0. recordResult() is called once per question when it resolves
   (right tap, or the reveal), from COUNT_HOW_MANY and MAKE_SET alike; a slide can only be
   scored once, so a replayed/re-entered slide can never be double-counted (no off-by-one). */
function recordResult(slide, firstTry){
  state.scored = state.scored || {};
  if(!slide || Object.prototype.hasOwnProperty.call(state.scored, slide.id)) return;
  state.scored[slide.id] = !!firstTry;
  state.masteryAttempts++; if(firstTry) state.masteryHits++;
}

/* ---------- 5. NUDGE ----------
   target may be a CSS selector OR an element. Used ONLY for flow guidance
   (e.g. the "listen" button / prompt) — never to point at the correct answer. */
/* QA checklist 2026-10-05: "inactivity nudges are activated after 7 seconds" - one value for every idle nudge in the
   lesson (the card's nudge_timeout_ms, per phase, says the same) */
const IDLE_MS = 7000;
function startNudge(slide, target){
  clearTimeout(state.nudgeTimer);
  if(!target) return;
  const ms = (CARD.scaffold_rules.nudge_timeout_ms || {})[slide.phase] || IDLE_MS;
  if(!ms) return;
  state.nudgeTimer = setTimeout(()=>{
    if(state.locked || state.hintActive) return;
    const el = (typeof target === "string") ? document.querySelector(target) : target;
    if(!el) return;
    if(!placeNudge(el)) return;
    state.nudgeUsed = true;
    state.scaffoldLevel = Math.max(state.scaffoldLevel, 1);
    GameBus.emit("nudge_invoked", { slide_id: slide.id, phase: slide.phase });
  }, ms);
}
function stopNudge(){
  clearTimeout(state.nudgeTimer);
  $("nudgeHand").classList.remove("show");
}
/* [QA 12] THE HAND SITS BELOW ITS TARGET, NEVER ON IT, NEVER ON A BUTTON.
   #nudgeHand is 86x108 and nudge_hand_new.svg (75x94) fills it at scale 1.1467, which puts the
   fingertip at (34.2, 15.8) inside the box (kit recipe 4 geometry). The old code dropped the box
   -56px / -30px INTO the target, i.e. the fingertip 24-50px inside the tile and the hand over it.
   Now the FINGERTIP lands 8px below the target's bottom edge, and, as HI01 [28j] does, below any
   label text sitting under the target in the same column. It is clamped inside the stage
   (never flipped above - it points UP, so above a target it would point away), and if the box
   would still overlap any button other than its own target it is not shown at all.
   References .slide-stage (the nudge's positioning context), not .stage (~140px header off). */
const NH = { W:86, H:108, TIP_X:34.2, TIP_Y:15.8, GAP:8 };
function placeNudge(el){
  const nh = $("nudgeHand"), host = document.querySelector(".slide-stage");
  if(!el || !nh || !host || !el.getBoundingClientRect) return false;
  const r = el.getBoundingClientRect(), sw = host.getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  const cx = (r.left - sw.left)/scale + r.width/scale/2;
  let tipY = (r.bottom - sw.top)/scale + NH.GAP;
  const tile = el.closest(".opt-cell, .count-item, .ms-item, .q-cell, .tut-card") || el.parentElement;
  if(tile){
    tile.querySelectorAll(".lbl, .opt-label, .count-badge, .pic-label").forEach(t => {
      const tr = t.getBoundingClientRect();
      if(tr.width < 2 || tr.height < 2 || tr.right < r.left || tr.left > r.right) return;
      const tb = (tr.bottom - sw.top)/scale + NH.GAP;
      if(tb > tipY) tipY = tb;
    });
  }
  const stageW = sw.width/scale, stageH = sw.height/scale;
  const left = Math.max(0, Math.min(stageW - NH.W, cx - NH.TIP_X));
  const top  = Math.max(0, Math.min(stageH - NH.H, tipY - NH.TIP_Y));
  nh.style.left = left + "px"; nh.style.top = top + "px";
  // never covering a button: test the hand's final box against every button except its target
  const hr = { l: sw.left + left*scale, t: sw.top + top*scale, r: sw.left + (left + NH.W)*scale, b: sw.top + (top + NH.H)*scale };
  /* A button in the hand's box: the hand is CUT OFF 4px above that button's top edge (clip-path),
     so it reads as tucked behind the button and never draws over it. On the tutorial slides आगे
     sits right under the unit row, so a plain "hide if it overlaps" rule hid the tutorial hand
     entirely. If the cut would leave less than 40% of the hand (fingertip + finger), it is hidden. */
  let cutTop = Infinity;
  [...document.querySelectorAll("button, .nav-btn, .audio-chip, .tut-audio, .hint-btn")].forEach(b => {
    if(b === el || b.contains(el) || el.contains(b)) return;
    const br = b.getBoundingClientRect();
    if(br.width < 2 || br.height < 2 || getComputedStyle(b).visibility === "hidden") return;
    if(br.left < hr.r && br.right > hr.l && br.top < hr.b && br.bottom > hr.t) cutTop = Math.min(cutTop, br.top);
  });
  nh.style.clipPath = "";
  if(cutTop !== Infinity){
    const keep = (cutTop - 4 - hr.t) / scale;                 // design px of the hand left visible
    if(keep < NH.H * 0.4){ nh.classList.remove("show"); return false; }
    /* only the BOTTOM is cut: the tap ripple (kit recipe 4) spreads up to ~55px above and around the box */
    nh.style.clipPath = "inset(-60px -60px " + Math.max(0, NH.H - keep).toFixed(1) + "px -60px)";
  }
  if(!nh.classList.contains("show")) sfxNudge();   // QA checklist 2026-10-05: an encouraging SFX with every nudge
  nh.classList.add("show");
  return true;
}

/* ---------- 8. TAP-OPTION HELPER (shared by 5 slide types) ---------- */
function mountTapOptions({slide, host, signalName, stimulus, options, isCorrect, optionRenderer, columnsHint, mastery, hintAction, nudgeTarget, shuffle, onCorrect, onWrong, reask}){
  state.attempts = 0; state.selectedKey = null; state.locked = false;
  state.audioReplays = 0; state.hintUsed = false; state.nudgeUsed = false; state.scaffoldLevel = 0;
  // idle hand-nudge target: defaults to the stimulus (re-listen), but a slide can pass
  // nudgeTarget:null to suppress it entirely (e.g. "how many?" — nothing to re-tap).
  const _nudge = (nudgeTarget !== undefined) ? nudgeTarget : (stimulus || null);
  // optional custom hint (runs on the live slide instead of a text popup), e.g. a
  // count-demonstration. Wrapped to block option taps while it plays.
  const runHint = hintAction ? (after)=>{ state.hintActive = true; hintAction(()=>{ state.hintActive = false; if(after) after(); }); } : null;

  // Shuffle options once so the correct answer isn't pinned to one position (engine-wide anti
  // positional-bias — otherwise "always tap the same spot" can pass mastery). Opt out with
  // shuffle:false for inherently-ordered options (e.g. a number line).
  const _opts = (shuffle === false) ? options.slice()
    : (function(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; })(options);

  const wrap = document.createElement("div"); wrap.className = "q-row";
  if(stimulus){ wrap.appendChild(stimulus); }
  const grid = document.createElement("div");
  const cols = columnsHint || (_opts.length <= 2 ? 2 : _opts.length <= 3 ? 3 : 4);
  grid.className = "opt-grid cols-" + cols;
  _opts.forEach((opt, i) => {
    const cell = optionRenderer(opt, i);
    cell.classList.add("opt-cell");
    cell.dataset.key = String(i);
    cell.onclick = ()=>{
      /* [10] a wrong card must stay tappable - the .crossed early-return is gone.
         .correct still blocks, because the slide is locked once it is answered. */
      if(state.locked || state.hintActive || cell.classList.contains("correct")) return;
      stopNudge();
      // SME rule: SPEAK THE TAPPED WORD on EVERY tap (right or wrong), then the feedback — never two
      // voices at once (buzz/confetti are sfx, they ride alongside the word). opt.audio = word clip id.
      // Fallback wiring for LETTER options (SME: the tapped item's own sound speaks EVERYWHERE): options
      // authored as {letter:"आ"} carry no audio id, but the slide's data.phonemes map has each letter's
      // clip — derive it here centrally so every TAP_LETTER_* / mastery module inherits speak-on-tap
      // without per-module or per-card changes. Explicit opt.audio always wins.
      const _aid = opt.audio ||
                   (opt.letter && slide.data && slide.data.phonemes && slide.data.phonemes[opt.letter]) || null;
      const _word = _aid ? ("assets/voiceover/" + _aid + "." + AUDIO_EXT) : null;
      const _afterWord = (cb)=>{ if(_word) play(_word, cb); else cb(); };
      if(isCorrect(opt, i)){
        state.locked = true; cell.classList.add("correct"); FLNMotion.correctSelect.play(cell);
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase },
             { is_correct:true, attempt: state.attempts + 1, score: state.attempts === 0 ? 1 : 0 }); }catch(e){}   /* kit recipe 19 - tile-level confirm; runs WITH the confetti, not instead of it */
        sfxCorrect(); confettiCannon(); setSwMood("happy");
        if(onCorrect) onCorrect(opt, cell);      // [kit] slide-level flourish (e.g. the result plate)
        recordResult(slide, state.attempts === 0);   // [QA 06] every answerable slide scores, not only "mastery"
        GameBus.emit(signalName, { slide_id: slide.id, phase: slide.phase, value: true,
          first_try: state.attempts === 0, attempts: state.attempts + 1,
          scaffold_level: state.scaffoldLevel, latency_ms: Date.now()-state.slideStart });
        _afterWord(()=> setTimeout(()=> completeSlide(true), 700));   // speak the word → then advance (confetti is the reward)
      } else {
        state.attempts++; cell.classList.add("crossed");
        /* [10] QA CHECKLIST: the wrong card auto-reverts after ~900ms and STAYS
           TAPPABLE, so this is the kit's transient .play() (release), no longer
           .out() (elimination). .play() releases at dur*1500+40 then fades over
           260ms = ~900ms at the default .4s beat, which is the spec figure.
           The .crossed class is left on only so existing logic still reads it;
           its dim/lock/cross are neutralised in style.css. */
        FLNMotion.wrongSelect.play(cell, { then: function(){ cell.classList.remove("crossed"); } });
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase },
             { is_correct:false, attempt: state.attempts, score: 0 }); }catch(e){}
        sfxWrongSoft(); setSwMood("tryagain");
        if(onWrong) onWrong(opt, cell);          // [kit] slide-level cue (e.g. gap vs overlap)
        // (do NOT count masteryAttempts here — the correct branch counts one attempt PER ITEM.)
        GameBus.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
        // LAYERED SCAFFOLD (A1): L1 re-listen → L2 hint → L3 REVEAL at max_attempts (never stuck).
        const _maxA = (CARD.scaffold_rules && CARD.scaffold_rules.max_attempts) || 3;
        $("hintBtn").classList.add("show","hint-glow");
        _afterWord(()=>{   // speak the tapped word FIRST, then the layered feedback VO (no overlap)
          if(state.attempts >= _maxA){ revealAnswer("wrong"); }
          else if(state.attempts >= 2){ state.scaffoldLevel = Math.max(state.scaffoldLevel, 2);
            GameBus.emit("hint_shown", { slide_id: slide.id, manual: false });   // [QA 14] auto hint -> hint_used
            if(runHint) runHint(); else play(audioFor(slide, "hint") || audioFor(slide, "try_again") || null, ()=>{}); }
          else { state.scaffoldLevel = Math.max(state.scaffoldLevel, 1);
            /* [QA 05] rung 1 = RE-LISTEN: the try-again line, then the question itself again
               (reask:false = the try-again line only, where the deck's incorrect feedback is just that line) */
            play(audioFor(slide, "try_again") || null, ()=>{ if(reask !== false && !state.locked && !state.hintActive) play(audioFor(slide, "prompt") || null, ()=>{}); }); }
        });
      }
    };
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);
  host.appendChild(wrap);

  // ---- layered-hint helpers (A1/B2): reveal-on-max + a wired manual hint button ----
  function _correctCell(){ return [...grid.querySelectorAll(".opt-cell")].find(c => isCorrect(_opts[+c.dataset.key], +c.dataset.key)); }
  function revealAnswer(reason){
    if(state.locked) return; state.locked = true; state.scaffoldLevel = 3; setSwMood("hint");
    const el = _correctCell();
    [...grid.querySelectorAll(".opt-cell")].forEach(c => { if(c !== el) c.classList.add("faded"); });
    if(el) el.classList.add("correct", "ck-correct", "reveal-pulse");   // [QA 10] the spec green border, never the tick badge
    recordResult(slide, false);
    GameBus.emit("answer_revealed", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts, reason });
    play(audioFor(slide, "reveal") || audioFor(slide, "correct") || audioFor(slide, "try_again") || null,
      ()=> setTimeout(()=> completeSlide(false), 800));
  }
  $("hintBtn").onclick = ()=>{ if(state.locked || state.hintActive) return;
    state.hintUsed = true; if(state.attempts < 1) state.attempts = 1;
    GameBus.emit("hint_shown", { slide_id: slide.id, manual: true });
    if(runHint) runHint(); else play(audioFor(slide, "hint") || audioFor(slide, "try_again") || null, ()=>{}); };

  startNudge(slide, _nudge);
  // Tap-to-answer standard (lead review): a WRONG tap = soft buzz + ✕ + that card LOCKS (can't re-tap);
  // a RIGHT tap = confetti cannons + Swiftie cheer, then auto-advance. No select-then-आगे for pick questions.
  $("navBtn").style.display = "none"; setNavActive(false);
}

/* ---------- 10. RENDER HELPERS ---------- */
/* Render a picture as the real PNG (assets/<key>.png); if the file is
   missing it falls back to the emoji. Pass the image id (e.g. "pic_anaar"). */
function imgOrEmoji(imgKey, emoji, imgClass, emojiClass){
  if(imgKey){
    const fb = String(emoji||"❓").replace(/'/g,"");
    return `<img class="${imgClass}" src="assets/${imgKey}.${IMG_EXT}" alt="" `+
      `onerror="var s=document.createElement('span');s.className='${emojiClass}';s.textContent='${fb}';this.replaceWith(s);">`;
  }
  return `<span class="${emojiClass}">${emoji||"❓"}</span>`;
}
/* ordering/seriation render (MTKGA02_L02_S02): an object at a given magnitude. by="size" scales the
   picture uniformly; by="length" draws a content-true rounded bar of width∝mag; by="weight" shows the
   picture at a uniform size (weight is not visual — the child uses known heaviness / the balance cue). */
function imgOrEmojiSized(img, emoji, px){
  const fb = String(emoji||"❓").replace(/'/g,"");
  if(img) return `<img class="ord-obj-img" style="width:${px}px;height:${px}px" src="assets/${img}.${IMG_EXT}" alt="" `+
    `onerror="var s=document.createElement('span');s.className='ord-obj-emoji';s.style.fontSize='${Math.round(px*0.82)}px';s.textContent='${fb}';this.replaceWith(s);">`;
  return `<span class="ord-obj-emoji" style="font-size:${Math.round(px*0.82)}px">${emoji||"❓"}</span>`;
}
function renderOrdObj(o, by){
  if(by === "length"){ const w = {1:130,2:210,3:300}[o.mag] || 200;
    return `<div class="ord-bar" style="width:${w}px;background:${o.color||"#F5A623"}"></div>`; }
  // size AND weight scale the picture by visual magnitude — so a BIG-but-LIGHT balloon looks big and
  // tempts the child (bigger=heavier misconception), while the small stone is the correct heaviest pick.
  const px = {1:80, 2:116, 3:154}[o.mag] || 116;
  return imgOrEmojiSized(o.img, o.emoji, px);
}

/* shape helpers (maths): render circle/square/triangle/rectangle as inline SVG in
   any colour / size / rotation (LO: recognise regardless of orientation or size).
   No image assets needed — shapes are pure geometry, so the sample renders offline. */
function shapeSVG(shape, opts){
  opts = opts || {};
  const color = opts.color || "#386AF6";
  const size  = opts.size  || 120;
  const rot   = opts.rotate || 0;
  let inner = "";
  if(shape === "circle")         inner = `<circle cx="50" cy="50" r="42" fill="${color}"/>`;
  else if(shape === "square")    inner = `<rect x="12" y="12" width="76" height="76" rx="0" fill="${color}"/>`;   // TRUE corners — teachable geometry is never rounded
  else if(shape === "triangle")  inner = `<polygon points="50,9 91,89 9,89" fill="${color}"/>`;
  else if(shape === "rectangle") inner = `<rect x="6" y="28" width="88" height="44" rx="0" fill="${color}"/>`;    // TRUE corners
  const g = rot ? `<g transform="rotate(${rot} 50 50)">${inner}</g>` : inner;
  return `<svg class="shape-svg" viewBox="0 0 100 100" width="${size}" height="${size}" `+
         `xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
}

/* VISUAL-FIRST quantity: a HAND showing n fingers up (assets/hand_1..5) — pre-reader,
   NO number-word text. Falls back to the numeral only if n is outside 1..5 or the art is missing. */
function fingerCount(n, cls){ cls = cls || "finger-hand";
  if(!(n>=1 && n<=5)) return `<span class="num-glyph">${n}</span>`;
  return `<img class="${cls}" src="assets/hand_${n}.png" alt="" ` +
    `onerror="var s=document.createElement('span');s.className='num-glyph';s.textContent='${n}';this.replaceWith(s);">`;
}
/* DISPLAY numeral: ALWAYS Arabic (1 2 3) on screen — kids learn the universal digit.
   Spoken VO stays Hindi (एक/दो/तीन) via the separate vo_num_/vo_total_ audio files. */
function devNumeral(n){ return String(n); }

/* ---------- 10b. DEVANAGARI GLYPH INK-CENTERING ----------
   Devanagari glyphs carry matras above (ओ, औ, अं) and below (ऋ) the shirorekha,
   so plain flex `align-items:center` leaves them sitting high with a gap below —
   and the offset differs per glyph. Measure each glyph's real ink box (canvas
   actualBoundingBox) + its baseline in the DOM, then translateY so the INK is
   truly centred in its tile/box. Font-agnostic; recomputed on mount + fonts.ready. */
let _inkCtx = null;
function centerInkGlyph(span){
  if(!span || !span.parentElement) return;
  const glyph = (span.textContent || "").trim();
  if(!glyph) return;
  const box = span.parentElement;
  const cs = getComputedStyle(span);
  const fpx = parseFloat(cs.fontSize);
  if(!fpx) return;
  _inkCtx = _inkCtx || document.createElement("canvas").getContext("2d");
  _inkCtx.font = `${cs.fontWeight} ${fpx}px ${cs.fontFamily}`;
  const m = _inkCtx.measureText(glyph);
  const a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent;
  if(!isFinite(a) || !isFinite(d)) return;
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  span.style.transform = "";   // reset before measuring baseline
  const probe = document.createElement("span");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;";
  span.appendChild(probe);
  const baseScreen = probe.getBoundingClientRect().top;
  span.removeChild(probe);
  const br = box.getBoundingClientRect();
  if(br.height < 5) return;    // not laid out yet
  const boxCenter = br.top + br.height/2;
  const inkCenter = baseScreen + ((d - a)/2) * scale;   // screen px
  const dy = (boxCenter - inkCenter) / scale;           // css px to move glyph down
  span.style.transform = `translateY(${dy}px)`;
}
function centerAllGlyphs(root){
  (root || document).querySelectorAll(".ink-glyph").forEach(centerInkGlyph);
}


/* ---------- 12. SLIDE MODULES ---------- */
/* ---------- [pv kit] PVK - the place-value addition kit, shared by every slide of MTG2A01_L03_S01 (without
   regrouping) and MTG2A01_L03_S02 (with regrouping). The SME decks draw one model on every page: a दहाई | इकाई
   place-value table per number, a green rod for each ten (assets/pv_rod11.webp, ten of the cubes) and an orange
   cube for each one (assets/pv_cube10.webp), and a third table below for the sum. Everything here is placed in STAGE
   px (1333 x 750): the scene's 0,0 is put on the stage's 0,0 whatever host it is mounted in (the tutorial card or
   the slide host). Moves animate the `translate` property, never `transform` (as MDK in MTG2A04 - a CSS `scale`
   on a pulsing block would multiply anything in `transform`). CSS [pv kit]. ---------- */
/* the idle hand TOUCHES what it points at (user 2026-10-15: "the hand nudges are not correct"): the engine's
   placeNudge stood the fingertip 8px below the target, pointing up at it - under a + button, a block or the answer
   box it read as pointing at nothing, and its tap ripple broke out beside the target. Same hand, same clamping into
   the stage; the fingertip now lands on the target's lower part, where a finger would press it. */
placeNudge = (function(base){
  return function(el){
    const nh = $("nudgeHand"), host = document.querySelector(".slide-stage");
    if(!el || !nh || !host || !el.getBoundingClientRect) return base(el);
    const r = el.getBoundingClientRect(), sw = host.getBoundingClientRect();
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
    const w = r.width / scale, h = r.height / scale, cx = (r.left - sw.left) / scale + w / 2;
    const tipY = (r.top - sw.top) / scale + h - Math.min(h * 0.35, 26);
    const stageW = sw.width / scale, stageH = sw.height / scale;
    nh.style.left = Math.max(0, Math.min(stageW - NH.W, cx - NH.TIP_X)) + "px";
    nh.style.top = Math.max(0, Math.min(stageH - NH.H, tipY - NH.TIP_Y)) + "px";
    nh.style.clipPath = "";
    if(!nh.classList.contains("show")) sfxNudge();
    nh.classList.add("show");
    return true;
  };
})(placeNudge);
/* a character's picture: the supplied art (assets/char_<who>.webp - pv-addition-kit/make_characters.py, from the
   character sheets, e.g. Pari and Aaru 2026-10-08) when the lesson ships it, else the drawn portrait (char_<who>.svg,
   tools/make_avatars.py). full: the whole figure (the first screen), null when there is none; full "cheer": the whole
   figure cheering (char_<who>_cheer.webp), "carry": carrying blocks (char_<who>_carry.webp) - null when there is none. */
function pvChar(w, full){
  const has = f => Object.prototype.hasOwnProperty.call(ASSET_SIZES, f), base = "assets/char_" + w;
  if(full){ const f = base + (full === true ? "_full" : "_" + full) + ".webp"; return has(f) ? f : null; }
  return has(base + ".webp") ? base + ".webp" : base + ".svg";
}
/* blinks (user 2026-10-15: "make the characters' eyes blink throughout the game"): every character picture on screen
   (the story pages' portraits, the first screen's figures) that has an eyes-shut copy (char_<...>_blink.webp,
   make_blinks.py - only the eyes differ) shows it for a moment every 2.5-6s, each on its own clock, now and then twice.
   The copy is decoded before its first use, so the swap is instant; the shadows' copies (.sgp-cast) do not blink. */
const PVBlink = (function(){
  const ready = {}, SEL = ".pv-av, .sgp-fw .sgp-pose";
  const shut = src =>{ const f = src.replace(/(\.webp)(\?.*)?$/, "_blink$1"); return Object.prototype.hasOwnProperty.call(ASSET_SIZES, f) ? f : null; };
  /* the boot loader shows its pictures from blob: URLs (Assets) and keeps the file in data-asset - and it swaps any
     file path an <img> is given for its blob. So the shut copy is shown by the very URL that was decoded for it (its
     blob when fetched), and the open one comes back by the blob it had, with data-asset put back */
  const load = f =>{ if(!ready[f]){ const u = (Assets.blob(f) && Assets.url(f)) || f, im = new Image(); ready[f] = "loading"; im.src = u;
    (im.decode ? im.decode() : Promise.resolve()).then(()=>{ ready[f] = { u, im }; }, ()=>{ delete ready[f]; }); } return ready[f] && ready[f] !== "loading"; };
  const shown = im => im.isConnected && im.getClientRects().length && getComputedStyle(im).opacity !== "0";
  const blink = (im, f, open, file)=>{ const u = ready[f].u; im.dataset.blinking = 1; im.src = u;
    setTimeout(()=>{ const s = im.getAttribute("src");
      if(s === u || im.dataset.asset === f){ im.src = open; im.setAttribute("data-asset", file); } delete im.dataset.blinking; }, 130); };
  setInterval(()=>{
    if(document.hidden || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    const now = Date.now();
    document.querySelectorAll(SEL).forEach(im =>{
      if(im.dataset.blinking) return;
      const open = im.getAttribute("src"), file = (im.dataset.asset || open || "").replace("_blink.webp", ".webp"), f = open && shut(file); if(!f) return;
      if(!im.dataset.next){ im.dataset.next = now + 1200 + Math.random() * 3500; load(f); return; }
      if(now < +im.dataset.next || !shown(im) || !load(f)) return;
      im.dataset.next = now + 2500 + Math.random() * 3500;
      blink(im, f, open, file); if(Math.random() < .18) setTimeout(()=>{ if(!im.dataset.blinking) blink(im, f, im.getAttribute("src"), file); }, 300);   // now and then twice
    });
  }, 100);
  return { shut };
})();
const PVSFX = (function(){
  /* the block sounds, made in WebAudio and throttled (a row of blocks added at once is a patter, not a roar):
     tap   - the + button, the number pad's keys          appear - a block comes into a table: a round "bloop"
     magic - a block popped out (taken away): a sparkle   move   - blocks / a table glide: a short soft swish
     land  - a block set down                                                                                       */
  const last = {}, ok = (k, ms)=>{ const t = performance.now(); if(last[k] && t - last[k] < ms) return false; last[k] = t; return true; };
  function tone(f0, f1, dur, vol, type, at){ const c = _ac(); if(!c) return; const t0 = c.currentTime + (at || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.03); }
  function noise(dur, f0, f1, vol, type, at){ const c = _ac(); if(!c) return; const t0 = c.currentTime + (at || 0), n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0); for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; f.type = type || "bandpass"; f.Q.value = 1.1;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * .25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(t0); s.stop(t0 + dur + 0.02); }
  return {
    tap(){ if(!ok("tap", 40)) return; tone(1500, 950, .05, .13, "triangle"); noise(.03, 3400, 2600, .12); },
    appear(){ if(!ok("appear", 55)) return; tone(240, 560, .11, .16, "sine"); tone(480, 1120, .09, .05, "triangle", .01); },
    pop(){ this.appear(); },
    magic(){ if(!ok("magic", 70)) return;
      tone(520, 180, .09, .12, "sine");                                              // the pop
      [1568, 2093, 2637, 3136].forEach((f, i)=> tone(f, f * 1.02, .12, .05, "sine", .04 + i * .035));   // the sparkle
      noise(.32, 5200, 1800, .05, "highpass", .03); },                              // the shimmer
    move(){ if(!ok("move", 150)) return; noise(.22, 700, 2300, .09, "bandpass"); },
    whoosh(){ this.move(); },
    unpop(){ tone(700, 300, .1, .12, "sine"); },
    land(){ if(!ok("land", 45)) return; tone(300, 170, .08, .15, "triangle"); noise(.04, 1000, 700, .1, "bandpass"); }
  };
})();
const PVK = (function(){
  const reduce = ()=> !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const px = v => (Math.round(v * 10) / 10) + "px";
  const wait = ms => new Promise(r => setTimeout(r, reduce() ? Math.min(ms, 60) : ms));
  /* the blocks are the user's front-on cubes (make_blocks.py, review 2026-10-14): the green rod and the orange cube are
     drawn at one proportion, so a rod is as wide as a cube and ten cubes stacked at its step ARE the rod. pitch = how far
     up the next cube in a stack sits, as a share of the cube's width. */
  const ROD = { src: "assets/pv_rod11.webp", ar: 987 / 147 };       // h / w of the art
  const CUBE = { src: "assets/pv_cube10.webp", ar: 289 / 300, pitch: 93.2 / 147 };
  /* front-on cubes are taller per cube than the old isometric ones (a rod 6.7 widths tall, was 5.2): the layouts keep
     every rod at its old height and the blocks get narrower to match (user's choice 2026-10-14: "smaller blocks, same
     layout"). A table's `cube` stays its layout size; its blocks are FIT of it. */
  const FIT = (1559 / 300) / ROD.ar;
  const kNow = ()=> parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  function add(parent, tag, cls, css){ const e = document.createElement(tag); if(cls) e.className = cls; if(css) e.style.cssText = css; parent.appendChild(e); return e; }
  const setXY = (e, x, y)=>{ e._x = x; e._y = y; e.style.left = px(x); e.style.top = px(y); };
  const xy = e => ({ x: e._x, y: e._y });
  const knock = ()=> PVSFX.land();      // a block set down (was a soft sine, too quiet - user 2026-10-18)
  /* the pop-in plays once and its class goes: left on, any later animation on the element (a pulse, a highlight)
     would replace it and, when that one ends, bring the pop back - replayed from nothing */
  const pop = e =>{ if(!e) return; e.classList.remove("pv-pop"); void e.offsetWidth; e.classList.add("pv-pop");
    const end = ev =>{ if(!/^pv(Btn|Rod)?Pop$/.test(ev.animationName)) return; e.removeEventListener("animationend", end); e.classList.remove("pv-pop"); };
    e.addEventListener("animationend", end); };
  const show = (e, on)=>{ if(!e) return; e.classList.toggle("pv-hide", on === false); if(on !== false) pop(e); };
  /* the lateral buzz of the FLN kit (recipes 11/20): +-9px decaying, .4s, on `translate` */
  /* the decks' idle cue ("if idle, pulsate again"): the pulse restarts from its start, with the nudge chime - no hand
     (user 2026-10-15: match the decks; their hand nudges are only the answer counter's and the ghost drags) */
  function repulse(el){ if(!el) return; el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); try{ sfxNudge(); }catch(e){} }
  function shake(el, amp){ if(!el || reduce()) return; const a = amp || 9;
    el.animate([{ translate: "0 0" }, { translate: -a + "px 0" }, { translate: a + "px 0" }, { translate: -a * .67 + "px 0" },
                { translate: a * .67 + "px 0" }, { translate: "0 0" }], { duration: 400, easing: "ease-in-out" }); }
  /* the kit's hint glow (recipe 12): a green ring, three soft pulses */
  function softGlow(el){
    if(!el) return null;
    const own = getComputedStyle(el).boxShadow, b = own && own !== "none" ? own + ", " : "";
    return el.animate([{ boxShadow: b + "0 0 0 0 rgba(0,177,50,0), 0 0 0 0 rgba(0,177,50,0)" },
                       { boxShadow: b + "0 0 0 8px rgba(0,177,50,.32), 0 10px 26px rgba(0,177,50,.34)" },
                       { boxShadow: b + "0 0 0 0 rgba(0,177,50,0), 0 0 0 0 rgba(0,177,50,0)" }],
                      { duration: 1100, iterations: reduce() ? 1 : 3, easing: "ease-in-out" });
  }

  /* ---- the scene: absolute, stage px, 0,0 = the stage's top-left. Only its children take pointer events. ---- */
  function scene(host){
    host.style.position = "relative";
    const sc = add(host, "div", "pv-stage");
    /* the host's place in the stage from the LAYOUT (offsetLeft / offsetTop up to the stage), not from the screen: a page
       that mounts while it slides in (the q-in between two questions: shifted and a little smaller on its first frame) was
       measured off by its animation, and everything on it stood ~8px left and ~20px high (user 2026-10-24: "P2 is not the
       same as P1"). The screen measure stays as the fallback when the stage is not in the host's offsetParent chain. */
    const stage = $("stage"); let x = 0, y = 0, e = host;
    while(e && e !== stage){ x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    if(e !== stage){ const st = stage.getBoundingClientRect(), hr = host.getBoundingClientRect(), k = kNow(); x = (hr.left - st.left) / k; y = (hr.top - st.top) / k; }
    sc.style.left = px(-x); sc.style.top = px(-y);
    const card = host.closest(".tut-card"); if(card) card.classList.add("tc-pv");
    return sc;
  }

  /* ---- a slide's run context: alive / guard, its VO (one role at a time), cued VO, waits ----
     say(role): the slide's clip for that role (silent beat when it has none); cue(role, [[fraction, fn], ...]): the
     same, with each fn fired when the clip reaches that fraction of its length (in sync with the VO). A slide that
     is left throws C.STOP out of every await, so its run simply ends. */
  function ctx(slide, sc){
    const STOP = {};
    const C = { slide, sc, STOP, cur: null,
      alive: ()=> CARD.slides[state.idx] === slide && sc.isConnected,
      guard(){ if(!C.alive()) throw STOP; },
      has: role => !!audioFor(slide, role),
      wait: ms => wait(ms).then(()=> C.guard()),
      say(role){ return C.cue(role, []); },
      cue(role, cues){
        cues = (cues || []).filter(p => typeof p[0] === "number" && isFinite(p[0])).sort((p, q)=> p[0] - q[0]);   // (a cue the card has no time for is left out - it would hold back every cue after it)
        let i = 0; const fireTo = f =>{ while(i < cues.length && cues[i][0] <= f){ try{ cues[i][1](); }catch(e){ console.error(e); } i++; } };
        return new Promise(res =>{
          if(!C.alive()) return res();
          const src = audioFor(slide, role);
          if(src) C.cur = role;
          fireTo(0);
          if(!src){ const t0 = performance.now(); const tick = ()=>{ if(!C.alive()) return res(); const f = (performance.now() - t0) / 700;
              fireTo(f); if(f >= 1) res(); else requestAnimationFrame(tick); }; if(cues.length) requestAnimationFrame(tick); else res(); return; }
          let raf = 0;
          const tick = ()=>{ if(!C.alive()) return; const d = voEl.duration;
            if(isFinite(d) && d > 0 && srcOf(voEl) === src) fireTo(voEl.currentTime / d); raf = requestAnimationFrame(tick); };
          play(src, ()=>{ cancelAnimationFrame(raf); fireTo(1); res(); });
          raf = requestAnimationFrame(tick);
        }).then(()=> C.guard());
      },
      sayNum(n){ return new Promise(r => play("assets/voiceover/vo_num_" + n + "." + AUDIO_EXT, r)).then(()=> C.guard()); }
    };
    return C;
  }
  const run = (C, fn)=> fn().catch(e =>{ if(e !== C.STOP) console.error("[pv]", e); });

  /* ---- blocks: a rod (kind "t", size = its height) or a cube (kind "o", size = its side) ---- */
  function block(sc, kind, x, y, size){
    const e = add(sc, "img", "pv-blk pv-" + (kind === "t" ? "rod" : "cube"));
    e.src = kind === "t" ? ROD.src : CUBE.src; e.alt = ""; e.draggable = false;
    const w = kind === "t" ? size / ROD.ar : size, h = kind === "t" ? size : size * CUBE.ar;
    e.style.width = px(w); e.style.height = px(h); e._w = w; e._h = h; e._kind = kind;
    setXY(e, x, y); return e;
  }
  /* move an element (a block, a card, the hand) along a gentle arc or straight; resolves when it is there */
  function glide(e, to, ms, arc){
    return new Promise(res =>{
      const from = xy(e), dx = to.x - from.x, dy = to.y - from.y;
      if(e._gl){ const old = e._gl; e._gl = null; old.cancel(); }
      if(reduce() || ms <= 0 || (Math.abs(dx) < .5 && Math.abs(dy) < .5)){ setXY(e, to.x, to.y); res(); return; }
      const up = arc ? -Math.min(90, 24 + Math.hypot(dx, dy) * 0.18) : 0;
      e.classList.add("moving");
      const a = e.animate([{ translate: "0px 0px" }, { translate: dx / 2 + "px " + (dy / 2 + up) + "px", offset: .5 }, { translate: dx + "px " + dy + "px" }],
                          { duration: ms, easing: "cubic-bezier(.45,.05,.35,1)" });
      e._gl = a;
      const done = ()=>{ if(e._gl !== a) return res(); e._gl = null; setXY(e, to.x, to.y); e.classList.remove("moving"); res(); };
      a.onfinish = done; a.oncancel = done;
    });
  }
  const shift = (e, dx, dy, ms)=> glide(e, { x: e._x + dx, y: e._y + dy }, ms, false);

  /* ---- the demonstrating hand (the engine's nudge-hand art; its fingertip is NH.TIP_X / TIP_Y of its 86x108 box) ---- */
  function hand(sc){
    const el = add(sc, "img", "pv-hand"); el.src = "assets/nudge_hand_new.svg"; el.alt = "";
    const at = p =>({ x: p.x - NH.TIP_X, y: p.y - NH.TIP_Y });
    return { el,
      on(p){ setXY(el, at(p).x, at(p).y); el.classList.add("on"); },
      off(){ el.classList.remove("on", "press"); },
      to(p, ms){ return glide(el, at(p), ms == null ? 420 : ms, false); },
      async tap(p){ if(!el.classList.contains("on")) this.on({ x: p.x + 40, y: p.y + 60 }); await this.to(p, 380);
        el.classList.add("press"); await wait(150); el.classList.remove("press"); await wait(90); } };
  }
  const centre = (e, sc)=>{ const r = e.getBoundingClientRect(), s = sc.getBoundingClientRect(), k = kNow();
    return { x: (r.left - s.left + r.width / 2) / k, y: (r.top - s.top + r.height / 2) / k }; };

  /* ---- numbers: each digit its own span (tens .pv-dt, ones .pv-do) so the VO can light the digit it names ---- */
  function numHTML(n){
    const s = String(n);
    if(s.length === 2) return '<span class="pv-d pv-dt">' + s[0] + '</span><span class="pv-d pv-do">' + s[1] + '</span>';
    if(s.length === 1) return '<span class="pv-d pv-do">' + s + '</span>';
    return '<span class="pv-d">' + s + '</span>';
  }
  function numCard(sc, n, cx, y, h, cls){
    const e = add(sc, "div", "pv-num " + (cls || ""), "height:" + px(h) + ";font-size:" + px(h * .7) + ";min-width:" + px(h * 1.55) + ";border-radius:" + px(h * .28));
    e.innerHTML = n == null ? "?" : numHTML(n); setXY(e, cx, y); e._n = n; return e;
  }
  const lightDigit = (card, which, on)=>{ if(!card) return; const d = card.querySelector(which === "t" ? ".pv-dt" : ".pv-do");
    if(d) d.classList.toggle(which === "t" ? "hl-t" : "hl-o", on !== false); };
  /* the equation row "a + b = ?" (one flex row, centred on cx) */
  /* ---- a dotted outline (the ten's ring, the drop target) with ONE dot missing: the gap travels round the shape a dot at a
     time while the dots stay put (review 2026-10-14). An SVG rect over the box: w x h its size, sw the line, r the corner,
     dash / gap the dot and space in px; one more than "dash" is left out so the pattern goes exactly round. ---- */
  function dashBox(el, w, h, sw, r, dash, gap){
    const NS = "http://www.w3.org/2000/svg", i = sw / 2, iw = w - sw, ih = h - sw, rr = Math.max(0, Math.min(r - i, iw / 2, ih / 2));
    const per = 2 * (iw + ih) - 8 * rr + 2 * Math.PI * rr, n = Math.max(6, Math.round(per / (dash + gap)));
    const d = 10 * dash / (dash + gap), g = 10 - d, pat = [];
    for(let k = 0; k < n - 2; k++) pat.push(d, g);
    pat.push(d, g + d + g);                                         // the missing dot
    const svg = document.createElementNS(NS, "svg"), rc = document.createElementNS(NS, "rect");
    svg.setAttribute("class", "pv-dash"); svg.setAttribute("width", w); svg.setAttribute("height", h);
    [["x", i], ["y", i], ["width", iw], ["height", ih], ["rx", rr], ["pathLength", n * 10], ["stroke-dasharray", pat.map(v => +v.toFixed(3)).join(" ")]]
      .forEach(([k, v])=> rc.setAttribute(k, v));
    svg.appendChild(rc); el.appendChild(svg);
    if(!reduce()) rc.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -n * 10 }],
                             { duration: n * 85, iterations: Infinity, easing: "steps(" + n + ")" });
    return svg;
  }
  /* (op: the sign, "+" by default - this lesson's "−") */
  function equation(sc, a, b, cx, y, h, op){
    const row = add(sc, "div", "pv-eq", "height:" + px(h) + ";--h:" + px(h));
    const box = (n, cls)=>{ const e = add(row, "div", "pv-num " + cls, "height:" + px(h) + ";font-size:" + px(h * .7) + ";min-width:" + px(h * 1.55) + ";border-radius:" + px(h * .28) + ";position:relative");
      e.innerHTML = n == null ? "?" : numHTML(n); return e; };
    const sym = t =>{ const e = add(row, "span", "pv-op", "font-size:" + px(h * .78)); e.textContent = t; return e; };
    const E = { el: row, a: box(a, "pv-ea"), op: sym(op || "+"), b: box(b, "pv-eb"), eq: sym("="), q: box(null, "pv-q") }; E.plus = E.op;
    E.fill = n =>{ E.q.innerHTML = numHTML(n); E.q.classList.add("filled"); pop(E.q); };
    setXY(row, cx, y); return E;
  }
  /* the equation spread out (the sibling's number-pad page): each part placed by its own centre - xs { a, op, b, eq, q } */
  function spreadEq(sc, a, b, op, xs, y, h){
    const sym = (t, x)=>{ const e = add(sc, "div", "pv-op pv-sym", "font-size:" + px(h * .73)); e.textContent = t; setXY(e, x, y + h / 2 - h * .35); return e; };
    const E = { a: numCard(sc, a, xs.a, y, h, "pv-ea"), op: sym(op || "+", xs.op), b: numCard(sc, b, xs.b, y, h, "pv-eb"), eq: sym("=", xs.eq), q: numCard(sc, null, xs.q, y, h, "pv-q") };
    E.plus = E.op; E.spread = true;
    E.fill = n =>{ E.q.innerHTML = numHTML(n); E.q.classList.add("filled"); pop(E.q); };
    return E;
  }
  /* ---- one person of a story page: the round portrait and the name under it ---- */
  function person(sc, who, name, cx, y, size){
    const list = Array.isArray(who) ? who : [who];
    const e = add(sc, "div", "pv-person", "width:" + px(size * (list.length > 1 ? 1.55 : 1)));
    e.innerHTML = '<div class="pv-avs">' + list.map((w, i)=> '<img class="pv-av" alt="" src="' + pvChar(w) + '" style="width:' +
      px(list.length > 1 ? size * .82 : size) + (i ? ';margin-left:' + px(-size * .2) : '') + '">').join("") + '</div>' +
      (name ? '<div class="pv-name">' + name + '</div>' : "");
    setXY(e, cx, y); return e;
  }

  return { reduce, px, wait, ROD, CUBE, FIT, dashBox, kNow, add, setXY, xy, knock, pop, show, shake, repulse, softGlow, scene, ctx, run, block, glide, shift,
           hand, centre, numHTML, numCard, lightDigit, equation, spreadEq, person };
})();

/* ---- [pv kit] the place-value table, block groups, moving blocks between tables, making a ten ---- */
Object.assign(PVK, (function(){
  const K = PVK, { px, add, setXY, glide, wait, pop, ROD, CUBE } = K;
  /* a दहाई | इकाई table. o: { cx, y, cube (a cube's side - a rod is ten of them, as wide as one), tensMax (rod places the column is wide for),
     tensFinal (the rods it will hold - they stand centred in their column), onesMax (cube places: rows of 5, the
     first two rows a ten-frame) }. Blocks are NOT children of the table: they are scene elements standing on its
     places, so they can fly from one table to another. T.rods / T.cubes = what stands on it now, in place order. */
  function table(sc, o){
    /* Q: the table's layout size; G: its blocks - o.blk (each screen's layout sets it as big as its room allows, review
       2026-10-14 "make the cubes look bigger"), else core FIT of Q. o.pad: the inner margin (tight screens trim it) */
    const Q = o.cube, G = o.blk || Q * K.FIT;
    const g = Math.max(4, Math.round(Q * .2)), rW = G, rH = G * ROD.ar, rg = Math.max(6, Math.round(rW * .5));
    const pad = o.pad != null ? o.pad : Math.round(Q * .45) + 4, head = Math.round(Q * .55 + 30), cH = G * CUBE.ar;   // (+8: room for bigger words, user 2026-10-22)
    const rows = Math.max(2, Math.ceil((o.onesMax || 9) / 5)), tSlots = Math.max(o.tensMax || 5, 3);
    /* the two columns are always the same width: the wider one's need sets both (blocks centre in their column) */
    /* a table that can reach ten ones keeps a rod lane at the right of its इकाई column: the new ten forms there,
       inside the table, and waits there until it is put in the tens column */
    const lane = (o.onesMax || 9) >= 10 ? rW + 2 * g : 0;
    const onesNeed = 5 * G + 4 * g + lane + 2 * pad, colW = Math.max(onesNeed, tSlots * rW + (tSlots - 1) * rg + 2 * pad);
    const onesW = colW, tensW = colW, onesIn = (colW - onesNeed) / 2;
    /* rows after the first two (the ten-frame) stand TF lower, so they clear its dashed ring (review 2026-10-14) */
    const TF = 12, rowsH = r => r ? r * cH + (r - 1) * g + (r > 2 ? TF : 0) : 0;
    const inH = Math.max(rH, rowsH(rows)), H = head + inH + 2 * pad, W = tensW + onesW;
    const x = o.cx - W / 2, y = o.y, fs = Math.round(head * .6);
    const el = add(sc, "div", "pv-table", "width:" + px(W) + ";height:" + px(H) + ";--head:" + px(head));
    el.innerHTML = '<div class="pv-th pv-th-t" style="width:' + px(tensW) + ';height:' + px(head) + ';font-size:' + px(fs) + '">दहाई</div>' +
                   '<div class="pv-th pv-th-o" style="left:' + px(tensW) + ';right:0;height:' + px(head) + ';font-size:' + px(fs) + '">इकाई</div>' +
                   '<i class="pv-div" style="left:' + px(tensW - 1.5) + '"></i>';
    setXY(el, x, y);
    const T = { sc, el, x, y, W, H, G, g, rH, rW, rg, pad, head, inH, tensW, onesW, cH, rods: [], cubes: [], ghosts: [], extra: [],
                th: el.querySelector(".pv-th-t"), oh: el.querySelector(".pv-th-o") };
    /* every group stands in the CENTRE of its column (review 2026-10-14), for the blocks there NOW (n, default the list's
       length): the rods side by side; the cubes in rows of five (the first two a ten-frame); a new ten waiting in the
       इकाई column (T.laneRod) stands left of its cubes, the two centred together. T.relayout() re-centres after a change. */
    T.tensXY = (j, n)=>{ n = Math.max(n == null ? T.rods.length : n, j + 1, 1); const grp = n * rW + (n - 1) * rg;
      return { x: T.x + (tensW - grp) / 2 + j * (rW + rg), y: T.y + head + pad + (inH - rH) / 2 }; };
    T.onesBox = (n, rod)=>{ const cols = Math.min(n, 5), rows = Math.ceil(n / 5), bw = cols ? cols * G + (cols - 1) * g : 0,
      bh = rowsH(rows), gap = rod && n ? Math.max(10, 2 * g) : 0, tw = (rod ? rW : 0) + gap + bw,
      x0 = T.x + tensW + (onesW - tw) / 2, top = T.y + head + pad;
      return { rx: x0, ry: top + (inH - rH) / 2, cx: x0 + (rod ? rW + gap : 0), cy: top + (inH - bh) / 2 }; };
    T.onesXY = (i, n)=>{ const b = T.onesBox(Math.max(n == null ? T.cubes.length : n, i + 1), !!T.laneRod);
      const r = Math.floor(i / 5); return { x: b.cx + (i % 5) * (G + g), y: b.cy + r * (cH + g) + (r >= 2 ? TF : 0) }; };
    T.laneRod = null;
    T.slot = (kind, i, n)=> kind === "t" ? T.tensXY(i, n) : T.onesXY(i, n);
    /* glide every block not in flight to its centred place (one in flight re-settles when it lands) */
    T.relayout = (ms, skip, settling)=>{ ms = ms == null ? 320 : ms; const go = (b, p)=>{ if(b !== skip && !b._gl) glide(b, p, ms, false); };
      T.rods.forEach((b, j)=> go(b, T.tensXY(j))); T.cubes.forEach((b, i)=> go(b, T.onesXY(i)));
      if(T.laneRod){ const q = T.onesBox(T.cubes.length, true); go(T.laneRod, { x: q.rx, y: q.ry }); }
      /* blocks added quickly one after another were in flight just now: once things are still, settle them all */
      if(!settling){ clearTimeout(T._settle); T._settle = setTimeout(function again(){ if(!T.el.isConnected) return;
        if([...T.rods, ...T.cubes].some(b => b._gl)){ T._settle = setTimeout(again, 120); return; } T.relayout(220, null, true); }, ms + 80); } };
    T.list = kind => kind === "t" ? T.rods : T.cubes;
    /* a new block on the next place of its column, popping in */
    T.addBlock = kind =>{ PVSFX.appear(); const list = T.list(kind), p = T.slot(kind, list.length, list.length + 1);
      const b = K.block(sc, kind, p.x, p.y, kind === "t" ? rH : G); list.push(b); pop(b); T.relayout(260, b); return b; };
    /* the number built "one by one" (deck: "Show the PV tables with the numbers built using blocks one by one") */
    T.fill = async (n, step)=>{ const t = Math.floor(n / 10), u = n % 10;
      for(let j = 0; j < t; j++){ T.addBlock("t"); await wait(step == null ? 110 : step); }
      for(let i = 0; i < u; i++){ T.addBlock("o"); await wait(step == null ? 90 : step * .8); } };
    /* the column digits under the table (the place value written out): tens green, ones orange */
    T.digits = (tens, ones)=>{
      T.extra.filter(e => e.classList.contains("pv-dig")).forEach(e => e.remove());
      const mk = (cls, v, cx)=>{ const d = add(sc, "div", "pv-dig " + cls); d.textContent = String(v); setXY(d, cx, T.y + H); T.extra.push(d); pop(d); return d; };
      return { t: mk("pv-dig-t", tens, T.x + tensW / 2), o: mk("pv-dig-o", ones, T.x + tensW + onesW / 2) };
    };
    T.lightHead = (which, on)=> (which === "t" ? T.th : T.oh).classList.toggle("hl", on !== false);
    /* the whole table with everything standing on it (blocks, digits, its number card) */
    T.all = ()=> [T.el, ...T.rods, ...T.cubes, ...T.extra];
    T.move = (dx, dy, ms)=>{ if(ms && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) PVSFX.move(); T.x += dx; T.y += dy; return Promise.all(T.all().map(e => K.shift(e, dx, dy, ms))); };
    T.fade = ()=>{ [...T.all(), ...T.ghosts].forEach(e => e.classList.add("pv-gone")); };
    return T;
  }
  const showTable = (T, on)=>{ T.el.classList.toggle("pv-hide", on === false); if(on !== false) pop(T.el); };

  /* a block flies from table A to the next place of its column in table S; a grey copy stays where it was
     (deck: "each tapped block moves to the sum card, leaving a greyed-out image behind") */
  function transfer(b, A, S, ms){
    const list = A.list(b._kind), i = list.indexOf(b); if(i >= 0) list.splice(i, 1);
    b.classList.remove("pv-tap", "pulse", "hl");
    const gh = b.cloneNode(false); gh.className = "pv-blk pv-ghost pv-" + (b._kind === "t" ? "rod" : "cube");
    setXY(gh, b._x, b._y); A.sc.insertBefore(gh, b); A.ghosts.push(gh);
    const dest = S.list(b._kind), p = S.slot(b._kind, dest.length, dest.length + 1); dest.push(b);
    b.style.zIndex = 30; S.relayout(ms == null ? 620 : ms, b);
    return glide(b, p, ms == null ? 620 : ms, true).then(()=>{ b.style.zIndex = ""; K.knock(); S.relayout(220); });
  }
  /* highlight a set one after another (the VO naming them) */
  /* a new ten blinks twice as it forms; .pv-new then goes, or the blink would play again whenever a later highlight
     (.hl, a sweep) ends and hands the animation back to it (user 2026-10-14: "the last green stick was blinking") */
  function newTen(rod){ rod.classList.add("pv-new");
    const off = ()=> rod.classList.remove("pv-new");
    rod.addEventListener("animationend", e =>{ if(e.animationName === "pvInnerBlink") off(); });
    setTimeout(off, 2500); }
  function sweep(list, step){ (list || []).forEach((e, i)=> setTimeout(()=>{ if(!e.isConnected) return;
    e.classList.remove("hl"); void e.offsetWidth; e.classList.add("hl"); setTimeout(()=> e.classList.remove("hl"), 1900); }, i * (step == null ? 110 : step))); }
  /* the dashed ring round the first ten cubes of a table (the ten-frame's two rows) */
  function ring(T, on){
    if(!T._ring){ const w = 5 * T.G + 4 * T.g + 14, h = 2 * T.cH + T.g + 14;
      T._ring = add(T.sc, "div", "pv-ring pv-hide", "width:" + px(w) + ";height:" + px(h)); K.dashBox(T._ring, w, h, 4, 14, 11, 8);
      T.extra.push(T._ring); }
    if(on !== false){ const p = T.onesXY(0); setXY(T._ring, p.x - 7, p.y - 7); }      // round the first ten where they stand now
    T._ring.classList.toggle("pv-hide", on === false); if(on !== false) pop(T._ring);
    return T._ring;
  }
  /* MAKE A TEN: the first ten cubes of table S stack into one column in their इकाई column - left of the cubes left over, the
     two centred together - (each one on its place in the rod - a rod is ten cubes), and become ONE rod (a "new ten", glowing); the cubes left over move up to the first places.
     Resolves with that rod - not yet in S.rods: it waits in the lane until it is put in the tens column. */
  async function makeTen(S){
    const ten = S.cubes.slice(0, 10), rest = S.cubes.slice(10);
    S.cubes = rest; S.laneRod = ten[9];                               // (a stand-in until the rod is made: the layout leaves its place)
    const q = S.onesBox(rest.length, true), rx = q.rx, ry = q.ry, sc = S.sc;
    rest.forEach((c, i)=> glide(c, S.onesXY(i), 560, false));
    const unit = S.G * CUBE.pitch;                                 // one cube's step = one tenth of the rod
    ring(S, false);
    await Promise.all(ten.map((c, j)=> wait(j * 45).then(()=>{
      c.style.zIndex = 30;
      return glide(c, { x: rx, y: ry + (9 - j) * unit }, 560, true);
    })));
    await wait(140);
    const rod = K.block(sc, "t", rx, ry, S.rH); newTen(rod); pop(rod);
    ten.forEach(c =>{ c.classList.add("pv-gone"); setTimeout(()=> c.remove(), 400); });
    try{ playSfxFile("sfx_correct", 0.5); }catch(e){}
    S.laneRod = rod;
    await wait(420);
    return rod;
  }
  /* a person's blocks on a story page: the rods side by side, then the cubes in columns of five, bottom-aligned.
     g.add(blocks) re-lays a set of blocks (another group's, flying in) into this group's places */
  function group(sc, n, cx, bottom, H, gap){
    const G = { sc, n, cx, bottom, H, rods: [], cubes: [] };
    const rW = H / ROD.ar, cs = rW, cH = cs * CUBE.ar, fH = cs * CUBE.pitch;   // a cube = one of the rod's ten
    /* the cubes stack like the rod's (each one's top face under the next one), so five of them are half a rod */
    G.layout = (t, u)=>{ const cols = Math.ceil(u / 5), rw = t ? t * rW + (t - 1) * 5 : 0, cw = cols ? cols * cs + (cols - 1) * 3 : 0;
      const W = rw + (t && cols ? 10 : 0) + cw, x0 = cx - W / 2, cx0 = x0 + rw + (t && cols ? 10 : 0);
      return { rod: j =>({ x: x0 + j * (rW + 5), y: bottom - H }), cube: i =>({ x: cx0 + Math.floor(i / 5) * (cs + 3), y: bottom - cH - (i % 5) * (gap != null ? cH + gap : fH) }) }; };   // (gap: each cube apart, else stacked like the rod's)
    G.make = ()=>{ const t = Math.floor(n / 10), u = n % 10, L = G.layout(t, u);
      for(let j = 0; j < t; j++){ const p = L.rod(j); G.rods.push(K.block(sc, "t", p.x, p.y, H)); }
      for(let i = 0; i < u; i++){ const p = L.cube(i); G.cubes.push(K.block(sc, "o", p.x, p.y, cs)); } return G; };
    G.all = ()=> [...G.rods, ...G.cubes];
    G.cs = cs; G.rW = rW;
    return G;
  }
  return { table, showTable, transfer, newTen, sweep, ring, makeTen, group };
})());

/* ---- [pv kit] what the child does: add blocks with the + buttons, tap blocks across into the sum table, make a
   ten and drag it to the tens column; and the same moves played by the game (Swifty's demo, the hints) ---- */
Object.assign(PVK, (function(){
  const K = PVK, { px, add, setXY, glide, wait, pop, shake } = K;
  const idleMs = ()=> IDLE_MS;

  /* the two source buttons under a table being built: [rod +] (दहाई) and [cube +] (इकाई); centred on mid (stage x)
     when given - the screen's centre, review 2026-10-14 - else under the table */
  function sources(sc, T, y, mid){
    const mk = (kind, cx)=>{ const b = add(sc, "button", "pv-src pv-hide"); b.type = "button";
      b.innerHTML = '<img alt="" src="' + (kind === "t" ? K.ROD.src : K.CUBE.src) + '"><span class="pv-plus">+</span>';
      b.setAttribute("aria-label", kind === "t" ? "दहाई" : "इकाई"); setXY(b, cx, y); b._kind = kind; return b; };
    const cx = mid != null ? mid : T.x + T.W / 2, S = { t: mk("t", cx - 74), o: mk("o", cx + 74) };
    S.show = on =>{ K.show(S.t, on); K.show(S.o, on); };
    S.remove = ()=>{ S.t.remove(); S.o.remove(); };
    return S;
  }
  /* the child adds n blocks of one kind with its + button: it pulses, each tap adds one, it switches off at n.
     Idle 7s: it pulses again (the decks: "if idle after 1 tap, pulsate again"). */
  function childAdd(C, btn, T, n, kind){
    return new Promise(res =>{
      if(!n) return res();
      let got = 0, idleT = 0;
      btn.classList.remove("off"); btn.classList.add("pulse");
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || got >= n) return; K.repulse(btn); arm(); }, idleMs()); };
      btn.onclick = ()=>{
        if(!C.alive() || got >= n) return;
        stopNudge(); got++; T.addBlock(kind); K.knock();
        GameBus.emit("pv_block_added", { slide_id: C.slide.id, kind, count: got });
        if(got >= n){ clearTimeout(idleT); btn.onclick = null; btn.classList.remove("pulse"); btn.classList.add("off"); setTimeout(res, 380); }
        else arm();
      };
      arm();
    });
  }
  /* Swifty's hand taps a + button n times (the deck: "Swiftee adds 2 rods by tapping on plus") */
  async function demoAdd(C, H, btn, T, n, kind){
    for(let j = 0; j < n; j++){
      await H.tap(K.centre(btn.querySelector(".pv-plus"), C.sc)); C.guard();
      T.addBlock(kind); K.knock(); await C.wait(260);
    }
  }
  /* the child taps blocks of one kind (or any kind, kind null) in the addend tables: each flies to the sum table.
     Resolves when none are left. Other blocks are not tappable meanwhile. Idle 7s: they pulse + the hand. */
  function tapAcross(C, from, S, kind){
    return new Promise(res =>{
      const pool = ()=> from.flatMap(T => kind ? T.list(kind) : [...T.rods, ...T.cubes]);
      if(!pool().length) return res();
      let flying = 0, idleT = 0, fin = false;
      const done = ()=>{ if(fin || pool().length || flying) return; fin = true; clearTimeout(idleT); res(); };
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || fin) return;
        pool().forEach(b => K.repulse(b)); arm(); }, idleMs()); };   // the decks: "pulsate the blocks until all are tapped"
      from.forEach(T => [...T.rods, ...T.cubes].forEach(b =>{
        if(kind && b._kind !== kind) return;
        b.classList.add("pv-tap");
        b.onclick = ()=>{
          if(!C.alive() || !b.classList.contains("pv-tap")) return;
          stopNudge(); b.onclick = null; flying++;
          pool().forEach(x => x.classList.remove("pulse"));
          const A = from.find(T => T.list(b._kind).includes(b));
          K.transfer(b, A, S).then(()=>{ flying--; GameBus.emit("pv_block_moved", { slide_id: C.slide.id, kind: b._kind }); done(); });
          arm();
        };
      }));
      from.forEach(T => T.list(kind || "t").forEach(b => b.classList.add("pulse")));
      if(!kind) from.forEach(T => T.cubes.forEach(b => b.classList.add("pulse")));
      arm();
    });
  }
  /* Swifty's hand taps every block of one kind across, one after another (PV_DEMO auto) */
  async function demoAcross(C, H, from, S, kind){
    for(const T of from) for(const b of T.list(kind).slice()){
      await H.tap(K.centre(b, C.sc)); C.guard();
      K.transfer(b, T, S); GameBus.emit("pv_block_moved", { slide_id: C.slide.id, kind });
      await C.wait(380); C.guard();
    }
    await C.wait(400);
  }
  /* the game moves every block across by itself (a hint, or the S02 story): ones first, the ten made if the ones
     reach ten, then the tens */
  async function autoMerge(C, from, S, opt){
    opt = opt || {};
    for(const T of from) for(const b of T.cubes.slice()){ K.transfer(b, T, S, 520); await C.wait(opt.step || 150); }
    await C.wait(560);
    if(S.cubes.length >= 10){
      K.ring(S, true); await C.wait(700);
      const rod = await K.makeTen(S); C.guard();
      await C.wait(250); await putRod(S, rod);
    }
    for(const T of from) for(const b of T.rods.slice()){ K.transfer(b, T, S, 560); await C.wait(opt.step || 170); }
    await C.wait(640);
  }
  /* the new ten goes into the tens column's next place */
  function putRod(S, rod){ const p = S.tensXY(S.rods.length, S.rods.length + 1); S.rods.push(rod); S.laneRod = null; rod.classList.remove("pv-grab", "pulse", "pv-new");
    rod.style.zIndex = 30; S.relayout(620, rod); return glide(rod, p, 620, true).then(()=>{ rod.style.zIndex = ""; K.knock(); }); }

  /* the "दहाई बनाओ" button (gold, the game's button style); .off = not yet (fewer than ten ones) */
  function makeBtn(sc, x, y){ const b = add(sc, "button", "pv-make pv-hide"); b.type = "button"; b.textContent = "दहाई बनाओ"; setXY(b, x, y); return b; }

  /* the child puts the new ten into the tens column: it pulses beside the table; drag it ANYWHERE onto the table's
     दहाई side (no target box - review 2026-10-14) and it settles on its place there (or tap it). cfg: { demo: the ghost drag once at the start, idle: ms before the ghost drag
     plays by itself (0 = never), wrongs: the Drag & Drop ladder - 1st miss "फिर से सोचिए...", then the ghost } */
  function placeRod(C, rod, S, cfg){
    cfg = cfg || {};
    return new Promise(res =>{
      const sc = C.sc, j = S.rods.length, p = S.tensXY(j, j + 1);
      S.rods.forEach((b, k)=> glide(b, S.tensXY(k, j + 1), 420, false));   // the rods there make room: the new place keeps the group centred
      const home = { x: rod._x, y: rod._y }, H = K.hand(sc);
      rod.classList.add("pv-grab", "pulse");
      let misses = 0, idleT = 0, fin = false, ghosting = 0, drag = null;
      /* on the दहाई side: the rod's centre over the tens column (a little slack round it) */
      const near = (x, y)=>{ const cx = x + S.rW / 2, cy = y + S.rH / 2, m = 24;
        return cx > S.x - m && cx < S.x + S.tensW + m && cy > S.y - m && cy < S.y + S.H + m; };
      async function ghost(){
        const t = ++ghosting, g = rod.cloneNode(false); g.className = "pv-blk pv-rod pv-ghostdrag"; setXY(g, home.x, home.y); sc.appendChild(g);
        if(!cfg.noHand) H.on({ x: home.x + S.rW / 2, y: home.y + S.rH * .55 }); await wait(320);   // noHand: the ghost rod glides alone
        if(t === ghosting && !fin){ H.el.classList.add("press");
          await Promise.all([glide(g, p, 1100, true), H.to({ x: p.x + S.rW / 2, y: p.y + S.rH * .55 }, 1100)]); await wait(250); }
        g.remove(); H.off();
      }
      const arm = ()=>{ clearTimeout(idleT); if(!cfg.idle) return;
        idleT = setTimeout(()=>{ if(!C.alive() || fin || drag) return; ghost().then(arm); }, cfg.idle); };
      const finish = ()=>{ if(fin) return; fin = true; clearTimeout(idleT); ghosting++; H.off(); H.el.remove();
        S.rods.push(rod); S.laneRod = null; S.relayout(420, rod); rod.classList.remove("pv-grab", "pulse", "pv-new"); rod.onpointerdown = null;
        rod.style.zIndex = 30; glide(rod, p, 260, false).then(()=>{ rod.style.zIndex = ""; K.knock(); try{ sfxCorrect(); }catch(e){} setTimeout(res, 200); }); };
      const miss = async ()=>{ misses++; shake(rod, 7); try{ sfxWrongSoft(); }catch(e){}
        await glide(rod, home, 380, false);
        if(misses === 1 && C.has("dd_try")) await C.say("dd_try"); else { ghost(); if(C.has("place")) await C.say("place"); }
        arm(); };
      rod.onpointerdown = ev =>{
        if(fin || !C.alive() || drag) return; ev.preventDefault(); stopNudge(); clearTimeout(idleT); ghosting++;
        const k = K.kNow(); drag = { sx: ev.clientX, sy: ev.clientY, x0: rod._x, y0: rod._y, moved: 0 };
        rod.classList.add("lift"); rod.style.zIndex = 31;
        try{ rod.setPointerCapture(ev.pointerId); }catch(e){}
        const mv = e =>{ const dx = (e.clientX - drag.sx) / k, dy = (e.clientY - drag.sy) / k; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
          setXY(rod, drag.x0 + dx, drag.y0 + dy); };
        const up = ()=>{ rod.removeEventListener("pointermove", mv); rod.removeEventListener("pointerup", up); rod.removeEventListener("pointercancel", up);
          rod.classList.remove("lift"); const d = drag; drag = null;
          if(d.moved < 8 || near(rod._x, rod._y)) finish(); else miss().catch(()=>{}); };
        rod.addEventListener("pointermove", mv); rod.addEventListener("pointerup", up); rod.addEventListener("pointercancel", up);
      };
      (async ()=>{ if(cfg.say && C.has(cfg.say)) await C.say(cfg.say); if(cfg.demo && !fin) await ghost(); arm(); })().catch(()=>{});
    });
  }

  /* GUIDED merge (deck pages 6-8 / S02 7-9): the child taps ANY block across; with regrouping the दहाई बनाओ button
     (shown from the start) comes alive once the sum has ten ones; the new ten then goes to the tens column.
     Done when every block is across, the ones are fewer than ten and no ten is waiting. Idle 7s - the visual hint
     that fits: the waiting ten's ghost drag, else the live button, else the blocks pulse (+ the hand). */
  function mergeChild(C, from, S, btn, opt){
    opt = opt || {}; const point = el => K.repulse(el);   // the decks (pages 6-9): "if inactive for 7 seconds, pulsate" - no hand
    return new Promise(res =>{
      const pool = ()=> from.flatMap(T => [...T.rods, ...T.cubes]);
      let flying = 0, pending = null, idleT = 0, fin = false, making = false;
      const ready = ()=> S.cubes.length >= 10 && !pending && !making && !flying;
      const sync = ()=>{ if(!btn) return; btn.classList.toggle("off", !ready()); btn.classList.toggle("pulse", ready()); };
      const done = ()=>{ sync(); if(fin || pool().length || flying || pending || making || S.cubes.length >= 10) return; fin = true; clearTimeout(idleT); res(); };
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || fin) return;
        if(pending){ arm(); return; }                                   // (placeRod runs its own idle ghost)
        if(ready()){ point(btn); arm(); return; }
        pool().forEach(b => point(b)); arm(); }, idleMs()); };
      pool().forEach(b =>{
        b.classList.add("pv-tap");
        b.onclick = ()=>{
          if(!C.alive() || fin || !b.classList.contains("pv-tap")) return;
          if(pending || making){ shake(pending || b, 6); return; }
          stopNudge(); b.onclick = null; flying++;
          pool().forEach(x => x.classList.remove("pulse"));
          const A = from.find(T => T.list(b._kind).includes(b));
          K.transfer(b, A, S).then(()=>{ flying--; GameBus.emit("pv_block_moved", { slide_id: C.slide.id, kind: b._kind }); done(); });
          sync(); arm();
        };
      });
      if(btn) btn.onclick = async ()=>{
        if(!C.alive() || fin) return;
        if(!ready()){ shake(btn, 7); return; }
        stopNudge(); making = true; sync();
        K.ring(S, true); await wait(500);
        const rod = await K.makeTen(S); making = false; pending = rod; sync();
        GameBus.emit("pv_ten_made", { slide_id: C.slide.id });
        await placeRod(C, rod, S, { idle: idleMs(), noHand: true });   // the guided ghost drag: the ghost rod alone (user 2026-10-15)
        pending = null; done(); arm();
      };
      sync(); arm();
    });
  }
  return { sources, childAdd, demoAdd, tapAcross, demoAcross, autoMerge, putRod, makeBtn, placeRod, mergeChild };
})());

/* ---- [pv kit] answering: the three answer cards and the number pad. One behaviour on every answer screen, as in
   MTG2A04 (QA checklist 2026-10-05 / review 2026-10-06): a wrong card shakes with its amber rim and returns; three
   layers of help (the slide's own ladder, cfg.ladder(n)); the right card turns green, the others dim, SFX + confetti
   + Swiftie cheers + the deck's correct VO, and the answer flies into the equation's "?" ---- */
Object.assign(PVK, (function(){
  const K = PVK, { px, add, setXY, glide, wait, pop, shake } = K;

  /* cfg: { options, answer, y, ladder: async n => (help after the n-th wrong tap), reask: role, onRight: async card =>,
     after: async => (once the correct line has played) } */
  function mcq(C, cfg){
    return new Promise(res =>{
      const slide = C.slide, sc = C.sc;
      const box = add(sc, "div", "mq-opts"); box.style.top = px(cfg.y); box.style.width = "1333px";
      /* a new order every time the page opens (user 2026-10-16: the right card was always in the same place) */
      /* user 2026-10-23: never the same order as the last visit to this page (a plain shuffle can repeat it) */
      const mix = ()=>{ const o = cfg.options.slice(); for(let i = o.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
      const seen = mcq.last || (mcq.last = {}), was = seen[slide.id];
      let opts = mix(); for(let n = 0; n < 12 && was && opts.join() === was; n++) opts = mix();
      seen[slide.id] = opts.join();
      const els = opts.map(v =>{ const o = add(box, "button", "mq-opt"); o.type = "button"; o.textContent = devNumeral(v); o._v = v; return o; });
      const right = els.find(o => o._v === cfg.answer);
      let wrong = 0, busy = true, idleT = 0, layer3 = false, over = false;
      const M = { box, els, right,
        open(){ box.classList.add("in"); },
        hide(on){ box.classList.toggle("pv-hide", on !== false); },
        moveTo(y){ box.style.top = px(y); },
        ready(){ busy = false; arm(); },
        lock(){ layer3 = true; els.forEach(x =>{ if(x !== right){ x.classList.add("faded", "locked"); x.disabled = true; } });
          right.classList.add("hint-on"); K.softGlow(right); } };   // highlighted + the others faded (the decks' WA3) - no hand
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{
        if(!C.alive() || busy || over) return;
        busy = true; C.say(cfg.reask || "ask").then(()=>{ busy = false; arm(); }, ()=>{}); }, IDLE_MS); };
      async function onWrong(o){
        wrong++; busy = true; clearTimeout(idleT);
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: false, attempt: wrong, score: 0 }); }catch(e){}
        GameBus.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: wrong });
        sfxWrongSoft(); setSwMood("tryagain");
        o.classList.add("wrong"); shake(o, 9); setTimeout(()=> o.classList.remove("wrong"), 900);
        await C.wait(450);
        setSwMood("hint");
        await cfg.ladder(wrong, M);
        if(C.alive() && !over){ busy = false; setSwMood("point"); arm(); }
      }
      async function onRight(o){
        over = true; state.locked = true; busy = true; stopNudge(); clearTimeout(idleT);
        o.classList.remove("hint-on"); o.classList.add("correct");
        els.forEach(x =>{ if(x !== o) x.classList.add("pv-gone"); });   // the other two go completely as the right one goes up (review 2026-10-14)
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: true, attempt: wrong + 1, score: wrong === 0 ? 1 : 0 }); }catch(e){}
        recordResult(slide, wrong === 0);
        GameBus.emit("mcq_correct", { slide_id: slide.id, phase: slide.phase, value: wrong === 0, first_try: wrong === 0, attempts: wrong + 1, latency_ms: Date.now() - state.slideStart });
        sfxCorrect(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
        if(cfg.onRight) await cfg.onRight(o);
        els.forEach(x => x.classList.add("pv-gone"));   // the answer now stands in the equation: the cards below go
        await (cfg.sayCorrect ? cfg.sayCorrect() : C.say("correct"));   // (S02: "शाबाश! 53 घटा 14 बराबर 39।" - the equation lit in sync)
        if(cfg.after) await cfg.after();
        await C.wait(500);
        completeSlide(wrong === 0);
        res();
      }
      els.forEach(o => o.addEventListener("click", ()=>{
        if(busy || over || !C.alive() || o.classList.contains("locked")) return;
        stopNudge(); clearTimeout(idleT);
        if(o === right) onRight(o).catch(()=>{}); else onWrong(o).catch(()=>{});
      }));
      C.mcq = M;
      cfg.onReady && cfg.onReady(M);
    });
  }
  /* the right card's number flies into the equation's "?" box */
  async function flyToQ(C, from, E){
    const a = K.centre(from, C.sc), b = K.centre(E.q, C.sc);
    const f = add(C.sc, "div", "pv-num pv-fly", "height:64px;font-size:44px;min-width:96px;border-radius:18px");
    f.textContent = from.textContent; setXY(f, a.x, a.y - 32);
    from.style.visibility = "hidden";   // the card itself goes up: no second box left behind (review 2026-10-14)
    await glide(f, { x: b.x, y: b.y - 32 }, 620, true);
    f.remove(); E.fill(+from.textContent);
  }

  /* the number pad (deck pages 9-10: "an answer counter below with a hand nudge. On tap, open the number pad"):
     the answer box - ONE box with a blinking typing cursor "|" (review 2026-10-14), centred on x - and beside it a 1-9 / 0
     pad with a back key and a tick: the answer is checked when the tick is tapped (review 2026-10-14).
     cfg: { answer, x (the answer box's centre), y, ladder: async n =>, onRight: async => } */
  function numpad(C, cfg){
    return new Promise(res =>{
      const slide = C.slide, sc = C.sc, digits = String(cfg.answer).split(""), N = digits.length;
      const slotW = Math.max(120, N * 30 + 60), ansW = slotW + 26;
      const x0 = cfg.x - ansW / 2;                                   // the answer box stands at the centre
      /* cfg.target (the sibling's layout, user 2026-10-22): no answer box - the child types into the equation's "?" */
      const T = cfg.target;
      const ans = T || add(sc, "div", "pv-ans"); if(!T) setXY(ans, x0, cfg.y + 40);
      const slot = T || add(ans, "div", "pv-slot pv-slot-one", "width:" + px(slotW));
      if(T) T.classList.add("pv-typein");
      /* the pad: the sibling's 3 x 4 phone pad (MTG2A01_L03_S01, user 2026-10-22) - 1-9, then back 0 tick. It is tall
         (4 rows), so it stands beside the table column (cfg.padAt), else beside the box, level with its middle */
      const pad = add(sc, "div", "pv-pad pv-pad-3 pv-hide");
      const keys = {};
      /* review 2026-10-14: a backspace ARROW (the ⌫ glyph read as a cross) and a green tick that sends the answer */
      const ICON = { "⌫": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5.5M11 5.5 4.5 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                     "✓": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' };
      ICON["⌫"] = '<svg viewBox="0 0 40 26" aria-hidden="true"><path d="M13 2h23a2.5 2.5 0 0 1 2.5 2.5v17A2.5 2.5 0 0 1 36 24H13L2 13z" fill="#fff" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M19 8.5l9 9M28 8.5l-9 9" stroke="#E5282E" stroke-width="3.4" stroke-linecap="round"/></svg>';
      ["1","2","3","4","5","6","7","8","9","⌫","0","✓"].forEach(k =>{
        const b = add(pad, "button", "pv-key" + (k === "⌫" ? " pv-back" : k === "✓" ? " pv-ok off" : "")); b.type = "button";
        if(ICON[k]){ b.innerHTML = ICON[k]; b.setAttribute("aria-label", k === "⌫" ? "मिटाएँ" : "जाँचें"); } else b.textContent = k;
        b._k = k; keys[k] = b; });
      const ok = keys["✓"];
      if(cfg.padAt) setXY(pad, cfg.padAt.cx != null ? cfg.padAt.cx - pad.offsetWidth / 2 : cfg.padAt.x, cfg.padAt.y);
      else setXY(pad, x0 + ansW + 40, cfg.y + 40 + ans.offsetHeight / 2 - pad.offsetHeight / 2);
      let typed = [], wrong = 0, busy = false, open = false, over = false, idleT = 0, guide = null;
      const P = { ans, pad,
        hide(on){ if(!T) ans.classList.toggle("pv-hide", on !== false); pad.classList.toggle("pv-hide", on !== false || !open); },
        guideKeys(){ guide = 0; Object.values(keys).forEach(b => b.classList.add("locked")); lightKey(); } };
      /* the third layer: the right digit keys light one after the other, then the tick */
      /* every key locked but the one to tap now (user 2026-10-22: 45 - first only 4, then only 5, then the tick) */
      const lightKey = ()=>{ Object.values(keys).forEach(b =>{ b.classList.remove("hint-on"); if(guide != null) b.classList.add("locked"); });
        if(guide == null || guide > N) return; const b = guide < N ? keys[digits[guide]] : ok; b.classList.remove("locked"); b.classList.add("hint-on"); };
        /* (user 2026-10-26: no yellow ring round the key to press - the others are off, it pulses) */   // the key lights (the decks' WA3 "highlight the correct digit buttons in sequence") - no hand
      /* the tick: dim until a digit is in, pulsing once the box holds the whole answer */
      const okState = ()=>{ ok.classList.toggle("off", !typed.length); ok.classList.toggle("pulse", typed.length >= N && !over && !busy); };
      const render = ()=>{ const full = typed.length >= N || over;
        if(T && !open && !typed.length){ if(ok) okState(); return; }          // (the "?" stays until the pad opens)
        slot.innerHTML = typed.map(d => '<span class="pv-ch">' + d + '</span>').join("") + (full ? "" : '<span class="pv-caret">|</span>');
        slot.classList.toggle("on", open && !full); if(ok) okState(); };
      render();                                                    // the cursor shows from the start
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || busy || over) return;
        if(!open) placeNudge(ans); else if(guide != null) lightKey(); else if(typed.length >= N) K.repulse(ok);   // the answer counter's hand (the decks)
        busy = true; C.say(cfg.reask || "prompt").then(()=>{ busy = false; arm(); }, ()=>{}); }, IDLE_MS); };
      const openPad = ()=>{ if(open || over) return; open = true; stopNudge(); pad.classList.remove("pv-hide"); pop(pad); ans.classList.add("open"); render(); arm(); };
      ans.onclick = ()=>{ if(!C.alive() || busy) return; if(!open) PVSFX.tap(); openPad(); };
      P.open = openPad;
      async function check(){
        busy = true; clearTimeout(idleT); stopNudge(); okState();
        const v = typed.join("");
        if(v === String(cfg.answer)){
          over = true; state.locked = true; ans.classList.add("ok"); Object.values(keys).forEach(b => b.classList.add("locked")); okState();
          try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: true, attempt: wrong + 1, score: wrong === 0 ? 1 : 0, response: v }); }catch(e){}
          recordResult(slide, wrong === 0);
          GameBus.emit("numpad_correct", { slide_id: slide.id, phase: slide.phase, value: wrong === 0, first_try: wrong === 0, attempts: wrong + 1, latency_ms: Date.now() - state.slideStart });
          sfxCorrect(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
          pad.classList.add("pv-gone");   // the keypad goes as the answer goes up (review 2026-10-14)
          if(cfg.onRight) await cfg.onRight(ans);
          await (cfg.sayCorrect ? cfg.sayCorrect() : C.say("correct")); if(cfg.after) await cfg.after(); await C.wait(500);
          completeSlide(wrong === 0); res(); return;
        }
        wrong++;
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: false, attempt: wrong, score: 0, response: v }); }catch(e){}
        GameBus.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: wrong });
        sfxWrongSoft(); setSwMood("tryagain"); ans.classList.add("wrong"); shake(ans, 9);
        await C.wait(800); ans.classList.remove("wrong"); typed = []; render();
        setSwMood("hint");
        await cfg.ladder(wrong, P);
        if(C.alive() && !over){ busy = false; setSwMood("point"); render(); arm(); }
      }
      Object.values(keys).forEach(b => b.addEventListener("click", ()=>{
        if(!C.alive() || busy || over || !open || b.classList.contains("locked")) return;
        stopNudge(); arm(); PVSFX.tap();
        if(b._k === "⌫"){ typed.pop(); render(); return; }
        if(b._k === "✓"){ if(!typed.length) return; K.knock(); check().catch(()=>{}); return; }   // the answer goes in on the tick only
        if(typed.length >= N) return;
        typed.push(b._k); K.knock(); render(); pop(slot.querySelectorAll(".pv-ch")[typed.length - 1]);
        if(guide != null){ guide++; lightKey(); }
      }));
      P.ready = ()=>{ arm(); };   // the box pulses its cursor; the hand only after 7s idle (user 2026-10-15: "comes too early")
      cfg.onReady && cfg.onReady(P);
    });
  }
  /* the answer box's digits fly into the "?" */
  async function flyAnsToQ(C, ans, E, n){
    const a = K.centre(ans, C.sc), b = K.centre(E.q, C.sc);
    const f = add(C.sc, "div", "pv-num pv-fly", "height:64px;font-size:44px;min-width:96px;border-radius:18px");
    f.textContent = String(n); setXY(f, a.x, a.y - 32);
    ans.style.visibility = "hidden";    // the answer box goes up itself (review 2026-10-14)
    await glide(f, { x: b.x, y: b.y - 32 }, 620, true); f.remove(); E.fill(n);
  }
  return { mcq, flyToQ, numpad, flyAnsToQ };
})());

/* ---- [pv sub] the take-away kit (MTG2A01_L04_S01, review 2): build a number with the -/+ buttons, take blocks
   away (each taken block flies to the number being taken away and leaves a grey copy behind), the blocks that are
   left copied into the answer table, and the column-by-column help ladder. CSS [pv sub]. ---- */
/* a soft pop as a box / the equation comes in */
const sfxPop      = ()=> _tone([620, 930], "sine", 0.12, 0.10);

Object.assign(PVK, (function(){
  const K = PVK, { px, add, setXY, glide, wait, pop, shake } = K;
  const W_ = { t: "दहाई", o: "इकाई" };

  /* the table heads can carry a count: "दहाई" -> "3 दहाई" (deck page 11: "the table and the text header will reflect
     the correct remaining numbers"; page 3: "1 दहाई" / "2 इकाई" on the answer table) */
  /* the table heads show their word only (SME review 3: "remove the numerals written in the cell") - n is ignored */
  function headCount(T, kind, n){ const h = kind === "t" ? T.th : T.oh; if(h.textContent !== W_[kind]) h.textContent = W_[kind]; }
  const left = (T, kind)=> T.list(kind).filter(b => !b._removed);
  function liveHeads(T){ T.counts = ()=>{}; headCount(T, "t"); headCount(T, "o"); }
  function dropBlock(T, kind){ const b = T.list(kind).pop(); if(!b) return; PVSFX.unpop(); b.classList.add("pv-gone"); setTimeout(()=> b.remove(), 450); if(T.relayout) T.relayout(260); }
  /* a beat, no glow (SME review 3: "remove the shining/glow effect - pop up and pulsate in sync with the VO") */
  function beat(list, step){ (list || []).forEach((e, i)=>{ if(!e || !e.isConnected || K.reduce()) return;
    e.animate([{ scale: "1" }, { scale: "1.16" , offset: .32 }, { scale: ".96", offset: .62 }, { scale: "1.06", offset: .8 }, { scale: "1" }],
              { duration: 560, delay: i * (step == null ? 70 : step), easing: "ease-out" }); }); }
  /* a column of a table beats: its head and the blocks still standing in it */
  function beatCol(T, kind){ beat([kind === "t" ? T.th : T.oh], 0); beat(left(T, kind), kind === "t" ? 90 : 60); }
  /* the whole table pops (it and every block on it, together) */
  /* the whole table lights (its frame glows a moment) and pops - "इसमें" (SME review 4) */
  function hlTable(T){ T.el.classList.remove("pv-table-hl"); void T.el.offsetWidth; T.el.classList.add("pv-table-hl");
    setTimeout(()=> T.el.classList.remove("pv-table-hl"), 1600); popTable(T); }
  function popTable(T){ if(K.reduce()) return; const all = [T.el, ...T.rods, ...T.cubes].filter(e => !e.classList.contains("pv-gone"));
    all.forEach(e => e.animate([{ scale: "1" }, { scale: "1.06", offset: .35 }, { scale: ".985", offset: .7 }, { scale: "1" }], { duration: 520, easing: "ease-out" })); }

  /* the + buttons under a table being built: MTG2A01_L03_S01's source box, exactly (her 4c368fb, user 2026-10-26) - ONE white
     box, two halves [rod +] (दहाई) | [cube +] (इकाई), each half its own button (pulse / off / demo), the same width, a thin
     line between them; its block on the left upright in the table's own ratio (the rod drawn smaller, the cube a little
     bigger), the + on the right. y: the box's top, under the table. g.plus = the half itself (the whole half is the button) */
  function sources(sc, T, y){
    const G = Math.round(T.G * .45), rodL = G * K.ROD.ar, GC = Math.round(T.G * .72), H = Math.round(rodL + 24);   // G: the rod's width, GC: the cube's
    const bar = add(sc, "div", "pv-src-bar pv-hide", "height:" + px(H));
    const mk = kind =>{ const b = add(bar, "button", "pv-src"); b.type = "button";
      b.innerHTML = '<span class="pv-src-blk"><img alt="" src="' + (kind === "t" ? K.ROD.src : K.CUBE.src) + '" style="width:' + px(kind === "t" ? G : GC) + ';height:' +
        px(kind === "t" ? rodL : GC * K.CUBE.ar) + '"></span><span class="pv-plus">+</span>';
      b.setAttribute("aria-label", W_[kind]); b._kind = kind; b.plus = b; b.dot = b.querySelector(".pv-plus"); return b; };
    const S = { t: mk("t") }; add(bar, "i", "pv-src-div"); S.o = mk("o");
    const w = Math.max(S.t.offsetWidth, S.o.offsetWidth); [S.t, S.o].forEach(b => b.style.width = px(w));
    setXY(bar, T.x + T.W / 2 - bar.offsetWidth / 2, y);
    S.bar = bar;
    S.show = on =>{ bar.classList.toggle("pv-hide", on === false); if(on !== false) pop(bar); };
    S.fade = ()=>{ bar.classList.add("pv-gone"); setTimeout(()=> bar.remove(), 500); };
    return S;
  }
  /* Swiftee's hand taps a + button n times - her demo: that half lit for its turn, the other grey */
  async function demoAdd(C, H, g, T, n, kind){
    g.classList.remove("off");
    for(let j = 0; j < n; j++){ await H.tap(K.centre(g.dot || g.plus, C.sc)); C.guard(); PVSFX.tap(); T.addBlock(kind); await C.wait(260); }
    g.classList.add("off");
  }
  /* SME review 5 (2026-10-26): the 7s inactivity reminder - after 7s with no action the step's own line ("अब दहाई बनाइए।",
     "अब इकाई हटाइए।" ...), said again every 7s while the child stays idle; any action restarts the 7s; never over another
     voice (it waits for a quiet moment). pick() -> the clip id for now, or null (nothing to remind of right now) */
  function idleVo(C, pick){
    let t = 0, on = true;
    const arm = ()=>{ clearTimeout(t); if(!on) return;
      t = setTimeout(()=>{ if(!on || !C.alive()) return; const id = pick();
        if(!id || isPlaying){ arm(); return; }
        play("assets/voiceover/" + id + "." + AUDIO_EXT, ()=>{ if(on && C.alive()) arm(); }); }, IDLE_MS); };
    return { arm, stop(){ on = false; clearTimeout(t); } };
  }
  /* the child builds n with the + buttons: the column still to do pulses (tens first); each + stops (greys) when its
     column holds its number (SME review 3: "when the child adds the required number of blocks the buttons become
     inactive"); when both do, it is built. Idle 7s: the button to press pulses again. */
  function childBuild(C, T, n, S){
    const want = { t: Math.floor(n / 10), o: n % 10 };
    return new Promise(res =>{
      let idleT = 0, fin = false;
      const cnt = k => T.list(k).length;
      const next = ()=> cnt("t") < want.t ? "t" : (cnt("o") < want.o ? "o" : null);
      const vo = idleVo(C, ()=>{ const k = fin ? null : next(); return k ? "vo_idle_build_" + k : null; });
      const sync = ()=>{ const nx = next();
        ["t", "o"].forEach(k =>{ const g = S[k], full = cnt(k) >= want[k]; g.plus.classList.toggle("off", full); g.classList.toggle("pv-done", full);
          g.classList.toggle("pulse", k === nx); }); };
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || fin) return; const k = next(); if(k) K.repulse(S[k]); arm(); }, IDLE_MS); };
      const check = ()=>{ if(next() || fin) return; fin = true; clearTimeout(idleT); stopNudge(); vo.stop();
        ["t", "o"].forEach(k =>{ S[k].plus.onclick = null; S[k].classList.remove("pulse"); });
        setTimeout(res, 450); };
      ["t", "o"].forEach(k =>{ const g = S[k];
        g.plus.onclick = ()=>{ if(!C.alive() || fin || cnt(k) >= want[k]) return; stopNudge(); PVSFX.tap(); T.addBlock(k);
          GameBus.emit("pv_block_added", { slide_id: C.slide.id, kind: k, count: cnt(k) }); sync(); check(); arm(); vo.arm(); };
      });
      sync(); arm(); vo.arm(); check();
    });
  }

  /* TAKE AWAY one block (SME review 3 + user 2026-10-19): it pops out where it stands with a sparkle - a bright copy
     swells and fades, stars fly out - and its grey copy stays in its place. Nothing flies to the numbers. */
  function sparkles(C, x, y, n){
    for(let i = 0; i < n; i++){ const a = i / n * Math.PI * 2 + Math.random() * .5, r = 26 + Math.random() * 22;
      const e = add(C.sc, "i", "pv-spark" + (i % 3 ? "" : " pv-spark-w")); setXY(e, x, y);
      e.animate([{ translate: "0 0", scale: ".2", rotate: "0deg", opacity: 1 },
                 { translate: (Math.cos(a) * r).toFixed(1) + "px " + (Math.sin(a) * r).toFixed(1) + "px", scale: "1", rotate: "90deg", opacity: 1, offset: .55 },
                 { translate: (Math.cos(a) * r * 1.3).toFixed(1) + "px " + (Math.sin(a) * r * 1.3 + 8).toFixed(1) + "px", scale: ".3", rotate: "180deg", opacity: 0 }],
                { duration: 620 + Math.random() * 180, easing: "cubic-bezier(.2,.8,.4,1)" }).onfinish = ()=> e.remove(); }
  }
  function takeAway(C, b){
    b._removed = true; b.classList.remove("pv-tap", "pulse", "hl", "pv-allowed"); PVSFX.magic();
    if(K.reduce()){ b.classList.add("pv-taken"); return Promise.resolve(); }
    const f = add(C.sc, "img", "pv-blk pv-" + (b._kind === "t" ? "rod" : "cube") + " pv-flyaway"); f.src = b.src; f.alt = "";
    f.style.width = px(b._w); f.style.height = px(b._h); setXY(f, b._x, b._y);
    f.animate([{ scale: "1", opacity: 1, filter: "brightness(1)" }, { scale: "1.32", opacity: .95, filter: "brightness(1.7)", offset: .35 },
               { scale: "1.6", opacity: 0, filter: "brightness(2)" }], { duration: 480, easing: "ease-out" }).onfinish = ()=> f.remove();
    b.classList.add("pv-taken");
    b.animate([{ scale: ".6", opacity: 0 }, { scale: "1", opacity: .3, offset: .7 }, { scale: "1" }], { duration: 520, easing: "ease-out" });
    sparkles(C, b._x + b._w / 2, b._y + b._h / 2, b._kind === "t" ? 9 : 6);
    return K.wait(480);
  }
  /* PUT BACK (the help ladder's reset: "all the blocks should return"): the grey copy comes back to colour with a pop */
  function putBack(C, b){
    b._removed = false; b.classList.remove("pv-taken"); PVSFX.appear(); pop(b);
    return Promise.resolve();
  }
  /* Swiftee's hand takes n blocks of one kind away, the last ones first (onEach(j) after each: the count VO) */
  async function demoRemove(C, H, T, kind, n, to, onEach){
    const list = left(T, kind);
    for(let j = 0; j < n; j++){
      const b = list[list.length - 1 - j]; await H.tap(K.centre(b, C.sc)); C.guard();
      takeAway(C, b); if(onEach) await onEach(j); else await C.wait(360);
    }
  }
  /* the CHILD takes need.t tens and need.o ones away from T (deck pages 3, 7-11). Ones first: a ten tapped
     while ones are still to go, or one block more than needed, is a wrong move - the move shows, then every block flies
     back and the line for that column plays (1st time); the 2nd time the guide line, and from then on only the blocks
     to take are tappable (the others dimmed) - "इनमें से इतने हटाइए।". Done when exactly need is taken and stays so for
     a moment (cfg.settle ms; 0 = at once). cfg: { to (centre the taken blocks fly to), onOnes (async, when the ones are
     done - the step VO), only ("t": the ones are not the child's to take), idle (ms) }.
     Resolves with the number of wrong moves. */
  function removeChild(C, T, need, cfg){
    cfg = cfg || {};
    return new Promise(res =>{
      let wrongs = 0, guided = { o: false, t: false }, wrongsBy = { o: 0, t: 0 }, busy = false, fin = false, idleT = 0, settleT = 0, onesSaid = false;
      const gone = k => T.list(k).filter(b => b._removed).length;
      const all = ()=> [...T.rods, ...T.cubes];
      const ok = ()=> gone("t") === need.t && gone("o") === need.o;
      const vo = idleVo(C, ()=> (fin || busy) ? null : "vo_idle_rm_" + (cfg.only || (gone("o") < need.o ? "o" : "t")));
      const tappable = b =>{
        if(fin || busy || b._removed) return false;
        if(cfg.only && b._kind !== cfg.only) return false;
        if(b._kind === "o" && gone("o") >= need.o) return false;                       // the ones taken: the others stay put (SME review 5)
        if(cfg.onesFirst && b._kind === "t" && gone("o") < need.o) return false;      // the ones first, always
        if(guided[b._kind]) return !!b._allowed && (b._kind === "o" || gone("o") >= need.o);
        return true;
      };
      /* the guide (2nd mistake) shows ONE column at a time - the ones until they are done, then the tens (user 2026-10-22):
         only that column's blocks to take are marked, the rest of it dimmed; the other column is left as it is */
      const active = ()=> gone("o") < need.o ? "o" : "t";
      const sync = ()=>{ const k = active(); all().forEach(b =>{ const can = tappable(b); b.classList.toggle("pv-tap", can);
          b.classList.toggle("pv-dim", guided[k] && b._kind === k && !b._allowed && !b._removed);
          b.classList.toggle("pv-allowed", guided[k] && b._kind === k && !!b._allowed && !b._removed); });
        if(T.counts) T.counts(); };
      const nextBlock = ()=>{ const k = gone("o") < need.o ? "o" : (gone("t") < need.t ? "t" : null); if(!k) return null;
        const l = left(T, k).filter(tappable); return l[l.length - 1] || null; };
      const pulseNext = ()=>{ const b = nextBlock(); if(!b) return;
        (guided[b._kind] ? left(T, b._kind).filter(x => x._allowed) : left(T, b._kind)).forEach(x => x.classList.add("pulse")); return b; };
      const unpulse = ()=> all().forEach(b => b.classList.remove("pulse"));
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || fin || busy) return;
        const b = nextBlock(); if(b){ (guided[b._kind] ? left(T, b._kind).filter(x => x._allowed) : left(T, b._kind)).forEach(x => K.repulse(x)); if(cfg.hand) placeNudge(b); }
        arm(); }, cfg.idle || IDLE_MS); };
      const done = ()=>{ fin = true; clearTimeout(idleT); clearTimeout(settleT); stopNudge(); unpulse(); sync(); vo.stop();
        all().forEach(b =>{ b.onclick = null; b.classList.remove("pv-dim", "pv-allowed"); });
        GameBus.emit("pv_remove_done", { slide_id: C.slide.id, wrongs }); res(wrongs); };
      const settle = ()=>{ clearTimeout(settleT); if(!ok()) return;
        if(!cfg.settle) return done();
        settleT = setTimeout(()=>{ if(C.alive() && !fin && !busy && ok()) done(); }, cfg.settle); };
      /* user 2026-10-26 (G1): on a page with one take-away line (cfg.sayStep) the step is said at once - "अब इकाई हटाइए।" right
         after that line, "अब दहाई हटाइए।" (the tens pulsing) the moment the ones are done; the 7s reminder repeats it */
      const sayId = id => new Promise(r => play("assets/voiceover/" + id + "." + AUDIO_EXT, r));
      const onesStep = async ()=>{ if(onesSaid || gone("o") < need.o || !(cfg.onOnes || (cfg.sayStep && need.t > 0))) return; onesSaid = true;
        busy = true; sync(); try{ await C.wait(350); if(cfg.onOnes) await cfg.onOnes(); else { pulseNextT(); await sayId("vo_idle_rm_t"); } } finally { busy = false; }
        if(!C.alive()) return; sync(); unpulse(); pulseNext(); arm(); vo.arm(); };
      const pulseNextT = ()=> left(T, "t").filter(x => !guided.t || x._allowed).forEach(x => x.classList.add("pulse"));
      async function wrong(b, role){
        busy = true; clearTimeout(idleT); clearTimeout(settleT); stopNudge(); unpulse(); wrongs++; wrongsBy[b._kind]++;
        takeAway(C, b, cfg.to); sync();
        GameBus.emit("answer_wrong", { slide_id: C.slide.id, phase: C.slide.phase, attempts: wrongs, step: "remove", why: role });
        try{ sfxWrongSoft(); }catch(e){} setSwMood("tryagain");
        await C.wait(650);
        /* only the column of the wrong tap goes back (user 2026-10-22: a mistake in the tens never undoes the ones) */
        const back = all().filter(x => x._removed && x._kind === b._kind && !(cfg.only && x._kind !== cfg.only));
        back.forEach((x, i)=> setTimeout(()=>{ if(C.alive()) putBack(C, x, cfg.to); }, i * 70));
        await C.wait(back.length * 70 + 600);
        if(T.counts) T.counts();
        setSwMood("hint");
        /* the guide is the column's own (user 2026-10-23): two mistakes in the ones guide the ones only - the tens are
           then taken as usual, unless they too get two mistakes */
        const k = b._kind;
        if(wrongsBy[k] >= 2){
          if(!guided[k]){ guided[k] = true;
            const l = left(T, k); l.slice(l.length - need[k]).forEach(x =>{ x._allowed = true; }); }
          sync();
          await C.say("rm_guide");
        } else await C.say(role);
        if(b._kind === "o") onesSaid = false;                               // (the ones still done: their step line is not said again)
        busy = false; setSwMood("point"); sync(); pulseNext(); arm();
        if(need.o === 0) onesStep();
      }
      all().forEach(b =>{
        b.onclick = ()=>{
          if(cfg.onesFirst && b._kind === "t" && gone("o") < need.o) return;   // the ones first: a ten is not tappable yet - nothing happens (user 2026-10-23)
          if(!C.alive() || fin || busy || b._removed || !b.classList.contains("pv-tap")) return;
          stopNudge(); unpulse(); clearTimeout(settleT); vo.arm();
          const k = b._kind;
          if(k === "o" && gone("o") >= need.o) return void wrong(b, "rm_ones_more").catch(()=>{});
          if(k === "t" && gone("o") < need.o) return void wrong(b, "rm_ones_less").catch(()=>{});
          if(k === "t" && gone("t") >= need.t) return void wrong(b, "rm_tens_more").catch(()=>{});
          takeAway(C, b, cfg.to); sync();
          GameBus.emit("pv_block_removed", { slide_id: C.slide.id, kind: k });
          /* S02 (deck pages 4-7: "1, 2, 3, ... 7"): each one taken is counted aloud; the next tap waits for the count */
          if(cfg.count && k === "o"){ busy = true; sync(); clearTimeout(idleT);
            C.sayNum(gone("o")).catch(()=>{}).then(()=>{ busy = false; if(!C.alive() || fin) return; sync();
              if(ok()) settle(); else { onesStep(); arm(); } }); return; }
          if(ok()) settle(); else { onesStep(); arm(); }
        };
      });
      sync(); pulseNext(); arm(); vo.arm();
      if(cfg.sayStep && need.o > 0){ busy = true; sync();
        sayId("vo_idle_rm_o").then(()=>{ busy = false; if(!C.alive() || fin) return; sync(); pulseNext(); arm(); vo.arm(); }); }
      if(need.o === 0) onesStep();
      if(ok()) settle();
    });
  }
  /* the blocks LEFT in T are copied, one by one, into the answer table S (deck: "the remaining blocks move here") */
  async function copyLeft(C, T, S, kind, step){
    for(const b of left(T, kind)){
      const p = S.slot(kind, S.list(kind).length, S.list(kind).length + 1);
      const c = K.block(C.sc, kind, b._x, b._y, kind === "t" ? T.rH : T.G); S.list(kind).push(c);
      c.style.zIndex = 30; S.relayout(620, c); PVSFX.move(); glide(c, p, 620, true).then(()=>{ c.style.zIndex = ""; K.knock(); S.relayout(220); });
      await C.wait(step || 170);
    }
    await C.wait(650);
  }
  /* light the equation's parts one after another as the VO names them ("इसलिए 34 घटा 21 बराबर 13" - deck:
     "[Number Sync with VO]"). The starts are spread by the words' spoken weight. */
  function eqSync(C, E, role, weights){
    const parts = [E.a, E.op, E.b, E.eq, E.q], w = weights || [3, 3, 2, 3, 3, 2];   // इसलिए | a | घटा | b | बराबर | c
    const tot = w.reduce((s, x)=> s + x, 0); let acc = w[0];
    const cues = parts.map((el, i)=>{ const f = .08 + .9 * acc / tot; acc += w[i + 1]; return [f, ()=>{ el.classList.remove("pv-say"); void el.offsetWidth; el.classList.add("pv-say"); }]; });
    return C.cue(role, cues);
  }

  /* the equation lit part by part at the card's own times (lessons.py eq_cues: "… a घटा b बराबर n", measured from the clip) */
  function eqSyncAt(C, E, role, fr){
    const parts = [E.a, E.op, E.b, E.eq, E.q];
    return C.cue(role, parts.map((el, i)=> [fr[i], ()=>{ el.classList.remove("pv-say"); void el.offsetWidth; el.classList.add("pv-say"); }]));
  }

  /* ---- [pv regroup] OPEN A TEN (MTG2A01_L04_S02): the ones are too few, so one rod of the दहाई column is brought into the
     इकाई column (it stands left of the cubes there, the two centred together - the table's laneRod place) and opens into ten
     cubes: they fill the ten-frame's two rows (the dashed ring round them, as the deck's mockups) and the ones that were
     there move below. The rod is gone - it IS those ten cubes now. ---- */
  function bringTen(C, T, rod){
    rod = rod || left(T, "t").slice(-1)[0]; if(!rod) return Promise.resolve(null);
    T.rods.splice(T.rods.indexOf(rod), 1); T.laneRod = rod;
    rod.classList.remove("pv-tap", "pulse", "pv-dim"); rod.onclick = null; rod.style.zIndex = 30;
    const q = T.onesBox(T.cubes.length, true);
    PVSFX.move(); T.relayout(560, rod);
    return glide(rod, { x: q.rx, y: q.ry }, 760, true).then(()=>{ rod.style.zIndex = ""; K.knock(); return rod; });
  }
  async function splitTen(C, T){
    const rod = T.laneRod; if(!rod) return;
    const unit = T.G * K.CUBE.pitch, ten = [];
    for(let j = 0; j < 10; j++){ const c = K.block(T.sc, "o", rod._x, rod._y + (9 - j) * unit, T.G); c.style.zIndex = 30; ten.push(c);
      if(!K.reduce()) c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: j * 20, fill: "backwards" }); }
    sparkles(C, rod._x + rod._w / 2, rod._y + rod._h / 2, 10); PVSFX.magic();
    rod.classList.add("pv-gone"); setTimeout(()=> rod.remove(), 450);
    T.laneRod = null; const old = T.cubes.slice(); T.cubes = ten.concat(old);
    await wait(520);
    old.forEach((c, i)=> glide(c, T.onesXY(i + 10), 560, false));
    await Promise.all(ten.map((c, i)=> wait(i * 45).then(()=> glide(c, T.onesXY(i), 560, true)).then(()=>{ c.style.zIndex = ""; })));
    K.knock(); K.ring(T, true); T.relayout(220);
    GameBus.emit("pv_ten_opened", { slide_id: C.slide.id });
    await wait(300);
  }
  /* the game opens a ten by itself (the help's blocks, a demo without cues) */
  async function openTen(C, T){ await bringTen(C, T); C.guard(); await wait(200); await splitTen(C, T); C.guard(); }
  /* the CHILD opens a ten (user 2026-10-26): every rod pulses and is tappable; the one tapped comes into the इकाई column and
     opens. The ones cannot be taken meanwhile (they are not tappable yet). Idle 7s: the rods pulse again and the reminder
     "अब 1 दहाई को इकाई में लाइए।" (again every 7s while idle). cfg.hand: the hand on a rod too. */
  function openChild(C, T, cfg){
    cfg = cfg || {};
    return new Promise(res =>{
      const rods = left(T, "t"); let idleT = 0, fin = false;
      const vo = idleVo(C, ()=> fin ? null : "vo_idle_open");
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || fin) return;
        rods.forEach(r => K.repulse(r)); if(cfg.hand) placeNudge(rods[rods.length - 1]); arm(); }, cfg.idle || IDLE_MS); };
      rods.forEach(r =>{ r.classList.add("pv-tap", "pulse");
        r.onclick = async ()=>{ if(fin || !C.alive()) return; fin = true; clearTimeout(idleT); vo.stop(); stopNudge(); PVSFX.tap();
          rods.forEach(x =>{ x.onclick = null; x.classList.remove("pv-tap", "pulse"); });
          try{ await bringTen(C, T, r); C.guard(); await wait(200); await splitTen(C, T); C.guard(); res(); }catch(e){ if(e !== C.STOP) console.error(e); } };
      });
      arm(); vo.arm();
    });
  }

  return { headCount, liveHeads, dropBlock, beat, beatCol, popTable, hlTable, sparkles, sources, demoAdd, childBuild, takeAway, putBack, demoRemove, removeChild, copyLeft,
           eqSync, eqSyncAt, left, bringTen, splitTen, openTen, openChild };
})());

const PV_LAY = {
  /* blk / pad: the blocks' width and the tables' inner margin - as big as each screen's two rows of tables allow
     (the sibling's review 2026-10-14 "make the cubes look bigger"; a rod is 6.7 blocks tall). eqY / eqH: this lesson's
     take-away row on the tutorial card stands where its number cards do */
  tut:  { numY: 142, numH: 84, eqY: 142, eqH: 84, tableY: 250, sumY: 476, cube: 29, blk: 28, pad: 10, cxL: 451, cxR: 881, cx: 666 },   // inside the tutorial card
  main: { eqY: 166, eqH: 62, tableY: 254, sumY: 466, cube: 29, blk: 28, pad: 10, cxL: 410, cxR: 922, cx: 666 }    // under the header band
};
const pvSplit = n =>({ t: Math.floor(n / 10), o: n % 10 });
/* the keypad pages (P1, P4) in the sibling's layout (MTG2A01_L03_S01 PV_NUMPAD, user 2026-10-22): the one table on the left,
   level with the 3 x 4 pad's middle; the pad on the right under the "?"; the equation spread over them - a over the दहाई
   column, b over the इकाई column, the − between, the "=" midway to the "?" - and the child types into the "?" */
const PV_PADL = { eqY: 162, eqH: 100, tcx: 470, qx: 1100, padY: 296, padH: 356 };
function pvPadPage(sc, L, d, hidden){
  const K = PVK, P = PV_PADL, T = pvTable(sc, L, P.tcx, L.tableY);
  if(hidden) T.el.classList.add("pv-hide");      // (before anything is measured: no fade-out flash - user 2026-10-23)
  T.move(0, Math.round(P.padY + P.padH / 2 - T.H / 2) - T.y, 0);
  const mid = h => T.x + h.offsetLeft + h.offsetWidth / 2, ca = mid(T.th), cb = mid(T.oh);   // (layout sizes: right during a slide-in too)
  const E = K.spreadEq(sc, d.a, d.b, "−", { a: ca, op: (ca + cb) / 2, b: cb, eq: 0, q: P.qx }, P.eqY, P.eqH);
  K.setXY(E.eq, (cb + E.b.offsetWidth / 2 + P.qx - E.q.offsetWidth / 2) / 2, E.eq._y);
  return { T, E, padAt: { cx: P.qx, y: P.padY } };
}
/* every table of the lesson is the same size (SME review 3): its tens column is wide enough for nine rods */
const pvTable = (sc, L, cx, y)=> PVK.table(sc, { cx, y, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: 9, tensFinal: 0, onesMax: 9 });
function pvReplay(C){ state.replayAudio = ()=>{ if(!isPlaying && C.cur && C.alive()) C.say(C.cur).catch(()=>{}); }; }
/* two tables side by side, as far apart as they need to be (an 8-rod table is wider than a 3-rod one) */
function pvPair(TA, TB, cx, gap, minHalf){
  const half = Math.max(Math.max(TA.W, TB.W) / 2 + (gap || 34), minHalf || 0);
  return Promise.all([TA.move(cx - half - (TA.x + TA.W / 2), 0, 650), TB.move(cx + half - (TB.x + TB.W / 2), 0, 0)]);
}
function pvCelebrate(){ sfxCorrect(); try{ confettiCannon(); }catch(e){} setSwMood("happy"); }
/* the story screen of T1 (deck page 2): the two people's portraits over their blocks - Meera's 25, Aman's own 13 in grey -
   and the cards under them, 25 − 13 = ?. gR: the blocks of the answer (a group under the "?", not made yet) */
/* the story screen of T1 (and T2's end) - user 2026-10-23, after the reference picture: ONE ROW - Meera's portrait on the left,
   her 25 blocks beside her (the cubes a little apart), some space, then Aman's portrait with no blocks; the equation
   25 − 13 = ? under the row, in the middle. gB: the places beside Aman where blocks given to him stand (made, hidden). */
function pvStoryScene(sc, d, dy){
  dy = dy || 0;                                                 // (T2's ending stands dy higher - SME review 5)
  const K = PVK, AV = 124, MIDY = 318 + dy, BH = 190, BOT = MIDY + BH / 2, GAP = 6, EY = 452 + dy, EH = 72;   // (user 2026-10-23: up - the equation was on the next button)
  const XA = 400, XB = 830, BX = 150;                       // the two portraits' centres; their blocks BX to the right
  const [P0, P1] = d.people, diff = d.a - d.b;
  const S = { BOT, BH, diff, amanAt: { x: XB, y: MIDY } };
  S.pA = K.person(sc, P0.who, P0.name, XA, MIDY - AV / 2, AV); S.pB = K.person(sc, P1.who, P1.name, XB, MIDY - AV / 2, AV);
  S.gA = K.group(sc, d.a, XA + BX, BOT, BH, GAP).make();
  S.gB = K.group(sc, d.b, XB + BX, BOT, BH, GAP);
  S.gAm = S.gB.make(); S.gAm.all().forEach(x => x.style.visibility = "hidden");      // (Aman has no blocks of his own)
  S.cs = S.gA.cs;
  const E = K.equation(sc, d.a, d.b, 666, EY, EH, "−");
  S.E = E; S.cA = E.a; S.minus = E.op; S.cB = E.b; S.eqs = E.eq; S.cQ = E.q;
  S.parts = ()=> [S.pA, S.pB, ...S.gA.all(), S.cA, S.minus, S.cB, S.eqs, S.cQ];
  /* user 2026-10-23: when the VO says "मीरा" / "अमन" that child's portrait lights (a ring of light, a beat) */
  S.hl = who =>{ const e = who === P1.who ? S.pB : S.pA; if(!e) return; e.classList.remove("pv-person-hl"); void e.offsetWidth; e.classList.add("pv-person-hl"); };
  /* the card's name cues for a role, added to that role's own cues */
  S.names = (cues, role, list)=> (list || []).concat(((cues && cues.names) || {})[role] ? cues.names[role].map(([f, who])=> [f, ()=> S.hl(who)]) : []);
  return S;
}
/* S02's first screen (deck page 2, and page 3's end): only the number sentence "a − b = ?", big, in the tutorial card's middle */
function pvEqScene(sc, d){ return PVK.equation(sc, d.a, d.b, 666, 300, 112, "−"); }
const PVModules = {
  STORY_SUB: {
    /* deck page 2 / "Appear the first screen" - "कितने बचे?", in the sibling's STORY page: the two people's round
       portraits over their blocks and the number cards under them (its COL / sizes). Meera (the sibling's girl, Tara's art)
       has 25 blocks; on "उनमें से तेरह ब्लॉक्स मीरा ने अमन को दिए हैं।" Aman's 13 (1 rod + 3 cubes) come in under him, grey,
       and Meera keeps all her 25 in view (SME review 3); the cards follow the VO ("Sync the numbers and signs with the VO"): 25, − 13, = ?.
       mode "answer": the page as it was left; "…तो बचे 12।" lights Meera's blocks; on "अब इस डिब्बे में 12 आएगा।" a copy of
       them moves into the third column and the "?" becomes 12. data: { mode, a, b, people:[{who}, {who}], fill_at }.
       audio: a, b, ask, learn | a, b, c. */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc);
      state.ownsAudio = true; setNavActive(false); pvReplay(C);
      const S = pvStoryScene(sc, d), { pA, pB, gA, cA, minus, cB, eqs, cQ } = S, CU = d.cues || {};
      const say = e =>{ e.classList.remove("pv-say"); void e.offsetWidth; e.classList.add("pv-say"); };
      S.parts().forEach(e => e.classList.add("pv-hide"));
      K.run(C, async ()=>{
        await C.wait(250);
        await C.cue("a", S.names(CU, "a", [[0.05, ()=>{ K.show(pA); gA.all().forEach((x, i)=> setTimeout(()=>{ if(C.alive()){ K.show(x); if(i % 3 === 0) PVSFX.appear(); } }, 120 + i * 55)); }],
                          [0.6, ()=>{ K.show(cA); sfxPop(); }]]));
        await C.cue("b", S.names(CU, "b", [[0.05, ()=>{ K.show(pB); sfxPop(); }], [0.72, ()=>{ K.show(minus); K.show(cB); sfxPop(); }]]));
        C.guard();
        await C.cue("ask", S.names(CU, "ask", [[0.15, ()=> K.show(eqs)], [0.6, ()=>{ K.show(cQ); cQ.classList.add("pulse"); }]]));
        await C.cue("learn", [[0.3, ()=> say(cA)], [0.5, ()=> say(cB)], [0.8, ()=>{ cQ.classList.remove("pulse"); void cQ.offsetWidth; cQ.classList.add("pulse"); }]]);
        setNavActive(true);
      });
    }
  },
  PV_SUB_DEMO: {
    /* deck page 3 (+ page 3 folded in) - one table throughout (SME review 3): Swiftee's hand builds 25 with the + buttons
       (each pulses as its column is named); the table pops; then 25 − 13 in the same table: Swiftee takes 3 ones away
       (each pops out where it stands, a grey copy stays), the CHILD takes the ten (idle 3s: the hand); the columns beat as
       the VO names what is left; "= 12" beside the table; on "12 आएगा" it goes into the "?", the table goes and the
       equation grows into the card's middle. No glow anywhere - beats. data: { a, b, idle_ms, fill_at, cues }. */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc), L = PV_LAY.tut, CU = d.cues || {};
      state.ownsAudio = true; setNavActive(false); setSwMood("teach"); pvReplay(C);
      const A = pvSplit(d.a), B = pvSplit(d.b), R = pvSplit(d.a - d.b);
      const prompt = host.closest(".tut-card").querySelector(".tut-prompt");
      const card = K.numCard(sc, d.a, L.cx, L.numY, L.numH);
      const TA = pvTable(sc, L, L.cx, L.tableY); TA.el.classList.add("pv-hide");
      const E = K.equation(sc, d.a, d.b, L.cx, L.eqY, L.eqH, "−"); E.el.classList.add("pv-hide");
      const say = e =>{ e.classList.remove("pv-say"); void e.offsetWidth; e.classList.add("pv-say"); };
      K.run(C, async ()=>{
        await C.wait(250);
        await C.cue("head", [[0.2, ()=> K.pop(card)]]);
        const src = K.sources(sc, TA, TA.y + TA.H + 14);
        await C.cue("intro", [[0.45, ()=>{ K.showTable(TA); src.show(); }]]);
        [src.t, src.o].forEach(g => g.classList.add("demo", "off"));
        const cd = CU.digits || { t: .3, o: .6 };
        await C.cue("digits", [[cd.t, ()=>{ K.lightDigit(card, "t"); K.beat([src.t], 0); }],
                               [cd.o, ()=>{ K.lightDigit(card, "t", false); K.lightDigit(card, "o"); K.beat([src.o], 0); }]]);
        await C.wait(200); K.lightDigit(card, "o", false);
        const H = K.hand(sc);
        await Promise.all([C.say("tens"), C.wait(700).then(()=> K.demoAdd(C, H, src.t, TA, A.t, "t"))]);
        await Promise.all([C.say("ones"), C.wait(700).then(()=> K.demoAdd(C, H, src.o, TA, A.o, "o"))]);
        H.off();
        await C.cue("built", [[0.15, ()=> K.popTable(TA)]]);
        GameBus.emit("pv_build_done", { slide_id: slide.id });
        /* the take-away, in the same table */
        src.fade(); card.classList.add("pv-gone"); prompt.classList.add("pv-gone");
        await C.wait(350);
        /* each part of 25 − 13 = ? comes in as it is said: 25 on "25", − on "में से", 13 on "13", = ? on "घटाते"; then the 13's
           tens / ones digits light on "1 दहाई" / "3 इकाई" */
        const eqP = [E.a, E.op, E.b, E.eq, E.q]; eqP.forEach(e => e.classList.add("pv-hide")); K.show(E.el);
        const inn = (...els)=>{ els.forEach(e => K.show(e)); sfxPop(); };
        const cs = CU.sub || { a: .12, op: .2, b: .3, q: .4, t: .62, o: .8 };
        await C.cue("sub", [[cs.a, ()=> inn(E.a)], [cs.op, ()=> inn(E.op)], [cs.b, ()=> inn(E.b)], [cs.q, ()=> inn(E.eq, E.q)],
                            [cs.t, ()=> K.lightDigit(E.b, "t")], [cs.o, ()=>{ K.lightDigit(E.b, "t", false); K.lightDigit(E.b, "o"); }]]);
        eqP.forEach(e => K.show(e));
        K.lightDigit(E.b, "o", false);
        TA.rods.forEach(x => x.classList.add("pv-dim"));                       // "Tens are disabled"
        await C.say("rm_ones");                                               // SME review 5: then a count on each of her taps
        await K.demoRemove(C, H, TA, "o", B.o, null, j => C.sayNum(j + 1));
        H.off(); TA.rods.forEach(x => x.classList.remove("pv-dim"));
        await C.cue("ones_left", [[(CU.ones_left || { o: .8 }).o, ()=> K.beatCol(TA, "o")]]);
        await C.say("rm_tens");
        await K.removeChild(C, TA, { t: B.t, o: B.o }, { only: "t", idle: d.idle_ms || 3000, settle: 0, hand: true }); C.guard();
        await C.cue("tens_left", [[(CU.tens_left || { t: .8 }).t, ()=> K.beatCol(TA, "t")]]);
        const midY = TA.y + TA.head + TA.pad + TA.inH / 2;
        const eqS = K.add(sc, "div", "pv-op pv-sym pv-hide", "font-size:46px"); eqS.textContent = "="; K.setXY(eqS, TA.x + TA.W + 32, midY - 26);
        const tot = K.numCard(sc, d.a - d.b, TA.x + TA.W + 100, midY - 28, 56); tot.classList.add("pv-hide", "pv-total");
        TA.extra.push(eqS, tot);
        const ct = CU.total || { t: .5, o: .7, n: .85 };
        await C.cue("total", [[ct.t, ()=> K.beatCol(TA, "t")], [ct.o, ()=> K.beatCol(TA, "o")], [ct.n, ()=>{ K.show(eqS); K.show(tot); sfxPop(); }]]);
        H.el.remove();
        await C.wait(500);
        /* SME review 4: "at the end of T2 bring back the last visual from T1": the table and the equation go, T1's screen (the
           people, Meera's 25, Aman's 13 in grey, 25 − 13 = ?) comes back; "…तो बचे 12।" - the 12 come in under the "?";
           "अब इस डिब्बे में 12 आएगा।" - the "?" becomes 12; "यानी मीरा के पास कुल 12 ब्लॉक्स बचे।" - the 12 beat */
        const SD = (CARD.slides.find(x => x.type === "STORY_SUB") || {}).data;
        if(SD && C.has("story_a")){
          TA.fade(); E.el.classList.add("pv-gone"); PVSFX.move();
          await C.wait(550); C.guard();
          /* user 2026-10-23: the T1 row - Aman has no blocks; on "तेरह घटाए" 13 of Meera's 25 (1 rod, 3 cubes) go over to him
             (copies) and hers turn grey where they stand; on "बचे 12" her 12 left beat; "12 आएगा" fills the "?" */
          const S = pvStoryScene(sc, SD, -34), aman = S.gAm.all();
          const all = S.parts(); all.forEach(e => e.classList.add("pv-hide"));
          all.forEach((e, i)=> setTimeout(()=>{ if(C.alive()){ K.show(e); if(i % 4 === 0) PVSFX.appear(); } }, i * 30));
          await C.wait(all.length * 30 + 450); C.guard();
          const RR = pvSplit(d.a - d.b), BB = pvSplit(d.b);
          const rods = S.gA.all().filter(x => x._kind === "t"), cubes = S.gA.all().filter(x => x._kind === "o");
          const goR = rods.slice(rods.length - BB.t), goC = cubes.slice(cubes.length - BB.o);
          const kept = [...rods.slice(0, rods.length - BB.t), ...cubes.slice(0, cubes.length - BB.o)];
          const toA = { t: aman.filter(x => x._kind === "t"), o: aman.filter(x => x._kind === "o") };
          /* (user 2026-10-23: they do not leave her 25 - a copy of each goes to Aman, and hers turns grey where it stands, so
             it reads as "taken out of the 25") */
          const give = ()=>{ PVSFX.move();
            [...goR.map((x, j)=> [x, toA.t[j]]), ...goC.map((x, j)=> [x, toA.o[j]])].forEach(([x, to], n)=>
              K.wait(n * 90).then(()=>{ if(!to || !C.alive()) return; const c = K.block(sc, x._kind, x._x, x._y, x._kind === "t" ? S.BH : S.cs);
                x.classList.add("pv-taken");
                /* SME review 5: each goes into Aman's picture and is gone (he holds no blocks on the screen) */
                const at = S.amanAt;
                K.glide(c, { x: at.x - c._w / 2, y: at.y - c._h / 2 }, 650, true).then(()=>{
                  c.animate([{ scale: "1", opacity: 1 }, { scale: ".2", opacity: 0 }], { duration: 260, easing: "ease-in" }).onfinish = ()=> c.remove();
                  if(n === 0 || n === goR.length + goC.length - 1) K.beat([S.pB], 0); }); })); };
          const cy = CU.story || { a: .25, b: .45, n: .78, c: .55 };
          await C.cue("story_a", [[cy.a, ()=>{ say(S.cA); K.beat(S.gA.all(), 25); }], [cy.b, ()=>{ say(S.cB); give(); }],
                                  [cy.n, ()=> K.beat(kept, 60)]]);
          await C.cue("story_b", [[0.12, ()=> S.cQ.classList.add("pulse")],
                                  [d.fill_at || 0.5, ()=>{ S.cQ.classList.remove("pulse"); S.cQ.innerHTML = K.numHTML(d.a - d.b); S.cQ.classList.add("filled"); K.pop(S.cQ); sfxCorrect(); }]]);
          C.guard(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
          if(C.has("story_c")) await C.cue("story_c", S.names(CU, "story_c", [[cy.c, ()=>{ K.beat(kept, 60); say(S.cQ); }]]));
        }
        await C.wait(600);
        setNavActive(true);
      });
    }
  },
  EQ_STORY: {
    /* S02 deck page 2 - "कितने बचे?": no people, only the number sentence 25 − 6 = ? in the card's middle, each part coming in
       as it is said ("Sync 25, −, 6, =, ? with the VO"): 25 on "पच्चीस", − on "घटा", 6 on "छः", = on "बराबर", ? on "कितना";
       then "…25 में से 6 घटाने पर कितने बचते हैं" lights 25, 6 and the "?". data: { a, b, cues }. audio: a, learn. */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc), CU = d.cues || {};
      state.ownsAudio = true; setNavActive(false); pvReplay(C);
      const E = pvEqScene(sc, d), P = [E.a, E.op, E.b, E.eq, E.q];
      const say = e =>{ e.classList.remove("pv-say"); void e.offsetWidth; e.classList.add("pv-say"); };
      const inn = e =>{ K.show(e); sfxPop(); };
      P.forEach(e => e.classList.add("pv-hide"));
      K.run(C, async ()=>{
        await C.wait(300);
        const c = CU.a || { a: .45, op: .55, b: .65, eq: .75, q: .88 };
        await C.cue("a", [[c.a, ()=> inn(E.a)], [c.op, ()=> inn(E.op)], [c.b, ()=> inn(E.b)], [c.eq, ()=> inn(E.eq)], [c.q, ()=>{ inn(E.q); E.q.classList.add("pulse"); }]]);
        P.forEach(e => K.show(e));
        const l = CU.learn || { a: .4, b: .55, q: .8 };
        await C.cue("learn", [[l.a, ()=> say(E.a)], [l.b, ()=> say(E.b)], [l.q, ()=>{ E.q.classList.remove("pulse"); void E.q.offsetWidth; E.q.classList.add("pulse"); }]]);
        setNavActive(true);
      });
    }
  },
  PV_REGROUP_DEMO: {
    /* S02 deck pages 3 and 4 - subtraction WITH regrouping, in one table (as S01's T2). data.demo true (page 3, 25 − 6): Swiftee's
       hand builds 25; "5 इकाई में से 6 इकाई नहीं घटाई जा सकती…"; on "हम 1 दहाई को यहाँ लाएँगे" a rod moves into the इकाई
       column and on "तोड़ेंगे" it opens into ten cubes (15 इकाई); Swiftee takes 6 away, counting; "= 19" beside the table; then
       the first screen comes back (deck: "Appear the first screen") and 19 lands in its "?" on "19 आएगा".
       data.demo false (page 4, 30 − 17): 30 − 17 = ? is asked first; the CHILD builds 30 (the + of the rods; the ones' + is off -
       0 ones); the ten opens with the VO as above; the child takes 7 ones (each counted) and 1 ten (idle 3s: the hand);
       "…यानी 13" fills the equation's "?". Beats, no glow. data: { a, b, demo, idle_ms, cues }. */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc), CU = d.cues || {};
      /* page 4 keeps its heading "कितने बचे?" (every mockup of it shows it): the number, the equation and the table stand 48px
         lower, clear of it */
      const L = slide.prompt_hi ? Object.assign({}, PV_LAY.tut, { numY: PV_LAY.tut.numY + 48, eqY: PV_LAY.tut.eqY + 48, tableY: PV_LAY.tut.tableY + 44 }) : PV_LAY.tut;
      state.ownsAudio = true; setNavActive(false); setSwMood("teach"); pvReplay(C);
      const A = pvSplit(d.a), B = pvSplit(d.b), R = pvSplit(d.a - d.b), diff = d.a - d.b;
      const prompt = host.closest(".tut-card").querySelector(".tut-prompt");
      const card = K.numCard(sc, d.a, L.cx, L.numY, L.numH);
      const TA = pvTable(sc, L, L.cx, L.tableY); TA.el.classList.add("pv-hide");
      const E = K.equation(sc, d.a, d.b, L.cx, L.eqY, L.eqH, "−"); E.el.classList.add("pv-hide");
      const eqP = [E.a, E.op, E.b, E.eq, E.q];
      const say = e =>{ e.classList.remove("pv-say"); void e.offsetWidth; e.classList.add("pv-say"); };
      const inn = (...els)=>{ els.forEach(e => K.show(e)); sfxPop(); };
      const bT = ()=> K.beatCol(TA, "t"), bO = ()=> K.beatCol(TA, "o");
      /* each part of "a − b = ?" in as it is said (S01's T2): a, − on "में से", b, "= ?" on "घटाते" */
      const eqIn = async role =>{ eqP.forEach(e => e.classList.add("pv-hide")); K.show(E.el);
        const cs = CU[role] || { a: .12, op: .2, b: .3, q: .4 };
        await C.cue(role, [[cs.a, ()=> inn(E.a)], [cs.op, ()=> inn(E.op)], [cs.b, ()=> inn(E.b)], [cs.q, ()=> inn(E.eq, E.q)],
                           [cs.o, ()=> K.lightDigit(E.b, "o")]]);
        eqP.forEach(e => K.show(e)); K.lightDigit(E.b, "o", false); };
      K.run(C, async ()=>{
        await C.wait(250);
        const H = K.hand(sc);
        if(C.has("sub0")){ card.classList.add("pv-hide"); await eqIn("sub0"); await C.wait(300); }   // page 4: the question first
        else K.pop(card);                                                       // page 3: "On screen, only 25 is shown"
        const src = K.sources(sc, TA, TA.y + TA.H + 14), ci = CU.intro || { n: .5 };
        await C.cue("intro", [[0.05, ()=>{ if(!E.el.classList.contains("pv-hide")){ E.el.classList.add("pv-hide"); card.classList.remove("pv-hide"); K.pop(card); } }],
                              [Math.max(.45, ci.n), ()=>{ K.showTable(TA); src.show(); }]]);
        if(d.demo) [src.t, src.o].forEach(g => g.classList.add("demo", "off"));
        const cd = CU.digits || { t: .3, o: .6 };
        await C.cue("digits", [[cd.t, ()=>{ K.lightDigit(card, "t"); K.beat([src.t], 0); }],
                               [cd.o, ()=>{ K.lightDigit(card, "t", false); K.lightDigit(card, "o"); K.beat([src.o], 0); }]]);
        await C.wait(200); K.lightDigit(card, "o", false);
        if(d.demo){
          await Promise.all([C.say("tens"), C.wait(700).then(()=> K.demoAdd(C, H, src.t, TA, A.t, "t"))]);
          await Promise.all([C.say("ones"), C.wait(700).then(()=> K.demoAdd(C, H, src.o, TA, A.o, "o"))]);
          H.off();
        } else {
          await C.say("tens");                                                  // "आप दहाई के ब्लॉक्स बनाइए।" - the child taps the rods' + three times
          await K.childBuild(C, TA, d.a, src); C.guard();
        }
        await C.cue("built", [[0.15, ()=> K.popTable(TA)]]);
        GameBus.emit("pv_build_done", { slide_id: slide.id });
        src.fade(); card.classList.add("pv-gone"); if(d.demo) prompt.classList.add("pv-gone");   // (page 4 keeps "कितने बचे?" - its mockups)
        await C.wait(350);
        await eqIn("sub");
        if(C.has("cant")) await C.cue("cant", [[(CU.cant || { o: .1 }).o, bO]]);
        /* the ten: brought in on "हम 1 दहाई को यहाँ लाएँगे", opened on "तोड़ेंगे" */
        const co = CU.open || { bring: .3, split: .55 };
        let opening = null;
        await C.cue("open", [[co.o, bO], [co.bring, ()=>{ opening = K.bringTen(C, TA); }],
                             [co.split, ()=>{ opening = (opening || K.bringTen(C, TA)).then(()=> C.alive() && K.splitTen(C, TA)); }]]);
        if(opening) await opening; C.guard();
        if(TA.laneRod) await K.splitTen(C, TA);
        if(C.has("ones_now")) await C.cue("ones_now", [[(CU.ones_now || { o: .5 }).o, bO]]);
        if(d.demo){
          await C.say("rm_ones");                                               // "अब इसमें से 6 इकाई को हटाते हैं," - then her count
          await K.demoRemove(C, H, TA, "o", B.o, null, j => C.sayNum(j + 1));
          H.off();
        } else {
          await C.cue("rm_ones", [[0.4, bO]]);
          await K.removeChild(C, TA, { t: 0, o: B.o }, { only: "o", count: true, settle: 0, idle: d.idle_ms || 3000, hand: true }); C.guard();
        }
        K.ring(TA, false);
        await C.cue("ones_left", [[(CU.ones_left || { o: .8 }).o, bO]]);
        if(C.has("tens_note")) await C.cue("tens_note", [[(CU.tens_note || { t: .7 }).t, bT]]);
        if(C.has("both_left")){ const c = CU.both_left || { t: .4, o: .7 }; await C.cue("both_left", [[c.t, bT], [c.o, bO]]); }
        if(C.has("rm_tens")){
          await C.cue("rm_tens", [[(CU.rm_tens || { t: .7 }).t, bT]]);
          await K.removeChild(C, TA, { t: B.t, o: B.o }, { only: "t", idle: d.idle_ms || 3000, settle: 0, hand: true }); C.guard();
          await C.cue("tens_left", [[(CU.tens_left || { t: .8 }).t, bT]]);
        }
        H.el.remove();
        const ct = CU.total || { t: .5, o: .7, n: .85 };
        if(d.demo){
          /* "= 19" beside the table (S01's T2) */
          const midY = TA.y + TA.head + TA.pad + TA.inH / 2;
          const eqS = K.add(sc, "div", "pv-op pv-sym pv-hide", "font-size:46px"); eqS.textContent = "="; K.setXY(eqS, TA.x + TA.W + 32, midY - 26);
          const tot = K.numCard(sc, diff, TA.x + TA.W + 100, midY - 28, 56); tot.classList.add("pv-hide", "pv-total");
          TA.extra.push(eqS, tot);
          await C.cue("total", [[ct.t, bT], [ct.o, bO], [ct.n, ()=>{ K.show(eqS); K.show(tot); sfxPop(); }]]);
        } else {
          /* page 4's last mockup: "30 − 17 = 13" over the table */
          await C.cue("total", [[ct.t, bT], [ct.o, bO], [ct.n, ()=>{ E.fill(diff); sfxCorrect(); }]]);
          C.guard(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
        }
        await C.wait(500);
        /* page 3's end - "Appear the first screen": the table and the equation go, T1's screen comes back; "…तो बचे 19।" -
           25 and 6 light; "अब इस डिब्बे में 19 आएगा।" - 19 lands in the "?" */
        if(C.has("story_a")){
          TA.fade(); E.el.classList.add("pv-gone"); PVSFX.move(); prompt.classList.remove("pv-gone"); prompt.textContent = "कितने बचे?";
          await C.wait(550); C.guard();
          const S = pvEqScene(sc, d), P = [S.a, S.op, S.b, S.eq, S.q];
          P.forEach((e, i)=>{ e.classList.add("pv-hide"); setTimeout(()=>{ if(C.alive()){ K.show(e); if(!i) sfxPop(); } }, i * 70); });
          await C.wait(600); C.guard();
          const cy = CU.story || { a: .25, b: .45, n: .78, fill: .5 };
          await C.cue("story_a", [[cy.a, ()=> say(S.a)], [cy.b, ()=> say(S.b)], [cy.n, ()=> S.q.classList.add("pulse")]]);
          await C.cue("story_b", [[cy.fill, ()=>{ S.q.classList.remove("pulse"); S.fill(diff); sfxCorrect(); }]]);
          C.guard(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
        }
        await C.wait(600);
        setNavActive(true);
      });
    }
  },
  PV_SUB: {
    /* deck pages 7-11 - "संख्याएँ घटाइए।", "a − b = ?": the child BUILDS a with the -/+ buttons (or it is given: data.build
       false, the heads counting), TAKES b away (ones first; the help ladder of removeChild), the blocks left move into
       the answer table (data.right_table), then answers: "fill" (the answer comes by itself into the "?"), "mcq"
       (three cards) or "numpad". The answer's ladder (user 2026-10-16): 1 recount (the answer table's tens, then ones
       light as they are named), 2 h2 ("a में से b घटाने पर ..." - a, then b light), 3 the column digits under the blocks,
       then the reveal (the right card glows / the right keys light one by one, the rest locked; G2: + the hand). The
       options come in a new order each time. data.ones_first: the tens stay locked until the ones are taken (practice).
       After the right answer: correct, then eq (in sync).
       data: { a, b, answer, options, build, steps, right_table }. audio: prompt, build, sub, remove | rm_ones + rm_tens,
       ask, try_again, reveal, correct, eq + rm_ones_more, rm_ones_less, rm_tens_more, rm_guide. */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc), L = PV_LAY.main, PAD = d.answer === "numpad" ? pvPadPage(sc, L, d) : null;
      state.ownsAudio = true; state.locked = false; setNavActive(false); $("navBtn").style.display = "none"; setSwMood("point"); pvReplay(C);
      const A = pvSplit(d.a), B = pvSplit(d.b), diff = d.a - d.b, R = pvSplit(diff);
      const E = PAD ? PAD.E : K.equation(sc, d.a, d.b, L.cx, L.eqY, L.eqH, "−");
      const TA = PAD ? PAD.T : pvTable(sc, L, L.cx, L.tableY), TB = null;     // one table throughout (SME review 3)
      const GAP = 26, ansY = d.answer === "numpad" ? L.tableY + TA.H + GAP - 13 : L.tableY + TA.H + GAP;   // the pad stands 13px above its y
      const AT = ()=> TB || TA;                                            // the table that holds the answer
      const say = e =>{ e.classList.remove("pv-say"); void e.offsetWidth; e.classList.add("pv-say"); };
      const CU = d.cues || {}, EQS = CU.eqs || {};
      const lightT = T => K.beatCol(T, "t"), lightO = T => K.beatCol(T, "o");          // beats, no glow (SME review 3)
      const recount = async ()=>{ const T = AT(), c = CU.recount || { t: .22, o: .46 };
        await C.cue("recount", [[c.t, ()=> lightT(T)], [c.o, ()=> lightO(T)]]);
      };
      /* 6) "79 में से 34 घटाने पर, 4 दहाई और 5 इकाई बचती हैं।": 79, 34 light; then the tens and the ones that are left */
      const sayH2 = async ()=>{ const T = AT(), c = CU.h2 || { a: .06, b: .27, t: .55, o: .75 };
        await C.cue("h2", [[c.a, ()=> say(E.a)], [c.b, ()=> say(E.b)], [c.t, ()=> lightT(T)], [c.o, ()=> lightO(T)]]); };
      /* 4, 7) the digits stand under the table, clear of its edge */
      /* the digits under the table; the answer below moves down to make room for them (shift) */
      const digitsUnder = async shift =>{ if(slide.phase === "practice") return;   // P1-P5: no digits under the table (user 2026-10-26)
        if(shift) shift(36); const g = AT().digits(R.t, R.o);   /* 36: clear of the digits by 10px */ [g.t, g.o].forEach(e => K.setXY(e, e._x, e._y + 28)); await C.wait(800); };
      const down = els => dy => els.forEach(e => K.glide(e, { x: e._x, y: e._y + dy }, 420, false));
      async function finale(fillNow){
        if(fillNow) await C.cue("correct", [[0.88, ()=> E.fill(diff)]]); else await C.say("correct");
        if(C.has("eq")) await K.eqSync(C, E, "eq");
      }
      K.run(C, async ()=>{
        if(!d.build){ await TA.fill(d.a, 70); K.popTable(TA); }
        await C.wait(250);
        await C.cue("prompt", [[0.1, ()=> K.pop(E.a)], [0.45, ()=> K.pop(E.b)]]);
        if(d.build){
          const src = K.sources(sc, TA, TA.y + TA.H + 14), cb = CU.build || { t: .62, o: .82 };
          /* "…जिसमें 3 दहाई और 4 इकाई होते हैं": the rod + pops on "3 दहाई", the cube + on "4 इकाई" (SME review 3) */
          await C.cue("build", [[0.12, ()=> src.show()], [cb.t, ()=>{ K.lightDigit(E.a, "t"); K.beat([src.t], 0); }],
                                [cb.o, ()=>{ K.lightDigit(E.a, "t", false); K.lightDigit(E.a, "o"); K.beat([src.o], 0); }]]);
          K.lightDigit(E.a, "o", false);
          await K.childBuild(C, TA, d.a, src); C.guard();
          GameBus.emit("pv_build_done", { slide_id: slide.id });
          src.fade(); await C.wait(300); K.popTable(TA);
        }
        const to = K.centre(E.b, sc);
        let cfg = { to, settle: 1100, onesFirst: true, sayStep: !d.steps };   // (every page: only the ones can be tapped until they are done - SME review 4)
        if(C.has("sub")){ const c = CU.sub || { b: .05, t: .6, o: .82 };
          await C.cue("sub", [...(c.this != null ? [[c.this, ()=> K.hlTable(TA)]] : []), [c.b, ()=> K.pop(E.b)],
                              [c.t, ()=> K.lightDigit(E.b, "t")], [c.o, ()=>{ K.lightDigit(E.b, "t", false); K.lightDigit(E.b, "o"); }]]); }
        K.lightDigit(E.b, "o", false);
        const sweepO = ()=> K.beatCol(TA, "o"), sweepT = ()=> K.beatCol(TA, "t");
        /* S02 - the ones are too few: the child opens a ten first (taps a rod: it comes into the इकाई column and opens into
           ten cubes). G1 says why ("2 इकाई में से 7 इकाई नहीं घटाई जा सकती। तो आप 1 दहाई को यहाँ लाइए।") and what it became */
        if(A.o < B.o){
          if(C.has("regroup")){ const c = CU.regroup || {}; await C.cue("regroup", [[c.o, sweepO], [c.t, sweepT]]); }
          await K.openChild(C, TA, {}); C.guard();
          if(C.has("opened")) await C.say("opened");
          if(C.has("ones_now")) await C.cue("ones_now", [[(CU.ones_now || { o: .5 }).o, sweepO]]);
        }
        if(d.count) cfg.count = true;                                          // "1, 2, 3, ..." on each one taken (deck pages 5-7)
        if(d.steps){ await C.cue("rm_ones", CU.rm_ones ? [[CU.rm_ones.o, sweepO]] : []);
          if(B.o === 0 && C.has("zero")) await C.say("zero");                // SME review 5: "शून्य यानी कुछ नहीं।"
          cfg.onOnes = async ()=>{ if(TA._ring) K.ring(TA, false);
            if(C.has("ones_left")) await C.cue("ones_left", [[(CU.ones_left || { o: .8 }).o, sweepO]]);
            await C.cue("rm_tens", CU.rm_tens ? [[CU.rm_tens.t, sweepT]] : []); }; }
        else if(C.has("remove")) await C.cue("remove", CU.remove ? [[CU.remove.o, sweepO], [CU.remove.t, sweepT]] : []);
        const wrongMoves = await K.removeChild(C, TA, { t: B.t, o: B.o }, cfg); C.guard();
        state.removeWrongs = wrongMoves;
        await C.wait(300);                                                     // (the blocks that are left stay where they are)
        if(d.answer === "fill"){
          recordResult(slide, wrongMoves === 0);
          pvCelebrate();
          await finale(true);
          await C.wait(400); completeSlide(wrongMoves === 0); return;
        }
        if(d.answer === "mcq"){
          await K.mcq(C, { options: d.options, answer: diff, y: ansY, reask: "ask",
            onReady: M =>{ M.open(); C.say("ask").then(()=> M.ready(), ()=>{}); },
            onRight: o => K.flyToQ(C, o, E),
            sayCorrect: EQS.correct ? ()=> K.eqSyncAt(C, E, "correct", EQS.correct) : null,
            after: ()=> C.has("eq") ? (EQS.eq ? K.eqSyncAt(C, E, "eq", EQS.eq) : K.eqSync(C, E, "eq")) : null,
            ladder: async (n, M)=>{ if(n === 1) await recount(); else if(n === 2) await sayH2();
              else { await digitsUnder(dy => M.moveTo(ansY + dy)); M.lock(); if(d.reveal_hand) setTimeout(()=>{ if(C.alive()) placeNudge(M.right); }, 300); await C.say("reveal"); } } });
          return;
        }
        await K.numpad(C, { answer: diff, x: L.cx, y: ansY, reask: "ask", target: E.q, padAt: PAD.padAt,
          onReady: P =>{ P.hide(true); C.cue("ask", [[0.55, ()=>{ P.hide(false); P.open(); }]]).then(()=> P.ready(), ()=>{}); },
          onRight: ()=> E.fill(diff),
          ladder: async (n, P)=>{ if(n === 1) await recount(); else if(n === 2) await sayH2();
            else { await digitsUnder(); P.guideKeys(); await C.say("reveal"); } } });
      });
    }
  },
  MENTAL_SUB: {
    /* deck pages 13 and 15 - only "a − b = ?" and the answer: three cards (data.answer "mcq") or the number pad
       ("numpad": the sibling's keypad layout, pvPadPage - the child types into the "?", user 2026-10-22). The ladder (user 2026-10-16/17):
       1 "संख्याओं में से पहले इकाई घटाइए, फिर दहाई घटाइए।" - the ones digits light on "इकाई", the tens digits on "दहाई";
       2 the blocks, told by "a में से b घटाने पर, x दहाई और y इकाई बचती हैं।": on "a" a's blocks light, on "b" b is taken away
       (ones, then tens - grey copies, each flying to b), on "x दहाई" / "y इकाई" the tens / ones left light; the table stays
       (its heads count what is left); 3 the column digits under the table, then the right answer is shown (+ the reveal).
       data: { a, b, answer, options, cues }. audio: prompt, order, h2, reveal, correct. */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc), CU = d.cues || {};
      state.ownsAudio = true; state.locked = false; setNavActive(false); $("navBtn").style.display = "none"; setSwMood("point"); pvReplay(C);
      const diff = d.a - d.b, pad = d.answer === "numpad", A = pvSplit(d.a), B = pvSplit(d.b), R = pvSplit(diff);
      const L = PV_LAY.main, PAD = pad ? pvPadPage(sc, L, d, true) : null;    // the keypad page: the sibling's layout (its table hidden till the 2nd help)
      const GAP = 26, Y0 = 452;                                                // the cards' first place
      /* the table of the 2nd help: a number pad under its box needs a shorter table (90 = nine rods) */
      const TY = L.tableY;
      const E = PAD ? PAD.E : K.equation(sc, d.a, d.b, L.cx, 282, L.eqH, "−"); if(!PAD) E.el.classList.add("big");
      const say = e =>{ e.classList.remove("pv-say"); void e.offsetWidth; e.classList.add("pv-say"); };
      const order = async ()=>{ const c = CU.order || { o: .36, t: .68 };
        await C.cue("order", [[c.o, ()=>{ K.lightDigit(E.a, "o"); K.lightDigit(E.b, "o"); }],
                              [c.t, ()=>{ K.lightDigit(E.a, "o", false); K.lightDigit(E.b, "o", false); K.lightDigit(E.a, "t"); K.lightDigit(E.b, "t"); }]]);
        K.lightDigit(E.a, "t", false); K.lightDigit(E.b, "t", false); };
      let T = null;
      /* the blocks: the answer hidden, the equation up, a's blocks, then the line - b taken away as it is said */
      async function blocks(hide, moveTo){
        if(T) return;
        hide(true);
        if(PAD) T = PAD.T;
        else { E.el.classList.remove("big"); await K.glide(E.el, { x: L.cx, y: L.eqY }, 500, false); C.guard(); T = pvTable(sc, L, L.cx, TY); }
        K.showTable(T); await C.wait(250);
        await T.fill(d.a, 90); C.guard(); K.popTable(T); await C.wait(300);
        let taking = null;
        /* S02: the ones are too few - a ten is opened first (the deck's help tables: "7 दहाई | 14 इकाई"), then b is taken */
        const takeAll = async ()=>{ if(A.o < B.o){ await K.openTen(C, T); await K.wait(250); }
          const take = [];
          for(const [k, n] of [["o", B.o], ["t", B.t]]){ const l = K.left(T, k); for(let j = 0; j < n; j++) take.push(l[l.length - 1 - j]); }
          for(const x of take){ K.takeAway(C, x); await K.wait(320); }
          if(T._ring) K.ring(T, false); };
        const c = CU.h2 || { a: .06, b: .27, t: .55, o: .75 };
        await C.cue("h2", [[c.a, ()=>{ say(E.a); K.popTable(T); }], [c.b, ()=>{ say(E.b); taking = takeAll(); }],
                           [c.t, ()=> K.beatCol(T, "t")], [c.o, ()=> K.beatCol(T, "o")]]);
        if(taking) await taking; C.guard();
        await C.wait(300);
        moveTo(TY + T.H + GAP); hide(false);                        // the box / the cards GAP under the table
      }
      /* the digits under the table, clear of its edge */
      const digitsUnder = async shift =>{ if(slide.phase === "practice") return;   // P1-P5: no digits under the table (user 2026-10-26)
        if(shift) shift(26); const g = T.digits(R.t, R.o); [g.t, g.o].forEach(e => K.setXY(e, e._x, e._y + 28)); await C.wait(800); };
      let optY = Y0;
      K.run(C, async ()=>{
        await C.wait(300);
        if(!pad){
          await K.mcq(C, { options: d.options, answer: diff, y: Y0, reask: "prompt",
            onReady: M =>{ M.open(); C.say("prompt").then(()=> M.ready(), ()=>{}); },
            onRight: o => K.flyToQ(C, o, E),
            sayCorrect: (CU.eqs || {}).correct ? ()=> K.eqSyncAt(C, E, "correct", CU.eqs.correct) : null,
            ladder: async (n, M)=>{
              if(n === 1) await order();
              else if(n === 2) await blocks(on => M.hide(on), y =>{ optY = y; M.moveTo(y); });
              else { await blocks(on => M.hide(on), y =>{ optY = y; M.moveTo(y); }); await digitsUnder(dy => M.moveTo(optY + dy + 10)); M.lock(); await C.say("reveal"); }
            } });
          return;
        }
        await K.numpad(C, { answer: diff, x: L.cx, y: Y0, reask: "prompt", target: E.q, padAt: PAD.padAt,
          onReady: P =>{
            P.hide(true); C.cue("prompt", [[0.6, ()=>{ P.hide(false); P.open(); }]]).then(()=> P.ready(), ()=>{}); },
          onRight: ()=> E.fill(diff),
          ladder: async (n, P)=>{
            const moveTo = ()=>{};                                        // (the "?" and the pad stay where they are)
            if(n === 1) await order();
            else if(n === 2) await blocks(on => P.hide(on), moveTo);
            else { await blocks(on => P.hide(on), moveTo); await digitsUnder(); P.guideKeys(); await C.say("reveal"); }
          } });
      });
    }
  },
  CELEBRATION: {
    /* HI02H11_L02_S02's end screen (user 2026-10-23: "exact same"): no text, the sunburst and the star burst, the
       celebration sound, the arrow there from the start; Swifty is the celebration kit's (below): she jumps and cheers
       first, then says the line, lip-synced. Our line ("शाबाश! अब आप संख्याएँ घटाना सीख गए हैं।") and the arrow's
       hand-off to the host stay. */
    mount(host, slide){
      playSfx(slide.audio && slide.audio.sfx ? slide.audio.sfx : "sfx_celebrate");
      const et = $("endTitle"); if(et) et.textContent = "";
      const st = $("endSubtitle"); if(st) st.textContent = "";
      const es = $("endScreen"); es.classList.add("show", "hint-glow");
      document.body.classList.add("is-end");
      const c = $("confetti"); c.innerHTML = "";
      starBurst();
      const masteryScore = state.masteryAttempts ? (state.masteryHits / state.masteryAttempts) : 0;
      GameBus.emit("mastery_score", { value: masteryScore, hits: state.masteryHits, attempts: state.masteryAttempts });
      GameBus.emit("lesson_completed", { skill_code: CARD.skill_code, total_signals: GameBus.signals.length });
      runValidator();
      setNavActive(false);
      const eb = $("endBtn"); eb.classList.add("show", "hint-glow");
      state.endBtnPending = false;
      if(new URLSearchParams(location.search).has("dev") && !$("dlResults")){
        const dl = document.createElement("button"); dl.id = "dlResults"; dl.textContent = "⬇ results JSON";
        dl.style.cssText = "position:absolute;bottom:20px;left:20px;z-index:5;font-family:var(--font-hi);font-weight:700;font-size:16px;padding:8px 16px;border-radius:12px;border:2px solid #B7DCFB;background:#fff;color:var(--navy);cursor:pointer;";
        dl.onclick = ()=> GameBus.downloadResults();
        es.appendChild(dl);
      }
      eb.onclick = ()=>{
        if(eb.dataset.done === "1") return;
        eb.dataset.done = "1"; eb.disabled = true;
        const firstTryScore = state.masteryAttempts ? (state.masteryHits / state.masteryAttempts) : 0;
        XAPI.once("activity_completed",
          { skill_code: CARD.skill_code, part: CARD.part_label },
          { completed: true, completion: true, progress: 100, score: firstTryScore,
            first_try_correct: state.masteryHits, questions: state.masteryAttempts,
            duration_ms: Date.now() - GameBus.startedAt });
        GameBus.emit("proceed_next", { skill_code: CARD.skill_code, part: CARD.part_label });
        try{ window.parent?.postMessage({type:"swiftpal:proceed", skill_code:CARD.skill_code, part:CARD.part_label}, "*"); }catch(e){}
      };
    }
  }
};
const SlideModules = PVModules;


/* ---------- [landing pv] the first screen's picture (both decks, page 1: "Visual: <the two children> playing with
   blocks"): the two children finish a build together. No equation (user, 2026-10-13).
   User, 2026-10-14 ("like Chhota Bheem's title"): in the middle stands a half-built castle (S01) / house (S02), its
   missing blocks shown as pale outlines; the children zip in from both sides with a swoosh, a block in each hand
   (motion blur, speed lines, a skid and a puff of dust as they stop), put their blocks into the gaps in turns - each
   leans, each block hops from the hand into its place - the flag goes up (castle) / the roof lands and the chimney smokes (house), a
   burst of sparkles, and they cheer (their cheering pose, a jump). Then the play button arrives ("sg-intro-done").
   While the screen waits they keep playing: they breathe, one at a time leans in to admire the build, a sparkle
   twinkles on it; the flag waves, the chimney smokes.
   Poses (make_characters.py, one scale - shown height = 224px x file height / 640): carry (char_<who>_carry, else the
   cheering pose) -> idle (char_<who>_full) -> cheer (char_<who>_cheer, else idle) -> idle. HANDS: where the carry
   pose's two hands are (fractions of its picture), each holding one block.
   card: landing_hero { kind:"pv_story", people:[left, right], build:"castle"|"house" }. */
const PVLanding = {
  /* the stage: .sgp's own px (772 x 96; the children's soles on FEET, the build stands on BASE, further back) */
  FEET: 202, BASE: 130, MID: 386, KID_X: [208, 564], FIG_H: 224, FILE_H: 640,
  HANDS: { kabir: [[.099, .19], [.896, .185]], tara: [[.118, .18], [.905, .13]], aman: [[.099, .19], [.896, .185]], meera: [[.118, .18], [.905, .13]], aaru: [[.125, .127], [.917, .49]], pari: [[.07, .40], [.84, .54]] },
  /* the user's drawings (make_house.py / make_castle.py, 2026-10-15), cut into pieces, each where it is in the drawing:
     boxes in the drawing's px; the build's middle at x WX, its foot at FOOT (on BASE + DY); S stage px per drawing px. order: the
     pieces bottom up, [name, who brings it, the order]. */
  ART: {
    /* a house of cubes only (user 2026-10-15, 18:39 - make_house.py): yellow walls with two blue windows and a doorway
       under a stepped red roof; all of it stands but the roof's two eave cubes - each child brings ONE (Aaru the left,
       Pari the right) and they put them in together */
    house: { S: .125, WX: 628, FOOT: 1145,                                       // (user 2026-10-15 18:39: the house of image 2 - yellow walls, blue windows, a doorway, a stepped red roof; FOOT = its lowest cubes, not the picture's edge - house_blocks.webp has 109px of empty canvas under them, which floated the house over its shadow: user 2026-10-16)
      order: [["block_l", 0, 1], ["block_r", 1, 1], ["blocks"]],   // (each child brings one roof eave cube; they go in BEHIND the rest)
      blocks: [33, 33, 1224, 1254], block_l: [83, 458, 268, 677], block_r: [986, 463, 1170, 677],
      carry: "block_top" },   // (what the children carry: a whole clean cube - house_block_top.webp; it becomes its eave piece as it lands)
    /* a castle of cubes only (user, 2026-10-15): all of it stands but the red cube on top of each tower - each child
       brings ONE (Kabir the left, Tara the right) and they put them on together */
    /* MTG2A01_L04_S01 (subtraction, user 2026-10-22): take - the castle stands WHOLE, its two red tops on; each child
       lifts one off and holds it up (the sibling's addition cover the other way round) */
    castle: { take: true, S: .1106, WX: 768, FOOT: 992, DY: -30,     // (DY -30: a little further back, clear of the play button - user 2026-10-16) (the size of S02's house - user 2026-10-16 "replicate the size of the house exactly": as wide as it (1346 x .1106 = 149 stage px), standing on the same BASE, the children stopping where they stop there)
      KIDY: 168.3,   // where the children's soles are: S01's arched title is 67.4px taller than S02's, so this whole picture sits 33.7px lower - the children stand exactly where S02's do (user 2026-10-19 "the standing position of all four characters should be the same in both games"); the castle stays where it was
      order: [["cubes"], ["cube_l", 0, 1], ["cube_r", 1, 1]],
      cubes: [95, 190, 1441, 992], cube_l: [220, 41, 439, 220], cube_r: [1096, 41, 1315, 220] }
  },
  /* the build, bottom up: [type, x of centre, y of bottom, w, h, picture, who brings it (0 left child, 1 right; none:
     already standing; "pop": goes up at the end), the order it is put in] */
  build(kind, M, B){ const A = this.ART[kind]; B += A.DY || 0;
    return A.order.map(([k, by, seq])=>{ const [x0, y0, x1, y1] = A[k];
      return ["img", M + ((x0 + x1) / 2 - A.WX) * A.S, B + (y1 - A.FOOT) * A.S, (x1 - x0) * A.S, (y1 - y0) * A.S, kind + "_" + k, by, seq || 0]; }); },
  /* the build's pictures, for the boot loader (the landing waits for them) */
  files(h){ const A = h && this.ART[h.build]; return A ? A.order.map(([k])=> h.build + "_" + k + ".webp").concat(A.carry ? [h.build + "_" + A.carry + ".webp"] : []) : []; },
  piece(type, c){ return '<img alt="" src="assets/' + c + '.webp" class="sgp-im">'; },
  html(h){
    const L = this, kind = L.ART[h.build] ? h.build : "house", plan = L.build(kind, L.MID, L.BASE);
    L.KID_X = L.ART[kind].KIDX || [208, 564];                                  // where the children stop (by the build's width)
    L.FEET = L.ART[kind].KIDY || 202;                                          // and the line their soles are on
    const box = (cls, p, i, extra)=> '<div class="' + cls + '" data-i="' + i + '" style="left:' + (p[1] - p[3] / 2) + 'px;top:' + (p[2] - p[4]) + 'px;width:' +
      p[3] + 'px;height:' + p[4] + 'px;z-index:' + (20 + i) + ';' + (extra || "") + '">';
    const brought = p => p[6] === 0 || p[6] === 1, take = !!L.ART[kind].take;   // (take: the brought pieces stand from the start)
    /* a brought piece's carried look (ART.carry): a whole cube in the hands and in the air (user 2026-10-16) */
    const cy = p => (L.ART[kind].carry && brought(p)) ? '<img alt="" src="assets/' + kind + '_' + L.ART[kind].carry + '.webp" class="sgp-im sgp-cy">' : "";
    const pieces = plan.map((p, i)=> box("sgp-pc sgp-" + p[0] + (p[6] === undefined || take ? " sgp-stand" : "") + (cy(p) ? " has-cy" : ""), p, i, "--d:" + (i * .03).toFixed(2) + "s") +
      L.piece(p[0], p[5]) + cy(p) + '</div>' + (brought(p) && !take ? box("sgp-ghost", p, i) + L.piece(p[0], p[5]) + '</div>' : "")).join("");
    const kid = (w, s)=>{
      const idle = pvChar(w, true) || pvChar(w), cheer = pvChar(w, "cheer") || idle, carry = pvChar(w, "carry") || cheer;
      const poses = {}; [["idle", idle], ["carry", carry], ["cheer", cheer]].forEach(([n, f])=>{ (poses[f] = poses[f] || []).push(n); });
      const imgs = Object.keys(poses).map(f => '<img class="sgp-pose' + (pvChar(w, true) ? "" : " sgp-round") + '" alt="" data-for="' + poses[f].join(" ") + '" src="' + f + '">').join("");
      const held = plan.map((p, i)=> p[6] === s ? '<div class="sgp-held" data-i="' + i + '" style="width:' + p[3] + 'px;height:' + p[4] + 'px' + (take ? ';visibility:hidden' : '') + '">' + (cy(p) || L.piece(p[0], p[5])) + '</div>' : "").join("");
      return '<div class="sgp-kid sgp-' + (s ? "r" : "l") + '" data-who="' + w + '" style="left:' + L.KID_X[s] + 'px;top:' + L.FEET + 'px"><div class="sgp-move">' +
        '<div class="sgp-cast">' + imgs + '</div><i class="sgp-shd"></i><i class="sgp-lines"><b></b><b></b><b></b></i><div class="sgp-fw"><div class="sgp-tilt">' + imgs + held + '</div></div></div></div>'; };
    /* shadows by the scene's light (user 2026-10-15 "as per physics"): the sun is outside, beyond the veranda at the back and a
       little to the right (the bright patches on the floor run from back right to front left), so every shadow starts dark
       where the thing meets the floor and falls TOWARD the viewer and to the LEFT, long and soft - the thing's own
       silhouette laid flat (.sgp-cast / .sgp-bcast: flipped about the floor line, foreshortened, sheared left) */
    const casts = plan.map((p, i)=> box("sgp-pcs" + (p[6] === undefined || take ? " sgp-stand" : ""), p, i) + L.piece(p[0], p[5]) + '</div>').join("");
    const xs = plan.map(p => [p[1] - p[3] / 2, p[1] + p[3] / 2]), bx0 = Math.min(...xs.map(x => x[0])), bx1 = Math.max(...xs.map(x => x[1]));
    const foot = L.BASE + (L.ART[kind].DY || 0);                                // (the build's foot line: a castle stands DY lower)
    return '<div class="sgp sgp-' + kind + '" id="sgp">' +
      '<div class="sgp-bcast" style="transform-origin:' + L.MID + 'px ' + foot + 'px">' + casts + '</div>' +
      '<i class="sgp-bshd" style="left:' + (bx0 - 6) + 'px;width:' + (bx1 - bx0 + 12) + 'px;top:' + (foot - 7) + 'px"></i>' +
      pieces + kid(h.people[0], 0) + kid(h.people[1], 1) + '</div>';
  },
  intro(){
    const L = this, root = document.getElementById("sgp");
    const done = ()=>{ if(!window.__sgIntroDone){ window.__sgIntroDone = true; document.dispatchEvent(new Event("sg-intro-done")); } };
    if(!root){ done(); return; }
    /* title_look "wall": the title is painted on the courtyard wall behind it (S01; user 2026-10-13) */
    const ttl = document.getElementById("sgTitle");
    if(ttl && CARD.landing_hero && CARD.landing_hero.title_look === "wall"){ ttl.classList.add("sg-wall");
      /* user 2026-10-16 "shift the title a little up and make it a little circular with white outline": the words
         ride a gentle arc (an SVG textPath - Devanagari stays shaped, its top bar unbroken), in the brush-streaked
         terracotta paint, edged like S02's title (user 2026-10-16 "just the 2 outline effect"): a white ring and,
         under it, a dark one dropped 4.8px (.sgw-b - S02's text-shadow rings, in deep brown here; pv.css). The arc is sized to the words once the font is in. */
      const txt = ttl.textContent.trim(), NS = "http://www.w3.org/2000/svg";
      ttl.innerHTML = '<svg class="sgw-arc" xmlns="' + NS + '" aria-hidden="true"><defs>' +
        '<pattern id="sgPaint" patternUnits="userSpaceOnUse" width="21" height="80" patternTransform="rotate(7)">' +
        '<rect width="7" height="80" fill="#A93816"/><rect x="7" width="3" height="80" fill="#932C10"/>' +
        '<rect x="10" width="7" height="80" fill="#B4421C"/><rect x="17" width="4" height="80" fill="#9E3214"/></pattern>' +
        '<path id="sgArc"/></defs>' +
        '<text class="sgw-b" transform="translate(0 4.8)"><textPath href="#sgArc" startOffset="50%" text-anchor="middle"></textPath></text>' +
        '<text class="sgw-t"><textPath href="#sgArc" startOffset="50%" text-anchor="middle"></textPath></text></svg>' +
        '<span class="sr-only"></span>';
      ttl.querySelectorAll("textPath").forEach(p => p.textContent = txt); ttl.lastChild.textContent = txt;
      const fit = ()=>{ const svg = ttl.firstChild, t = svg.querySelector("text"), fs = parseFloat(getComputedStyle(ttl).fontSize) || 60;
        const len = t.getComputedTextLength() || txt.length * fs * .45, pad = 14, W = len + 2 * pad + 8, sag = Math.round(W * .045);
        const base = fs * 1.05 + sag + pad;                                     // the ends' baseline; the middle rises by sag
        svg.setAttribute("width", W.toFixed(0)); svg.setAttribute("height", (base + fs * .38 + pad).toFixed(0));
        svg.querySelector("#sgArc").setAttribute("d", "M " + pad + " " + base + " Q " + (W / 2) + " " + (base - 2 * sag) + " " + (W - pad) + " " + base); };
      fit(); if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit); }
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const kids = [...root.querySelectorAll(".sgp-kid")], pcs = [...root.querySelectorAll(".sgp-pc")];
    const KIND = root.classList.contains("sgp-castle") ? "castle" : "house", TAKE = !!L.ART[KIND].take;
    const plan = L.build(KIND, L.MID, L.BASE);
    /* TEMPO: every move of the children x this (user 2026-10-15: "the motion of the characters on the first screen is too
       fast") - the swoosh in, the leans, the hops, a block's hop into place and the gaps between them */
    const T = 2.2;   // (1.7 still read as fast - user 2026-10-15 "they are more faster now, reduce their speed")
    const q = (e, s)=> e.querySelector(s), wait = ms => new Promise(r => setTimeout(r, ms));
    const dir = s => s ? -1 : 1;                                                // toward the middle: the left child faces right
    const sound = f =>{ try{ f(); }catch(e){} };
    /* each pose picture at the one scale, standing on the child's foot point; the blocks in the carry pose's hands */
    const layout = k =>{
      const ims = [...k.querySelectorAll(".sgp-pose")];
      ims.forEach(im =>{ const H = im.classList.contains("sgp-round") ? 118 : L.FIG_H * (im.naturalHeight || L.FILE_H) / L.FILE_H;
        im.style.height = H.toFixed(1) + "px"; im.dataset.w = ((im.naturalWidth || 120) * H / (im.naturalHeight || 224)).toFixed(1); im.dataset.h = H.toFixed(1); });
      const carry = ims.find(im => im.dataset.for.split(" ").includes("carry")), idle = ims.find(im => im.dataset.for.split(" ").includes("idle"));
      const W = +carry.dataset.w, H = +carry.dataset.h, s = k.classList.contains("sgp-r") ? 1 : 0;
      const hands = (L.HANDS[k.dataset.who] || [[.2, .55], [.8, .55]]).slice();
      if(!s) hands.reverse();                                                   // the hand nearer the build gives first
      [...k.querySelectorAll(".sgp-held")].forEach((b, j)=>{ const [fx, fy] = hands[j % 2], w = parseFloat(b.style.width), h = parseFloat(b.style.height);
        b.style.scale = Math.min(1, 34 / w).toFixed(3);
        b.style.left = ((fx - .5) * W - w / 2).toFixed(1) + "px"; b.style.top = (-H + fy * H - h / 2).toFixed(1) + "px"; });
      const sh = q(k, ".sgp-shd"), iw = +idle.dataset.w * .92;                 // the contact shadow: the feet and a little round them
      sh.style.width = iw.toFixed(0) + "px"; sh.style.left = (-iw / 2).toFixed(0) + "px"; };
    /* a pose change is a cut, not a cross-fade (two half-seen poses read as a double child), hidden by a quick squash */
    const pose = (k, n, pop)=>{ k.querySelectorAll(".sgp-pose").forEach(im => im.classList.toggle("on", im.dataset.for.split(" ").includes(n)));
      if(pop) q(k, ".sgp-fw").animate([{ scale: "1.07 .93" }, { scale: ".98 1.03", offset: .55 }, { scale: "1 1" }], { duration: 220, easing: "ease-out" }); };
    const ready = Promise.all([...root.querySelectorAll(".sgp-pose")].map(im => (im.decode ? im.decode() : Promise.resolve()).catch(()=>{})))
      .then(()=>{ kids.forEach(k =>{ layout(k); pose(k, reduce || TAKE ? "idle" : "carry"); }); });   // (take: they come empty-handed)
    /* the moves */
    const tilt = k => q(k, ".sgp-tilt"), fw = k => q(k, ".sgp-fw"), move = k => q(k, ".sgp-move");
    /* the shadow moves with the child (user 2026-10-15 "when they are dancing their shadow is not changing"): a lean swings
       it the same way (it lies flipped on the floor, so its rotation is the mirror one); in a hop it stays on the floor
       and shrinks and fades while the child is up, darkest again as they land */
    const cast = k => q(k, ".sgp-cast"), contact = k => q(k, ".sgp-shd");
    const lean = (s, deg, ms)=>{ const d = dir(s) * deg, o = { duration: ms * T, easing: "ease-in-out" };
      cast(kids[s]).animate([{ rotate: "0deg" }, { rotate: -d * 1.6 + "deg", offset: .4 }, { rotate: -d * 1.6 + "deg", offset: .6 }, { rotate: "0deg" }], o);
      return tilt(kids[s]).animate([{ rotate: "0deg" }, { rotate: d + "deg", offset: .4 }, { rotate: d + "deg", offset: .6 }, { rotate: "0deg" }], o); };
    const hop = (s, n, hgt)=>{ const k = kids[s], h = hgt || 18, o = { duration: 560 * T, iterations: n, easing: "ease-out" };
      const up = (el, sc, f)=>{ const b = parseFloat(getComputedStyle(el).opacity) || 1;   // from its own resting darkness
        el.animate([{ scale: "1", opacity: b }, { scale: sc, opacity: b * f, offset: .4, easing: "ease-in" }, { scale: "1", opacity: b, offset: .62 }, { scale: "1", opacity: b }], o); };
      up(cast(k), (1 - h / 90).toFixed(2), .55); up(contact(k), (1 - h / 45).toFixed(2), .35);
      return fw(k).animate([{ translate: "0 0" }, { translate: "0 " + -h + "px", offset: .4, easing: "ease-in" }, { translate: "0 0", offset: .62 },
        { translate: "0 2px", offset: .74 }, { translate: "0 0" }], o); };
    const fx = (cls, x, y, frames, ms)=>{ const e = document.createElement("i"); e.className = cls; e.style.left = x + "px"; e.style.top = y + "px"; root.appendChild(e);
      e.animate(frames, { duration: ms, easing: "cubic-bezier(.2,.8,.4,1)" }).onfinish = ()=> e.remove(); };
    const sparkle = (x, y, big)=> fx("sgp-spk" + (big ? " big" : ""), x, y,
      [{ scale: "0", rotate: "0deg", opacity: 1 }, { scale: "1", rotate: "45deg", opacity: 1, offset: .45 }, { scale: "0", rotate: "90deg", opacity: 0 }], big ? 900 : 760);
    const burst = (x, y)=>{ for(let i = 0; i < 14; i++){ const a = i / 14 * Math.PI * 2 + Math.random() * .3, r = 70 + Math.random() * 50;
      fx("sgp-spk conf c" + (i % 4), x, y, [{ translate: "0 0", scale: ".3", opacity: 1 }, { translate: Math.cos(a) * r + "px " + (Math.sin(a) * r * .7 - 20) + "px", scale: "1", opacity: 1, offset: .55 },
        { translate: Math.cos(a) * r * 1.15 + "px " + (Math.sin(a) * r * .7 + 14) + "px", scale: ".6", opacity: 0 }], 1100); } };
    /* the dust a skidding child kicks up behind their feet */
    const dust = s =>{ const x0 = L.KID_X[s] - dir(s) * 26;
      for(let i = 0; i < 7; i++){ const dx = -dir(s) * (14 + Math.random() * 44), dy = -(6 + Math.random() * 22);
        fx("sgp-dust", x0 + (Math.random() - .5) * 24, L.FEET - 6, [{ translate: "0 0", scale: ".4", opacity: .85 }, { translate: dx + "px " + dy + "px", scale: (1.2 + Math.random() * .8).toFixed(2), opacity: 0 }],
           520 + Math.random() * 260); } };
    /* the entrance: a calm glide in (user 2026-10-15: the dash in from beyond the card's edge read as too fast) - each child
       fades in ~200px out from their spot, glides over leaning a little into it, a small settle, still */
    const zoom = s =>{ const k = kids[s], d = dir(s), far = 200;
      sound(()=> playSfxFile("sfx_whoosh", .75));
      move(k).animate([{ translate: -d * far + "px 0", opacity: 0 }, { translate: -d * far * .8 + "px 0", opacity: 1, offset: .15 },
        { translate: d * 6 + "px 0", opacity: 1, offset: .75, easing: "ease-in-out" }, { translate: "0 0", opacity: 1 }],
        { duration: 680 * T, easing: "cubic-bezier(.12,.62,.3,1)", fill: "both" });
      tilt(k).animate([{ rotate: d * 5 + "deg", filter: "blur(2px)" }, { rotate: d * 4 + "deg", filter: "blur(1px)", offset: .45 },
        { rotate: -d * 3 + "deg", filter: "blur(0px)", offset: .7 }, { rotate: "0deg", filter: "blur(0px)" }],
        { duration: 680 * T, easing: "ease-out" });
      q(k, ".sgp-lines").animate([{ opacity: 0, scale: ".3 1" }, { opacity: .5, scale: "1 1", offset: .3 }, { opacity: 0, scale: "1.2 1", offset: .65 }, { opacity: 0 }],
        { duration: 680 * T, easing: "ease-out" });
      setTimeout(()=> dust(s), 400 * T); };
    const k = ()=> root.getBoundingClientRect().width / 772 || 1;
    const ctr = (e, o)=>{ const r = e.getBoundingClientRect(), z = k(); return { x: (r.left + r.width / 2 - o.left) / z, y: (r.bottom - o.top) / z }; };
    /* a block from the hand into its place: the child leans in, the block hops across in a small arc, lands, settles */
    const put = async i =>{
      const p = plan[i], s = p[6], kd = kids[s], held = q(kd, '.sgp-held[data-i="' + i + '"]'), pc = pcs[i], gh = q(root, '.sgp-ghost[data-i="' + i + '"]');
      lean(s, 7, 620); await wait(150 * T);
      const o = root.getBoundingClientRect(), a = ctr(held, o), sc = parseFloat(held.style.scale) || 1;
      const dx = a.x - p[1], dy = a.y - p[2], apex = Math.min(a.y, p[2] - p[4]) - 34 - p[2], F = [];
      held.style.visibility = "hidden"; pc.classList.add("on");
      const pcs_ = q(root, '.sgp-pcs[data-i="' + i + '"]'); if(pcs_) setTimeout(()=> pcs_.classList.add("on"), 470 * T);   // its shadow, as it lands
      for(let j = 0; j <= 10; j++){ const t = j / 10, y = (1 - t) * (1 - t) * dy + 2 * (1 - t) * t * (2 * apex - dy / 2);
        F.push({ translate: (dx * (1 - t)).toFixed(1) + "px " + y.toFixed(1) + "px", rotate: (dir(s) * -24 * (1 - t)).toFixed(1) + "deg",
                 scale: (sc + (1 - sc) * t).toFixed(3), offset: t * .76 }); }
      F.push({ translate: "0 0", rotate: "0deg", scale: "1.14 .84", offset: .87 }, { translate: "0 0", rotate: "0deg", scale: "1 1" });
      pc.animate(F, { duration: 640 * T, easing: "linear" });
      setTimeout(()=> pc.classList.add("landed"), 640 * T * .76);   // (in its gap: the carried cube becomes the drawing's own piece)
      setTimeout(()=>{ if(gh) gh.classList.add("gone"); sparkle(p[1] + (Math.random() - .5) * 10, p[2] - p[4] * .7);
        sound(()=> _tone([700, 470], "triangle", .1, .07)); }, 500 * T);
      if(![...kd.querySelectorAll(".sgp-held")].some(e => e.style.visibility !== "hidden")) setTimeout(()=> pose(kd, "idle", true), 420 * T); };
    /* take (subtraction): the child leans in, the red top hops off the tower in a small arc into their hands */
    const take = async i =>{
      const p = plan[i], s = p[6], kd = kids[s], held = q(kd, '.sgp-held[data-i="' + i + '"]'), pc = pcs[i];
      lean(s, 7, 620); await wait(150 * T);
      const o = root.getBoundingClientRect(), a = ctr(held, o), sc = parseFloat(held.style.scale) || 1;
      const dx = a.x - p[1], dy = a.y - p[2], apex = Math.min(a.y, p[2] - p[4]) - 34 - p[2];
      const F = [{ translate: "0 0", rotate: "0deg", scale: "1 1", offset: 0 }, { translate: "0 0", rotate: "0deg", scale: "1.14 .84", offset: .12 }];
      for(let j = 1; j <= 10; j++){ const t = j / 10, y = 2 * (1 - t) * t * (2 * apex - dy / 2) + t * t * dy;
        F.push({ translate: (dx * t).toFixed(1) + "px " + y.toFixed(1) + "px", rotate: (dir(s) * -24 * t).toFixed(1) + "deg",
                 scale: (1 + (sc - 1) * t).toFixed(3), offset: .12 + t * .88 }); }
      sparkle(p[1] + (Math.random() - .5) * 10, p[2] - p[4] * .7); sound(()=> _tone([470, 700], "triangle", .1, .07));
      const sh = q(root, '.sgp-pcs[data-i="' + i + '"]'); if(sh) setTimeout(()=>{ sh.style.transition = "opacity .25s"; sh.style.opacity = "0"; }, 120 * T);   // its shadow, as it lifts
      await pc.animate(F, { duration: 640 * T, easing: "linear" }).finished.catch(()=>{});
      pc.style.visibility = "hidden"; held.style.visibility = "visible"; pose(kd, "carry", true); };
    const twinkle = ()=>{ const p = pcs[Math.floor(Math.random() * pcs.length)], b = plan[+p.dataset.i];
      sparkle(b[1] + (Math.random() - .5) * b[3] * .6, b[2] - b[4] * (.4 + Math.random() * .5)); };
    /* while the screen waits: one child at a time leans in to admire it, now and then a hop; a twinkle on the build */
    const play = ()=>{ let n = 0;
      const iv = setInterval(()=>{
        if(!root.isConnected){ clearInterval(iv); return; }
        if(!root.getClientRects().length) return;                                 // (the landing is not showing)
        const s = n++ % 2; lean(s, 2, 1100); if(n % 3 === 0) hop(s, 1, 10); twinkle(); }, 2400 * T); };
    const top = Math.min(...plan.map(p => p[2] - p[4]));
    let started = false;
    const go = async ()=>{ if(started) return; started = true;
      await ready;
      if(reduce){ root.classList.add("go", "still", "built"); pcs.forEach(p => p.classList.add("on", "landed")); root.querySelectorAll(".sgp-pcs").forEach(p => p.classList.add("on")); done(); return; }
      if(TAKE){                                                                  // subtraction: the whole castle; each child takes a top away
        root.classList.add("go");
        await wait(380);
        zoom(0); await wait(240 * T); zoom(1); await wait(860 * T);
        await Promise.all(plan.map((p, i)=> i).filter(i => plan[i][6] === 0 || plan[i][6] === 1).map(i => take(i)));
        await wait(380);
        /* they stay (user 2026-10-22), each with their red top held up - the sibling's cheer: hops, sparkles, the chime */
        root.classList.add("built"); await wait(260);
        sparkle(L.MID - 44, top + 14, true); sparkle(L.MID + 50, top + 40, true);
        sound(()=> _tone([660, 880, 1180], "sine", .5, .1));
        kids.forEach(kd => pose(kd, "cheer", true)); hop(0, 2, 14); setTimeout(()=> hop(1, 2, 16), 110 * T);
        await wait(1300 * T);
        done(); return; }
      root.classList.add("go");                                                   // the half-built castle / house and its gaps
      await wait(380);
      zoom(0); await wait(240 * T); zoom(1); await wait(860 * T);
      const order = plan.map((p, i)=> i).filter(i => plan[i][6] === 0 || plan[i][6] === 1).sort((a, b)=> plan[a][7] - plan[b][7]);
      const steps = [...new Set(order.map(k => plan[k][7]))];                    // (pieces of the same order go in together)
      order.forEach(i => setTimeout(()=> put(i), 560 * T * steps.indexOf(plan[i][7])));
      await wait(560 * T * steps.length);
      await wait(380);
      plan.forEach((p, i)=>{ if(p[6] !== "pop") return; pcs[i].classList.add("on");               // the flag goes up
        const sh = q(root, '.sgp-pcs[data-i="' + i + '"]'); if(sh) setTimeout(()=> sh.classList.add("on"), 300 * T);
        pcs[i].animate([{ translate: "0 -24px", scale: ".4", opacity: 0 }, { translate: "0 2px", scale: "1.1", opacity: 1, offset: .6 }, { translate: "0 0", scale: "1" }],
                       { duration: 480 * T, easing: "cubic-bezier(.3,1.4,.5,1)" });
        sparkle(p[1] + 10, p[2] - 26, true); });
      root.classList.add("built");
      await wait(260);
      burst(L.MID, top + 34); sparkle(L.MID - 44, top + 14, true); sparkle(L.MID + 50, top + 40, true);
      sound(()=> _tone([660, 880, 1180], "sine", .5, .1));
      kids.forEach(kd => pose(kd, "cheer", true)); hop(0, 2, 14); setTimeout(()=> hop(1, 2, 16), 110 * T);
      await wait(1300 * T);
      kids.forEach(kd => pose(kd, "idle", true));
      await wait(250);
      done(); };   // then they stand still (user 2026-10-15: the idle leans / hops / twinkles distracted) - only their blinks
    /* the picture comes in on the greeting's "आज हम ... सीखेंगे" (user 2026-10-15), not on its "नमस्ते": card
       landing_hero.start_at = that word's time in vo_landing (s); it waits for the clip itself to reach it, so a slow
       start never puts it early. Never stranded: 2.5s past that time it comes in anyway. */
    const AT = +((CARD.landing_hero || {}).start_at) || 0;
    let greeted = false;
    document.addEventListener("sg-greeting-start", ()=>{ greeted = true;
      if(!AT){ go(); return; }
      const t0 = Date.now(), tick = ()=>{ if(started) return;
        const a = typeof currentAudio !== "undefined" ? currentAudio : null;
        if((a && !a.paused && a.currentTime >= AT) || Date.now() - t0 > AT * 1000 + 2500){ go(); return; }
        setTimeout(tick, 40); };
      tick(); });
    setTimeout(()=>{ if(!greeted) go(); }, 6000);          // (no greeting at all: the picture still comes in)
  }
};


/* VACHAN (एकवचन/बहुवचन) + any 2-category attribute reuse the GENERIC gender modules — identical
   mechanic, just different labels. A vachan game authors these types with the category in the
   "gender" field (e.g. "S"/"P"), the two labels, and (for pairs) f=singular / m=plural; it then
   inherits immediate tap-to-answer feedback, speak-word-on-tap, layered hints, and the engine
   guard for free. Named *_VACHAN (not *_NUMBER) to avoid colliding with MEET_NUMBER = counting. */

/* ---------- 13. CONTROLLER ---------- */
/* ===== FLN ANIMATION KIT: star-burst (call site) BEGIN =====
   Recipe 8 is a RETUNE of the function below, which was already the shipped
   HI01H05 original: fewer and slower (150 ticks / decay .975 / startV 14 /
   32 stars + 8 circles / spin .18 / shots 0-220-440, against 100 / .96 / 22 /
   80 + 20 / .3 / 0-150-300). Travel distance is held at ~547px so it still
   fills the same area - only the density and pace change.
   The original is kept as _starBurstOld, unreferenced, to make this reversible. */
function starBurst(){ FLNMotion.starBurst.fire({ host: "#confetti" }); }
function clearHost(){
  document.body.classList.remove("is-end");   // r4: clear immersive end state when leaving celebration
  /* user 2026-10-23: going back from the celebration (dev menu) left its Swifty on screen - the end screen, its button and
     the kit's Swifty are put away whenever another page mounts */
  { const es = $("endScreen"); if(es) es.classList.remove("show", "hint-glow");
    const eb = $("endBtn"); if(eb){ eb.classList.remove("show", "hint-glow"); eb.disabled = false; delete eb.dataset.done; }
    const cb = document.getElementById("celBox"); if(cb) cb.innerHTML = "";
    const cf = $("confetti"); if(cf) cf.innerHTML = ""; state.endBtnPending = false; }
  $("slideHost").innerHTML = "";
  $("hintBtn").classList.remove("show");
  $("hintBtn").disabled = false;
  setNavActive(false);
  stopNudge();
  stopAudio();
}

/* [loading] a slide mounts once its own files are in (Assets.whenSlide: at once, same tick, when they already are).
   The token keeps the LAST request: two quick jumps never mount the older slide on top of the newer. */
let _mountTok = 0;
function mountSlide(idx){ const t = ++_mountTok; Assets.whenSlide(idx, ()=>{ if(t !== _mountTok) return;
    /* from one question to the next (guided / practice, same phase): the old screen slides out, the new one slides in */
    const cur = CARD.slides[state.idx], nx = CARD.slides[idx], host = $("slideHost");
    const q = s => s && (s.phase === "guided" || s.phase === "practice") && s.type !== "CELEBRATION";
    if(host && cur && q(cur) && q(nx) && idx === state.idx + 1 && cur.phase === nx.phase && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)){
      host.classList.remove("q-in"); host.classList.add("q-out"); try{ PVSFX.move(); }catch(e){}
      setTimeout(()=>{ if(t !== _mountTok) return; host.classList.remove("q-out"); window.__qIn = true; mountSlideNow(idx); }, 340);
    } else mountSlideNow(idx); }); }
function mountSlideNow(idx){
  state.idx = idx;
  state.slideStart = Date.now();
  state.attempts = 0; state.selectedKey = null; state.locked = false;
  state.hintUsed = false; state.nudgeUsed = false; state.scaffoldLevel = 0; state.hintActive = false;
  state.audioReplays = 0; state.gateNavUntilAudio = false; state.endBtnPending = false;
  state.replayAudio = null;   // a module may set a slide-specific replay (e.g. teach slides whose
                              // audio roles aren't in the autoPlayChain order); else the chip replays the chain
  state.ownsAudio = false;    // a module that drives its OWN audio sequence sets this → skip autoPlayChain
                              // (else the auto prompt-chain stomps/truncates the module's timed VO)
  const slide = CARD.slides[idx];
  bgmFor(slide.phase);        // QA checklist 2026-10-05: the practice game gets its own music (when shipped)
  /* [14] question_started - only on slides that actually ask something */
  try{ if(XAPI_ANSWERABLE.indexOf(slide.type) >= 0)
         XAPI.send("question_started", { slide_id: slide.id, type: slide.type, phase: slide.phase }); }catch(e){}
  clearHost();

  // header prompt
  $("promptText").textContent = slide.prompt_hi || "";

  // Hint button stays HIDDEN until the learner makes a wrong attempt, then it is
  // exposed (graduated scaffold). Mastery uses the SAME scaffold — not excluded.
  $("hintBtn").classList.remove("show");
  $("hintBtn").style.display = "";
  $("navBtn").style.display = "";        // restored by default; tap-to-answer slides hide it themselves
  $("navBtn").style.left = "";           // (T3 sets its own place for it: beside the door - every other slide, bottom centre)
  // [16i] DEFAULT nav wiring — a module that enables आगे without overriding onclick still advances.
  // (DEMO_COUNT shipped an enabled-but-dead button; auto-INTRO inherited an unfulfillable tap guard.)
  /* one tap completes the slide: a 2nd tap while the confetti lands (before the next slide mounts) sent slide_completed again */
  { let navDone = false; $("navBtn").onclick = ()=>{ if(navDone || state.idx !== idx) return; navDone = true; setNavActive(false); completeSlide(true); }; }
  setSwMood("point");                    // Swiftie turns to present each new slide

  GameBus.emit("slide_entered", { slide_id: slide.id, phase: slide.phase, eis: slide.eis, type: slide.type, idx });

  // audio chip = replay the slide audio. Prefer a module-supplied replay (teach slides own their
  // count_intro/explain sequence, which autoPlayChain deliberately skips), else replay the chain.
  $("audioChip").onclick = ()=>{
    if(!replayTap(slide, "header_chip")) return;
    if(state.replayAudio) state.replayAudio(); else autoPlayChain(slide);
  };

  // mount the type
  const mod = SlideModules[slide.type];
  if(!mod){ console.error("[engine] no module for", slide.type); return; }
  // [engine JS] r4/F1 TEACHING FRAME: tutorial slides mount inside a grid-paper .tut-card (header hidden,
  // prompt in-card, standing Swiftie bottom-left + shoulder audio chip). Type-agnostic — any tutorial-phase
  // module renders into the card. Non-tutorial slides mount bare into slideHost as before.
  const isTut = (slide.phase === "tutorial" && slide.type !== "PHASE_TRANSITION" && slide.type !== "CELEBRATION");
  $("stage").classList.toggle("tut", isTut);
  // data.no_head: no header band / Swiftie on this slide - its instruction is its VO only (P4, review 2026-10-07)
  $("stage").classList.toggle("no-head", !!(slide.data && slide.data.no_head));
  document.body.classList.toggle("tut-page", isTut);
  // a slide's own backdrop (data.bg, CSS .stage[data-bg]) - only while that slide is up; its module sets --horizon
  $("stage").dataset.bg = (slide.data && slide.data.bg) || ""; $("stage").style.removeProperty("--horizon");
  let mountHost = $("slideHost");
  if(isTut){
    const card = document.createElement("div"); card.className = "tut-card";
    card.innerHTML = `<div class="tut-prompt">${slide.prompt_hi || ""}</div>` +
      `<img class="tut-mascot" src="assets/start_mascot.webp" alt="" onerror="this.style.display='none'">` +
      /* [05][11] QA CHECKLIST: the in-slide speaker chip is the inline SVG -
         gradient + white ring + wave arcs - never a flat PNG. Verbatim HI01. */
      `<span class="tut-audio" role="button" aria-label="फिर से सुनो"><svg viewBox="0 0 62 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Audio"><g filter="url(#tutChipShadow)"><rect x="8" y="4" width="46" height="44" rx="22" fill="url(#tutChipGrad)"/><rect x="6" y="2" width="50" height="48" rx="24" stroke="white" stroke-width="4"/><path d="M29.8466 19.0574C29.8804 19.0524 29.9145 19.0496 29.9487 19.0488C30.6094 19.0317 31.0021 19.5124 31.0015 20.1414C31.0008 20.9661 31.0003 21.7911 31.0005 22.6158L31.001 27.7212L31.0009 30.5591C31.0009 31.0364 31.0122 31.5472 30.9863 32.0228C30.9662 32.2709 30.902 32.4608 30.7251 32.643C30.3831 32.9952 29.8337 33.0842 29.4386 32.7671C29.0784 32.4781 28.7473 32.1159 28.4181 31.7862L26.4414 29.8087C26.1771 29.5426 25.9071 29.2636 25.6339 29.0081C25.0227 28.9649 24.3645 29.017 23.7487 28.9979C23.445 28.9885 23.1625 29.0211 22.8589 28.9606C22.3751 28.8616 22.0618 28.4823 22.0642 27.9824C22.0706 26.5937 22.0287 25.1949 22.0828 23.8081C22.0884 23.6626 22.2302 23.4334 22.3309 23.3252C22.454 23.1907 22.6146 23.0963 22.792 23.0543C23.0567 22.9904 23.5328 23.016 23.8224 23.0128C24.4143 23.0063 25.0171 23.0277 25.609 23.0073C25.6794 22.9529 25.8505 22.7743 25.919 22.706L26.5305 22.0945L28.5396 20.0838C28.9157 19.7059 29.3217 19.1749 29.8466 19.0574Z" fill="white"/><path class="wv wv2" d="M36.2367 18.6905C36.8783 18.6449 37.3041 19.231 37.6725 19.6829C38.7675 21.0046 39.4982 22.5894 39.7923 24.2804C40.2503 26.8763 39.6548 29.5478 38.1378 31.7035C37.8393 32.1274 37.508 32.5324 37.149 32.9063C36.9404 33.1236 36.7646 33.2558 36.4622 33.3081C36.2013 33.3412 35.9378 33.2717 35.7272 33.1144C35.5185 32.9615 35.3816 32.7298 35.3483 32.4733C35.2786 31.9235 35.5696 31.6821 35.8914 31.3297C36.0448 31.1639 36.1901 30.9908 36.3269 30.811C38.3669 28.136 38.4986 24.4654 36.6555 21.6511C36.4826 21.3899 36.2966 21.1376 36.0984 20.8951C35.8252 20.5652 35.3947 20.2691 35.3472 19.8184C35.2845 19.2225 35.6439 18.768 36.2367 18.6905Z" fill="white"/><path class="wv wv1" d="M33.3868 21.5044C33.9769 21.4549 34.2563 21.7845 34.5981 22.1981C35.1982 22.924 35.6149 23.7691 35.8211 24.6886C36.171 26.2384 35.8867 27.8637 35.0314 29.2026C34.7421 29.6568 34.2333 30.3745 33.6937 30.4946C33.1633 30.5437 32.6759 30.2927 32.5495 29.7376C32.3921 29.0462 32.9849 28.6956 33.3274 28.1763C34.2088 26.833 34.1932 25.0908 33.288 23.7635C33.0747 23.4522 32.6159 23.0564 32.5518 22.7133C32.4377 22.1027 32.7745 21.619 33.3868 21.5044Z" fill="white"/></g><defs><filter id="tutChipShadow" x="0" y="0" width="62" height="60" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="4"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter><linearGradient id="tutChipGrad" x1="8" y1="26" x2="54" y2="26" gradientUnits="userSpaceOnUse"><stop stop-color="#1987FC"/><stop offset="1" stop-color="#1565F4"/></linearGradient></defs></svg></span>`;
    const inner = document.createElement("div"); inner.className = "tut-content";
    card.insertBefore(inner, card.querySelector(".tut-mascot"));
    card.querySelector(".tut-audio").onclick = ()=>{
      if(!replayTap(slide, "tut_chip")) return;
      if(state.replayAudio) state.replayAudio(); else autoPlayChain(slide);
    };
    $("slideHost").appendChild(card);
    mountHost = inner;
  }
  mod.mount(mountHost, slide);
  // game-feel: animate the slide content in on every mount
  { const _sh = $("slideHost"), qi = !!window.__qIn; window.__qIn = false; _sh.classList.remove("slide-in", "q-in"); void _sh.offsetWidth; _sh.classList.add(qi ? "q-in" : "slide-in"); }

  // vertically ink-centre every Devanagari glyph once the slide has laid out
  requestAnimationFrame(()=> centerAllGlyphs($("slideHost")));

  // play the full VO chain automatically (prompt → phoneme/word_name → instruction).
  // If the slide gated its nav button on audio, enable it once the chain finishes
  // (so students can't skip before hearing it). SKIP when the module owns its audio
  // (state.ownsAudio) — else this chain stomps/truncates the module's own timed VO.
  if(!state.ownsAudio){
    autoPlayChain(slide, ()=>{
      if(state.gateNavUntilAudio) setNavActive(true);
      if(state.endBtnPending){ $("endBtn").classList.add("show"); state.endBtnPending = false; }
    });
  }
}

/* ---------- [engine JS] r4/P1 PHASE-TRANSITION PEEK GATE (Shruti's peek beat) ----------
   An automatic interstitial fired ON A PHASE BOUNDARY (not a slide type): blur the stage, Swiftie
   peeks up from the bottom under a big headline, hold ≥2s, then mount the next slide. Kept ALONGSIDE
   our journey-map PHASE_TRANSITION module (a distinct, author-placed slide type) — the gate below
   skips PHASE_TRANSITION + CELEBRATION so the two never double-fire. */
function afterConfetti(fn){
  /* ===== FLN ANIMATION KIT: confetti (advance gate) BEGIN =====
     Recipe 7 renders into .fx-confetti, not the retired .conf-shot, so this gate
     was about to poll for an element that can no longer exist and wave every
     slide straight through mid-celebration. FLNMotion.confetti.after() is the
     kit's own version of this poll, with the same 8s cap. */
  FLNMotion.confetti.after(fn);
  /* ===== FLN ANIMATION KIT: confetti (advance gate) END ===== */
}
/* onscreen headline per gate (display only; distinct from any narration). Eligibility = phase IN this map. */
const PHASE_GATE_TITLE = { tutorial:"चलिए, शुरू करें!", guided:"चलिए, साथ में करें!", practice:"अब आपकी बारी!" };   // HI02H11_L02_S02's headlines (user 2026-10-23: "exact same")   // QA checklist 2026-10-05: the headlines are exactly the lines Swiftie speaks (each VO is now that line alone), so the text appears only as she says it
const PHASE_GATE_VO    = { tutorial:"vo_pt_tutorial", guided:"vo_pt_guided", practice:"vo_pt_practice" };
const ANIM_ASSETS = ["loader.webp", "new_landing_swiftee_anim.webp", "peeking_talk_up.webp", "sw_head_celebrate_anim.webp", "sw_head_hint_anim.webp", "sw_head_tryagain_anim.webp"];
/* [gate] THE THREE TRANSITION SCREENS OF HI02H11_L02_S02 (its r142 - Hindi-game-gender-identify's screen), user 2026-10-23:
   "extract the same all three transition". Rule for rule:
   - Swifty is peeking_talk_up.webp (900x900, already up and talking), bottom-anchored, square, 52.8% of the window's
     height (max 624px, never wider than the screen); a .3s lift in (pgUpIn); on the first screen he sinks out (pgPeekDown).
   - a soft whoosh as the screen opens (its sfx_gate_whoosh).
   - the magenta headline with the white stroke is blank until Swifty says it, then wipes in left to right (pgWipe, .9s):
     PHASE_GATE_CUE_MS = where the line starts in OUR clips (each is the line alone: speech at 0.28s), counted from when
     the clip is heard; _fitGateTitle keeps it off his head on any screen.
   - the screen lets go when the line ends (he is shown at least 1.2s, the line whole for at least .7s), with a 12s
     watchdog; the next button is off while it is up; no remount if the child has moved on.
   Our lines (PHASE_GATE_TITLE) and clips (vo_pt_*) are unchanged. Every screen starts the bird from frame 0: a fresh
   blob: URL of the one download (Assets.fresh). */
const PEEK_UP_SRC = "assets/gif/peeking_talk_up.webp";
const PHASE_GATE_CUE_MS = { tutorial: 3075, guided: 3575, practice: 925 };   // HI02H11's title_cue_ms - where the headline is said in its clips (copied as they are)
function _fitGateTitle(){
  try{
    const t = $("phaseGateTitle"), im = $("phaseGateImg"), g = $("phaseGate");
    if(!t || !im || !t.textContent || !g || !g.classList.contains("show")){ window.removeEventListener("resize", _fitGateTitle); return; }
    t.style.removeProperty("top"); t.style.scale = "";
    const ir = im.getBoundingClientRect(); if(!ir.height) return;
    const crest = ir.top + ir.height * 0.38, GAP = 12, EDGE = 8, W = window.innerWidth;
    const tr = t.getBoundingClientRect();
    let sc = Math.min(1, (W - 2 * EDGE) / tr.width);                   // never wider than the screen
    if(tr.top + tr.height * sc > crest - GAP){                          // reaches the bird: lift it
      const room = crest - GAP - EDGE;
      sc = Math.min(sc, room / tr.height);
      sc = Math.max(0.35, sc);
      const top = Math.max(EDGE, crest - GAP - tr.height * sc);
      t.style.setProperty("top", top + "px", "important");
    }
    if(sc < 0.999){ t.style.transformOrigin = "50% 0"; t.style.scale = String(sc); }
  }catch(e){}
}
let _peekUrl = "";
const _gatedPhases = new Set();   // each phase gate plays ONCE (Start→tutorial, →guided, →practice)
let _gateToken = 0;
function phaseBlurTransition(cb, toPhase){
  const tok = ++_gateToken;
  const _idxAtGateOpen = (typeof state !== "undefined") ? state.idx : -1;
  stopNudge(); stopAudio();
  const gate = $("phaseGate"), img = $("phaseGateImg"), cv = $("phaseGateCv");
  if(cv) cv.style.display = "none";
  let _peekStart = Date.now();
  gate.classList.toggle("pg-talk", toPhase === "tutorial");   /* carries the sink on the first gate */
  gate.classList.add("pg-up");
  if(img){ img.style.display = ""; img.removeAttribute("src"); void img.offsetWidth;
           img.onload = function(){ _peekStart = Date.now(); };
           const old = _peekUrl; img.src = _peekUrl = Assets.fresh(PEEK_UP_SRC);
           if(old && old.indexOf("blob:") === 0) setTimeout(()=> URL.revokeObjectURL(old), 1000); }
  const title = $("phaseGateTitle");
  if(title){ title.textContent = ""; title.classList.remove("pg-pop"); title.style.removeProperty("top"); title.style.scale = ""; }
  $("stage").classList.add("blurred", "gating");
  document.body.classList.add("gating");
  gate.classList.add("show");
  playSfxFile("sfx_gate_whoosh", 0.7);   /* the screen changes - a soft swish, well before Swifty speaks */
  GameBus.emit("phase_transition", { to: toPhase });
  const closeGate = ()=>{ gate.classList.remove("show"); $("stage").classList.remove("blurred", "gating"); document.body.classList.remove("gating"); };
  setNavActive(false);
  let _gateDone = false, _capT = null, _capAt = 0;
  const finishGate = ()=>{
    if(_gateDone) return;                       // cb() must mount the next slide exactly once
    _gateDone = true;
    gate.classList.add("pg-sink");
    setTimeout(()=> _tearDownGate(), gate.classList.contains("pg-talk") ? 340 : 0);
  };
  const _tearDownGate = ()=>{
    gate.classList.remove("show", "pg-sink");
    clearTimeout(_capT); if(title){ title.textContent = ""; title.classList.remove("pg-pop"); }
    $("stage").classList.remove("blurred");
    if(cb && (_idxAtGateOpen < 0 || state.idx === _idxAtGateOpen)) cb();   // mounts the next slide
    $("stage").classList.remove("gating");      // header returns once the slide is in
    document.body.classList.remove("gating");
  };
  const GATE_WATCHDOG_MS = 12000;
  setTimeout(()=>{ if(tok === _gateToken) finishGate(); }, GATE_WATCHDOG_MS);
  const voId = PHASE_GATE_VO[toPhase];
  const voSrc = (voId && CARD.assets && CARD.assets.audio && CARD.assets.audio[voId]) || null;
  /* the headline arrives with its words: PHASE_GATE_CUE_MS into the clip, counted from when it is heard */
  const _cue = PHASE_GATE_CUE_MS[toPhase];
  const _capText = PHASE_GATE_TITLE[toPhase] || "";
  const _armCaption = ()=>{
    if(!title || !_capText) return;
    const show = ()=>{
      if(tok !== _gateToken || _gateDone) return;
      _capAt = Date.now();
      title.textContent = _capText; title.classList.remove("pg-pop"); void title.offsetWidth; title.classList.add("pg-pop");
      _fitGateTitle(); window.addEventListener("resize", _fitGateTitle);
    };
    if(_cue == null || !voSrc){ _capT = setTimeout(show, 0); return; }
    const t0 = performance.now();
    (function waitVoice(){
      if(tok !== _gateToken) return;
      const on = !!(currentAudio && !currentAudio.paused && currentAudio.currentTime > 0);
      if(on || performance.now() - t0 > 1500){ _capT = setTimeout(show, _cue); return; }
      requestAnimationFrame(waitVoice);
    })();
  };
  _armCaption();
  play(voSrc, ()=>{
    if(tok !== _gateToken){ closeGate(); return; }               // a newer gate superseded us
    const PEEK_MS = 1200;                                          // he is shown at least this long
    const CAP_HOLD_MS = 1600;                                      // and the line whole for .7s (wipe .9s + .7s)
    (function waitPeek(){
      if(tok !== _gateToken){ closeGate(); return; }
      const left = Math.max(PEEK_MS - (Date.now() - _peekStart), _capAt ? CAP_HOLD_MS - (Date.now() - _capAt) : 0);
      if(left > 0){ setTimeout(waitPeek, Math.min(left, 120)); return; }
      finishGate();
    })();
  });
}

function completeSlide(success){
  const slide = CARD.slides[state.idx];
  GameBus.emit("slide_completed", {
    slide_id: slide.id, phase: slide.phase, success: !!success,
    attempts: state.attempts + (success ? 1 : 0), latency_ms: Date.now()-state.slideStart,
    scaffold_level: state.scaffoldLevel, hint_used: state.hintUsed,
    nudge_used: state.nudgeUsed, audio_replays: state.audioReplays
  });
  if(state.idx >= CARD.slides.length - 1){
    // last slide is CELEBRATION; nothing more
    return;
  }
  // advance only AFTER the correct-answer confetti has landed (to the gate AND to the next slide alike).
  const fromIdx = state.idx, nextIdx = state.idx + 1;
  const next = CARD.slides[nextIdx];
  if(next && next.phase !== slide.phase && next.type !== "CELEBRATION" && next.type !== "PHASE_TRANSITION"
     && PHASE_GATE_TITLE[next.phase] && !_gatedPhases.has(next.phase)){
    _gatedPhases.add(next.phase);
    afterConfetti(()=>{ if(state.idx === fromIdx) Assets.whenSlide(nextIdx, ()=>{                   // [loading] the gate + that slide's files
      if(state.idx === fromIdx) phaseBlurTransition(()=> mountSlide(nextIdx), next.phase); }, next.phase); });
    return;
  }
  afterConfetti(()=>{ if(state.idx === fromIdx) mountSlide(nextIdx); });
}

/* ---------- 14. VALIDATOR (runtime self-check) ---------- */
function runValidator(){
  const missing = (CARD.signals_expected || []).filter(s => !GameBus.firedSet.has(s));
  GameBus.validatorReport.missing_signals = missing;
  GameBus.validatorReport.passed = missing.length === 0;
  console.log("[validator]", GameBus.validatorReport);
  try{ window.parent?.postMessage({type:"swiftpal:lesson_complete", signals: GameBus.signals, validatorReport: GameBus.validatorReport}, "*"); }catch(e){}
  // offline self-capture: write the final record to localStorage; optionally POST
  // it to a learning-record endpoint if one is configured AND the device is online.
  GameBus.persist();
  if(TELEMETRY.endpoint && navigator.onLine){
    try{ fetch(TELEMETRY.endpoint, {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(GameBus.exportResults()), keepalive:true}).catch(()=>{}); }catch(e){}
  }
  // dev banner
  if(new URLSearchParams(location.search).has("dev")){
    const b = $("devBanner");
    if(missing.length === 0){ b.textContent = "✓ all expected signals fired"; b.className = "dev-banner show ok"; }
    else { b.textContent = "✗ missing signals: " + missing.join(", "); b.className = "dev-banner show"; }
  }
}

/* ---------- [engine JS] r4/#2 DATA-DRIVEN LANDING CONCEPT STRIP ----------
   A landing_hero of kind "concept_strip" renders N visual-example tiles from card data, so any game
   declares its landing preview in card.json instead of hand-editing HTML. Tile types: discs (size),
   bars (length), balance (weight — equal-size objects, heavier lower, never a size cue), image. */
const SG_BALANCE_SVG =
  '<svg viewBox="0 0 124 112" xmlns="http://www.w3.org/2000/svg">' +
  '<line x1="62" y1="30" x2="62" y2="86" stroke="#8AA0C8" stroke-width="6" stroke-linecap="round"/>' +
  '<polygon points="62,60 44,100 80,100" fill="#8AA0C8"/>' +
  '<g transform="rotate(-13 62 34)">' +
  '<rect x="14" y="30" width="96" height="11" rx="5.5" fill="#4EA3F0"/>' +
  '<circle cx="22" cy="20" r="14" fill="#FBD24B" stroke="#D9A21A" stroke-width="2.5"/>' +
  '<circle cx="102" cy="20" r="14" fill="#98A2B3" stroke="#5B6577" stroke-width="2.5"/>' +
  '</g></svg>';
function conceptTileHTML(c){
  const lbl = c && c.label ? ` aria-label="${c.label}"` : "";   // a11y only; not shown (pre-reader → visual+VO)
  switch(c && c.type){
    case "discs": {
      const sizes = c.sizes || [34, 54, 76];
      return `<div class="sg-ex sg-ex-size" role="img"${lbl}>` +
        sizes.map(s => `<span class="sg-disc" style="width:${s}px;height:${s}px"></span>`).join("") + `</div>`;
    }
    case "bars": {
      const widths = c.widths || [42, 72, 102];
      return `<div class="sg-ex sg-ex-len" role="img"${lbl}>` +
        widths.map(w => `<span class="sg-bar" style="width:${w}px"></span>`).join("") + `</div>`;
    }
    case "balance":
      return `<div class="sg-ex sg-ex-wt" role="img"${lbl}>` + SG_BALANCE_SVG + `</div>`;
    case "image":
      return `<div class="sg-ex" role="img"${lbl}><img src="${c.src}" alt="${c.label || ''}"></div>`;
    default:
      return "";
  }
}

/* ---------- 14b. ASSETS: THE LANDING FIRST, THEN EVERY FILE OF THE LESSON ----------
   The white boot loader holds only until the LANDING's own files are in (tag CRIT: its art, the title font, the play
   button, the greeting + Swiftee's wave) - so the first screen comes up fast. Then every other file in ASSET_SIZES (all
   shipped files, generated from disk) streams in behind the landing while the greeting plays, so nothing loads
   mid-lesson. (A loading bar in the play button's place was tried on 2026-10-06 and taken out at review: "remove this
   loader". The play tap needs no gate of its own - slide 0 mounts through whenSlide, below, which waits for its files.)
     - queue: the landing's files first (nothing else starts until they are in), then SMALLEST FIRST - pictures,
       backdrops and clips land in the first seconds and never wait behind the big animated WebPs. 5 at a time.
     - a fetched file is kept as a Blob: an <img> / <audio> that is later given that file's path gets a blob: URL of it
       instead (the MutationObserver below; play() for the voice element), so "loaded" really means local. A blob: URL
       that fails falls back, once, to the file's own URL. CSS url() backgrounds read the same bytes from the HTTP
       cache the fetch just filled.
     - NEVER BLOCKS: a failed, stalled (STALL_MS without a byte) or over-long (CAP_MS) transfer is aborted and counts as
       done - the element keeps its original src and loads it the normal way. file:// (fetch blocked) is done at once.
   Assets.whenSlide(i, fn): fn runs once slide i's own files are in (same tick when they already are - almost always, as
   the files arrive while the greeting plays); a spinner shows after 300ms and after 8s fn runs anyway. Animations that must restart from frame 0
   (the peeking gate, the cheers) get a fresh blob: URL per restart (Assets.fresh) - no ?r= re-downloads.
   ?noprefetch (QA only) turns the queue off, so a slide's own requests can be watched.
   Formats (2026-10-06): images WebP, audio Ogg/Opus, fonts WOFF2 - Chrome / Edge / Firefox, and Safari 17+ (Ogg Opus
   from Safari 18.4). */
/* @asset-sizes:begin (generated by tools/gen_asset_sizes.js - do not edit by hand) */
const ASSET_SIZES = {
  "assets/bg_landing_soft2.webp": 60972,
  "assets/bg_landing_v3.webp": 54416,
  "assets/bgdeco_spark.svg": 220,
  "assets/bgdeco_star.svg": 391,
  "assets/bgdeco_star_o.svg": 448,
  "assets/btn-play-round-waiting.svg": 2655,
  "assets/btn-play-round.svg": 2645,
  "assets/castle_cube_l.webp": 4122,
  "assets/castle_cube_r.webp": 4236,
  "assets/castle_cubes.webp": 63644,
  "assets/celebration/cel_idle.webp": 651146,
  "assets/celebration/cel_shabaash.webp": 684852,
  "assets/celebration/cel_talk.webp": 650742,
  "assets/char_aman.webp": 13392,
  "assets/char_aman_blink.webp": 13526,
  "assets/char_aman_cheer.webp": 41686,
  "assets/char_aman_full.webp": 35576,
  "assets/char_aman_full_blink.webp": 36206,
  "assets/char_meera.webp": 17846,
  "assets/char_meera_blink.webp": 17818,
  "assets/char_meera_cheer.webp": 49346,
  "assets/char_meera_cheer_blink.webp": 49486,
  "assets/char_meera_full.webp": 47816,
  "assets/char_meera_full_blink.webp": 48192,
  "assets/end_screen.webp": 33634,
  "assets/fonts/baloo2-600.woff2": 87020,
  "assets/fonts/baloo2-700.woff2": 86108,
  "assets/fonts/baloo2-800.woff2": 74512,
  "assets/gif/loader.webp": 137428,
  "assets/gif/new_landing_swiftee_anim.webp": 641710,
  "assets/gif/peeking_talk_up.webp": 1561680,
  "assets/gif/sw_head_celebrate_anim.webp": 293618,
  "assets/gif/sw_head_hint_anim.webp": 316076,
  "assets/gif/sw_head_tryagain_anim.webp": 313414,
  "assets/last_swifty_end.webp": 1779506,
  "assets/last_swifty_still.webp": 26456,
  "assets/mascot.webp": 8006,
  "assets/nudge_fx_ring_inner.svg": 786,
  "assets/nudge_fx_ring_outer.svg": 769,
  "assets/nudge_fx_sparks.svg": 2476,
  "assets/nudge_hand_new.svg": 6860,
  "assets/pv_cube10.webp": 15724,
  "assets/pv_cube4.webp": 9352,
  "assets/pv_rod11.webp": 33128,
  "assets/sfx/bgm.ogg": 1443997,
  "assets/sfx/sfx_confetti.ogg": 11582,
  "assets/sfx/sfx_correct.ogg": 10099,
  "assets/sfx/sfx_gate_whoosh.ogg": 22384,
  "assets/sfx/sfx_next.ogg": 1538,
  "assets/sfx/sfx_nudge.ogg": 3537,
  "assets/sfx/sfx_play.ogg": 3094,
  "assets/sfx/sfx_whoosh.ogg": 3670,
  "assets/sfx/sfx_wrong.ogg": 6095,
  "assets/start_card.webp": 1024,
  "assets/start_mascot.webp": 18020,
  "assets/startnew_bg_plain.webp": 24446,
  "assets/sw_head_celebrate.webp": 41998,
  "assets/sw_head_hint.webp": 36812,
  "assets/sw_head_talking.webp": 37384,
  "assets/sw_head_tryagain.webp": 48836,
  "assets/voiceover/sfx_celebrate.ogg": 8344,
  "assets/voiceover/vo_ask_pick.ogg": 11839,
  "assets/voiceover/vo_cel.ogg": 15254,
  "assets/voiceover/vo_g1_build.ogg": 28748,
  "assets/voiceover/vo_g1_correct.ogg": 29620,
  "assets/voiceover/vo_g1_eq.ogg": 16447,
  "assets/voiceover/vo_g1_h2.ogg": 23464,
  "assets/voiceover/vo_g1_ones_left.ogg": 20710,
  "assets/voiceover/vo_g1_ones_now.ogg": 8527,
  "assets/voiceover/vo_g1_opened.ogg": 12327,
  "assets/voiceover/vo_g1_prompt.ogg": 10903,
  "assets/voiceover/vo_g1_regroup.ogg": 30152,
  "assets/voiceover/vo_g1_reveal.ogg": 20610,
  "assets/voiceover/vo_g1_rm_ones.ogg": 17257,
  "assets/voiceover/vo_g1_rm_tens.ogg": 20451,
  "assets/voiceover/vo_g1_sub.ogg": 21990,
  "assets/voiceover/vo_g2_build.ogg": 16488,
  "assets/voiceover/vo_g2_correct.ogg": 17375,
  "assets/voiceover/vo_g2_h2.ogg": 18258,
  "assets/voiceover/vo_g2_prompt.ogg": 9341,
  "assets/voiceover/vo_g2_reveal.ogg": 22754,
  "assets/voiceover/vo_g2_rm_ones.ogg": 9533,
  "assets/voiceover/vo_g2_rm_tens.ogg": 7592,
  "assets/voiceover/vo_g2_sub.ogg": 8409,
  "assets/voiceover/vo_g3_build.ogg": 14886,
  "assets/voiceover/vo_g3_correct.ogg": 19686,
  "assets/voiceover/vo_g3_h2.ogg": 21590,
  "assets/voiceover/vo_g3_prompt.ogg": 10177,
  "assets/voiceover/vo_g3_reveal.ogg": 22282,
  "assets/voiceover/vo_g3_rm_ones.ogg": 11451,
  "assets/voiceover/vo_g3_rm_tens.ogg": 8697,
  "assets/voiceover/vo_g3_sub.ogg": 9805,
  "assets/voiceover/vo_h_order.ogg": 17045,
  "assets/voiceover/vo_h_recount.ogg": 12823,
  "assets/voiceover/vo_idle_build_o.ogg": 6470,
  "assets/voiceover/vo_idle_build_t.ogg": 6721,
  "assets/voiceover/vo_idle_open.ogg": 11988,
  "assets/voiceover/vo_idle_rm_o.ogg": 7751,
  "assets/voiceover/vo_idle_rm_t.ogg": 8263,
  "assets/voiceover/vo_landing.ogg": 20870,
  "assets/voiceover/vo_num_1.ogg": 4077,
  "assets/voiceover/vo_num_2.ogg": 2755,
  "assets/voiceover/vo_num_3.ogg": 3295,
  "assets/voiceover/vo_num_4.ogg": 3679,
  "assets/voiceover/vo_num_5.ogg": 4219,
  "assets/voiceover/vo_num_6.ogg": 3615,
  "assets/voiceover/vo_num_7.ogg": 4521,
  "assets/voiceover/vo_num_8.ogg": 3070,
  "assets/voiceover/vo_p1_ask.ogg": 16750,
  "assets/voiceover/vo_p1_build.ogg": 13056,
  "assets/voiceover/vo_p1_correct.ogg": 19860,
  "assets/voiceover/vo_p1_h2.ogg": 21826,
  "assets/voiceover/vo_p1_prompt.ogg": 9171,
  "assets/voiceover/vo_p1_reveal.ogg": 22727,
  "assets/voiceover/vo_p1_rm_ones.ogg": 12831,
  "assets/voiceover/vo_p1_rm_tens.ogg": 9390,
  "assets/voiceover/vo_p1_sub.ogg": 14178,
  "assets/voiceover/vo_p2_build.ogg": 12637,
  "assets/voiceover/vo_p2_correct.ogg": 20439,
  "assets/voiceover/vo_p2_h2.ogg": 23132,
  "assets/voiceover/vo_p2_prompt.ogg": 9107,
  "assets/voiceover/vo_p2_reveal.ogg": 18218,
  "assets/voiceover/vo_p2_rm_ones.ogg": 6303,
  "assets/voiceover/vo_p2_rm_tens.ogg": 6865,
  "assets/voiceover/vo_p2_sub.ogg": 10769,
  "assets/voiceover/vo_p3_correct.ogg": 27619,
  "assets/voiceover/vo_p3_h2.ogg": 21672,
  "assets/voiceover/vo_p3_prompt.ogg": 17926,
  "assets/voiceover/vo_p3_reveal.ogg": 21910,
  "assets/voiceover/vo_p4_correct.ogg": 27929,
  "assets/voiceover/vo_p4_h2.ogg": 20305,
  "assets/voiceover/vo_p4_prompt.ogg": 13798,
  "assets/voiceover/vo_p4_reveal.ogg": 25367,
  "assets/voiceover/vo_pt_guided.ogg": 240670,
  "assets/voiceover/vo_pt_practice.ogg": 90014,
  "assets/voiceover/vo_pt_tutorial.ogg": 207518,
  "assets/voiceover/vo_rm_guide.ogg": 7416,
  "assets/voiceover/vo_rm_ones_less.ogg": 14424,
  "assets/voiceover/vo_rm_ones_more.ogg": 14986,
  "assets/voiceover/vo_rm_tens_more.ogg": 15734,
  "assets/voiceover/vo_t1_a.ogg": 24956,
  "assets/voiceover/vo_t1_learn.ogg": 26153,
  "assets/voiceover/vo_t2_both_left.ogg": 15117,
  "assets/voiceover/vo_t2_built.ogg": 11402,
  "assets/voiceover/vo_t2_cant.ogg": 25114,
  "assets/voiceover/vo_t2_digits.ogg": 11907,
  "assets/voiceover/vo_t2_intro.ogg": 14865,
  "assets/voiceover/vo_t2_ones5.ogg": 14928,
  "assets/voiceover/vo_t2_ones_left.ogg": 21204,
  "assets/voiceover/vo_t2_ones_now.ogg": 8760,
  "assets/voiceover/vo_t2_open.ogg": 28896,
  "assets/voiceover/vo_t2_rm_ones.ogg": 10996,
  "assets/voiceover/vo_t2_story_a.ogg": 17618,
  "assets/voiceover/vo_t2_story_b.ogg": 10024,
  "assets/voiceover/vo_t2_sub.ogg": 20150,
  "assets/voiceover/vo_t2_tens.ogg": 12878,
  "assets/voiceover/vo_t2_tens_note.ogg": 17500,
  "assets/voiceover/vo_t2_total.ogg": 27784,
  "assets/voiceover/vo_t3_build.ogg": 8323,
  "assets/voiceover/vo_t3_built.ogg": 11384,
  "assets/voiceover/vo_t3_digits.ogg": 14459,
  "assets/voiceover/vo_t3_intro.ogg": 14238,
  "assets/voiceover/vo_t3_ones_left.ogg": 19798,
  "assets/voiceover/vo_t3_open.ogg": 36214,
  "assets/voiceover/vo_t3_rm_ones.ogg": 10233,
  "assets/voiceover/vo_t3_rm_tens.ogg": 18672,
  "assets/voiceover/vo_t3_sub.ogg": 20585,
  "assets/voiceover/vo_t3_sub0.ogg": 12070,
  "assets/voiceover/vo_t3_tens_left.ogg": 21724,
  "assets/voiceover/vo_t3_total.ogg": 27709
};
/* @asset-sizes:end */
const Assets = (function(){
  const CRIT = -3, GATE = -2, UI = -1, REST = 999;
  const CONCURRENCY = 5, STALL_MS = 15000, CAP_MS = 90000, CRIT_CAP_MS = 20000;
  let q; try{ q = new URLSearchParams(location.search); }catch(e){ q = { has: ()=> false }; }
  const OFF = q.has("noprefetch");
  const HTTP = /^https?:$/.test(location.protocol);           // file:// can't fetch(): every element loads its own file there
  const items = new Map(), perSlide = [], blobs = new Map(), urls = new Map();
  let seq = 0, active = 0, started = false, hold = false;
  const A = (CARD.assets || {});
  const known = src => Object.prototype.hasOwnProperty.call(ASSET_SIZES, src);
  const vo = id => (A.audio && typeof A.audio[id] === "string" && A.audio[id].indexOf("assets/") === 0) ? A.audio[id]
                                                                                                      : "assets/voiceover/" + id + "." + AUDIO_EXT;
  const art = f => "assets/" + (ANIM_ASSETS.indexOf(f) >= 0 ? "gif/" : "") + f;
  const TYPES = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", ogg: "audio/ogg", woff2: "font/woff2" };
  const typeOf = src => TYPES[(src.split("?")[0].split(".").pop() || "").toLowerCase()] || "";
  /* a font file is "in" once the face is ready to draw too (fetched bytes + document.fonts.load: no swap later) */
  const faceOf = src =>{ const m = /baloo2-(\d+)\.woff2$/.exec(src); return m ? m[1] + " 1em 'Baloo 2'" : null; };
  function add(src, tag){
    if(!src || !known(src)) return null;                       // not shipped: never requested (no 404s)
    let it = items.get(src);
    if(it){ if(tag < it.tag) it.tag = tag; return it; }
    it = { src: src, tag: tag, n: seq++, st: 0, size: ASSET_SIZES[src] || 1, cbs: [] };   // st: 0 queued, 1 loading, 2 in
    items.set(src, it); return it;
  }
  function ready(){ if(OFF) return true; if(!items.size) return false; for(const it of items.values()) if(it.st !== 2) return false; return true; }
  function finish(it){
    if(it.st === 2) return;
    if(it.st === 1) active--;
    it.st = 2;
    /* an <img data-src> in index.html that only needs its picture later gets it now (it used to start downloading
       with the page, ahead of the landing's own files) */
    document.querySelectorAll('img[data-src="' + it.src + '"]').forEach(im =>{ im.src = it.src; im.removeAttribute("data-src"); });
    it.cbs.splice(0).forEach(f =>{ try{ f(); }catch(e){} });
    pump();
  }
  function load(it){
    it.st = 1; active++;
    if(!HTTP){ finish(it); return; }
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    let stallT = 0, capT = 0, over = false;
    const end = blob =>{
      if(over) return; over = true; clearTimeout(stallT); clearTimeout(capT);
      if(blob) blobs.set(it.src, blob);
      const face = faceOf(it.src);
      if(!face || !document.fonts || !document.fonts.load) return finish(it);
      const t = setTimeout(()=> finish(it), 3000);
      document.fonts.load(face).then(()=>{ clearTimeout(t); finish(it); }, ()=>{ clearTimeout(t); finish(it); });
    };
    const abort = ()=>{ try{ if(ctl) ctl.abort(); }catch(e){} end(null); };   // stalled / too long: counts as done
    const arm = ()=>{ clearTimeout(stallT); stallT = setTimeout(abort, STALL_MS); };
    capT = setTimeout(abort, it.tag <= CRIT ? CRIT_CAP_MS : CAP_MS); arm();
    fetch(it.src, ctl ? { signal: ctl.signal } : undefined).then(r =>{
      if(!r.ok) throw new Error("HTTP " + r.status);
      const len = +r.headers.get("content-length");
      if(len > 0 && !r.headers.get("content-encoding")) it.size = len;
      const type = typeOf(it.src) || r.headers.get("content-type") || "";
      if(!r.body || !r.body.getReader) return r.blob().then(b => new Blob([b], { type: type }));
      const rd = r.body.getReader(), parts = [];
      const next = ()=> rd.read().then(c =>{
        if(c.done) return new Blob(parts, { type: type });
        parts.push(c.value); arm();
        return next();
      });
      return next();
    }).then(end, ()=> end(null));
  }
  function pump(){
    if(OFF || !started) return;
    let crit = false;
    for(const it of items.values()) if(it.tag <= CRIT && it.st !== 2){ crit = true; break; }
    /* the landing's files (CRIT) and anything a waiting slide asked for (GATE) by tag; the rest smallest first */
    const rank = it => it.tag <= GATE ? it.tag : 0;
    while(active < CONCURRENCY){
      let best = null;
      for(const it of items.values())
        if(it.st === 0 && (!best || rank(it) < rank(best) || (rank(it) === rank(best) && (it.size < best.size || (it.size === best.size && it.n < best.n))))) best = it;
      if(!best || ((crit || hold) && best.tag > CRIT)) return;   // the landing's own files have the line to themselves
      load(best);
    }
  }
  function whenDone(srcs, cb){
    const pend = srcs.map(s => items.get(s)).filter(it => it && it.st !== 2);
    let left = pend.length;
    if(!left){ cb(); return; }
    pend.forEach(it => it.cbs.push(()=>{ if(--left === 0) cb(); }));
  }
  /* the engine art a slide's KIND draws, which its card data does not name: the blocks, the people, the end screen */
  function slideArt(s){
    const d = s.data || {}, out = [], img = f => out.push("assets/" + f + "." + IMG_EXT);
    if(s.type !== "CELEBRATION"){ img("pv_rod11"); img("pv_cube10"); out.push("assets/nudge_hand_new.svg"); }
    [].concat(...(d.people || []).map(p => p.who), ...(d.total ? [d.total.who] : [])).forEach(w => out.push(pvChar(w)));
    (d.count_clips || []).forEach(id => out.push(vo(id)));
    if(s.type === "CELEBRATION"){ img("end_screen"); img("last_swifty_still"); img("last_swifty_end"); out.push(vo("sfx_celebrate")); }
    if(s.phase === "tutorial" && s.type !== "CELEBRATION") img("start_mascot");      // the tutorial card's Swiftie
    return out;
  }
  const PEEK = art("peeking_talk_up.webp");
  const FONTS = ["assets/fonts/baloo2-800.woff2", "assets/fonts/baloo2-700.woff2", "assets/fonts/baloo2-600.woff2"];
  function gateFiles(phase){ return [PEEK, vo(PHASE_GATE_VO[phase])].filter(Boolean); }
  function init(){
    if(items.size) return;
    /* CRIT: the landing - what the boot loader waits for */
    ["startnew_bg_plain.webp", "start_card.webp", "bg_landing_v3.webp", "pv_rod11.webp", "pv_cube4.webp", "pv_cube10.webp",
     "btn-play-round-waiting.svg", "btn-play-round.svg", "bgdeco_star.svg", "bgdeco_star_o.svg", "bgdeco_spark.svg",
     ...((CARD.landing_hero && CARD.landing_hero.people) || []).map(w => (pvChar(w, true) || pvChar(w)).slice(7)),
     ...PVLanding.files(CARD.landing_hero)].forEach(f => add("assets/" + f, CRIT));
    add(art("new_landing_swiftee_anim.webp"), CRIT);                                // Swiftee's wave (sgMascotPlayer reads its Blob)
    add(FONTS[0], CRIT);                                                            // the title's weight; the others next
    add(vo("vo_landing"), CRIT);
    /* each slide, in lesson order: whenSlide's lists */
    const ids = Object.keys(A.audio || {});
    (CARD.slides || []).forEach((s, i)=>{
      const t = JSON.stringify(s), list = FONTS.slice();                            // (every slide: no text in a fallback face)
      (t.match(/assets\/[\w\/.\-]+\.(?:webp|png|svg|jpg|gif|ogg|mp3)/g) || []).forEach(src => list.push(src));
      ids.forEach(k =>{ if(t.indexOf('"' + k + '"') >= 0) list.push(vo(k)); });
      slideArt(s).forEach(src => list.push(src));
      const prev = CARD.slides[i - 1];
      if(PHASE_GATE_TITLE[s.phase] && (!prev || prev.phase !== s.phase)) gateFiles(s.phase).forEach(src => list.push(src));
      perSlide[i] = [...new Set(list)].filter(known);
      perSlide[i].forEach(src => add(src, i));
    });
    /* ...and EVERY other shipped file: the bar reaches 100% only when the whole lesson is local */
    Object.keys(ASSET_SIZES).forEach(src => add(src, REST));
  }
  /* the spinner: a slide that is still waiting for its own files */
  let waiting = 0;
  function spin(on){
    let el = document.getElementById("assetWait");
    if(!el){ el = document.createElement("div"); el.id = "assetWait"; el.className = "asset-wait"; el.setAttribute("aria-hidden", "true"); document.body.appendChild(el); }
    waiting = Math.max(0, waiting + (on ? 1 : -1));
    el.classList.toggle("show", waiting > 0);
  }
  function whenSlide(i, cb, phase){
    if(OFF || !perSlide[i]){ cb(); return; }
    const srcs = perSlide[i].concat(phase ? gateFiles(phase) : []);
    const pend = srcs.filter(s =>{ const it = items.get(s); return it && it.st !== 2; });
    if(!pend.length){ cb(); return; }
    pend.forEach(s =>{ const it = items.get(s); if(it.st === 0 && it.tag > GATE) it.tag = GATE; });   // jump the queue
    start();
    let fired = false, spun = false;
    const t0 = setTimeout(()=>{ if(!fired){ spun = true; spin(true); } }, 300);
    const go = ()=>{ if(fired) return; fired = true; clearTimeout(t0); clearTimeout(t1); if(spun) spin(false); cb(); };
    const t1 = setTimeout(go, 8000);
    whenDone(pend, go);
  }
  function start(){ if(!started){ started = true; init(); } pump(); }
  /* critical(extra, cb): cb once the landing's own files are in, and the extra promise (Swiftee's wave) has settled */
  function critical(extra, cb){
    init(); hold = true; start();
    const crit = [...items.values()].filter(it => it.tag <= CRIT).map(it => it.src);
    let left = 2; const one = ()=>{ if(--left === 0) release(); };
    const release = ()=>{ if(!hold) return; hold = false; pump(); cb(); };
    whenDone(crit, one);
    if(extra && extra.then) extra.then(one, one); else one();
    setTimeout(release, 10000);                                  // (the boot loader's own watchdog lifts it then too)
  }
  /* blobOf(src): a promise of the file's Blob (null when it could not be fetched) - sgMascotPlayer's one download */
  function blobOf(src){
    return new Promise(res =>{
      if(!HTTP || !known(src)) return res(null);
      init(); const it = items.get(src);
      const give = ()=> res(blobs.get(src) || null);
      if(!it || it.st === 2) give(); else it.cbs.push(give);
    });
  }
  /* url(src): one shared blob: URL of a fetched file, else the file's own path */
  function url(src){
    if(!blobs.has(src)) return src;
    if(!urls.has(src)) urls.set(src, URL.createObjectURL(blobs.get(src)));
    return urls.get(src);
  }
  /* a fresh blob: URL of a fetched animation (it plays from frame 0), else the file with a cache-bust (file://) */
  function fresh(src){ const b = blobs.get(src); return b ? URL.createObjectURL(b) : src + "?r=" + Date.now(); }
  /* ---- blob: swap: an <img>/<audio>/<video> given a fetched file's path shows the local copy instead. Only at the
     moment it is given the path (never a picture already on screen: no flash), and not on the landing card, whose
     pencil rules match its src. data-asset keeps the path (srcOf). A blob: URL that errors goes back, once, to the
     file's own URL (and a playing clip resumes). */
  function swap(el){
    if(!el || el._noBlob || !el.getAttribute) return;
    const s = el.getAttribute("src");
    if(!s || !blobs.has(s) || (el.closest && el.closest("#startGate"))) return;
    el.setAttribute("data-asset", s);
    if(!el._blobFallback){
      el._blobFallback = true;
      el.addEventListener("error", function onErr(){
        if(!/^blob:/.test(el.getAttribute("src") || "")) return;
        el.removeEventListener("error", onErr); el._noBlob = true;
        const playing = el.tagName !== "IMG" && el._wantPlay;
        el.setAttribute("src", el.getAttribute("data-asset"));
        if(playing && el.play) el.play().catch(()=>{});
      });
      if(el.tagName !== "IMG"){ el.addEventListener("play", ()=>{ el._wantPlay = true; }); el.addEventListener("pause", ()=>{ el._wantPlay = false; }); }
    }
    el.setAttribute("src", url(s));
  }
  const SWAP_SEL = "img[src],audio[src],video[src],source[src]";
  if(HTTP && !OFF && typeof MutationObserver === "function"){
    new MutationObserver(recs =>{
      for(const r of recs){
        if(r.type === "attributes"){ if(r.target.matches && r.target.matches(SWAP_SEL)) swap(r.target); continue; }
        r.addedNodes.forEach(n =>{
          if(n.nodeType !== 1) return;
          if(n.matches(SWAP_SEL)) swap(n);
          if(n.firstElementChild) n.querySelectorAll(SWAP_SEL).forEach(swap);
        });
      }
    }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
  }
  return { CRIT: CRIT, GATE: GATE, UI: UI, REST: REST, start: start, critical: critical, whenSlide: whenSlide,
           ready: ready, blob: src => blobs.get(src) || null, blobOf: blobOf, url: url, fresh: fresh };
})();
/* srcOf(el): the file an element shows - its path, even while it plays a blob: URL of it (Assets) */
function srcOf(el){ return el ? (el.getAttribute("data-asset") || el.getAttribute("src") || "") : ""; }

/* ---------- 15. BOOT ---------- */
function boot(){
  /* [14] activity_launched - once, at mount */
  try{ XAPI.once("activity_launched", { skill_code: CARD.skill_code, title: (CARD.title&&CARD.title.en)||"" }); }catch(e){}
  // god-mode visual theme (opt-in via CARD.theme) — warms the whole stage; scoped CSS under .thm-*
  if(CARD.theme) $("stage").classList.add("thm-" + CARD.theme);
  // banner title = skill name only (strip "(भाग…)" and the ": letters" list)
  $("sgTitle").textContent = (CARD.title.hi || "").split(/[:：(]/)[0].trim();
  // VISUAL-FIRST landing hero: SHOW the concept (shapes row / a finger-hand / an image), not just the title text
  (function(){ const hero = CARD.landing_hero, el = $("sgHero"); if(!hero || !el) return;
    if(hero.kind === "concept_strip"){
      // r4/#2: each cell is a .sg-acell (keeps the staggered fingerPop pop-in) wrapping a visual example.
      el.innerHTML = (hero.cells || []).map(c => `<div class="sg-acell">${conceptTileHTML(c)}</div>`).join("");
      /* HI01 PARITY: the early `return` here kept MTG's own landing type scale - 60px title and a
         150px content margin - by skipping the .compact / .has-hero classes every other hero kind
         adds. That is the whole remaining title-size and spacing gap against HI01, which runs the
         42px compact title and a 120px has-hero margin. Falling through instead of returning. */
    }
    if(hero.kind === "shapes" && typeof shapeSVG === "function")
      el.innerHTML = (hero.shapes||[]).map(s=> shapeSVG(s.shape, {color:s.color, size:104, rotate:s.rotate||0})).join("");
    else if(hero.kind === "count"){
      // counting game: preview the WHOLE 1..n sequence — a row of hands (1,2,3…), each with its Arabic numeral
      const hi = Math.min(Math.max(parseInt(hero.n,10)||3, 1), 5);   // clamp to available hand art (1..5)
      let cells = "";
      for(let i=1;i<=hi;i++){
        cells += `<div class="sg-hand-cell">${fingerCount(i, "sg-hand")}<span class="sg-hand-num">${devNumeral(i)}</span></div>`;
      }
      el.innerHTML = cells;
    }
    else if(hero.kind === "image") el.innerHTML = `<img src="${hero.src}" alt="">`;
    else if(hero.kind === "pv_story" || hero.kind === "pv_eq") el.innerHTML = PVLanding.html(hero);   // [landing pv]
    /* MTG2A01_L04_S01: the deck's page 1 shows "20 − 10 = ?" - a small equation pill over the sibling's castle scene
       (landing_hero.eq: [a, op, b]); it pops in with the greeting, before the children arrive */
    if(hero.kind === "pv_story" && hero.eq && el.innerHTML){ const sg = el.querySelector("#sgp");
      const n = (v, c)=> '<span class="sgq-n ' + (c || "") + '">' + v + '</span>', o = t => '<span class="sgq-op">' + t + '</span>';
      if(sg) sg.insertAdjacentHTML("afterbegin", '<div class="sgq">' + n(hero.eq[0]) + o(hero.eq[1]) + n(hero.eq[2]) + o("=") + n("?", "sgq-q") + '</div>');  const ct = el.closest(".sg-content"); if(ct) ct.classList.add("has-eq"); }
    if(el.innerHTML){ el.classList.add("show"); $("sgTitle").classList.add("compact");
      const c = el.closest && el.closest(".sg-content"); if(c){ c.classList.add("has-hero");
        // SME (S01 review deck): landing reads TITLE first, image BELOW it, image smaller.
        if(hero.title_first) c.classList.add("title-first"); } }
  })();

  // ----- landing-screen welcome VO (lead review) -----
  // A warm greeting on the title screen. Autoplay is often blocked before a gesture, so we also
  // (a) expose a pulsing 🔊 "listen" button, and (b) fire it on the first pointer-down. The whole
  // greeting lives HERE now (not on slide 0), which also kills the old overlap glitch where the
  // landing VO and slide-0 VO could talk over each other.
  const landSrc = (CARD.assets && CARD.assets.audio && CARD.assets.audio["vo_landing"]) || ("assets/voiceover/vo_landing." + AUDIO_EXT);
  /* ---- PLAY BUTTON WAITS FOR THE GREETING, THEN POPS (as HI02H11_L01_S01, the reference game) ----
     While the landing greeting speaks, the play button is shown but DISABLED in its grey waiting art
     (btn-play-blob-waiting.svg) - a bright button that ignores taps reads as broken. When the greeting
     ENDS it swaps to the gold art with a one-shot pop + gold ring (.sg-pop), and becomes tappable.
     If the child then does nothing for 5s it starts the strong idle pulse (.idle-pulse, the reference's
     sgBtnPulseStrong); any tap on the landing restarts that 5s timer.
     "Heard" means the clip really played to its end (voEl.ended). When the browser BLOCKS autoplay the
     button stays grey and the child's first tap - anywhere, the grey button included - starts the
     greeting, so the pop still lands exactly when the greeting ends. Never strands the child: an 18s
     watchdog releases the button even if the greeting never reports back at all.
     NB the waiting state is .sg-waiting + aria-disabled, NOT the disabled attribute - a disabled
     button swallows the tap that has to start a blocked greeting. */
  let _greetingHeard = false, _startIdleT = 0, _startWatchT = 0, _starting = false;
  const onLandingNow = ()=> { const g = $("startGate"); return g && !g.classList.contains("hidden"); };
  const startWaiting = ()=>{ const b = $("sgBtn"); return !b || b.classList.contains("sg-waiting"); };
  const disarmStartPulse = ()=>{ clearTimeout(_startIdleT); _startIdleT = 0; const b = $("sgBtn"); if(b) b.classList.remove("idle-pulse"); };
  const armStartPulse = ()=>{
    disarmStartPulse();
    /* QA checklist 2026-10-05: "the Play button pulsates immediately after the VO is complete" - it starts pulsing as
       its one-shot pop settles (was: only after 5s untouched) */
    _startIdleT = setTimeout(()=>{ const b = $("sgBtn"); if(b && !startWaiting() && onLandingNow()) b.classList.add("idle-pulse"); }, 600);
  };
  const setStartBtnReady = (ready)=>{
    const b = $("sgBtn"); if(!b) return;
    const img = b.querySelector("img");
    const was = !startWaiting();
    b.disabled = false;
    b.classList.toggle("sg-waiting", !ready);
    b.setAttribute("aria-disabled", ready ? "false" : "true");
    if(img) img.src = ready ? "assets/btn-play-round.svg" : "assets/btn-play-round-waiting.svg";   // HI02H11_L01_S01's round play button (review 2026-10-06)
    if(!ready){ disarmStartPulse(); b.classList.remove("sg-pop"); return; }
    if(!was){ b.classList.remove("sg-pop"); void b.offsetWidth; b.classList.add("sg-pop");
      setTimeout(()=> b.classList.remove("sg-pop"), 900); }
    armStartPulse();
  };
  setStartBtnReady(false);   // grey + disabled from first paint, until the greeting has been heard
  /* [landing intro] the gold pop waits for the whole intro too (title words -> cubes -> lines, "sg-intro-done"),
     so the button is the LAST thing to arrive (review 2026-09-29). The 18s watchdog still forces it - never stranded. */
  let _releasePending = false;
  const releaseStart = (force)=>{ if(!force && !window.__sgIntroDone){ _releasePending = true; return; }
    clearTimeout(_startWatchT); _releasePending = false; if(onLandingNow()) setStartBtnReady(true); };
  document.addEventListener("sg-intro-done", ()=>{ if(_releasePending) releaseStart(); });
  const playLanding = ()=>{
    if(!onLandingNow()) return;
    document.dispatchEvent(new Event("sg-greeting-start"));                  // (the cube row's watchdog counts from here)
    clearTimeout(_startWatchT); _startWatchT = setTimeout(()=> releaseStart(true), 18000);   // watchdog (forces it; 18s: the intro now starts on "आज", ends ~13.5s)
    /* released only when the greeting was really heard; a blocked/failed start leaves it grey for the
       child's first tap (or the watchdog) */
    /* review 2026-10-05: "why is the sound box getting disabled - this should not happen anywhere in the game": the
       speaker is never greyed out (the QA checklist's disabled-while-the-greeting-speaks state is gone). A tap while the
       greeting is still playing is ignored, as on every speaker (replayTap), so it never restarts the line mid-way. */
    play(landSrc, ()=>{ if(voEl.ended){ _greetingHeard = true; releaseStart(); } });
  };
  // any tap on the landing restarts the 5s idle timer (only once the button is live)
  window.addEventListener("pointerdown", ()=>{ if(onLandingNow() && !startWaiting()) armStartPulse(); }, true);
  const sgVo = $("sgVo"); if(sgVo) sgVo.onclick = (e)=>{ e.stopPropagation();
    if(replayTap(null, "landing_chip")) playLanding(); };   // [QA 11] the landing chip reports audio_replayed too
  /* ---- [landing mascot player] (review 2026-09-29: "swifty is getting glitched ... at the starting only"). Measured
     on the landing with a frame-by-frame screen recording: in about half the loads Chrome paints NOTHING where Swifty
     is for 1-2 frames, exactly when the <img>'s animated WebP (alpha) steps to its next frame while the landing
     is busy starting up - with the original HI01 file too. A canvas cannot blink like that: it keeps its last picture
     until the next one is drawn. So where the browser can decode the file itself (WebCodecs ImageDecoder), Swifty is
     drawn on a canvas at its displayed size, the next frame always decoded ahead. Anything missing or failing (no
     ImageDecoder, a decode error, not ready when the loader lifts) keeps the plain <img> and its restart below.
     [loading] ONE download (2026-10-01): the clip used to be fetched for the decoder AND pulled by the <img src> beside
     it - 1.6MB twice on the landing's critical path, and once more by the ?r= restart. The <img> has only a data-src
     now: the file is fetched once (index.html starts it with the page, on http(s)), the decoder reads those bytes,
     and the <img> path shows them as a blob: URL. file:// can't fetch(): there the plain <img src>, as before.
     `ready` settles once Swiftee can be shown - one of the things the boot loader waits for. ---- */
  const sgMascotPlayer = (()=>{
    const img = document.querySelector(".sg-mascot");
    if(!img) return null;
    const url = img.getAttribute("data-src") || (img.getAttribute("src") || "").split("?")[0], TYPE = "image/webp";
    let dec = null, count = 0, first = null, ok = false, dead = false, blob = null, blobUrl = "", pending = true;
    const shown = ()=> new Promise(res =>{
      if(img.complete && img.naturalWidth) return res();
      img.onload = ()=> res(); img.onerror = ()=>{ img.style.display = "none"; res(); };
    });
    const show = src =>{ img.removeAttribute("data-src"); img.src = src; return shown(); };
    const ready = (async ()=>{                                     // fetch + decode start at once, under the loader
      let buf = null;
      try{ const b = await Assets.blobOf(url); if(b){ blob = new Blob([b], { type: TYPE }); buf = await blob.arrayBuffer(); } }catch(e){}   // the loader's one download (Assets, CRIT)
      if(!buf){ pending = false; return show(url); }
      try{
        if(typeof ImageDecoder !== "undefined" && !(ImageDecoder.isTypeSupported && !(await ImageDecoder.isTypeSupported(TYPE)))){
          dec = new ImageDecoder({ data: buf, type: TYPE });
          await dec.tracks.ready; count = dec.tracks.selectedTrack.frameCount;
          first = (await dec.decode({ frameIndex: 0 })).image;
          ok = count > 0 && !dead;
        }
      }catch(e){ ok = false; }
      pending = false;
      if(!ok) return show(blobUrl = URL.createObjectURL(blob));
    })().catch(()=>{ ok = false; pending = false; });
    function start(){                                              // the loader lifting; false = keep the <img>
      if(!ok || !img.isConnected){ dead = true; return false; }
      try {
        const r = img.getBoundingClientRect(), W = Math.max(1, Math.round(r.width * (window.devicePixelRatio || 1)));
        const H = Math.max(1, Math.round(W * first.displayHeight / first.displayWidth));
        const cv = document.createElement("canvas"); cv.className = img.className; cv.width = W; cv.height = H;
        cv.setAttribute("role", "img"); cv.setAttribute("aria-label", img.getAttribute("alt") || "");
        const ctx = cv.getContext("2d"); ctx.imageSmoothingQuality = "high";
        const draw = f => { ctx.clearRect(0, 0, W, H); ctx.drawImage(f, 0, 0, W, H); };   // one task: never shown half-drawn
        draw(first); img.replaceWith(cv);
        let i = 0, cur = first, due = performance.now() + (cur.duration || 90000) / 1000;   // VideoFrame.duration is in us
        let next = count > 1 ? dec.decode({ frameIndex: 1 }) : null;
        const step = async ()=>{
          if(!next){ cur.close(); dec.close(); return; }             // plays once: the last frame stays drawn
          let n; try { n = (await next).image; } catch(e){ return; }  // a failed decode: the frame on show simply stays
          const wait = due - performance.now();
          if(wait > 1) await new Promise(res => setTimeout(res, wait));
          draw(n); cur.close(); cur = n; i++;
          due = Math.max(due, performance.now() - 30) + (n.duration || 90000) / 1000;
          next = i + 1 < count ? dec.decode({ frameIndex: i + 1 }) : null;   // decoded while this one is on show
          step();
        };
        step();
        return true;
      } catch(e){ dead = true; return false; }
    }
    /* the plain <img>: the wave from frame 0 again - a fresh blob: URL of the same bytes (file://: a cache-bust of the
       local file). Still downloading (the watchdog lifted the loader first): it shows from frame 0 when it lands. */
    function restart(){
      if(!img.isConnected || pending) return;
      const old = blobUrl;
      if(blob){ img.src = blobUrl = URL.createObjectURL(blob); if(old) URL.revokeObjectURL(old); }
      else img.src = url + "?r=" + Date.now();
    }
    return { start, restart, ready };
  })();
  // ---- [engine JS] r4/P2 boot loader: the loader until the LANDING's own files are in (Assets: CRIT + Swiftee's wave),
  // then it dismisses ITSELF into the landing (NO tap gate) - the rest of the lesson keeps loading behind the landing.
  // A 10s watchdog never strands the child; .done dedups the two. The same handler adds body.loaded (unblocks the
  // concept-strip stagger) and fires the landing VO. play() absorbs an autoplay block; the pulsing 🔊 chip is the fallback.
  // ===== QA CHECKLIST [02]: PRELOAD BEFORE THE START SCREEN - since 2026-10-01 only what the START SCREEN shows. It
  // used to be every image and clip of the lesson ([loading], Assets); each slide now waits for its own files instead
  // (mountSlide), so art and VO still never pop in mid-lesson. A FAILED ASSET COUNTS AS DONE: a 404 never strands. ----
  (function(){
    const bl = $("bootLoader");
    if(!bl){ document.body.classList.add("loaded"); playLanding(); Assets.start(); return; }
    const ready = ()=>{
      if(bl.classList.contains("done")) return;   // the files + the watchdog both land here → dedup
      bl.classList.add("done");
      document.body.classList.add("loaded");       // starts the .sg-acell pop chain
      /* [QA 03] the landing wave plays ONCE (the .webp's loop count is 1). It decodes under the loader, so without a
         restart the one wave would be spent before the child sees it: the moment the loader lifts it starts again
         from frame 0 - on the canvas player, or a fresh blob: URL of the same bytes (no second download). */
      if(sgMascotPlayer && !sgMascotPlayer.start()) sgMascotPlayer.restart();
      playLanding();
      setTimeout(()=> bl.remove(), 450);
    };
    Assets.critical(sgMascotPlayer && sgMascotPlayer.ready, ready);
    setTimeout(ready, 10000);   // hard watchdog: never strand the child on the loader
  })();
  // landing VO best-effort on first interaction too (some browsers block autoplay pre-gesture)
  /* ...but not when the greeting has already been heard or is playing now, and never on the play button
     itself - tapping the live gold button used to restart the greeting a split second before its click
     silenced it again. */
  window.addEventListener("pointerdown", function once(ev){ window.removeEventListener("pointerdown", once);
    if(ev && ev.target && ev.target.closest && ev.target.closest("#sgBtn")) return;
    if(!_greetingHeard && !isPlaying) playLanding(); }, { once:true });

  $("sgBtn").onclick = ()=>{
    if(startWaiting()){                 // still waiting for the greeting: a tap can only START it
      if(!_greetingHeard && !isPlaying) playLanding();
      return;
    }
    if(_starting) return;  // a second tap while slide 0's files finish loading
    disarmStartPulse(); clearTimeout(_startWatchT);
    stopAudio();          // silence the landing greeting BEFORE slide 0 speaks (no VO overlap)
    sfxPlay();            // QA checklist 2026-10-05: the standard play button SFX
    bgmStart();           // ...and the background music starts on this tap (never before it)
    _ac();                // unlock/resume WebAudio on the start gesture so the first clip never clips
    Screen.fullscreen();  // [responsive] a phone/tablet browser: the whole screen, held in landscape (Android)
    // [engine JS] r4/P1: peek gate into the tutorial. The landing stays visible-and-BLURRED behind the
    // peeking Swiftie + "चलिए शुरू करें"; it hides once the tutorial mounts (in the callback).
    // [loading] the gate's Swiftie and slide 0 are almost always in long before this tap; if not, a spinner holds here.
    _starting = true;
    Assets.whenSlide(0, ()=>{
      _gatedPhases.add("tutorial");
      phaseBlurTransition(()=>{
        _starting = false;
        $("startGate").classList.add("hidden");
        document.body.classList.remove("is-start");   // blue bg only on the title screen
        mountSlide(0);
      }, "tutorial");
    }, "tutorial");
  };

  // tapping आगे clears any pending nav-nudge, and sounds the standard next-button SFX
  $("navBtn").addEventListener("click", ()=>{ clearTimeout(state.navNudgeTimer); stopNudge(); sfxNext(); });
  /* [12][14] QA CHECKLIST: "hint_used event fires on every bulb tap." Each slide
     module rebinds $("hintBtn").onclick with its own `if(state.locked ...) return`
     guard, and only two of those seven handlers ever emitted hint_shown - so most
     bulb taps sent nothing. This capture-phase listener sits ahead of all of them
     and is the single place the verb is raised. */
  $("hintBtn").addEventListener("click", ()=>{
    const sl = CARD.slides[state.idx] || {};
    state.hintUsed = true;
    try{ XAPI.send("hint_used", { slide_id: sl.id, phase: sl.phase, type: sl.type },
                   { attempt: state.attempts }); }catch(e){}
  }, true);
  // [engine JS] r4 dev jump: ?slide=N skips the loader+gate and mounts slide N directly (QA/capture only)
  (function(){
    const j = parseInt(new URLSearchParams(location.search).get("slide"), 10);
    if(isNaN(j)) return;
    const bl = $("bootLoader"); if(bl) bl.remove();
    document.body.classList.add("loaded");
    $("startGate").classList.add("hidden");
    document.body.classList.remove("is-start");
    mountSlide(Math.max(0, Math.min(j, CARD.slides.length - 1)));
  })();
  // when the web font finishes loading, re-centre glyphs (metrics change vs fallback)
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(()=> centerAllGlyphs()); }
  // dev banner if ?dev=1 — show empty initially
  /* [QA 01] ?dev=1 JUMP PANEL. This engine revision shipped the dev BANNER but
     never the slide navigator - HI01 gained it in a later block (its line 7503)
     that MTG predates, which is why ?dev=1 looked like it "did nothing" here.
     buildDevNav() is ported verbatim; ?nav=1 is accepted too, as in HI01. */
  if(new URLSearchParams(location.search).has("dev") || new URLSearchParams(location.search).has("nav")){
    $("devBanner").textContent = "engine ready · slides=" + CARD.slides.length;
    $("devBanner").className = "dev-banner show";
    buildDevNav();
  }
}
/* ===== FLN ANIMATION KIT: core BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion = window.FLNMotion || {};
  M.still = function(){
    try{ return document.documentElement.classList.contains("no-anim") ||
      (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
    catch(_){ return false; }
  };
  M.scale = function(){
    try{ return parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue("--scale")) || 1; }catch(_){ return 1; }
  };
  M.rect = function(r, sw){                    // screen rect -> stage coords (R1/R2)
    var s = M.scale();
    if(document.documentElement.classList.contains("rotated")){
      return { left:(r.top - sw.top)/s, top:(sw.right - r.right)/s, w:r.height/s, h:r.width/s };
    }
    return { left:(r.left - sw.left)/s, top:(r.top - sw.top)/s, w:r.width/s, h:r.height/s };
  };
  M.guard = function(fn){                      // R4
    try{ fn(); }catch(e){ try{ console.warn("[animation-kit]", e && e.message); }catch(_){} }
  };
  var _actx = null;
  M.audio = function(){
    try{
      var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
      _actx = _actx || new AC();
      if(_actx.state === "suspended") _actx.resume();
      return _actx;
    }catch(_){ return null; }
  };
  M.ready = function(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  };
})();
/* ===== FLN ANIMATION KIT: core END ===== */

/* ===== FLN ANIMATION KIT: sky-drift BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;

  function build(o){
    var sky = typeof o.container === "string" ? document.querySelector(o.container) : o.container;
    if(!sky) return null;
    sky.textContent = "";
    var maxSize = 0, frag = document.createDocumentFragment();

    /* [landing card clear] every lane STARTS just outside the centre card, never behind it.
       The sky and the card share the viewport centre (body flex-centres the stage, the gate
       flex-centres the card), so per lane: distance from centre to where the ray leaves the
       card box (1114x456 design px x --scale) + the element's half-size + a gap, in vmax.
       Before this every star launched at a flat r0 = 22vmax - well inside the card - and slid
       out from under it. */
    var clear = null;
    if(o.avoid && document.querySelector(o.avoid)){
      var sc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
      var vmaxPx = Math.max(document.documentElement.clientWidth, document.documentElement.clientHeight) / 100 || 1;
      clear = { hw:(o.avoidBox[0] / 2) * sc / vmaxPx, hh:(o.avoidBox[1] / 2) * sc / vmaxPx, gap:o.avoidGap * sc / vmaxPx };
    }
    function startR(cos, sin, size){
      if(!clear) return o.r0;
      var t = Math.min(Math.abs(cos) > 1e-6 ? clear.hw / Math.abs(cos) : Infinity,
                       Math.abs(sin) > 1e-6 ? clear.hh / Math.abs(sin) : Infinity);
      return Math.max(o.r0, t + size * 0.75 + clear.gap);   // 0.75: half-size + the glow halo
    }

    o.layers.forEach(function(L, li){
      for(var i = 0; i < o.lanes; i++){
        var a = ((360 / o.lanes) * i + L.rot) * Math.PI / 180;
        var cos = Math.cos(a), sin = Math.sin(a);
        var size = +((o.size[0] + Math.random() * (o.size[1] - o.size[0])) * L.scale).toFixed(2);
        if(size > maxSize) maxSize = size;
        var dur = +(o.dur[0] + Math.random() * (o.dur[1] - o.dur[0])).toFixed(1);
        var el = document.createElement("i"), r0 = startR(cos, sin, size);
        el.className = o.shapes[(i + li) % o.shapes.length];
        el.style.cssText =
          "--s:"  + size + "vmax;" +
          "--x1:" + (r0 * cos).toFixed(2) + "vmax;--y1:" + (r0 * sin).toFixed(2) + "vmax;" +
          "--x2:" + (o.r1 * cos).toFixed(2) + "vmax;--y2:" + (o.r1 * sin).toFixed(2) + "vmax;" +
          "--t:"  + dur + "s;" +
          "--d:-" + (Math.random() * dur).toFixed(1) + "s;" +     // negative = de-sync
          "--g:"  + (o.glow[0] + Math.random() * (o.glow[1] - o.glow[0])).toFixed(1) + "s;" +
          "--gd:-" + (Math.random() * 4).toFixed(1) + "s;" +
          "--o:"  + (o.opacity[0] + Math.random() * (o.opacity[1] - o.opacity[0])).toFixed(2) + ";";
        frag.appendChild(el);
      }
    });
    sky.appendChild(frag);

    // collision proof: lane arc at the tightest radius must be >= 1.5x the largest element
    var arc = (2 * Math.PI * o.r0) / o.lanes, ok = arc >= maxSize * 1.5;
    if(!ok && o.warn !== false){
      console.warn("[animation-kit] sky lanes too tight: arc " + arc.toFixed(2) +
        "vmax vs element " + maxSize.toFixed(2) + "vmax. Reduce lanes or size.");
    }
    return { arc:arc, maxSize:maxSize, safe:ok, count:sky.children.length };
  }

  M.sky = {
    defaults: {
      container:".sg-sky", lanes:29,
      layers:[{rot:0,scale:1},{rot:6.2,scale:0.62},{rot:-6.2,scale:0.55}],
      r0:22, r1:72, size:[0.8,2.6], dur:[18,34], glow:[3.0,4.8],
      opacity:[0.62,0.92], shapes:["s1","s2","s3","s4","s5"], warn:true,
      avoid:".sg-card", avoidBox:[1114,456], avoidGap:24   // [landing card clear] design px
    },
    init: function(opts){
      var o = Object.assign({}, this.defaults, opts || {}), res = null;
      this._last = opts;
      M.guard(function(){ res = build(o); });
      return res;
    }
  };
  M.ready(function(){ M.guard(function(){ if(!window.__skyManual) M.sky.init(); }); });
  /* the card's size in vmax changes with aspect ratio (rotation, split-screen), so re-plan the
     lanes after a resize settles - otherwise start points drift back inside the card. */
  var skyRz = 0;
  window.addEventListener("resize", function(){
    clearTimeout(skyRz);
    skyRz = setTimeout(function(){ M.guard(function(){ if(!window.__skyManual) M.sky.init(M.sky._last); }); }, 250);
  });
})();
/* ===== FLN ANIMATION KIT: sky-drift END ===== */

/* ===== FLN ANIMATION KIT: sky-burst BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;

  function boom(o){                      // sine thud + noise tail + square crackles
    var actx = M.audio(); if(!actx) return;
    try{
      var t = actx.currentTime, out = actx.createGain();
      out.gain.value = o.volume; out.connect(actx.destination);

      var tg = actx.createGain();
      tg.gain.setValueAtTime(0.9, t);
      tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      tg.connect(out);
      var osc = actx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);
      osc.connect(tg); osc.start(t); osc.stop(t + 0.18);

      var n = actx.sampleRate * 0.45;
      var buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
      for(var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
      var src = actx.createBufferSource(); src.buffer = buf;

      for(var c = 0; c < o.crackles; c++){
        var cg = actx.createGain(), ct = t + 0.10 + Math.random() * 0.30;
        cg.gain.setValueAtTime(0.0001, ct);
        cg.gain.exponentialRampToValueAtTime(0.18, ct + 0.006);
        cg.gain.exponentialRampToValueAtTime(0.0001, ct + 0.07);
        cg.connect(out);
        var co = actx.createOscillator();
        co.type = "square";
        co.frequency.setValueAtTime(1500 + Math.random() * 2200, ct);
        co.connect(cg); co.start(ct); co.stop(ct + 0.08);
      }
      var bp = actx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = 3400; bp.Q.value = 0.8;
      var ng = actx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      src.connect(bp); bp.connect(ng); ng.connect(out); src.start(t + 0.02);
    }catch(_){}
  }

  function pop(el, r, o){
    el.classList.add("popped");
    // respawn on the next FLIGHT lap - the glow cycle is much shorter, so filter by name
    el.addEventListener("animationiteration", function back(e){
      if(e.animationName !== "sgFly") return;
      el.classList.remove("popped");
      el.removeEventListener("animationiteration", back);
    });

    var kind = "k-dot", cls = el.classList;
    for(var ci = 0; ci < cls.length; ci++){ if(o.kind[cls[ci]]) kind = o.kind[cls[ci]]; }

    var bs = Math.max(11, r.width);
    var b = document.createElement("div");
    b.className = "sg-burst " + kind;
    b.style.left = (r.left + r.width / 2) + "px";
    b.style.top  = (r.top  + r.height / 2) + "px";
    b.style.setProperty("--bs", bs + "px");
    b.appendChild(document.createElement("div")).className = "fl";

    var k = 0;
    for(var g = 0; g < o.rings.length; g++){
      var R = o.rings[g], off = Math.random() * Math.PI * 2;
      for(var i = 0; i < R.n; i++, k++){
        var a = off + i / R.n * Math.PI * 2;
        var dist = bs * R.rad * (0.78 + Math.random() * 0.44);
        var p = document.createElement("i");
        p.style.cssText =
          "--ps:"  + (bs * R.size * (0.8 + Math.random() * 0.5)).toFixed(1) + "px;" +
          "--dx:"  + (Math.cos(a) * dist).toFixed(1) + "px;" +
          "--dy:"  + (Math.sin(a) * dist).toFixed(1) + "px;" +
          "--gy:"  + (dist * o.gravity).toFixed(1) + "px;" +
          "--sd:"  + (R.dur + Math.random() * 0.22).toFixed(2) + "s;" +
          "--sdl:" + (Math.random() * 0.06).toFixed(3) + "s;" +
          "color:" + o.hues[k % o.hues.length];
        b.appendChild(p);
      }
    }
    document.body.appendChild(b);
    if(o.sound) boom(o);
    setTimeout(function(){ b.remove(); }, o.life);
  }

  M.skyBurst = {
    defaults: {
      container:".sg-sky", when:["is-start","is-end"],
      rings:[{n:9,rad:3.1,size:.58,dur:.80},{n:7,rad:1.8,size:.78,dur:.62}],
      hues:["#FCB717","#3B7DD8","#21A74A","#E5484D","#7048D6","#F1781D"],
      kind:{s1:"k-star",s2:"k-star",s3:"k-spark",s4:"k-dot",s5:"k-dot"},
      gravity:0.42, pad:12, padRatio:0.7, minAlpha:0.08, life:1200,
      sound:true, volume:0.22, crackles:4
    },
    init: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        var sky = typeof o.container === "string"
          ? document.querySelector(o.container) : o.container;
        if(!sky) return;
        // capture phase: .sg-sky is pointer-events:none, so hit-test by rect (R6)
        document.addEventListener("pointerdown", function(e){
          if(M.still()) return;
          if(!o.when.some(function(c){ return document.body.classList.contains(c); })) return;
          var els = sky.querySelectorAll("i:not(.popped)");
          for(var i = 0; i < els.length; i++){
            var el = els[i], r = el.getBoundingClientRect();
            if(r.width < 2) continue;
            var pad = Math.max(o.pad, r.width * o.padRatio);   // ~4px targets need slack
            if(e.clientX < r.left - pad || e.clientX > r.right  + pad ||
               e.clientY < r.top  - pad || e.clientY > r.bottom + pad) continue;
            if(parseFloat(getComputedStyle(el).opacity) < o.minAlpha) continue;
            // claim the tap, or it also fires the button under the star
            e.stopPropagation(); e.preventDefault();
            pop(el, r, o);
            return;
          }
        }, true);
      });
    }
  };
  M.ready(function(){ M.guard(function(){ M.skyBurst.init(); }); });
})();
/* ===== FLN ANIMATION KIT: sky-burst END ===== */

/* ===== FLN ANIMATION KIT: still-switch BEGIN ===== */
/* R5, second half. The kit's M.still() and the shipped starBurst both READ
   html.no-anim, but nothing in this activity ever SET it and there was no
   ?still=1 handler at all - so the kill-switch was unreachable. */
(function(){ "use strict";
  try{
    var q = new URLSearchParams(location.search);
    if(q.has("still") || (window.matchMedia &&
       matchMedia("(prefers-reduced-motion: reduce)").matches)){
      document.documentElement.classList.add("no-anim");
    }
  }catch(_){}
})();
/* ===== FLN ANIMATION KIT: still-switch END ===== */

/* ===== FLN ANIMATION KIT: nudge BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  function place(el, o){
    var nh = document.getElementById(o.hand); if(!nh || !el) return;
    var host = document.querySelector(o.host); if(!host) return;
    var r = el.getBoundingClientRect(), sw = host.getBoundingClientRect(), s = M.scale();
    nh.style.left = ((r.left - sw.left)/s + r.width/s/2 + o.dx) + "px";
    nh.style.top  = ((r.top  - sw.top )/s + r.height/s   + o.dy) + "px";
    nh.classList.add("show");
  }
  M.nudge = {
    defaults:{ hand:"nudgeHand", host:".slide-stage", dx:-34.2, dy:-7.8, oneHand:true },   /* [QA 12] fingertip 8px below target */
    pointAt: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(M.still()) return;
        if(o.oneHand) document.querySelectorAll(".demo-hand").forEach(function(h){ h.remove(); });
        place(el, o);
      });
    },
    after: function(target, ms, opts){            // returns cancel()
      var o = Object.assign({}, this.defaults, opts || {}), t = null;
      M.guard(function(){
        if(!ms || M.still()) return;
        t = setTimeout(function(){
          var el = (typeof target === "string") ? document.querySelector(target) : target;
          if(el) place(el, o);
        }, ms);
      });
      return function(){ clearTimeout(t); };
    },
    hide: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      var nh = document.getElementById(o.hand); if(nh) nh.classList.remove("show");
    }
  };
})();
/* ===== FLN ANIMATION KIT: nudge END ===== */

/* ===== FLN ANIMATION KIT: confetti BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  function rnd(a, b){ return a + Math.random() * (b - a); }

  M.confetti = {
    defaults: {
      host:".stage-inner", count:80, stagger:0.35,
      fall:[1.1,1.8], drift:45, sway:[10,34], bob:[3,7],
      rockT:[0.6,1.2], tumbleT:[0.75,1.5], tumbleShare:0.22,
      amp:[28,52], yaw:30, depth:[0.75,1.15], tilt:25,
      /* weighted: star 40%, rectangle 20%, line 20%, square 20%.
         Repeat an entry to weight it - the array is sampled uniformly. */
      shapes:["st","st","st","st","rc","rc","ln","ln","sq","sq"],
      /* VIBGYOR. Front/back pairs - the back is the SAME hue darkened, never a
         different hue, or it reads as two pieces flickering instead of one turning. */
      colors:[["#8B2FC9","#5E1C8C"],   /* violet */
              ["#3F51B5","#27358A"],   /* indigo */
              ["#1E88E5","#135FA6"],   /* blue   */
              ["#22B24C","#157A34"],   /* green  */
              ["#FFD21E","#D9A800"],   /* yellow */
              ["#FF8A1E","#C75F00"],   /* orange */
              ["#E5322D","#A81F1B"]],  /* red    */
      phases:["guided","practice","mastery"]   /* [] disables phase gating */
    },
    burst: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(M.still()) return;
        /* confetti ONLY on activity phases - never tutorials, demos, landing, transitions */
        if(o.phases.length && o.phase && o.phases.indexOf(o.phase) < 0) return;
        var host = document.querySelector(o.host); if(!host) return;

        var dist = host.clientHeight + 60, maxLife = 0;
        var wrap = document.createElement("div");
        wrap.className = "fx-confetti";

        for(var i = 0; i < o.count; i++){
          var z     = rnd(o.depth[0], o.depth[1]);        /* depth */
          var fall  = rnd(o.fall[0], o.fall[1]) / z;      /* nearer = bigger = faster */
          var delay = rnd(0, o.stagger);
          if(fall + delay > maxLife) maxLife = fall + delay;
          var pair = o.colors[i % o.colors.length];
          /* most pieces flutter (face stays visible); a minority go end-over-end */
          /* Two regimes, and a real plate moves DIFFERENTLY in each:
             flutter = zigzags hard, almost no net sideways drift;
             tumble  = autorotation gives a steady lateral force, so it barely
                       zigzags but drifts consistently to one side. */
          var flutter = Math.random() > o.tumbleShare;
          var rockT   = flutter ? rnd(o.rockT[0], o.rockT[1])
                                : rnd(o.tumbleT[0], o.tumbleT[1]);
          var sway    = flutter ? rnd(o.sway[0], o.sway[1]) : rnd(2, 8);
          var drift   = flutter ? rnd(-o.drift/2.5, o.drift/2.5) : rnd(-o.drift, o.drift);
          var bob     = flutter ? rnd(o.bob[0], o.bob[1]) : rnd(2, 4);

          /* set every property once - they inherit down to .w and .f */
          var p = document.createElement("i"); p.className = "p";
          p.style.cssText =
            "--x:"     + rnd(-2, 98).toFixed(1) + "%;" +
            "--dist:"  + dist + "px;" +
            "--fall:"  + fall.toFixed(2) + "s;" +
            "--delay:" + delay.toFixed(2) + "s;" +
            "--drift:" + drift.toFixed(0) + "px;" +
            "--sway:"  + sway.toFixed(0) + "px;" +
            "--bob:"   + bob.toFixed(1) + "px;" +
            "--rockT:" + rockT.toFixed(2) + "s;" +
            /* capped short of 90deg: even at max tilt the face still reads */
            "--amp:"   + Math.round(rnd(o.amp[0], o.amp[1])) + "deg;" +
            "--yaw:"   + Math.round(rnd(-o.yaw, o.yaw)) + "deg;" +
            "--tilt:"  + Math.round(rnd(-o.tilt, o.tilt)) + "deg;" +
            "--z:"     + z.toFixed(2) + ";" +
            "--dim:"   + (0.72 + (z - o.depth[0]) /
                          (o.depth[1] - o.depth[0]) * 0.28).toFixed(2) + ";" +
            /* shapes stay legible by ASPECT RATIO, not size - see the shape table */
            "--c:"     + pair[0] + ";--c2:" + pair[1] + ";";

          var w = document.createElement("i"); w.className = "w";
          var f = document.createElement("i");
          f.className = "f " + o.shapes[Math.floor(Math.random() * o.shapes.length)] +
                        (flutter ? "" : " tum");
          w.appendChild(f); p.appendChild(w); wrap.appendChild(p);
        }
        host.appendChild(wrap);
        /* lifetime is computed, not hard-coded - a longer fall cannot be cut off */
        setTimeout(function(){ wrap.remove(); }, (maxLife + 0.3) * 1000);
      });
    },
    /* stops a slide advancing mid-celebration. 8s safety cap. */
    after: function(fn){
      var started = Date.now();
      (function check(){
        if(!document.querySelector(".fx-confetti") || Date.now() - started > 8000){ fn(); return; }
        setTimeout(check, 200);
      })();
    }
  };
})();
/* ===== FLN ANIMATION KIT: confetti END ===== */

/* ===== FLN ANIMATION KIT: star-burst BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  M.starBurst = {
    defaults:{ host:"#confetti", w:1333, h:750,
      colors:["#FFE400","#FFBD00","#E89400","#FFCA6C","#FDFFB8"],
      /* retuned: fewer, slower, longer. Travel distance is held at ~547px so the
         burst still fills the same area - only the density and pace changed. */
      ticks:150, decay:0.975, startV:14, shots:[0,220,440], spin:0.18,
      stars:32, starScale:1.8, circles:8, circleScale:1.0 },
    fire: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(M.still()) return;
        var host = document.querySelector(o.host); if(!host) return;
        var cv = document.createElement("canvas");
        cv.width = o.w; cv.height = o.h;                 // design grid, scaled by CSS
        cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
        host.appendChild(cv);
        var ctx = cv.getContext("2d"), parts = [];

        function starPath(r){
          ctx.beginPath();
          for(var i = 0; i < 10; i++){
            var rad = (i % 2 === 0) ? r : r/2, a = Math.PI/5*i - Math.PI/2;
            ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(a)*rad, Math.sin(a)*rad);
          }
          ctx.closePath();
        }
        function add(n, scalar, shape){
          for(var i = 0; i < n; i++){
            var a = Math.random()*Math.PI*2;
            parts.push({ x:cv.width/2, y:cv.height/2, ax:Math.cos(a), ay:Math.sin(a),
              vel:o.startV*(0.5 + Math.random()), tick:0, scalar:scalar, shape:shape,
              color:o.colors[Math.floor(Math.random()*o.colors.length)],
              rot:Math.random()*Math.PI*2, spin:(Math.random()-.5)*o.spin });
          }
        }
        function shoot(){ add(o.stars, o.starScale, "star"); add(o.circles, o.circleScale, "circle"); }
        o.shots.forEach(function(ms){ ms ? setTimeout(shoot, ms) : shoot(); });

        /* derived from the LAST shot, so retiming the shots cannot end the loop
           before they have all fired. A hard-coded 30 breaks if shots move later. */
        var minFrames = Math.max.apply(null, o.shots) / 16 + 20;
        var frames = 0;
        (function frame(){
          ctx.clearRect(0, 0, cv.width, cv.height);
          var alive = false;
          for(var i = 0; i < parts.length; i++){
            var p = parts[i];
            if(p.tick >= o.ticks) continue;
            alive = true;
            p.x += p.ax*p.vel; p.y += p.ay*p.vel; p.vel *= o.decay;
            p.rot += p.spin; p.tick++;
            ctx.globalAlpha = 1 - p.tick/o.ticks;
            ctx.fillStyle = p.color;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            if(p.shape === "star"){ starPath(8*p.scalar); ctx.fill(); }
            else { ctx.beginPath(); ctx.arc(0, 0, 6*p.scalar, 0, Math.PI*2); ctx.fill(); }
            ctx.restore();
          }
          frames++;
          if(alive || frames < minFrames) requestAnimationFrame(frame);  // survive delayed shots
          else setTimeout(function(){ cv.remove(); }, 300);
        })();
      });
    }
  };
})();
/* ===== FLN ANIMATION KIT: star-burst END ===== */

/* ===== FLN ANIMATION KIT: correct-select BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function mk(cls){ var i = document.createElement("i"); i.className = cls; return i; }

  /* Every deferred step is parked ON THE TILE so clear() can cancel it. Without this
     a second play inherits the FIRST play's pending timers and they strip the state
     off the new beat part-way through. Owning the timers is what makes these safely
     re-fireable, which the 2-attempt ladder needs. */
  function later(el, fn, ms){ (el._selT = el._selT || []).push(setTimeout(fn, ms)); }

  /* Tempo lives in CSS (--fx-beat / --fx-reward) so the two effects cannot drift
     apart. JS reads it rather than keeping a second copy, and only writes --ckT or
     --wgT when a caller explicitly passes `dur`. Custom properties do not resolve
     calc(), so the two numbers are read and multiplied here rather than reading
     the composed value. */
  function tempo(el){
    var cs = getComputedStyle(el);
    function num(p, d){
      var v = parseFloat(cs.getPropertyValue(p));
      if(!v && v !== 0) return d;
      return v > 20 ? v / 1000 : v;              /* tolerate ms as well as s */
    }
    var beat = num("--fx-beat", 0.4);
    return { beat: beat, reward: beat * (parseFloat(cs.getPropertyValue("--fx-reward")) || 2) };
  }

  M.answer = {
    clear: function(el){
      if(!el) return;
      if(el._selT){ for(var j = 0; j < el._selT.length; j++) clearTimeout(el._selT[j]); }
      el._selT = [];
      el.classList.remove("ck-correct", "wg-wrong", "wg-out", "wg-rel");
      var fx = el.querySelectorAll(".ck-fx,.wg-fx");
      for(var i = 0; i < fx.length; i++) fx[i].remove();
    }
  };

  M.correctSelect = {
    defaults:{ crown:5 },      /* dur comes from CSS unless you pass one */
    play: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(!el) return;
        M.answer.clear(el);
        void el.offsetWidth;                 /* forced reflow - restarts the pop */
        var dur = o.dur || tempo(el).reward;            /* CSS owns the tempo */
        if(o.dur) el.style.setProperty("--ckT", dur + "s");

        var fx = mk("ck-fx");

        if(o.crown && !M.still()){
          var cr = mk("ck-crown");
          /* clientWidth is layout px INSIDE the scaled stage - design px already.
             getBoundingClientRect() would come back multiplied by --scale (R1). */
          var w = el.clientWidth || 96, h = el.clientHeight || 96;
          var rx = w * 0.46, ry = h * 0.46;               /* the tile's own edge */
          for(var i = 0; i < o.crown; i++){
            var t  = (o.crown === 1) ? 0.5 : i / (o.crown - 1);
            var a  = (-158 + t * 136 + rnd(-7, 7)) * Math.PI / 180;   /* TOP arc */
            var x0 = Math.cos(a) * rx, y0 = Math.sin(a) * ry;
            var out = rnd(.20, .34);
            var s = mk("");
            s.style.cssText =
              "--ss:" + rnd(7, 12).toFixed(1) + "px;" +
              "--x0:" + x0.toFixed(1) + "px;" +
              "--y0:" + y0.toFixed(1) + "px;" +
              "--sx:" + (x0 + Math.cos(a) * w * out).toFixed(1) + "px;" +
              "--sy:" + (y0 + Math.sin(a) * h * out).toFixed(1) + "px;" +
              "--sr:" + Math.round(rnd(-140, 140)) + "deg;";
            cr.appendChild(s);
          }
          fx.appendChild(cr);
        }

        /* class FIRST: the border and the pop are the feedback, and they must not
           wait on ~9 nodes of decoration being built. Measured 45ms of dead time
           before any pixel moved when this ran the other way round. */
        el.classList.add("ck-correct");
        el.appendChild(fx);
        /* Only the TRANSIENT layers are swept. .ck-correct stays: the green outline
           is the correct-mark and it belongs to the tile until the slide advances. */
        later(el, function(){
          var t = fx.querySelectorAll(".ck-crown");
          for(var i = 0; i < t.length; i++) t[i].remove();
        }, dur * 1050);
      });
    }
  };
})();
/* ===== FLN ANIMATION KIT: correct-select END ===== */

/* ===== FLN ANIMATION KIT: wrong-select BEGIN ===== */
/* needs the `later`, `tempo` and `M.answer.clear` helpers from recipe 19 */
(function(){ "use strict";
  var M = window.FLNMotion;
  function mk(cls){ var i = document.createElement("i"); i.className = cls; return i; }
  function later(el, fn, ms){ (el._selT = el._selT || []).push(setTimeout(fn, ms)); }
  /* ---- KIT PATCH (install-time), not part of the published block ----------
     Recipe 20's header says it "needs the `later`, `tempo` and `M.answer.clear`
     helpers from recipe 19". It re-declares `mk` and `later` in this IIFE but not
     `tempo`, which is local to recipe 19's IIFE - so both play() and out() threw
     `ReferenceError: tempo is not defined`. M.guard swallows it, so the wrong
     answer beat was silently DEAD rather than visibly broken. Verified with node
     before patching. Remove this once the kit block carries the helper itself. */
  function tempo(el){
    var cs = getComputedStyle(el);
    function num(p, d){
      var v = parseFloat(cs.getPropertyValue(p));
      if(!v && v !== 0) return d;
      return v > 20 ? v / 1000 : v;              /* tolerate ms as well as s */
    }
    var beat = num("--fx-beat", 0.4);
    return { beat: beat, reward: beat * (parseFloat(cs.getPropertyValue("--fx-reward")) || 2) };
  }

  M.wrongSelect = {
    defaults:{},               /* dur comes from CSS unless you pass one */

    /* transient: shakes, holds red, then RELEASES */
    play: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(!el) return;
        M.answer.clear(el);
        void el.offsetWidth;
        var dur = o.dur || tempo(el).beat;              /* CSS owns the tempo */
        if(o.dur) el.style.setProperty("--wgT", dur + "s");
        el.classList.add("wg-wrong");          /* class first - see recipe 19 */
        var fx = mk("wg-fx"); fx.appendChild(mk("wg-pulse"));
        el.appendChild(fx);
        /* RELEASE on a timeout, never on animationend: under the reduced-motion kill
           switch animationend never fires and the tile would stay red forever - on
           exactly the devices least able to recover from it. (R5, second half.)
           .wg-rel goes on BEFORE .wg-wrong comes off so the border has something to
           transition with. */
        later(el, function(){
          el.classList.add("wg-rel");
          el.classList.remove("wg-wrong");
          var f = el.querySelector(".wg-fx"); if(f) f.remove();
          later(el, function(){
            el.classList.remove("wg-rel");
            if(o.then) o.then();
          }, 260);
        }, dur * 1500 + 40);
      });
    },

    /* elimination: shakes once, recedes, and STAYS recessed. No auto-clear. */
    out: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(!el) return;
        M.answer.clear(el);
        void el.offsetWidth;
        var dur = o.dur || tempo(el).beat;
        if(o.dur) el.style.setProperty("--wgT", dur + "s");
        el.classList.add("wg-out");
        var fx = mk("wg-fx"); fx.appendChild(mk("wg-pulse"));
        el.appendChild(fx);
      });
    }
  };
})();
/* ===== FLN ANIMATION KIT: wrong-select END ===== */

/* ===== FLN ANIMATION KIT: object-outline BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  var ST = ["is-correct", "is-wrong", "is-muted"];

  M.objectOutline = {
    /* state is just a class - both engines read the same ones */
    set: function(el, state){
      M.guard(function(){
        if(!el) return;
        for(var i = 0; i < ST.length; i++) el.classList.remove(ST[i]);
        void el.offsetWidth;                  /* restart - as in recipe 19 */
        if(state) el.classList.add("is-" + state);
      });
    },
    correct: function(el){ this.set(el, "correct"); },
    muted:   function(el){ this.set(el, "muted"); },
    reset:   function(el){ if(el && el._olT) clearTimeout(el._olT); this.set(el, ""); },

    /* wrong RELEASES back to idle white - the child has another attempt, exactly
       as the tile does in recipe 20. Timeout, never animationend: under the
       reduced-motion kill-switch animationend never fires. */
    wrong: function(el, opts){
      var o = opts || {}, self = this;
      M.guard(function(){
        if(!el) return;
        self.set(el, "wrong");
        var v = parseFloat(getComputedStyle(el).getPropertyValue("--olT")) || 0.4;
        if(v > 20) v = v / 1000;
        if(el._olT) clearTimeout(el._olT);
        el._olT = setTimeout(function(){
          el.classList.remove("is-wrong");
          if(o.then) o.then();
        }, v * 1500 + 40);
      });
    },

    /* OPTIONAL, and read the caveat. A rectangular hit box over an irregular sprite
       steals taps meant for whatever is behind it - two overlapping characters and
       the child taps the wrong one. This tests the tap against the sprite's ALPHA.
       It FAILS OPEN: reading pixels back taints the canvas on file://, which is how
       the activities ship, so there it always returns true and you are back to the
       bounding box. Treat it as a dev-server nicety, not a guarantee - the reliable
       fix is z-order and not overlapping the tappable parts in the first place. */
    alphaHit: function(img, clientX, clientY){
      var r = img.getBoundingClientRect();
      if(clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom)
        return false;
      if(img._olA === undefined){
        try{
          var w = Math.min(img.naturalWidth, 256);
          var h = Math.round(img.naturalHeight * w / img.naturalWidth);
          var c = document.createElement("canvas"); c.width = w; c.height = h;
          var x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
          img._olA = x.getImageData(0, 0, w, h);
        }catch(e){ img._olA = null; }         /* tainted - fail OPEN */
      }
      if(!img._olA) return true;
      var d = img._olA;
      var px = Math.floor((clientX - r.left) / r.width  * d.width);
      var py = Math.floor((clientY - r.top)  / r.height * d.height);
      return d.data[(py * d.width + px) * 4 + 3] > 24;
    }
  };
})();
/* ===== FLN ANIMATION KIT: object-outline END ===== */

/* [engine JS] DEV NAV — a review/QA slide navigator. Shows ONLY with ?dev=1 or ?nav=1 (children never
   see it). Jump to any slide by dropdown, step ◀▶, first/last, or back to the landing. Uses the
   engine's own mountSlide + state.idx; a light poll keeps the label synced when the game self-advances. */
function buildDevNav(){
  if(document.getElementById("devNav")) return;
  const bar = document.createElement("div"); bar.id = "devNav"; bar.className = "dev-nav";
  const mk = (txt, title)=>{ const b = document.createElement("button"); b.className = "dev-nav-btn"; b.textContent = txt; if(title) b.title = title; return b; };
  const land = mk("⌂", "landing"), first = mk("⏮", "first"), prev = mk("◀", "prev"), next = mk("▶", "next"), last = mk("⏭", "last");
  const sel = document.createElement("select"); sel.className = "dev-nav-sel"; sel.title = "jump to slide";
  CARD.slides.forEach((s, i)=>{ const o = document.createElement("option"); o.value = i; o.textContent = (i+1) + ". " + s.id + " · " + s.type; sel.appendChild(o); });
  const lbl = document.createElement("span"); lbl.className = "dev-nav-lbl";
  const cur = ()=> (state && typeof state.idx === "number") ? state.idx : 0;
  const leaveStart = ()=>{ const sg = $("startGate"); if(sg) sg.classList.add("hidden"); document.body.classList.remove("is-start"); document.body.classList.add("loaded"); const bl = $("bootLoader"); if(bl) bl.remove(); };
  const sync = ()=>{ const i = cur(); const s = CARD.slides[i]; if(document.activeElement !== sel) sel.value = i;
    lbl.textContent = (i+1) + "/" + CARD.slides.length + (s ? " · " + s.id : ""); };
  const go = (i)=>{ i = Math.max(0, Math.min(i, CARD.slides.length - 1)); leaveStart(); mountSlide(i); sync(); };
  land.onclick = ()=>{ const sg = $("startGate"); if(sg){ sg.classList.remove("hidden"); document.body.classList.add("is-start"); } };
  first.onclick = ()=> go(0); prev.onclick = ()=> go(cur() - 1); next.onclick = ()=> go(cur() + 1); last.onclick = ()=> go(CARD.slides.length - 1);
  sel.onchange = ()=> go(parseInt(sel.value, 10));
  bar.append(land, first, prev, sel, lbl, next, last);
  document.body.appendChild(bar);
  setInterval(sync, 300); sync();
}

boot();

/* ---------- [landing dust] sunlit dust motes on the first screen ----------
   Real dust in a sunbeam, not sprites on rails:
   - VISIBLE ONLY WHERE LIT. Each speck's brightness = the sunlight at its position:
     a falloff spilling down-right from the sun (.sg-sun, read live), so motes
     glint near the window and fade out toward the shaded right side.
   - DRIFTS ON AIR, NOT ON THE LIGHT. Light does not push dust: motion = a slow room
     draught from the window (down-right) + smooth per-particle turbulence + a tiny
     gravity settle + damping (dust is light, drag dominates). No straight paths.
   - TUMBLES. Flakes glint as they rotate to face the sun: brightness pulses ^3.
   - DEPTH. z 0..1: far = tiny, sharp, slow, dim; near = larger, softer (out of
     focus), faster across the screen (parallax). Most dust is far.
   - COMES FROM THE WINDOW (review 2026-09-29: "the particles coming from the direction of
     sunlight?" - 80 dim specks drifting ~5px/s were too faint to see): the draught blows ALONG the
     light (26deg, down-right), most specks re-enter in the sunlit window and fade in there, and
     there are more, slightly larger, brighter specks.
   Pauses off the landing and when the tab is hidden; one static frame under
   prefers-reduced-motion. Coordinates are .sg-fx-local design px (1096x438). */
(function(){
  const cv = document.getElementById("sgDust"); if(!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d"), W = 1096, H = 438, N = 120;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // soft round sprite (one draw per mote); small sizes read as crisp points
  const spr = document.createElement("canvas"); spr.width = spr.height = 32;
  (function(){ const g = spr.getContext("2d"), r = g.createRadialGradient(16,16,0,16,16,16);
    r.addColorStop(0, "rgba(255,251,236,1)"); r.addColorStop(.45, "rgba(255,244,215,.75)");
    r.addColorStop(1, "rgba(255,236,196,0)"); g.fillStyle = r; g.fillRect(0,0,32,32); })();

  /* light field = the sun (the .sg-sun anchor, read live) spilling into the room: an
     elongated falloff pointing down-right from the window (~26deg, the angle of the
     painted wall streak) - bright near the window, gone by the shaded right side. */
  let sun = { x:170, y:70 };
  const LA = 26 * Math.PI / 180, LC = Math.cos(LA), LS = Math.sin(LA);
  function readSun(){
    const f = document.querySelector(".sg-fx .sg-sun");
    if(f) sun = { x:f.offsetLeft, y:f.offsetTop };            // .sg-sun is a 0x0 anchor AT the sun
  }
  function light(x, y){
    const dx = x - sun.x, dy = y - sun.y;
    const s = dx * LC + dy * LS, c = -dx * LS + dy * LC;       // along / across the spill
    const sa = s >= 0 ? s / 520 : s / 150;                     // reaches far into the room, little behind the sun
    return Math.exp(-(sa * sa + (c / 230) * (c / 230)));
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(p, fresh){
    p.z = Math.pow(Math.random(), 1.8);                        // bias far
    // start anywhere on screen the first time; later mostly re-enter IN the sunlit window (fading in there,
    // so they visibly come out of the light), the rest from the window-side edges
    const r0 = Math.random();
    if(fresh){ p.x = rnd(-20, W * .75); p.y = rnd(-10, H); }
    else if(r0 < .7){ p.x = sun.x + rnd(-130, 70); p.y = sun.y + rnd(-60, 90); }
    else if(r0 < .85){ p.x = rnd(-30, -5); p.y = rnd(0, H * .6); }
    else { p.x = rnd(0, W * .4); p.y = rnd(-30, -5); }
    p.vx = rnd(-2, 2); p.vy = rnd(-2, 2);
    p.r  = 1.1 + p.z * 3.4;                                    // radius px
    p.f1 = rnd(.07, .19); p.f2 = rnd(.11, .27); p.ph1 = rnd(0, 6.3); p.ph2 = rnd(0, 6.3);
    p.spin = rnd(.6, 2.2); p.sph = rnd(0, 6.3);
    p.fade = fresh ? 1 : 0;                                    // ease in after respawn
    return p;
  }
  const P = Array.from({length:N}, () => spawn({}, true));

  function fit(){
    const sc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
    const k = Math.min(sc * (window.devicePixelRatio || 1), 2);  // cap backing store for low-end GPUs
    cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    readSun();
    if(reduce) draw(8);                                        // resizing clears the canvas
  }

  function step(p, t, dt){
    const par = .45 + p.z * .9;                                // parallax: near crosses faster
    // room draught from the window, ALONG the light (LA) + slow global gusts
    const ws = 13 + 4 * Math.sin(t * .09);
    const wx = ws * LC, wy = ws * LS + 1.2 * Math.sin(t * .07 + 1.3);
    // smooth turbulence (two incommensurate sines per axis = no visible loop)
    const tx = 7 * Math.sin(t * p.f1 + p.ph1) + 4 * Math.sin(t * p.f2 * 1.7 + p.ph2);
    const ty = 6 * Math.cos(t * p.f2 + p.ph2) + 3 * Math.sin(t * p.f1 * 2.3 + p.ph1);
    const g  = .8 + p.z * .9;                                  // settling: heavier near flakes sink a touch faster
    // drag toward the local air velocity (dust has almost no inertia) + Brownian jitter
    const k = 1 - Math.exp(-1.6 * dt);
    p.vx += ((wx + tx) - p.vx) * k + rnd(-1, 1) * 6 * dt;
    p.vy += ((wy + ty + g) - p.vy) * k + rnd(-1, 1) * 6 * dt;
    p.x += p.vx * par * dt; p.y += p.vy * par * dt;
    if(p.fade < 1) p.fade = Math.min(1, p.fade + dt / 1.5);
    if(p.x > W + 20 || p.y > H + 20 || p.x < -40 || p.y < -40) spawn(p, false);
  }

  function draw(t){
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for(const p of P){
      const L = light(p.x, p.y);
      if(L < .02) continue;                                    // in shade: invisible, like real dust
      const glint = .5 + .5 * Math.pow(Math.max(0, Math.sin(t * p.spin + p.sph)), 3);
      const depth = .45 + .55 * (1 - Math.abs(p.z - .35));     // far dim, very near slightly defocused
      const a = Math.min(1, L * 1.7) * glint * depth * p.fade;
      if(a < .02) continue;
      const d = p.r * 2 * (p.z > .7 ? 1.35 : 1);               // near = out-of-focus blur disc
      ctx.globalAlpha = p.z > .7 ? a * .6 : a;
      ctx.drawImage(spr, p.x - d / 2, p.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }

  let last = 0, t = 0;
  function frame(now){
    requestAnimationFrame(frame);
    if(!document.body.classList.contains("is-start")){ last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now; t += dt;
    for(const p of P) step(p, t, dt);
    draw(t);
  }

  fit();
  window.addEventListener("resize", () => { clearTimeout(fit._t); fit._t = setTimeout(fit, 200); });
  window.addEventListener("load", fit);
  if(reduce){ for(let i = 0; i < 240; i++) for(const p of P) step(p, i / 30, 1 / 30); draw(8); }
  else requestAnimationFrame(frame);
})();

PVLanding.intro();   // [landing pv] the picture comes in with the greeting

/* ==== HI02H11_L02_S02's celebration Swiftie (user 2026-10-23): its kit player + its wrapper, as they are ==== */
/* ============================================================================================
   SWIFTIE CELEBRATION KIT — player (framework-free, no dependencies)
   ============================================================================================
   Plays the three celebration sheets (cel_shabaash / cel_talk / cel_idle) lip-synced to a voice-over.

     SwiftieCelebration.play({
       host:     <element>,                 // where Swiftie goes (she fills its height)
       meta:     <cel_meta.json object>,    // frame size, grid, open-mouth frames, roles
       base:     "assets/UI/celebration/",  // folder the three .webp sheets are served from
       bits:     "0001111...",              // lip-sync track from make_lipsync.py (25 ms per char)
       step_ms:  25,
       // THE CLOCK — give ONE of these:
       audio:    <HTMLAudioElement>,        // best: time = audio.currentTime
       isSounding: ()=> bool                // or: true while the VO is sounding (timer starts then)
     })  -> { stop() }

   Timeline (all from the VO clock):
     before the first sound   shabaash 0-5    standing, mouth shut
     first word («शाबाश!»)    shabaash 6-29   the jump, mouth open — stretched to that word
     the pause after it       shabaash 30-35  lands, mouth shut
     rest of the line         talk sheet: a cursor walks the sheet forward (so the body keeps moving)
                              but only lands on frames whose mouth matches the track at that instant
     after the VO             idle sheet, mouth-shut frames only, looping
   Measured on MTG2A04_L01_S01: mouth = VO in 99.6-100 % of samples; every miss within one paint.
   ============================================================================================ */
(function(global){
  "use strict";
  function play(o){
    const M = o.meta, base = (o.base || "").replace(/\/?$/, "/");
    const bits = o.bits || "", step = o.step_ms || 25;
    const S = M.shabaash, T = M.talk, I = M.idle, COLS = M.cols || 6, N = M.frames || 36;
    const OPEN = new Set(T.open);
    let stopped = false;

    const sp = document.createElement("div");
    sp.className = "swc-sprite";
    sp.innerHTML = '<div class="swc-art"></div>';
    o.host.appendChild(sp);
    const art = sp.firstChild;
    art.style.aspectRatio = M.fw + " / " + M.fh;
    [S, T, I].forEach(s => { const i = new Image(); i.src = base + s.src; });   /* warm all three */

    let cur = "";
    const show = (sheet, i)=>{
      const url = base + sheet.src;
      if(url !== cur){ art.style.backgroundImage = 'url("' + url + '")'; cur = url; }
      const c = i % COLS, r = Math.floor(i / COLS);
      art.style.backgroundPosition = (c * 100 / (COLS - 1)) + "% " + (r * 100 / (COLS - 1)) + "%";
      sp.dataset.sheet = sheet === S ? "shabaash" : (sheet === I ? "idle" : "talk"); sp.dataset.f = i;
    };
    show(S, S.pre[0]);

    const loud = (t)=> bits.charAt(Math.floor(t / step)) === "1";
    const GAP = Math.round(200 / step);                       /* a 200 ms silence ends the first word */
    let s0 = bits.indexOf("1"), e0 = s0, gap = 0;
    for(let k = s0; k >= 0 && k < bits.length; k++){ if(bits[k] === "1"){ e0 = k; gap = 0; } else if(++gap >= GAP) break; }
    const speechStart = Math.max(0, s0) * step, wordEnd = (e0 + 1) * step;
    const ns = bits.indexOf("1", e0 + GAP), nextStart = ns < 0 ? wordEnd : ns * step;
    const lenMs = bits.length * step;
    const seg = (list, t, a, b)=> list[Math.min(list.length - 1, Math.max(0, Math.floor((t - a) / Math.max(1, b - a) * list.length)))];

    const idle = ()=>{ let j = 0; (function tick(){ if(stopped || !sp.isConnected) return;
      show(I, I.loop[j % I.loop.length]); j++; setTimeout(tick, 110); })(); };

    /* the clock */
    let t0 = 0, started = false;
    /* audio.currentTime advances in coarse steps in some browsers, so it only ANCHORS a smooth clock:
       t0 is set once from it when the clip starts; after that time is performance.now() - t0 */
    const t_now = ()=> performance.now() - t0;
    const sounding = ()=> o.audio ? (!o.audio.paused && !o.audio.ended) : !!(o.isSounding && o.isSounding());
    const waitStart = performance.now();
    let cursor = 0, curOpen = null, lastStep = 0;
    (function frame(){
      if(stopped || !sp.isConnected) return;
      const now = performance.now();
      if(!started){
        if(sounding() && (!o.audio || o.audio.currentTime > 0)){ started = true; t0 = now - (o.audio ? o.audio.currentTime * 1000 : 0); }
        else if(now - waitStart > 1800){ idle(); return; }            /* the VO never started */
        else { requestAnimationFrame(frame); return; }
      }
      const t = t_now(); sp.dataset.t = Math.round(t);
      if(!sounding() || t > lenMs + 400){ idle(); return; }
      if(t < speechStart) show(S, seg(S.pre, t, 0, speechStart));
      else if(t < wordEnd) show(S, seg(S.word, t, speechStart, wordEnd));
      else if(t < nextStart) show(S, seg(S.post, t, wordEnd, nextStart));
      else {
        const want = loud(t + 16);                        /* one paint ahead: the frame shows on the NEXT paint */
        if(want !== curOpen || now - lastStep > 80){      /* at once on a mouth change, else every 80 ms */
          let k = 1;
          while(k < N && OPEN.has((cursor + k) % N) !== want) k++;
          cursor = (cursor + k) % N; show(T, cursor); curOpen = want; lastStep = now;
        }
      }
      requestAnimationFrame(frame);
    })();
    return { el: sp, stop(){ stopped = true; } };
  }
  global.SwiftieCelebration = { play };
})(window);


/* [r85] THE CELEBRATION SWIFTIE - the kit's README wrapper, verbatim in intent. The engine's
   CELEBRATION module is wrapped, not edited: it still does everything it did (sfx, sunburst, stars,
   the arrow), then the stock .end-mascot is hidden and a 300x358 host takes its place - the mascot's
   own 358 px layout height, so the arrow below it keeps its exact size and position.
   The clock is the clip's own - see THE CLOCK below. */
(function(){
  if(typeof SlideModules === "undefined" || !SlideModules.CELEBRATION || typeof CARD === "undefined"
     || !CARD.end_anim || typeof SwiftieCelebration === "undefined") return;
  const EA = CARD.end_anim;
  /* the three sheets (~2 MB) are fetched quietly 12 s after the lesson loads, so on a first visit
     they are in the cache long before the last page: the kit only starts loading them when the
     celebration mounts, and on a slow connection the jump (350 ms in) would play before its sheet
     had arrived. Kept referenced so the cached copies are not dropped. */
  const _warm = [];
  const warm = ()=> [EA.meta.shabaash, EA.meta.talk, EA.meta.idle].forEach(s => {
    const i = new Image(); i.decoding = "async"; i.src = EA.base + s.src; _warm.push(i); });
  const arm = ()=> setTimeout(warm, 12000);
  if(document.readyState === "complete") arm(); else window.addEventListener("load", arm);
  /* THE CLOCK. The kit takes `audio` - anything with paused / ended / currentTime - and anchors
     itself as  t0 = now - currentTime  the first time it sees the clip sounding. Measured here: the
     celebration mounts in a burst of work (sunburst, stars, sound), the page's main thread stalls
     150-330 ms right as the clip starts, and a yes/no "sounding" signal is only noticed on the first
     frame AFTER the stall - which put the whole lip-sync 170-1470 ms late when opened as a file.
     So the clock below reports how long the clip has really been audible, from the moment it
     became so, however late the next frame runs:
       · Web Audio (served): when the engine started the source, + the context's output latency
       · <audio> (opened as a file): the element's own "playing" event timestamp */
  const _st = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function(when){
    try{ const c = this.context;
      this.__swcAt = performance.now() + ((when && when > c.currentTime) ? (when - c.currentTime) * 1000 : 0)
                     + ((c.baseLatency || 0) + (c.outputLatency || 0)) * 1000; }catch(e){}
    return _st.apply(this, arguments);
  };
  const heardAt = ()=>{
    const a = currentAudio;
    if(a){
      if(!a.__swc){ a.__swc = true;
        a.addEventListener("playing", (e)=>{ a.__swcAt = e.timeStamp - a.currentTime * 1000; }); }
      return a.paused ? null : (a.__swcAt != null ? a.__swcAt
                               : (a.currentTime > 0 ? performance.now() - a.currentTime * 1000 : null));
    }
    return (typeof currentVoiceSource !== "undefined" && currentVoiceSource) && currentVoiceSource.__swcAt != null ? currentVoiceSource.__swcAt : null;
  };
  const clock = {
    get paused(){ return !isPlaying || heardAt() == null; },
    get ended(){ return !isPlaying; },
    get currentTime(){ const t = heardAt(); return t == null ? 0 : Math.max(0, performance.now() - t) / 1000; }
  };
  const _cel = SlideModules.CELEBRATION.mount;
  SlideModules.CELEBRATION.mount = function(host, slide){
    const r = _cel.apply(this, arguments);
    const img = document.querySelector("#endScreen .end-mascot");
    let box = document.getElementById("celBox");
    if(!box && img){ box = document.createElement("div"); box.id = "celBox";
      /* the stock mascot's OWN layout height, measured before it is hidden: 330 px wide at its
         516x476 art is 357.72 px, not the kit's 358 - and 0.28 px is a whole screen pixel of arrow
         movement at 1920x1080. Falls back to the kit's 358 if the stock art never loaded. */
      const h = 357.72;   // (HI02H11's stock mascot box: 330px wide at its 516x476 art - ours has other art, so its number is taken)
      box.style.cssText = "width:300px;height:" + h + "px;position:relative;z-index:2";
      img.parentNode.insertBefore(box, img); }
    if(!box) return r;
    if(img) img.style.display = "none";
    box.innerHTML = "";
    /* [r106] SHE JUMPS AND CELEBRATES FIRST, THEN SPEAKS. Yasir: "in the last celebration screen Swifty
       jumps and celebrates, then starts speaking - the VO should only play when she starts speaking".
       So the line is NOT played by the page on arrival (ownsAudio): the jump - the kit's own शाबाश
       sheet, its standing frames and its jump frames - plays first, silent but for the celebration
       sound; then the line starts and the kit's player takes over, with a track arranged so that it
       finishes the landing over the clip's lead-in and then lip-syncs the WHOLE line on the talk
       sheet (a 25 ms stand-in "first word" stops the kit spending the real first words on a jump). */
    state.ownsAudio = true;
    const M = EA.meta, S = M.shabaash, COLS = M.cols || 6;
    const sp = document.createElement("div"); sp.className = "swc-sprite";
    sp.innerHTML = '<div class="swc-art"></div>'; box.appendChild(sp);
    const art = sp.firstChild; art.style.aspectRatio = M.fw + " / " + M.fh;
    art.style.backgroundImage = 'url("' + EA.base + S.src + '")';
    const showF = (i)=>{ const c = i % COLS, rr = Math.floor(i / COLS);
      art.style.backgroundPosition = (c * 100 / (COLS - 1)) + "% " + (rr * 100 / (COLS - 1)) + "%";
      sp.dataset.sheet = "shabaash"; sp.dataset.f = i; };
    const frames = S.pre.concat(S.word), FMS = 45;          /* ~22 fps: 30 frames, 1.35 s */
    showF(frames[0]);
    const bits = EA.track.bits, lead = Math.max(0, bits.indexOf("1"));
    const step = EA.track.step_ms || 25;
    const bits2 = "1" + "00000000" + bits.slice(lead);      /* stand-in word, 200 ms gap, the line */
    const shift = (9 - lead) * step / 1000;                 /* keeps the line on the clip's clock */
    const clock2 = {
      get paused(){ return clock.paused; }, get ended(){ return clock.ended; },
      get currentTime(){ const t = clock.currentTime; return t > 0 ? Math.max(0.001, t + shift) : 0; }
    };
    const t0 = performance.now();
    (function jump(){
      if(!sp.isConnected || CARD.slides[state.idx] !== slide) return;
      const k = Math.floor((performance.now() - t0) / FMS);
      if(k < frames.length){ showF(frames[k]); requestAnimationFrame(jump); return; }
      /* the jump is over: the line starts, and the kit takes over the moment it is sounding */
      const src = (typeof audioFor === "function") ? audioFor(slide, "prompt") : null;
      if(src) play(src, ()=>{});
      const h = SwiftieCelebration.play({ host: box, meta: M, base: EA.base, bits: bits2, step_ms: step, audio: clock2 });
      h.el.style.animation = "none"; h.el.style.position = "absolute"; h.el.style.inset = "0";
      h.el.style.visibility = "hidden";
      (function swap(){
        if(!h.el.isConnected) return;
        if(h.el.dataset.t !== undefined || h.el.dataset.sheet === "idle"){ h.el.style.visibility = ""; sp.remove(); return; }
        requestAnimationFrame(swap);
      })();
    })();
    return r;
  };
})();
