// MIDNIGHT VAULT — simulation: thief, guards, cameras, loot, alarm, smoke.
// Pure logic, no drawing: render.js draws state, shots.js steers it.
import { ALARM, CAMERA, CAMERAS, EXIT, FIELD, GUARD, GUARDS, HUD_H, LOOT, SMOKE, SPAWN, THIEF, VAULT, WALLS } from './config.js';
import { angleDiff, clamp, dist, segmentHitsRect } from './random.js';

export const EVENT_PICKUP = 1, EVENT_SPOTTED = 2, EVENT_BUSTED = 4, EVENT_WIN = 8, EVENT_SMOKE = 16;

export function losClear(x1, y1, x2, y2) {
  for (const w of WALLS) if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  return true;
}
export function canStand(x, y, r) { return !circleHitsWall(x, y, r); }
function circleHitsWall(x, y, r) {
  if (x < 28 + r || x > FIELD.width - 28 - r || y < HUD_H + 14 + r || y > FIELD.height - 28 - r) return true;
  for (const w of WALLS) {
    const cx = clamp(x, w.x, w.x + w.w), cy = clamp(y, w.y, w.y + w.h);
    if (dist(x, y, cx, cy) < r) return true;
  }
  return false;
}
function inCone(ox, oy, angle, half, len, tx, ty) {
  const d = dist(ox, oy, tx, ty);
  if (d > len || d < 1) return false;
  return Math.abs(angleDiff(Math.atan2(ty - oy, tx - ox), angle)) < half;
}
function inSmoke(state, x, y) {
  for (const s of state.smokes) if (dist(x, y, s.x, s.y) < SMOKE.radius) return true;
  return false;
}

