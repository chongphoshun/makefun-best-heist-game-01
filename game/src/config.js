// MIDNIGHT VAULT — tuning, layout and palette in one place.
// Logical playfield is 1280x720; the renderer scales it to the window.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const HUD_H = 64;

export const THIEF = { r: 14, speed: 215, sneakSpeed: 115, grabR: 26 };

export const GUARD = {
  r: 15, patrolSpeed: 58, chaseSpeed: 132, coneLen: 210, coneHalf: 0.61,
  detectRate: 38, chaseDetectRate: 70, suspicionDecay: 26, chaseTime: 2.2,
};
export const CAMERA = { coneLen: 250, coneHalf: 0.42, detectRate: 24, sweepSpeed: 0.55 };

export const ALARM = { max: 100, decay: 7, bustAt: 100 };
export const SMOKE = { max: 2, radius: 95, seconds: 3.2 };

// Room layout: walls are the playfield border; obstacles block movement and sight.
export const WALLS = [
  // x, y, w, h — display cases, pillars, velvet-rope planters
  { x: 300, y: 150, w: 120, h: 70 },   // gold display case
  { x: 620, y: 300, w: 70, h: 150 },   // central pillar
  { x: 880, y: 150, w: 120, h: 70 },   // jade display case
  { x: 300, y: 470, w: 120, h: 70 },   // painting plinth
  { x: 880, y: 470, w: 120, h: 70 },   // cash display case
  { x: 560, y: 560, w: 160, h: 56 },   // long bench / rope barrier
];

export const VAULT = { x: 1108, y: 92, w: 132, h: 128 }; // top-right vault room
export const EXIT = { x: 36, y: 596, w: 96, h: 88 };     // bottom-left exit door
export const SPAWN = { x: 210, y: 640 };

export const LOOT = [
  { id: 'diamond', name: 'Meridian Diamond', value: 5000, x: 1174, y: 156, r: 18, color: '#7fe7ff', kind: 'diamond' },
  { id: 'gold', name: 'Gold Bars', value: 1800, x: 360, y: 185, r: 15, color: '#f2c94c', kind: 'gold' },
  { id: 'painting', name: 'The Velvet Lady', value: 2400, x: 940, y: 185, r: 15, color: '#ff7ab8', kind: 'painting' },
  { id: 'jade', name: 'Jade Phoenix', value: 1500, x: 360, y: 505, r: 15, color: '#4ade80', kind: 'statue' },
  { id: 'cash', name: 'Cash Stack', value: 1200, x: 940, y: 505, r: 15, color: '#a3e635', kind: 'cash' },
];

export const GUARDS = [
  { id: 'marco', name: 'Marco', waypoints: [[240, 300], [640, 300], [640, 620], [240, 620]], start: 0 },
  { id: 'lena', name: 'Lena', waypoints: [[1040, 300], [760, 300], [760, 620], [1040, 620]], start: 1 },
  { id: 'otto', name: 'Otto', waypoints: [[640, 130], [1040, 130], [1040, 430], [640, 430]], start: 2 },
];

export const CAMERAS = [
  { id: 'cam1', x: 640, y: 78, baseAngle: Math.PI / 2, sweep: 0.9 },
  { id: 'cam2', x: 1246, y: 380, baseAngle: Math.PI, sweep: 0.8 },
];

export const PALETTE = {
  bg: '#0a0d18', floorA: '#141a2e', floorB: '#10152a', wall: '#1d2440',
  gold: '#f2c94c', goldDim: '#8a6d1f', red: '#e5534b', cream: '#f4ead2',
  text: '#eef1f5', muted: '#9aa3b8', cone: '#ffd23f', camCone: '#ff4d4d',
  thief: '#0c0c12', thiefTrim: '#f2c94c', guard: '#2f6fb2', guardTrim: '#bcd6ff',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'midnight-vault.best';
