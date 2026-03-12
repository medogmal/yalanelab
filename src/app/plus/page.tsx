"use client";
import React, { useEffect, useState } from "react";

export default function PlusPage() {
  const [tier, setTier] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
      setTier(me.user?.tier || "free");
    })();
  }, []);
  async function upgrade() {
    const res = await fetch("/api/subscriptions/upgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier: "pro" }) });
    if (res.ok) {
      setTier("pro");
    }
  }
  async function cancel() {
    const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
    if (res.ok) {
      setTier("free");
    }
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-silver">NELAB Plus</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded card-glow p-4">
          <div className="font-semibold text-white mb-2">مزايا المميز</div>
          <ul className="text-silver space-y-1">
            <li>اسكين ذهبي ونيون للقطع</li>
            <li>ثيمات لوحة: خشب، كاربون، أوشن</li>
            <li>تحليل متقدم بعمق أعلى</li>
            <li>شارة مميز بجانب اسمك</li>
          </ul>
        </div>
        <div className="rounded card-glow p-4">
          <div className="font-semibold text-white mb-2">حالة عضويتك</div>
          <div className="badge-gold">{tier}</div>
        </div>
        <div className="rounded card-glow p-4 space-y-3">
          <button className="w-full px-3 py-2 rounded btn-neon" onClick={upgrade}>اشترك الآن</button>
          <button className="w-full px-3 py-2 rounded bg-zinc-800 text-white" onClick={cancel}>إلغاء الاشتراك</button>
        </div>
      </div>
    </div>
  );
}
