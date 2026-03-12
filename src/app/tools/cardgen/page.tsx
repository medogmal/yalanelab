 "use client";
 import React from "react";
 import SaudiCardSVG from "@/components/baloot/SaudiCard";
 
 const SUITS = ["H","D","S","C"] as const;
 const RANKS = ["7","8","9","10","J","Q","K","A"] as const;
 
 function svgToPng(svgEl: SVGSVGElement, fileName: string) {
   const xml = new XMLSerializer().serializeToString(svgEl);
   const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
   const url = URL.createObjectURL(svgBlob);
   const img = new Image();
   img.onload = () => {
     const canvas = document.createElement("canvas");
     canvas.width = svgEl.viewBox.baseVal.width || svgEl.clientWidth;
     canvas.height = svgEl.viewBox.baseVal.height || svgEl.clientHeight;
     const ctx = canvas.getContext("2d");
     if (ctx) {
       ctx.drawImage(img, 0, 0);
       canvas.toBlob((blob) => {
         if (blob) {
           const a = document.createElement("a");
           a.href = URL.createObjectURL(blob);
           a.download = fileName;
           a.click();
         }
         URL.revokeObjectURL(url);
       }, "image/png");
     } else {
       URL.revokeObjectURL(url);
     }
   };
   img.src = url;
 }
 
 export default function CardGeneratorPage() {
  // const refMap = React.useRef<Map<string, SVGSVGElement>>(new Map());
  return (
     <div className="mx-auto max-w-7xl px-4 py-8">
       <h2 className="text-2xl font-bold mb-4 text-silver">مولّد بطاقات سعودية (SVG/PNG)</h2>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {SUITS.map((s) => RANKS.map((r: "7"|"8"|"9"|"10"|"J"|"Q"|"K"|"A") => {
           const key = `${r}-${s}`;
           return (
             <div key={key} className="rounded p-3 bg-zinc-900 text-white card-glow">
               <div className="text-sm mb-2">{r} — {s}</div>
               <div className="flex items-center justify-center">
                 <SaudiCardSVG suit={s} rank={r} width={200} height={300} premium trump={s === "H" ? "H" : null} />
               </div>
               <div className="mt-2 flex items-center gap-2">
                 <button
                   className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500"
                   onClick={() => {
                     const svgEl = document.querySelector(`svg[aria-label='${r}${s}']`) as SVGSVGElement | null;
                     if (svgEl) svgToPng(svgEl, `saudi_${r}_${s}.png`);
                   }}
                 >
                   حفظ PNG
                 </button>
               </div>
             </div>
           );
         }))}
       </div>
     </div>
   );
 }
