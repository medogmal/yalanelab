"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Crown, ShoppingBag, Gamepad2,
  LayoutDashboard, Bell, Sword, Trophy, ChevronRight
} from "lucide-react";
import UserMenu from "./UserMenu";
import type { PlatformConfig } from "@/lib/platform-config";

export default function NavBar({ config }: { config?: PlatformConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Fix hydration mismatch — render same className on server & client
  React.useEffect(() => setMounted(true), []);

  const siteName = config?.branding?.siteName || "يالا نلعب";
  const logoUrl   = config?.branding?.logoUrl;

  const navLinks = [
    { href: "/?tab=games",  label: "الألعاب",  icon: <Gamepad2   size={17} /> },
    { href: "/plus",        label: "Plus",      icon: <Crown      size={17} />, gold: true },
    { href: "/?tab=store",  label: "المتجر",   icon: <ShoppingBag size={17} /> },
    { href: "/leaderboards",label: "اللوائح",  icon: <Trophy      size={17} /> },
  ];

  return (
    <header className="sticky top-0 z-[100] glass-dark border-b border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="relative z-50 flex items-center gap-2.5 group flex-shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center gap-2">
              {/* Icon mark */}
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-all">
                <Gamepad2 size={20} className="text-black" />
              </div>
              {/* Name */}
              <span className="text-xl font-black tracking-tight gold-shimmer hidden sm:block">
                {siteName}
              </span>
            </div>
          )}
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/[0.06]" data-gold={link.gold ? 'true' : undefined}
            >
              <span className={link.gold ? "text-amber-400" : "text-slate-500"}>
                {link.icon}
              </span>
              {link.label}
              {link.gold && (
                <span className="text-[9px] font-black bg-amber-400 text-black px-1.5 py-0.5 rounded-md leading-none">
                  PRO
                </span>
              )}
            </Link>
          ))}

          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold
                       text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <LayoutDashboard size={17} className="text-slate-500" />
            Admin
          </Link>
        </nav>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notification bell */}
          <button className="relative p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors hidden md:flex items-center justify-center">
            <Bell size={18} className="text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#07090f] animate-pulse" />
          </button>

          {/* User menu */}
          <div className="hidden md:block">
            <Suspense fallback={<div className="w-9 h-9 bg-white/[0.06] rounded-xl animate-pulse" />}>
              <UserMenu />
            </Suspense>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-white"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[57px] bg-black/60 z-30 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-[57px] right-0 bottom-0 w-72 glass-dark border-l border-white/[0.06] z-40 md:hidden flex flex-col p-5"
            >
              {/* Nav links */}
              <div className="flex flex-col gap-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 p-3.5 rounded-2xl text-base font-bold transition-all
                      ${link.gold
                        ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                        : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"}
                    `}
                  >
                    <span className={`p-1.5 rounded-lg ${link.gold ? "bg-amber-400/20" : "bg-white/[0.06]"}`}>
                      {link.icon}
                    </span>
                    <span className="flex-1">{link.label}</span>
                    {link.gold && (
                      <span className="text-[9px] font-black bg-amber-400 text-black px-1.5 py-0.5 rounded-md">
                        PRO
                      </span>
                    )}
                    <ChevronRight size={16} className="text-slate-600" />
                  </Link>
                ))}

                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl text-base font-bold
                             bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white
                             border border-white/[0.06] transition-all mt-1"
                >
                  <span className="p-1.5 rounded-lg bg-white/[0.06]">
                    <LayoutDashboard size={17} />
                  </span>
                  <span className="flex-1">لوحة الإدارة</span>
                  <ChevronRight size={16} className="text-slate-600" />
                </Link>
              </div>

              {/* Bottom: user */}
              <div className="mt-auto pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">حسابي</span>
                  <Suspense fallback={<div className="w-8 h-8 bg-white/[0.06] rounded-full animate-pulse" />}>
                    <UserMenu />
                  </Suspense>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
