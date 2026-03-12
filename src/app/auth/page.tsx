"use client";
import { useEffect, useState } from "react";

type Role = "viewer" | "competitor" | "admin" | "super_admin";
type Form = {
  name: string;
  phone: string;
  email: string;
  alias: string;
  avatarUrl: string;
  networkName: string;
  superCode: string;
};

export default function AuthPage() {
  const [role, setRole] = useState<Role>("viewer");
  const [form, setForm] = useState<Form>({
    name: "",
    phone: "",
    email: "",
    alias: "",
    avatarUrl: "",
    networkName: "",
    superCode: "",
  });

  useEffect(() => {
    const raw = localStorage.getItem("nelab_profile");
    if (raw) {
      const p = JSON.parse(raw);
      setRole(p.role);
      setForm({ ...form, name: p.name, email: p.email, phone: p.phone, alias: p.alias });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save() {
    if (role === "super_admin" && form.superCode !== "NELAB-SUPER") {
      alert("رمز السوبر أدمن غير صحيح");
      return;
    }
    const profile = {
      role,
      name: form.name || "مستخدم",
      email: form.email || "",
      phone: form.phone || "",
      alias: form.alias || "",
      avatarUrl: form.avatarUrl || "",
      networkName: form.networkName || "",
    };
    localStorage.setItem("nelab_profile", JSON.stringify(profile));
    alert("تم حفظ الحساب");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h2 className="text-2xl font-bold">تسجيل الدخول</h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          className={`px-3 py-2 rounded border ${role === "viewer" ? "bg-zinc-900 text-white" : ""}`}
          onClick={() => setRole("viewer")}
        >
          مشاهد
        </button>
        <button
          className={`px-3 py-2 rounded border ${role === "competitor" ? "bg-zinc-900 text-white" : ""}`}
          onClick={() => setRole("competitor")}
        >
          منافس
        </button>
        <button
          className={`px-3 py-2 rounded border ${role === "admin" ? "bg-zinc-900 text-white" : ""}`}
          onClick={() => setRole("admin")}
        >
          أدمن (منظم)
        </button>
        <button
          className={`px-3 py-2 rounded border ${role === "super_admin" ? "bg-zinc-900 text-white" : ""}`}
          onClick={() => setRole("super_admin")}
        >
          سوبر أدمن
        </button>
      </div>

      <div className="border rounded-lg p-4 bg-white space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="w-full border rounded px-3 py-2" placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full border rounded px-3 py-2" placeholder="الإيميل" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full border rounded px-3 py-2" placeholder="اللقب" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
        {role === "competitor" && (
          <input className="w-full border rounded px-3 py-2" placeholder="الصورة الشخصية (رابط)" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
        )}
        {role === "admin" && (
          <input className="w-full border rounded px-3 py-2" placeholder="اسم الشبكة" value={form.networkName} onChange={(e) => setForm({ ...form, networkName: e.target.value })} />
        )}
        {role === "super_admin" && (
          <input className="w-full border rounded px-3 py-2" placeholder="رمز الدخول للسوبر أدمن" value={form.superCode} onChange={(e) => setForm({ ...form, superCode: e.target.value })} />
        )}
        <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={save}>
          حفظ الحساب
        </button>
      </div>
    </div>
  );
}
