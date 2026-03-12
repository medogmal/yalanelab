
import { NextResponse } from "next/server";
import { getPlatformConfig, savePlatformConfig } from "@/lib/platform-config";

export async function GET() {
  return NextResponse.json(getPlatformConfig());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = getPlatformConfig();
    
    // Deep merge (simplified)
    const newConfig = {
        ...current,
        ...body,
        branding: { ...current.branding, ...body.branding },
        content: { ...current.content, ...body.content },
        features: { ...current.features, ...body.features },
    };

    savePlatformConfig(newConfig);
    return NextResponse.json({ success: true, config: newConfig });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}
