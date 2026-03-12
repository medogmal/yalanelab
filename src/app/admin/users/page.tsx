"use client";
import React, { useEffect, useState } from "react";
import { Users, Search, Edit2, Shield, MoreHorizontal, UserX, UserCheck, Loader2 } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  coins: number;
  createdAt: number;
};

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
      ));
    }
  }, [search, users]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(newRole: string) {
    if (!editingUser) return;
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingUser.id, role: newRole }),
      });
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  }

  function getRoleColor(role: string) {
    if (role === "super_admin") return "text-purple-400 bg-purple-400/10";
    if (role === "admin") return "text-amber-400 bg-amber-400/10";
    if (role === "tournament_organizer") return "text-blue-400 bg-blue-400/10";
    if (role === "player_monitor") return "text-green-400 bg-green-400/10";
    return "text-zinc-400 bg-zinc-800";
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("ar-EG");
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <Users className="text-blue-500" size={32} />
            إدارة المستخدمين
          </h2>
          <p className="text-zinc-400 mt-1">عرض والتحكم في حسابات المستخدمين وصلاحياتهم</p>
        </div>
        
        <div className="relative w-full md:w-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو البريد..." 
            className="w-full md:w-80 bg-zinc-900 border border-zinc-800 text-white rounded-xl pr-10 pl-4 py-3 outline-none focus:border-blue-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">الدور</th>
                <th className="px-6 py-4">العضوية</th>
                <th className="px-6 py-4">الرصيد</th>
                <th className="px-6 py-4">تاريخ الانضمام</th>
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-blue-500" size={24} />
                      جاري تحميل البيانات...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    لا يوجد مستخدمين مطابقين للبحث.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 border border-zinc-700">
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">{user.name}</div>
                          <div className="text-xs text-zinc-500 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${getRoleColor(user.role)}`}>
                        {user.role === "super_admin" && <Shield size={12} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-300 font-mono uppercase bg-zinc-800 px-2 py-1 rounded text-xs">
                        {user.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-amber-500 font-bold">{user.coins.toLocaleString()} 🪙</span>
                        {/* <span className="text-purple-400 font-bold">{user.gems?.toLocaleString() || 0} 💎</span> */}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="تعديل">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="حظر">
                          <UserX size={16} />
                        </button>
                        <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Static for now) */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center text-xs text-zinc-500">
            <span>عرض {filteredUsers.length} من أصل {users.length} مستخدم</span>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-50">السابق</button>
              <button disabled className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-50">التالي</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">تعديل صلاحيات المستخدم</h3>
            <p className="text-zinc-400 mb-4">تغيير دور المستخدم <span className="text-white font-bold">{editingUser.name}</span></p>
            
            <div className="space-y-2">
              {[
                { id: "user", label: "مستخدم عادي", desc: "لا توجد صلاحيات إدارية" },
                { id: "tournament_organizer", label: "منظم بطولات", desc: "يمكنه إنشاء وإدارة البطولات فقط" },
                { id: "player_monitor", label: "مراقب لاعبين", desc: "يمكنه مراقبة وحظر اللاعبين المخالفين" },
                { id: "admin", label: "مسؤول (Admin)", desc: "صلاحيات كاملة عدا الإعدادات الحساسة" },
                { id: "super_admin", label: "مسؤول فائق (Super Admin)", desc: "كل الصلاحيات" },
              ].map((roleOption) => (
                <button
                  key={roleOption.id}
                  onClick={() => handleUpdateRole(roleOption.id)}
                  className={`w-full text-right p-3 rounded-xl border transition-all ${
                    editingUser.role === roleOption.id 
                      ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <div className="font-bold">{roleOption.label}</div>
                  <div className="text-xs opacity-70">{roleOption.desc}</div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setEditingUser(null)}
              className="mt-6 w-full py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
