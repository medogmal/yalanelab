"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (res.ok) {
      setMsg("تم تسجيل الدخول بنجاح");
      // Force session refresh (if using a store that listens to storage) or just redirect
      if (data.user && data.user.role === "super_admin") {
          window.location.href = "/admin"; // Use window.location to force full reload and session update
      } else {
          window.location.href = "/";
      }
    } else {
      setMsg(data.error || "فشل تسجيل الدخول");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">تسجيل الدخول</h2>
      <div className="space-y-3 rounded border border-zinc-800 bg-zinc-900 p-4">
        <input className="w-full px-3 py-2 rounded bg-zinc-800 text-white" placeholder="الإيميل" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full px-3 py-2 rounded bg-zinc-800 text-white" type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white" onClick={submit}>دخول</button>
        {msg && <div className="text-sm text-zinc-300">{msg}</div>}
      </div>
      <div className="mt-3 text-sm text-zinc-400">
        ليس لديك حساب؟ <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300">إنشاء حساب</Link>
      </div>
    </div>
  );
}
