import { promises as fs } from "fs";
import path from "path";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const p = path.join(process.cwd(), "src", "img", "dominointro.mp4");
    const data = await fs.readFile(p);
    return new Response(data, {
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
