// scripts/gen-icons.mjs — يولّد icons الـ PWA من اللوجو
// تشغيل: node scripts/gen-icons.mjs
import { createCanvas, loadImage } from "canvas";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const LOGO_PATH = path.join(__dirname, "../public/branding/1772931007554_logo.png");
const OUT_DIR   = path.join(__dirname, "../public/icons");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const img = await loadImage(LOGO_PATH);

for (const size of SIZES) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#07090f";
  ctx.fillRect(0, 0, size, size);
  const pad = size * 0.12;
  ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
  const buf = canvas.toBuffer("image/png");
  writeFileSync(path.join(OUT_DIR, `icon-${size}.png`), buf);
  console.log(`✅ icon-${size}.png`);
}
console.log("🎉 كل الـ icons اتعملوا!");
