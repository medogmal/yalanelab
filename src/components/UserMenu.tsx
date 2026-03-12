 "use client";
 import { useEffect, useState } from "react";
 import Link from "next/link";

 type User = { id: string; name: string; email: string; ratings: { chess: number }; tier?: "free" | "pro" | "elite" };

 export default function UserMenu() {
   const [user, setUser] = useState<User | null>(null);
   useEffect(() => {
     (async () => {
       const res = await fetch("/api/auth/me", { cache: "no-store" });
       const data = await res.json();
       setUser(data.user);
     })();
   }, []);

   async function logout() {
     await fetch("/api/auth/logout", { method: "POST" });
     setUser(null);
   }

   return (
     <div className="flex items-center gap-3">
       {!user ? (
         <>
           <Link href="/auth/login" className="px-3 py-1 rounded border border-zinc-700 text-zinc-300 hover:text-white">تسجيل الدخول</Link>
           <Link href="/auth/register" className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white">إنشاء حساب</Link>
         </>
       ) : (
         <>
           <div className="text-sm">
             <div className="font-medium text-white">{user.name}</div>
             <div className="text-zinc-400">تصنيف: {user.ratings.chess}</div>
             <div className="text-amber-400">عضوية: {user.tier || "free"}</div>
           </div>
           <Link href="/profile" className="px-3 py-1 rounded border border-zinc-700 text-zinc-300 hover:text-white">ملفي</Link>
           <button onClick={logout} className="px-3 py-1 rounded bg-zinc-900 text-white">خروج</button>
         </>
       )}
     </div>
   );
}
