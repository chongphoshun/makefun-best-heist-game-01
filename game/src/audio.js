// Tiny WebAudio synth: no audio files, no network. M toggles mute.
export function createAudio() {
  let ctx = null, muted = false;
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = 'sine', vol = 0.08, slide = 0) {
    if (muted) return;
    const ac = ensure(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  }
  return {
    toggleMute() { muted = !muted; return muted; },
    pickup() { tone(880, 0.12, 'sine', 0.09); setTimeout(() => tone(1320, 0.16, 'sine', 0.09), 70); },
    spotted() { tone(220, 0.25, 'sawtooth', 0.06, 220); },
    smoke() { tone(300, 0.4, 'triangle', 0.07, -200); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'sine', 0.09), i * 110)); },
    bust() { [400, 300, 200].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.08), i * 160)); },
    click() { tone(600, 0.06, 'square', 0.04); },
  };
}
