"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطأ في تسجيل الدخول"); return; }
      if (data.user?.role === "admin" || data.user?.role === "super_admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0c0c0e",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "var(--font-cairo), sans-serif",
    }} dir="rtl">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ width: "100%", maxWidth: 400 }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#7c3aed",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 20, color: "#fff",
              margin: "0 auto 12px",
            }}>ي</div>
          </Link>
          <div style={{ fontWeight: 900, fontSize: 20, color: "#f4f4f8", marginBottom: 4 }}>
            مرحباً بعودتك
          </div>
          <div style={{ fontSize: 13, color: "#7a7a8a", fontWeight: 500 }}>
            سجّل دخولك للعب مع الأصدقاء
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#131317",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "28px 24px",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 700,
                color: "#c0c0cc", marginBottom: 7,
              }}>
                البريد الإلكتروني
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                required autoComplete="email"
                style={{
                  width: "100%", padding: "11px 13px", borderRadius: 10,
                  background: "#1a1a20",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f4f4f8", fontSize: 14, fontWeight: 500,
                  fontFamily: "inherit", outline: "none",
                  transition: "border-color .2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 700,
                color: "#c0c0cc", marginBottom: 7,
              }}>
                كلمة المرور
              </label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required autoComplete="current-password"
                style={{
                  width: "100%", padding: "11px 13px", borderRadius: 10,
                  background: "#1a1a20",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f4f4f8", fontSize: 14, fontWeight: 500,
                  fontFamily: "inherit", outline: "none",
                  transition: "border-color .2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 13px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.18)",
                color: "#ef4444", fontSize: 13, fontWeight: 600,
              }}>⚠ {error}</div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: 11,
                background: loading ? "rgba(124,58,237,0.5)" : "#7c3aed",
                color: "#fff", fontWeight: 800, fontSize: 14,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "background .2s",
                marginTop: 4,
              }}
            >
              {loading ? "جاري الدخول..." : "دخول →"}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#7a7a8a" }}>
          مش عندك حساب؟{" "}
          <Link href="/auth/register" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 800 }}>
            سجّل الآن
          </Link>
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Link href="/" style={{ fontSize: 12, color: "#404050", textDecoration: "none" }}>
            ← العودة للرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
