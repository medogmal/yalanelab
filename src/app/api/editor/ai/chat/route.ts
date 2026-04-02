// ═══════════════════════════════════════════════════════════
//  YALA EDITOR — AI Chat API
//  POST /api/editor/ai/chat
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي متخصص في بناء الألعاب داخل منصة "يالا نلعب".
لديك وصول كامل لـ engineData الخاص بمشروع اللعبة وتقدر تعدّله.

engineData له الهيكل ده:
{
  scenes: [{ id, name, width, height, gravity, backgroundColor:{r,g,b,a}, objects:[...] }],
  settings: { screenWidth, screenHeight, physics, language },
  story: { title, synopsis, winCondition, loseCondition }
}

كل object له: { id, name, type, x, y, width, height, rotation, visible, locked, color:{r,g,b,a}, layer, tags }
أنواع الـ objects: player, enemy, platform, wall, trigger, collectible, npc, spawn, goal, decoration, text

ردودك لازم تكون JSON فقط (بدون backticks أو markdown):
{
  "message": "رسالة للمستخدم بالعربي",
  "patch": { ... تعديلات على engineData ... } أو null لو مش محتاج تعديل
}

الـ patch ممكن يحتوي على:
- "scenes": مصفوفة كاملة بعد التعديل
- "settings": object التعديلات على الإعدادات
- "story": object التعديلات على القصة

أمثلة على المطالب:
- "ضيف منصات" → ضيف 3-5 platform objects في الـ scene الأولى
- "اعمل عدو" → ضيف enemy object
- "غير الخلفية لأحمر" → عدّل backgroundColor في الـ scene
- "شرح لي" → اشرح بدون patch

مهم:
- الـ id لازم يكون unique: استخدم "obj_ai_" + رقم عشوائي
- الألوان بـ {r,g,b,a} مش hex
- الإحداثيات لازم تكون داخل حدود الـ scene
- ردّ بالعربي دايماً`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { message, engineData, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "الرسالة مطلوبة" }, { status: 400 });
    }

    // Build messages array with history
    const messages: Anthropic.MessageParam[] = [];

    // Add history (last 6 messages)
    for (const h of history.slice(-6)) {
      messages.push({
        role: h.role === "user" ? "user" : "assistant",
        content: h.content,
      });
    }

    // Add current user message with game state
    messages.push({
      role: "user",
      content: `حالة اللعبة الحالية:
${JSON.stringify(engineData, null, 2)}

طلب المستخدم: ${message}`,
    });

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages,
    });

    const rawText = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    // Parse JSON response
    let parsed: { message: string; patch: object | null };
    try {
      // Remove any accidental markdown fences
      const clean = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      // If not valid JSON, return as plain message
      parsed = { message: rawText, patch: null };
    }

    return NextResponse.json({
      message: parsed.message || "تم",
      patch: parsed.patch || null,
    });
  } catch (error: unknown) {
    console.error("[AI Chat] Error:", error);
    const msg = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
