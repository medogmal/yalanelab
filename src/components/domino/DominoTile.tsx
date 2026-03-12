
import React from "react";

const DOMINO_ORDER = [
  [0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6],
  [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [2,2],
  [2,3], [2,4], [2,5], [2,6], [3,3], [3,4], [3,5],
  [3,6], [4,4], [4,5], [4,6], [5,5], [5,6], [6,6]
];

interface DominoTileProps {
  a: number;
  b: number;
  skinUrl?: string; // If provided, use sprite sheet.
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  rotate?: 0 | 90 | 180 | 270; // Explicit rotation for layout
}

export default function DominoTile({ a, b, skinUrl, className, onClick, disabled, rotate = 0 }: DominoTileProps) {
  // Canonical form: smaller number first for lookup
  const [min, max] = a < b ? [a, b] : [b, a];
  
  // Find index in our standard sprite sheet order
  const index = DOMINO_ORDER.findIndex(([x, y]) => x === min && y === max);

  // Removed Garrifin 2-6 Hotfix as per user feedback ("direction is wrong")
  // Reverting to standard rotation logic.
  const finalRotate = rotate;
  
  // Default look (CSS/Tailwind) if no skin
  if (!skinUrl) {
     return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`relative flex items-center justify-center bg-white border border-zinc-300 rounded overflow-hidden shadow-sm transition-transform ${className}`}
            style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
        >
             <div className="flex flex-col items-center justify-center w-full h-full gap-1">
                 <span className="font-bold text-black">{min}</span>
                 <div className="w-full h-px bg-zinc-300" />
                 <span className="font-bold text-black">{max}</span>
             </div>
        </button>
     );
  }

  // Check if skinUrl is a directory (doesn't end in .png/.jpg/etc)
  const isDirectorySkin = skinUrl && !skinUrl.match(/\.(png|jpg|jpeg|webp)$/i);

  // If using individual images (High Quality Mode)
  if (isDirectorySkin) {
      // Filename format: "min-max.png"
      // Ensure we use canonical order (smaller first) as per file system
      // If tile is played as 5-2, we need image 2-5.png but rotated.
      // The prop 'rotate' handles the visual orientation.
      // The image source should always be min-max.png.
      
      const [small, big] = a < b ? [a, b] : [b, a];
      const tileImage = `${skinUrl}/${small}-${big}.png`;
      const isHorizontal = finalRotate === 90 || finalRotate === 270;

      return (
        <button
          onClick={onClick}
          disabled={disabled}
          // Added rounded corners back slightly to soften look
          className={`relative flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 ${className}`}
          style={{ 
              width: isHorizontal ? "80px" : "40px", 
              height: isHorizontal ? "40px" : "80px",
          }}
        >
           <img 
             src={tileImage} 
             alt={`${a}-${b}`}
             // Increased scale to 1.4 to force significant overlap and eliminate white lines
             className="w-full h-full object-fill scale-[1.4] z-10" 
             style={{ 
                 transform: `rotate(${finalRotate}deg)`,
                 transformOrigin: "center",
                 imageRendering: "auto",
                 // Matte finish: brightness 0.95, contrast 1.1
                 filter: "brightness(0.95) contrast(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
             }}
             onError={(e) => {
                 console.error(`Missing tile image: ${tileImage}`);
                 // Fallback to text if image missing - REMOVED bg-white causing white line artifacts
                 e.currentTarget.style.display = 'none';
                 // e.currentTarget.parentElement?.classList.add('bg-white', 'border', 'border-zinc-300');
             }}
           />
           {/* Fallback Text (hidden by image usually) */}
           <div className="absolute inset-0 flex flex-col items-center justify-center -z-10">
                 <span className="font-bold text-white text-xs">{min}</span>
                 <div className="w-full h-px bg-white/20" />
                 <span className="font-bold text-white text-xs">{max}</span>
           </div>
        </button>
      );
  }

  // Sprite Sheet Calculation (Legacy Mode)
  // Grid: 7 cols x 4 rows
  const col = index % 7;
  const row = Math.floor(index / 7);

  // The sprite sheet has 7 columns and 4 rows.
  // Each cell is 1/7 wide and 1/4 tall.
  const posX = (col / 6) * 100;
  const posY = (row / 3) * 100;
  
  const isHorizontal = rotate === 90 || rotate === 270;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center justify-center shadow-sm rounded-[1px] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 ${className}`}
    >
      <div 
        style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            // If horizontal (container is 2:1), we need inner to be 1:2.
            // If container is w-16 h-8 (64px x 32px).
            // Inner needs to be 32px x 64px.
            width: isHorizontal ? "32px" : "100%", 
            height: isHorizontal ? "64px" : "100%",
            
            // We revert to standard grid size (7 cols, 4 rows) and use scale() to zoom/crop
            backgroundImage: `url(${skinUrl})`,
            backgroundSize: "700% 400%", 
            backgroundPosition: `${(col / 6) * 100}% ${(row / 3) * 100}%`,
            backgroundRepeat: "no-repeat",
            
            // Transform logic:
            // 1. Center the div (translate -50%, -50%)
            // 2. Apply layout rotation (rotate)
            // 3. Scale up (1.35) to crop the internal borders of the sprite aggressively
            transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(1.35)`,
            imageRendering: "high-quality",
        }}
        className={isHorizontal ? "w-8 h-16" : "w-full h-full"}
      />
    </button>
  );
}
