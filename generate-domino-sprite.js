
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const SRC_DIR = path.join(__dirname, 'src/img/domino/Garrifin');
const OUTPUT_FILE = path.join(__dirname, 'public/skins/default_domino.png');

const DOMINO_ORDER = [
  "0+0.png", "0+1.png", "0+2.png", "0+3.png", "0+4.png", "0+5.png", "0+6.png",
  "1+1.png", "1+2.png", "1+3.png", "1+4.png", "1+5.png", "1+6.png", "2+2.png",
  "2+3.png", "2+4.png", "2+5.png", "2+6.png", "3+3.png", "3+4.png", "3+5.png",
  "3+6.png", "4+4.png", "4+5.png", "4+6.png", "5+5.png", "5+6.png", "6+6.png"
];

// Grid: 7 cols x 4 rows
const COLS = 7;
const ROWS = 4;

async function generateSprite() {
    console.log("Starting sprite generation...");
    
    // Determine dimensions from first image
    const firstImgPath = path.join(SRC_DIR, DOMINO_ORDER[0]);
    if (!fs.existsSync(firstImgPath)) {
        console.error("First image not found:", firstImgPath);
        return;
    }
    const firstImg = await loadImage(firstImgPath);
    const tileW = firstImg.width;
    const tileH = firstImg.height;
    
    const canvas = createCanvas(tileW * COLS, tileH * ROWS);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < DOMINO_ORDER.length; i++) {
        const filename = DOMINO_ORDER[i];
        const imgPath = path.join(SRC_DIR, filename);
        
        if (fs.existsSync(imgPath)) {
            const img = await loadImage(imgPath);
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            
            ctx.drawImage(img, col * tileW, row * tileH, tileW, tileH);
            console.log(`Drawn ${filename} at ${col},${row}`);
        } else {
            console.warn(`Missing file: ${filename}`);
        }
    }

    // Ensure output dir exists
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(OUTPUT_FILE, buffer);
    console.log(`Sprite sheet saved to ${OUTPUT_FILE}`);
}

generateSprite();
