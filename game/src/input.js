// Keyboard (+ click to start) input. Returns a unit vector each frame.
export function createInput() {
  const keys = new Set();
  let smokeQueued = false, startQueued = false, restartQueued = false, pauseQueued = false;
  const down = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === 'q') smokeQueued = true;
    if (e.key === 'Enter' || e.key === ' ') startQueued = true;
    if (e.key.toLowerCase() === 'r') restartQueued = true;
    if (e.key.toLowerCase() === 'p') pauseQueued = true;
  };
  const up = (e) => keys.delete(e.key.toLowerCase());
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('mousedown', () => { startQueued = true; });
  return {
    vector() {
      let x = 0, y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      const len = Math.hypot(x, y);
      return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
    },
    get sneak() { return keys.has('shift'); },
    takeSmoke() { const v = smokeQueued; smokeQueued = false; return v; },
    takeStart() { const v = startQueued; startQueued = false; return v; },
    takeRestart() { const v = restartQueued; restartQueued = false; return v; },
    takePause() { const v = pauseQueued; pauseQueued = false; return v; },
  };
}
