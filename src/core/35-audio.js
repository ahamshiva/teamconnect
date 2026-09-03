/* src/core/35-audio.js  WebAudio cues, no files. Honours silent mode. */
(function () {
  "use strict";
  const TCL = window.TCL;
  const Audio = TCL.Audio = {};
  let ctx = null;
  Audio.blocked = false;
  function enabled() { const s = TCL.state && TCL.state.settings; return s && s.sound && !s.silent; }
  function beep(freq, dur, type, gain) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.value = freq;
      const vol = (TCL.state && TCL.state.settings ? TCL.state.settings.volume : 0.6) * (gain || 0.12);
      g.gain.value = vol;
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
      Audio.blocked = false;
    } catch (e) { Audio.blocked = true; }
  }
  Audio.ding = function (force) { if (!force && !enabled()) return; beep(880, 0.15); setTimeout(() => beep(1320, 0.2), 120); };
  Audio.buzzer = function (force) { if (!force && !enabled()) return; beep(180, 0.7, "sawtooth"); };
  Audio.tickWarn = function (force) { if (!force && !enabled()) return; beep(660, 0.06, "square", 0.05); };
  Audio.fanfare = function (force) { if (!force && !enabled()) return; [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.25), i * 140)); };
  Audio.test = function () { beep(880, 0.15); setTimeout(() => beep(1320, 0.2), 120); setTimeout(() => beep(180, 0.6, "sawtooth"), 600); return !Audio.blocked; };
})();
