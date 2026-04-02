import type { Domino } from "./game";

export type BoardBounds  = { width: number; height: number; margin?: number };
export type TilePlacement = { x: number; y: number; rot: number; w: number; h: number };

const TILE_WIDTH  = 50;
const TILE_HEIGHT = 100;

/* ─── helpers ──────────────────────────────────────── */
/**
 * أبعاد القطعة:
 *   double  → عمودية  (w=tileW, h=tileH)  — ضيقة وطويلة
 *   عادية  → أفقية   (w=tileH, h=tileW)  — عريضة وقصيرة
 */
function dimsFor(t: Domino, tileW: number, tileH: number) {
  return t.a === t.b
    ? { w: tileW, h: tileH }
    : { w: tileH, h: tileW };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   computeDominoLayout
   -------------------------------------------------------
   المنطق:
   ● نبدأ من pivot (المنتصف) بإحداثيات (0,0).
   ● اتجاه يمين  (i > pivot): نبني الـ tail → يمين
   ● اتجاه يسار  (i < pivot): نبني الـ head → يسار
   ● عند تجاوز حدود الـ canvas نعمل "عطفة":
       - نرفع الصف (rowY ±= rowDelta)
       - نعكس الاتجاه
       - القطعة عند الركن تكون عمودية وملاصقة لنهاية السابقة
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function computeDominoLayout(
  chain: Domino[],
  tileW: number,
  tileH: number,
  _bounds?: BoardBounds,
  pivotIndex?: number | null,
): TilePlacement[] {
  const n = chain.length;
  if (n === 0) return [];

  let piv = pivotIndex ?? Math.floor(n / 2);
  if (piv < 0 || piv >= n) piv = Math.floor(n / 2);

  const placements: TilePlacement[] = new Array(n);
  const margin  = _bounds?.margin ?? 12;
  const halfW   = (_bounds?.width  ?? 0) / 2 - margin;
  const halfH   = (_bounds?.height ?? 0) / 2 - margin;

  /*
   * rowDelta = المسافة الرأسية بين صفين:
   *   نصف ارتفاع القطعة الأفقية (tileW/2)
   *   + نصف ارتفاع الصف الجديد  (tileW/2)
   *   + gap بصري صغير
   */
  const GAP      = 6;
  const rowDelta = tileW + GAP;

  /* ── pivot ── */
  const pivDims = dimsFor(chain[piv], tileW, tileH);
  const pivRot  = chain[piv].a === chain[piv].b ? 0 : -90;
  placements[piv] = { x: 0, y: 0, rot: pivRot, w: pivDims.w, h: pivDims.h };

  /* ══════════════════════════════════════════════════
     اتجاه يمين  (tail): i = piv+1 .. n-1
  ══════════════════════════════════════════════════ */
  let dirRight  =  1;   //  1 = سائر يمين، -1 = سائر يسار بعد bend
  let rowYRight =  0;   //  Y الصف الحالي من جهة الـ tail

  for (let i = piv + 1; i < n; i++) {
    const prev     = placements[i - 1];
    const currTile = chain[i];
    const isDouble = currTile.a === currTile.b;
    let   cDims    = dimsFor(currTile, tileW, tileH);

    /* موضع مبدئي — نفس الصف */
    let xCand = dirRight === 1
      ? prev.x + prev.w / 2 + cDims.w / 2
      : prev.x - prev.w / 2 - cDims.w / 2;
    let yCand    = rowYRight;
    let isCorner = false;

    if (halfW > 0) {
      const exceededRight = xCand + cDims.w / 2 > halfW;
      const exceededLeft  = xCand - cDims.w / 2 < -halfW;

      if (exceededRight || exceededLeft) {
        isCorner   = true;
        /*
         * FIX: الـ Y ينتقل فقط بمقدار rowDelta — لا يُضاف frac من الـ tile.
         * القطعة عند الركن تُرسم بنفس Y الصف الجديد (rowYRight المحدّث).
         * بهذا تبقى محاذية للصف وما تتداخلش مع القطعة السابقة.
         */
        rowYRight  = Math.min(halfH - tileW / 2, rowYRight + rowDelta);
        yCand      = rowYRight;
        dirRight  *= -1;

        /*
         * x عند الركن: ملاصق لحافة القطعة السابقة
         * — لو كنا سائرين يمين وتجاوزنا، نبدأ من prev.x + prev.w/2 - tileW/2
         *   (أي مباشرة تحت/فوق نهاية القطعة السابقة)
         * — والعكس
         */
        xCand = exceededRight
          ? prev.x + prev.w / 2 - tileW / 2
          : prev.x - prev.w / 2 + tileW / 2;
      }
    }

    /* تدوير */
    let rotDeg: number;
    if (isCorner || isDouble) {
      /* عند الركن أو الـ double: عمودية (لا تدوير) */
      rotDeg = 0;
      cDims  = { w: tileW, h: tileH };
    } else {
      /* عادية أفقية: تدوير حسب الاتجاه */
      rotDeg = dirRight === 1 ? -90 : 90;
      cDims  = { w: tileH, h: tileW };
    }

    placements[i] = { x: xCand, y: yCand, rot: rotDeg, w: cDims.w, h: cDims.h };
  }

  /* ══════════════════════════════════════════════════
     اتجاه يسار  (head): i = piv-1 .. 0
  ══════════════════════════════════════════════════ */
  let dirLeft  = -1;   // -1 = سائر يسار، 1 = سائر يمين بعد bend
  let rowYLeft =  0;

  for (let i = piv - 1; i >= 0; i--) {
    const next     = placements[i + 1];
    const currTile = chain[i];
    const isDouble = currTile.a === currTile.b;
    let   cDims    = dimsFor(currTile, tileW, tileH);

    let xCand = dirLeft === -1
      ? next.x - next.w / 2 - cDims.w / 2
      : next.x + next.w / 2 + cDims.w / 2;
    let yCand    = rowYLeft;
    let isCorner = false;

    if (halfW > 0) {
      const exceededLeft  = xCand - cDims.w / 2 < -halfW;
      const exceededRight = xCand + cDims.w / 2 >  halfW;

      if (exceededLeft || exceededRight) {
        isCorner  = true;
        /*
         * FIX: نفس المنطق — Y ينزل بمقدار rowDelta فقط.
         * الاتجاه للـ head معكوس: rowYLeft يتناقص (يصعد على الشاشة).
         */
        rowYLeft  = Math.max(-halfH + tileW / 2, rowYLeft - rowDelta);
        yCand     = rowYLeft;
        dirLeft  *= -1;

        xCand = exceededLeft
          ? next.x - next.w / 2 + tileW / 2
          : next.x + next.w / 2 - tileW / 2;
      }
    }

    let rotDeg: number;
    if (isCorner || isDouble) {
      rotDeg = 0;
      cDims  = { w: tileW, h: tileH };
    } else {
      rotDeg = dirLeft === -1 ? -90 : 90;
      cDims  = { w: tileH, h: tileW };
    }

    placements[i] = { x: xCand, y: yCand, rot: rotDeg, w: cDims.w, h: cDims.h };
  }

  return placements;
}

/* wrapper للاستخدام الخارجي */
export function computePerfectLayout(chain: Domino[], bounds: BoardBounds) {
  if (chain.length === 0) return [];
  return computeDominoLayout(
    chain,
    TILE_WIDTH,
    TILE_HEIGHT,
    bounds,
    Math.floor(chain.length / 2),
  );
}
