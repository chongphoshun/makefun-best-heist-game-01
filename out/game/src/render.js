// MIDNIGHT VAULT — canvas renderer: museum room, vision cones, HUD, screens.
import { ALARM, CAMERA, EXIT, FIELD, FONT, GUARD, HUD_H, PALETTE, SMOKE, THIEF, VAULT, WALLS } from './config.js';
import { losClear } from './world.js';

export const SCREEN_TITLE = 'title', SCREEN_PLAY = 'play', SCREEN_OVER = 'over', SCREEN_WIN = 'win';

function conePath(ctx, x, y, angle, half, len) {
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.arc(x, y, len, angle - half, angle + half); ctx.closePath();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function drawWorld(ctx, state, screen) {
  const W = FIELD.width, H = FIELD.height;
  // Floor: dark marble checker.
  ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, W, H);
  const tile = 64;
  for (let ty = HUD_H; ty < H; ty += tile) for (let tx = 0; tx < W; tx += tile) {
    ctx.fillStyle = ((tx / tile + ty / tile) % 2 === 0) ? PALETTE.floorA : PALETTE.floorB;
    ctx.fillRect(tx, ty, tile, tile);
  }
  // Gold trim around the room.
  ctx.strokeStyle = PALETTE.goldDim; ctx.lineWidth = 3;
  ctx.strokeRect(28, HUD_H + 14, W - 56, H - HUD_H - 42);
  // Paintings on the top wall.
  const paintings = [[180, 84, 90, 52, '#7a3b4f'], [520, 84, 90, 52, '#2f5d4a'], [860, 84, 90, 52, '#4a3b7a']];
  for (const [x, y, w, h, c] of paintings) {
    ctx.fillStyle = '#c9a227'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = c; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 8, y + 8, w - 30, 6);
  }
  // Velvet rope line across the middle gallery.
  ctx.strokeStyle = '#a83246'; ctx.lineWidth = 4; ctx.setLineDash([14, 10]);
  ctx.beginPath(); ctx.moveTo(60, 430); ctx.lineTo(1220, 430); ctx.stroke(); ctx.setLineDash([]);

  // Obstacles: display cases + pillar, with gold edges and labels.
  for (const w of WALLS) {
    ctx.fillStyle = '#232c4a'; ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(242,201,76,0.14)'; ctx.fillRect(w.x, w.y, w.w, 10);
    ctx.strokeStyle = PALETTE.goldDim; ctx.lineWidth = 2; ctx.strokeRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w * 0.32, w.h * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Vault (top-right): glowing doorway + diamond pedestal.
  const vaultGlow = 0.5 + 0.3 * Math.sin(state.time * 3);
  ctx.fillStyle = `rgba(127,231,255,${0.10 + vaultGlow * 0.08})`;
  ctx.fillRect(VAULT.x - 10, VAULT.y - 10, VAULT.w + 20, VAULT.h + 20);
  ctx.fillStyle = '#1b2f4a'; ctx.fillRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
  ctx.strokeStyle = '#7fe7ff'; ctx.lineWidth = 3; ctx.strokeRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
  ctx.fillStyle = PALETTE.cream; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText('★ VAULT ★', VAULT.x + VAULT.w / 2, VAULT.y + 18);

  // Exit door (bottom-left).
  ctx.fillStyle = '#1d5c33'; ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3; ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#d1fae5'; ctx.font = `bold 15px ${FONT}`;
  ctx.fillText('EXIT →', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 5);

  // Loot, pulsing glow.
  for (const l of state.loot) {
    if (l.taken) continue;
    const pulse = 1 + 0.18 * Math.sin(state.time * 4 + l.bob);
    ctx.save(); ctx.globalAlpha = 0.35;
    ctx.fillStyle = l.color; ctx.beginPath(); ctx.arc(l.x, l.y, l.r * 2.1 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = l.color;
    if (l.kind === 'diamond') {
      ctx.beginPath(); ctx.moveTo(l.x, l.y - 16); ctx.lineTo(l.x + 14, l.y); ctx.lineTo(l.x, l.y + 16); ctx.lineTo(l.x - 14, l.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(l.x, l.y - 8); ctx.lineTo(l.x + 6, l.y); ctx.lineTo(l.x, l.y + 8); ctx.lineTo(l.x - 6, l.y); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(l.x, l.y, l.r * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0d18'; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'center';
      ctx.fillText('$', l.x, l.y + 5);
    }
    ctx.fillStyle = PALETTE.cream; ctx.font = `11px ${FONT}`;
    ctx.fillText(l.name, l.x, l.y + l.r + 16);
  }

  // Camera cones (red) — drawn under guards so cones stay readable.
  for (const c of state.cameras) {
    ctx.save(); ctx.globalAlpha = 0.20;
    ctx.fillStyle = PALETTE.camCone; conePath(ctx, c.x, c.y, c.angle, CAMERA.coneHalf, CAMERA.coneLen); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALETTE.camCone; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = PALETTE.camCone; ctx.beginPath(); ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.muted; ctx.font = `10px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText('CCTV', c.x, c.y - 16);
  }

  // Guard vision cones (yellow) + guards.
  for (const g of state.guards) {
    const alpha = g.chasing ? 0.38 : 0.26;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = g.chasing ? '#ff5a3c' : PALETTE.cone;
    conePath(ctx, g.x, g.y, g.angle, GUARD.coneHalf, GUARD.coneLen); ctx.fill();
    ctx.restore();
    ctx.fillStyle = g.chasing ? '#7a1f14' : '#1d3a5f';
    ctx.beginPath(); ctx.arc(g.x, g.y, GUARD.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = g.chasing ? '#ff5a3c' : PALETTE.guardTrim; ctx.lineWidth = 2.5; ctx.stroke();
    // Cap + eyes in facing direction.
    ctx.fillStyle = PALETTE.guardTrim;
    ctx.beginPath(); ctx.arc(g.x + Math.cos(g.angle) * 7, g.y + Math.sin(g.angle) * 7, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `bold 11px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y - GUARD.r - 8);
    if (g.suspicion > 5) {
      ctx.fillStyle = g.suspicion > 55 ? '#ff5a3c' : '#ffd23f';
      ctx.fillRect(g.x - 16, g.y - GUARD.r - 22, 32 * (g.suspicion / 100), 4);
    }
  }

  // Smoke clouds.
  for (const s of state.smokes) {
    ctx.save(); ctx.globalAlpha = Math.min(0.75, s.t / SMOKE.seconds + 0.3);
    ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(s.x, s.y, SMOKE.radius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Thief: black cloak, gold mask, direction tick.
  const th = state.thief;
  ctx.save();
  ctx.shadowColor = PALETTE.thiefTrim; ctx.shadowBlur = th.sneak ? 4 : 14;
  ctx.fillStyle = PALETTE.thief; ctx.beginPath(); ctx.arc(th.x, th.y, THIEF.r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = PALETTE.thiefTrim; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(th.x, th.y, THIEF.r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = PALETTE.thiefTrim;
  ctx.beginPath(); ctx.arc(th.x + Math.cos(th.facing) * 6, th.y + Math.sin(th.facing) * 6, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.cream; ctx.font = `bold 11px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText(th.sneak ? 'SNEAKING' : 'THIEF', th.x, th.y - THIEF.r - 8);

  // Spotted flash: red vignette when seen.
  if (state.spotted) {
    ctx.save(); ctx.globalAlpha = 0.16 + 0.08 * Math.sin(state.time * 10);
    ctx.fillStyle = '#ff2020'; ctx.fillRect(0, HUD_H, W, H - HUD_H); ctx.restore();
    ctx.fillStyle = '#ff6b6b'; ctx.font = `bold 22px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText('! SPOTTED — BREAK LINE OF SIGHT !', W / 2, HUD_H + 34);
  }
  if (state.messageTimer > 0 && state.message) {
    ctx.fillStyle = PALETTE.cream; ctx.font = `bold 15px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(state.message, W / 2, H - 18);
  }
}

export function drawHUD(ctx, state) {
  const W = FIELD.width;
  ctx.fillStyle = '#0b0e1a'; ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = PALETTE.gold; ctx.font = `bold 22px ${FONT}`; ctx.textAlign = 'left';
  ctx.fillText('◆ MIDNIGHT VAULT', 20, 28);
  ctx.fillStyle = PALETTE.muted; ctx.font = `13px ${FONT}`;
  ctx.fillText('steal the Meridian Diamond, then reach EXIT', 20, 50);

  // Alarm meter — the heart of the HUD.
  const ax = 470, ay = 16, aw = 340, ah = 22;
  ctx.fillStyle = '#1f2937'; roundRect(ctx, ax, ay, aw, ah, 6); ctx.fill();
  const frac = state.alarm / ALARM.max;
  const col = frac < 0.4 ? '#4ade80' : frac < 0.7 ? '#f2c94c' : '#e5534b';
  ctx.fillStyle = col; roundRect(ctx, ax, ay, aw * frac, ah, 6); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; roundRect(ctx, ax, ay, aw, ah, 6); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `bold 14px ${FONT}`; ctx.textAlign = 'left';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}%`, ax + 8, ay + 16);
  ctx.fillStyle = PALETTE.muted; ctx.font = `12px ${FONT}`;
  ctx.fillText(frac > 0.7 ? 'LOCKDOWN IMMINENT' : 'stay out of the cones', ax, ay + 38);

  // Loot / score / time / smoke.
  ctx.textAlign = 'right'; ctx.fillStyle = PALETTE.cream; ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(`LOOT ${state.lootTaken}/5  •  $${state.lootValue.toLocaleString()}`, W - 20, 26);
  ctx.fillStyle = PALETTE.muted; ctx.font = `13px ${FONT}`;
  const mm = Math.floor(state.time / 60), ss = Math.floor(state.time % 60);
  ctx.fillText(`SCORE ${state.score.toLocaleString()}   ${mm}:${String(ss).padStart(2, '0')}   SMOKE ${'●'.repeat(state.smokesLeft)}${'○'.repeat(2 - state.smokesLeft)} (Q)`, W - 20, 50);
}

function overlay(ctx, title, lines, accent) {
  ctx.save(); ctx.fillStyle = 'rgba(5,7,14,0.78)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height); ctx.restore();
  ctx.fillStyle = accent; ctx.font = `bold 44px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText(title, FIELD.width / 2, 250);
  ctx.fillStyle = PALETTE.cream; ctx.font = `19px ${FONT}`;
  lines.forEach((l, i) => ctx.fillText(l, FIELD.width / 2, 300 + i * 30));
}

export function drawScreen(ctx, state, screen, best) {
  drawWorld(ctx, state, screen);
  drawHUD(ctx, state);
  if (screen === SCREEN_TITLE) {
    overlay(ctx, '◆ MIDNIGHT VAULT ◆', [
      'One thief. One vault. Three guards. Two cameras. One diamond.',
      'WASD / arrows to move  •  SHIFT to sneak  •  Q smoke bomb (×2)',
      'Grab all 5 loot, steal the Meridian Diamond, then slip out the EXIT.',
      'If the ALARM hits 100%, the vault locks down. You are done.',
      '',
      '— press ENTER or click to start the heist —',
    ], PALETTE.gold);
  } else if (screen === SCREEN_OVER) {
    overlay(ctx, state.busted ? 'BUSTED — LOCKDOWN' : 'CAUGHT', [
      `The alarm hit 100%. The vault sealed with $${state.lootValue.toLocaleString()} still inside.`,
      `Loot ${state.lootTaken}/5  •  Score ${state.score.toLocaleString()}  •  Best ${best.toLocaleString()}`,
      '',
      'Press R to run it back.',
    ], '#ff5a3c');
  } else if (screen === SCREEN_WIN) {
    overlay(ctx, 'CLEAN GETAWAY ★', [
      `The Meridian Diamond is yours. $${state.lootValue.toLocaleString()} in loot, alarm at ${Math.round(state.alarm)}%.`,
      `Score ${state.score.toLocaleString()}  •  Time ${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')}  •  Best ${best.toLocaleString()}`,
      'No guard ever laid a hand on you. The museum will notice in the morning.',
      '',
      'Press R to steal it all over again.',
    ], '#4ade80');
  }
}
export { losClear };
