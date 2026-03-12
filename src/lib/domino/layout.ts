import type { Domino } from "./game";
export type BoardBounds = { width: number; height: number; margin?: number };
export type TilePlacement = { x: number; y: number; rot: number; w: number; h: number };
const TILE_WIDTH = 50;
const TILE_HEIGHT = 100;

function dimsFor(t: Domino, tileW: number, tileH: number) {
  const isDouble = t.a === t.b;
  return isDouble ? { w: tileW, h: tileH } : { w: tileH, h: tileW };
}
function rotFor(t: Domino) {
  return t.a === t.b ? 0 : -90;
}

export function computeDominoLayout(
  chain: Domino[],
  tileW: number,
  tileH: number,
  _bounds?: BoardBounds,
  pivotIndex?: number | null
): TilePlacement[] {
  const n = chain.length;
  if (n === 0) return [];
  let piv = pivotIndex ?? Math.floor(n / 2);
  if (piv < 0 || piv >= n) piv = Math.floor(n / 2);
  const placements: TilePlacement[] = new Array(n);
  const centerX = 0;
  const centerY = 0;
  const pDims = dimsFor(chain[piv], tileW, tileH);
  const pivIsDouble = chain[piv].a === chain[piv].b;
  const pivRot = pivIsDouble ? 0 : -90;
  placements[piv] = { x: centerX, y: centerY, rot: pivRot, w: pDims.w, h: pDims.h };
  const margin = _bounds?.margin ?? 12;
  const halfW = (_bounds?.width ?? 0) / 2 - margin;
  const halfH = (_bounds?.height ?? 0) / 2 - margin;
  const rowDelta = tileH / 2 + tileW / 2;
  let dirRight = 1; // 1 يمين، -1 يسار
  let rowYRight = 0;
  for (let i = piv + 1; i < n; i++) {
    const prev = placements[i - 1];
    const prevTile = chain[i - 1];
    const currTile = chain[i];
    const currIsDouble = currTile.a === currTile.b;
    let cDims = dimsFor(currTile, tileW, tileH);
    let xCand = dirRight === 1 ? prev.x + prev.w / 2 + cDims.w / 2 : prev.x - prev.w / 2 - cDims.w / 2;
    let yCand = rowYRight;
    let isCorner = false;
    if (halfW > 0) {
      if (xCand + cDims.w / 2 > halfW) {
        const newRow = Math.min(halfH - tileH / 2, rowYRight + rowDelta);
        dirRight = -1;
        rowYRight = newRow;
        xCand = prev.x + prev.w / 2 + tileW / 2;
        yCand = prev.y + tileH / 2; // اتصال أعلى الرأسية مع نهاية السابقة
        isCorner = true;
      } else if (xCand - cDims.w / 2 < -halfW) {
        const newRow = Math.min(halfH - tileH / 2, rowYRight + rowDelta);
        dirRight = 1;
        rowYRight = newRow;
        xCand = prev.x - prev.w / 2 - tileW / 2;
        yCand = prev.y + tileH / 2; // اتصال أعلى الرأسية مع نهاية السابقة
        isCorner = true;
      }
    }
    let rotDeg = rotFor(currTile);
    if (!currIsDouble && isCorner) {
      const match = prevTile.b;
      rotDeg = currTile.a === match ? 0 : 180;
      cDims = { w: tileW, h: tileH };
    }
    if (currIsDouble && isCorner) {
      rotDeg = 0;
      cDims = { w: tileW, h: tileH };
    }
    if (!currIsDouble && !isCorner) {
      rotDeg = dirRight === 1 ? -90 : 90;
    }
    placements[i] = { x: xCand, y: yCand, rot: rotDeg, w: cDims.w, h: cDims.h };
  }
  let dirLeft = -1; // يبدأ يسار
  let rowYLeft = 0;
  for (let i = piv - 1; i >= 0; i--) {
    const next = placements[i + 1];
    const nextTile = chain[i + 1];
    const currTile = chain[i];
    const currIsDouble = currTile.a === currTile.b;
    let cDims = dimsFor(currTile, tileW, tileH);
    let xCand = dirLeft === -1 ? next.x - next.w / 2 - cDims.w / 2 : next.x + next.w / 2 + cDims.w / 2;
    let yCand = rowYLeft;
    let isCorner = false;
    if (halfW > 0) {
      if (xCand - cDims.w / 2 < -halfW) {
        const newRow = Math.max(-halfH + tileH / 2, rowYLeft - rowDelta);
        dirLeft = 1;
        rowYLeft = newRow;
        xCand = next.x - next.w / 2 - tileW / 2;
        yCand = next.y - tileH / 2; // اتصال أسفل الرأسية مع نهاية التالية
        isCorner = true;
      } else if (xCand + cDims.w / 2 > halfW) {
        const newRow = Math.max(-halfH + tileH / 2, rowYLeft - rowDelta);
        dirLeft = -1;
        rowYLeft = newRow;
        xCand = next.x + next.w / 2 + tileW / 2;
        yCand = next.y - tileH / 2; // اتصال أسفل الرأسية مع نهاية التالية
        isCorner = true;
      }
    }
    let rotDeg = rotFor(currTile);
    if (!currIsDouble && isCorner) {
      const match = nextTile.a;
      rotDeg = currTile.b === match ? 0 : 180;
      cDims = { w: tileW, h: tileH };
    }
    if (currIsDouble && isCorner) {
      rotDeg = 0;
      cDims = { w: tileW, h: tileH };
    }
    if (!currIsDouble && !isCorner) {
      rotDeg = dirLeft === -1 ? -90 : 90;
    }
    placements[i] = { x: xCand, y: yCand, rot: rotDeg, w: cDims.w, h: cDims.h };
  }
  return placements;
}

export function computePerfectLayout(chain: Domino[], bounds: BoardBounds) {
  if (chain.length === 0) return [];

  const placements = [];
  const p = computeDominoLayout(chain as Domino[], TILE_WIDTH, TILE_HEIGHT, bounds, Math.floor(chain.length / 2));
  for (let i = 0; i < p.length; i++) {
    placements.push(p[i]);
  }
  return placements;
}
