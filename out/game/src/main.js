// MIDNIGHT VAULT — boot + fixed-step loop + screens.
// ?shot=title|play|alarm|victory renders one deterministic scene for screenshots.
import { FIELD, STEP, BEST_KEY } from './config.js';
import { createWorld, EVENT_BUSTED, EVENT_PICKUP, EVENT_SMOKE, EVENT_SPOTTED, EVENT_WIN } from './world.js';
import { drawScreen, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7);
const shotName = params.get('shot');
const world = createWorld(seed);
const input = createInput();
const audio = createAudio();

let screen = SCREEN_TITLE;
let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY) || 0) || 0; } catch { best = 0; }
let paused = false, acc = 0, last = performance.now(), announced = '';

function saveBest() {
  if (world.state.score > best) {
    best = world.state.score;
    try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* private mode */ }
  }
}
function announce(text) {
  if (text !== announced) { announced = text; if (statusEl) statusEl.textContent = text; }
}
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(FIELD.width * dpr);
  canvas.height = Math.floor(FIELD.height * dpr);
  canvas.style.width = '100vw'; canvas.style.height = '100vh';
  ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
}
window.addEventListener('resize', resize);
resize();

if (shotName) {
  // Screenshot mode: stage the scene, draw once, signal readiness.
  try {
    const staged = stageShot(shotName, world);
    screen = staged.screen; best = Math.max(best, staged.best);
    drawScreen(ctx, world.state, screen, best);
    window.__shotReady = true;
  } catch (err) {
    window.__shotError = String(err && err.message || err);
    throw err;
  }
} else {
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm') { const m = audio.toggleMute(); announce(m ? 'Sound muted' : 'Sound on'); }
  });
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (input.takePause() && screen === SCREEN_PLAY) paused = !paused;
    if (input.takeRestart() && (screen === SCREEN_OVER || screen === SCREEN_WIN)) {
      world.reset(); screen = SCREEN_TITLE; paused = false;
    }
    if (screen === SCREEN_TITLE && input.takeStart()) {
      world.reset(); screen = SCREEN_PLAY; audio.click();
      announce('Heist started. Steal the diamond and reach the exit.');
    }
    if (screen === SCREEN_PLAY && !paused) {
      acc += dt;
      while (acc >= STEP) {
        acc -= STEP;
        const v = input.vector();
        const ev = world.step(STEP, { x: v.x, y: v.y, sneak: input.sneak, smoke: input.takeSmoke() });
        if (ev & EVENT_PICKUP) audio.pickup();
        if (ev & EVENT_SPOTTED) audio.spotted();
        if (ev & EVENT_SMOKE) audio.smoke();
        if (ev & EVENT_WIN) { screen = SCREEN_WIN; saveBest(); audio.win(); announce('Clean getaway. You won.'); }
        if (ev & EVENT_BUSTED) { screen = SCREEN_OVER; saveBest(); audio.bust(); announce('Busted. The vault locked down.'); }
        if (world.state.over && world.state.won) screen = SCREEN_WIN;
        if (world.state.over && world.state.busted) screen = SCREEN_OVER;
      }
    }
    drawScreen(ctx, world.state, screen, best);
    if (paused && screen === SCREEN_PLAY) {
      ctx.fillStyle = 'rgba(5,7,14,0.6)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = '#eef1f5'; ctx.font = 'bold 36px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('PAUSED — press P to resume', FIELD.width / 2, FIELD.height / 2);
    }
  }
  requestAnimationFrame(frame);
}
