"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Palette, 
  FileText, 
  Gamepad2, 
  ShieldAlert, 
  LogOut, 
  Store, 
  Users,
  Settings,
  Trophy,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import clsx from "clsx";

const ALLOWED_ROLES = ["admin", "super_admin", "tournament_organizer", "player_monitor"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
          if (data.user && ALLOWED_ROLES.includes(data.user.role)) {
              setAuthorized(true);
              setUser(data.user);
              window.localStorage.setItem("nelab_profile", JSON.stringify(data.user));
          } else {
              // Fallback to local storage (not recommended but kept for existing logic)
              const raw = window.localStorage.getItem("nelab_profile");
              if (raw) {
                  const p = JSON.parse(raw);
                  if (ALLOWED_ROLES.includes(p.role)) {
                      setAuthorized(true);
                      setUser(p);
                      return;
                  }
              }
              router.push("/auth/login");
          }
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  if (!authorized) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-bold animate-pulse">
       جاري التحقق من الصلاحيات...
    </div>
  );

  const allLinks = [
    { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard, roles: ["admin", "super_admin", "tournament_organizer", "player_monitor"] },
    { href: "/admin/tournaments", label: "البطولات", icon: Trophy, roles: ["admin", "super_admin", "tournament_organizer"] },
    { href: "/admin/skins", label: "إدارة المتجر", icon: Store, roles: ["admin", "super_admin"] },
    { href: "/admin/users", label: "المستخدمين", icon: Users, roles: ["admin", "super_admin", "player_monitor"] },
    { href: "/admin/games", label: "الألعاب", icon: Gamepad2, roles: ["admin", "super_admin"] },
    { href: "/admin/pages", label: "المحتوى", icon: FileText, roles: ["admin", "super_admin"] },
    { href: "/admin/audit", label: "سجلات النظام", icon: ShieldAlert, roles: ["admin", "super_admin"] },
    { href: "/admin/settings", label: "الإعدادات", icon: Settings, roles: ["admin", "super_admin"] },
  ];

  const links = allLinks.filter(link => link.roles.includes(user?.role || "user"));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden font-sans" dir="rtl">
      {/* Sidebar Overlay (Mobile) */}
      <div 
        className={clsx(
          "fixed inset-0 bg-black/80 z-40 md:hidden transition-opacity", 
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed md:relative z-50 w-72 h-full bg-zinc-900/50 backdrop-blur-xl border-l border-zinc-800 flex flex-col transition-transform duration-300 ease-out",
          isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
              NELAB ADMIN
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">v3.0.0 PRO</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 mx-4 mt-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-black">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{user?.name || "Admin"}</div>
            <div className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider">{user?.role}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-bold text-zinc-500 uppercase px-4 py-2">القائمة الرئيسية</div>
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsSidebarOpen(false)} // Close on mobile click
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                  isActive 
                    ? "bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r-full" />}
                <Icon size={20} className={isActive ? "text-amber-500" : "text-zinc-500 group-hover:text-white transition-colors"} />
                <span className="flex-1">{link.label}</span>
                {isActive && <ChevronRight size={16} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/50 space-y-2">
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
          >
            <LogOut size={16} />
            <span>الخروج للمنصة</span>
          </Link>
          <div className="text-center text-[10px] text-zinc-600">
            &copy; 2026 Yalla Nelab Inc.
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Topbar (Mobile Trigger) */}
        <header className="md:hidden h-16 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-300 hover:bg-zinc-800 rounded-lg">
             <Menu size={24} />
           </button>
           <span className="font-bold text-amber-500">لوحة التحكم</span>
           <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          {children}
        </div>
      </main>
    </div>
  );
}
