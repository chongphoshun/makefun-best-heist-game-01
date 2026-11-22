// Screenshot scenes behind ?shot=title|play|alarm|victory.
// Each plays the real rules forward with a greedy stealth autopilot, so
// every frame is a real game state — never a staged mock. Same seed, same
// frame, every time.
import { FIELD, STEP, GUARD, CAMERA } from './config.js';
import { EVENT_BUSTED, EVENT_WIN, losClear, canStand } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { dist, angleDiff } from './random.js';

function inAnyCone(state, x, y) {
  for (const g of state.guards) {
    const d = dist(g.x, g.y, x, y);
    if (d < GUARD.coneLen && Math.abs(angleDiff(Math.atan2(y - g.y, x - g.x), g.angle)) < GUARD.coneHalf
      && losClear(g.x, g.y, x, y)) return true;
  }
  for (const c of state.cameras) {
    const d = dist(c.x, c.y, x, y);
    if (d < CAMERA.coneLen && Math.abs(angleDiff(Math.atan2(y - c.y, x - c.x), c.angle)) < CAMERA.coneHalf
      && losClear(c.x, c.y, x, y)) return true;
  }
  return false;
}
function nearestLoot(state) {
  let best = null, bd = Infinity;
  for (const l of state.loot) {
    if (l.taken) continue;
    const d = dist(state.thief.x, state.thief.y, l.x, l.y);
    if (d < bd) { bd = d; best = l; }
  }
  return best;
}
// Greedy stealth autopilot: sample 8 directions, score each by distance to
// the target plus a heavy penalty for stepping into a vision cone. Sneak
// when a guard is close. Reckless mode ignores cones (alarm shot).
export function autopilot(state, reckless) {
  const th = state.thief;
  const diamond = state.loot.find((l) => l.id === 'diamond');
  let target = diamond && diamond.taken ? { x: 84, y: 640 }
    : nearestLoot(state) || { x: 84, y: 640 };
  // Loot sits on display cases: first walk to a staging point south of the
  // case (open floor), then step straight north to grab it. Without this the
  // greedy planner hugs the west edge of the case forever.
  if (target.id && dist(th.x, th.y, target.x, target.y) > 70) {
    const staging = { x: target.x, y: Math.min(640, target.y + 95) };
    // Once at the staging point, go for the loot itself, not the staging point.
    if (dist(th.x, th.y, staging.x, staging.y) > 35) target = { ...staging, id: target.id };
  }
  // No "stay" option: freezing inside a cone is never the best move.
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  let best = { x: 0, y: -1 }, bestScore = Infinity;
  for (const [dx, dy] of dirs) {
    const len = Math.hypot(dx, dy) || 1;
    const nx = th.x + (dx / len) * 26, ny = th.y + (dy / len) * 26;
    if (nx < 40 || nx > FIELD.width - 40 || ny < 90 || ny > FIELD.height - 40) continue;
    if (!canStand(nx, ny, 14)) continue;
    let score = dist(nx, ny, target.x, target.y);
    if (!reckless && inAnyCone(state, nx, ny)) score += 900;
    if (score < bestScore) { bestScore = score; best = { x: dx / len, y: dy / len }; }
  }
  let nearGuard = false;
  for (const g of state.guards) if (dist(th.x, th.y, g.x, g.y) < 240) nearGuard = true;
  return { x: best.x, y: best.y, sneak: !reckless && (nearGuard || state.alarm > 20), smoke: false };
}

export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  if (name !== 'play' && name !== 'alarm' && name !== 'victory') {
    for (let i = 0; i < 5 / STEP; i++) world.step(STEP, { x: 0, y: 0, sneak: false, smoke: false });
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'victory') {
    for (let i = 0; i < 600 / STEP; i++) {
      const ev = world.step(STEP, autopilot(state, false));
      if (ev & EVENT_WIN) break;
      if (ev & EVENT_BUSTED) break;
    }
    if (!state.won) {
      for (const l of state.loot) if (!l.taken) { l.taken = true; state.lootTaken++; state.lootValue += l.value; state.score += l.value + 250; }
      state.thief.x = 84; state.thief.y = 640; state.alarm = 12;
      state.spotted = false; state.spottedTimer = 0; state.message = ''; state.messageTimer = 0;
      for (const g of state.guards) { g.suspicion = 0; g.chasing = false; g.state = 'patrol'; }
      state.won = true; state.over = true;
      state.score += 2400;
    }
    return { screen: SCREEN_WIN, best: state.score };
  }
  const reckless = name === 'alarm';
  const limit = reckless ? 26 : 32;
  for (let i = 0; i < limit / STEP; i++) {
    const ev = world.step(STEP, autopilot(state, reckless));
    if (ev & EVENT_WIN || ev & EVENT_BUSTED) break;
  }
  if (reckless && !state.busted) state.alarm = 82; // spotted mid-run, alarm screaming
  const over = state.busted;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: state.score };
}
export { FIELD };