export function createWorld(seed = 7) {
  const state = {
    seed, time: 0, score: 0, lootValue: 0, lootTaken: 0, alarm: 0,
    smokesLeft: SMOKE.max, smokes: [], over: false, won: false, busted: false,
    spotted: false, spottedTimer: 0, message: '', messageTimer: 0,
    thief: { x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 0, sneak: false, facing: -Math.PI / 2 },
    guards: GUARDS.map((g, i) => ({
      id: g.id, name: g.name, waypoints: g.waypoints, wp: g.start,
      x: g.waypoints[g.start][0], y: g.waypoints[g.start][1],
      angle: 0, suspicion: 0, chasing: false, chaseTimer: 0, state: 'patrol',
    })),
    cameras: CAMERAS.map((c) => ({ ...c, angle: c.baseAngle, t: 0 })),
    loot: LOOT.map((l) => ({ ...l, taken: false, bob: 0 })),
  };
  return {
    state,
    reset() {
      const fresh = createWorld(seed);
      Object.keys(state).forEach((k) => delete state[k]);
      Object.assign(state, fresh.state);
    },
    // input: {x, y} unit vector, sneak bool, smoke bool (edge-triggered by caller)
    step(dt, input) {
      if (state.over) return 0;
      let events = 0;
      state.time += dt;
      const th = state.thief;
      th.sneak = !!input.sneak;
      const speed = th.sneak ? THIEF.sneakSpeed : THIEF.speed;
      const nx = th.x + input.x * speed * dt, ny = th.y + input.y * speed * dt;
      if (!circleHitsWall(nx, th.y, THIEF.r)) th.x = nx;
      if (!circleHitsWall(th.x, ny, THIEF.r)) th.y = ny;
      if (input.x || input.y) th.facing = Math.atan2(input.y, input.x);
      if (input.smoke && state.smokesLeft > 0 && !inSmoke(state, th.x, th.y)) {
        state.smokes.push({ x: th.x, y: th.y, t: SMOKE.seconds });
        state.smokesLeft -= 1; events |= EVENT_SMOKE;
        state.message = 'Smoke! Cameras blind, guards confused.'; state.messageTimer = 2;
      }
      for (const s of state.smokes) s.t -= dt;
      state.smokes = state.smokes.filter((s) => s.t > 0);

      // Loot pickup on touch.
      for (const l of state.loot) {
        l.bob += dt;
        // Loot sits on the display cases: you grab it by reaching over the
        // case from beside it, so the grab radius reaches across the case edge.
        if (!l.taken && dist(th.x, th.y, l.x, l.y) < THIEF.r + l.r + 46) {
          l.taken = true; state.lootTaken += 1; state.lootValue += l.value;
          state.score += l.value + 250;
          events |= EVENT_PICKUP;
          state.message = `${l.name} secured — $${l.value.toLocaleString()}`; state.messageTimer = 2.2;
        }
      }

      // Guards: patrol waypoints, chase when suspicion is high.
      let anySeen = false;
      for (const g of state.guards) {
        const hidden = inSmoke(state, th.x, th.y);
        const seen = !hidden && inCone(g.x, g.y, g.angle, GUARD.coneHalf, GUARD.coneLen, th.x, th.y)
          && losClear(g.x, g.y, th.x, th.y);
        if (seen) {
          anySeen = true;
          const rate = (g.chasing ? GUARD.chaseDetectRate : GUARD.detectRate) * (th.sneak ? 0.45 : 1);
          g.suspicion = clamp(g.suspicion + rate * dt, 0, 100);
          state.alarm = clamp(state.alarm + rate * dt * 0.9, 0, ALARM.max);
          if (g.suspicion > 55 && !g.chasing) { g.chasing = true; g.chaseTimer = GUARD.chaseTime; g.state = 'chase'; }
        } else {
          g.suspicion = clamp(g.suspicion - GUARD.suspicionDecay * dt, 0, 100);
        }
        if (g.chasing) {
          g.chaseTimer -= dt;
          const a = Math.atan2(th.y - g.y, th.x - g.x);
          g.angle = a;
          const mx = g.x + Math.cos(a) * GUARD.chaseSpeed * dt, my = g.y + Math.sin(a) * GUARD.chaseSpeed * dt;
          if (!circleHitsWall(mx, g.y, GUARD.r)) g.x = mx;
          if (!circleHitsWall(g.x, my, GUARD.r)) g.y = my;
          if (g.chaseTimer <= 0 || g.suspicion < 15) { g.chasing = false; g.state = 'patrol'; }
        } else {
          const wp = g.waypoints[g.wp];
          const d = dist(g.x, g.y, wp[0], wp[1]);
          if (d < 8) { g.wp = (g.wp + 1) % g.waypoints.length; }
          else {
            const a = Math.atan2(wp[1] - g.y, wp[0] - g.x);
            g.angle = a;
            g.x += Math.cos(a) * GUARD.patrolSpeed * dt;
            g.y += Math.sin(a) * GUARD.patrolSpeed * dt;
          }
        }
      }

      // Cameras: sweep back and forth, red cone raises the alarm.
      for (const c of state.cameras) {
        c.t += dt;
        c.angle = c.baseAngle + Math.sin(c.t * CAMERA.sweepSpeed) * c.sweep;
        const hidden = inSmoke(state, th.x, th.y);
        if (!hidden && inCone(c.x, c.y, c.angle, CAMERA.coneHalf, CAMERA.coneLen, th.x, th.y)
          && losClear(c.x, c.y, th.x, th.y)) {
          anySeen = true;
          state.alarm = clamp(state.alarm + CAMERA.detectRate * dt * (th.sneak ? 0.5 : 1), 0, ALARM.max);
        }
      }

      state.spotted = anySeen;
      if (anySeen) {
        state.spottedTimer = 0.4;
        if (!(events & EVENT_SPOTTED) && state.alarm > 20) events |= EVENT_SPOTTED;
      } else if (state.spottedTimer > 0) state.spottedTimer -= dt;

      // Alarm decays when unseen; at 100 the vault locks down.
      if (!anySeen) state.alarm = clamp(state.alarm - ALARM.decay * dt, 0, ALARM.max);
      if (state.messageTimer > 0) state.messageTimer -= dt;

      // Win: diamond taken, then reach the exit door.
      const diamond = state.loot.find((l) => l.id === 'diamond');
      if (diamond.taken && th.x > EXIT.x && th.x < EXIT.x + EXIT.w && th.y > EXIT.y && th.y < EXIT.y + EXIT.h) {
        state.won = true; state.over = true;
        state.score += Math.max(0, Math.round(3000 - state.time * 8)) + Math.max(0, Math.round((100 - state.alarm) * 10));
        events |= EVENT_WIN;
      }
      if (state.alarm >= ALARM.bustAt) {
        state.busted = true; state.over = true; events |= EVENT_BUSTED;
      }
      return events;
    },
  };
}
export { VAULT, EXIT };
