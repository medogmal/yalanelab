// ═══════════════════════════════════════════════════════════════
//  API: /api/editor/ai/chat — AI Game Designer
// ═══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM = `أنت مصمم ألعاب AI متخصص في منصة يالا نلعب.
عندك قدرة تعدّل على engineData اللعبة مباشرة.

هيكل engineData:
{
  version: "2.0",
  scenes: [{
    id, name, width, height, gravity,
    backgroundColor: {r,g,b,a},
    objects: [{
      id, name, type, tag, x, y, width, height, rotation,
      active, visible, locked, color:{r,g,b,a}, layer, tags,
      components: [
        { type:"Transform", position:{x,y,z}, rotation:{x,y,z}, scale:{x,y,z} },
        { type:"Rigidbody2D", bodyType:"Dynamic|Static|Kinematic", mass, gravityScale },
        { type:"BoxCollider2D", isTrigger, size:{x,y} },
        { type:"PlayerController", moveSpeed, jumpForce, maxJumps },
        { type:"EnemyAI", aiPattern:"patrol|chase|guard", moveSpeed, attackDamage },
        { type:"HealthSystem", maxHealth, currentHealth, deathAction },
        { type:"SpriteRenderer", spriteKey, color:{r,g,b,a} }
      ]
    }]
  }],
  settings: { screenWidth, screenHeight, physics, gravity, targetFPS }
}

أنواع objects: player, enemy, platform, wall, trigger, collectible, npc, spawn, goal, decoration

ردك لازم يكون JSON فقط بدون markdown:
{
  "message": "شرح بالعربي",
  "patch": { ... تعديلات كاملة ... } أو null
}

للـ patch، ابعت الـ scenes array كاملة بعد التعديل.

قواعد مهمة:
- IDs فريدة: "obj_ai_" + timestamp + رقم عشوائي
- الألوان {r,g,b,a} مش hex
- الإحداثيات داخل حدود الـ scene
- لما تضيف لاعب: اضيف PlayerController + Rigidbody2D + BoxCollider2D + HealthSystem
- لما تضيف عدو: اضيف EnemyAI + Rigidbody2D + BoxCollider2D + HealthSystem
- ردّ بالعربي دايماً`;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { message, engineData, history = [] } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "الرسالة مطلوبة" }, { status: 400 });

    const messages: Anthropic.MessageParam[] = [];

    // Add history (last 8 messages)
    for (const h of history.slice(-8)) {
      messages.push({ role: h.role === "user" ? "user" : "assistant", content: h.content });
    }

    // Current message with game state
    messages.push({
      role: "user",
      content: `حالة اللعبة:\n${JSON.stringify(engineData, null, 2)}\n\nطلب: ${message}`,
    });

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4000,
      system: SYSTEM,
      messages,
    });

    const rawText = response.content.filter(b => b.type === "text").map(b => (b as Anthropic.TextBlock).text).join("");

    let parsed: { message: string; patch: object | null };
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { message: rawText, patch: null };
    }

    return NextResponse.json({ message: parsed.message || "تم", patch: parsed.patch || null });
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return NextResponse.json({ error: "خطأ في الـ AI" }, { status: 500 });
  }
}
