"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (res.ok) {
      setMsg("تم إنشاء الحساب وتسجيل الدخول");
    } else {
      setMsg(data.error || "فشل إنشاء الحساب");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">إنشاء حساب</h2>
      <div className="space-y-3 rounded border border-zinc-800 bg-zinc-900 p-4">
        <input className="w-full px-3 py-2 rounded bg-zinc-800 text-white" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full px-3 py-2 rounded bg-zinc-800 text-white" placeholder="الإيميل" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full px-3 py-2 rounded bg-zinc-800 text-white" type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white" onClick={submit}>إنشاء</button>
        {msg && <div className="text-sm text-zinc-300">{msg}</div>}
      </div>
      <div className="mt-3 text-sm text-zinc-400">
        لديك حساب بالفعل؟ <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">تسجيل الدخول</Link>
      </div>
    </div>
  );
}
