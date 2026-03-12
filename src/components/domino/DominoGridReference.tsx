
import React from "react";

export default function DominoGridReference() {
  const DOMINO_ORDER = [
    [0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6],
    [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [2,2],
    [2,3], [2,4], [2,5], [2,6], [3,3], [3,4], [3,5],
    [3,6], [4,4], [4,5], [4,6], [5,5], [5,6], [6,6]
  ];

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl mt-4">
      <h4 className="text-white font-bold mb-4">ترتيب قطع الدومينو في الصورة (7 أعمدة × 4 صفوف)</h4>
      <div className="grid grid-cols-7 gap-1 bg-black p-2 rounded w-fit mx-auto">
        {DOMINO_ORDER.map(([a, b], i) => (
          <div key={i} className="w-12 h-24 bg-white text-black flex flex-col items-center justify-center border border-zinc-400 text-xs font-bold">
            <span>{a}</span>
            <div className="w-full h-px bg-black my-1"></div>
            <span>{b}</span>
          </div>
        ))}
      </div>
      <p className="text-zinc-500 text-xs mt-2 text-center">
        يجب أن تكون الصورة المرفوعة تحتوي على جميع القطع بهذا الترتيب تماماً.
      </p>
    </div>
  );
}
