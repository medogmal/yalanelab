/**
 * syncUserFromPrisma
 * يُستدعى عند كل تسجيل دخول عبر NextAuth
 * يتأكد أن المستخدم موجود في users.json أيضاً
 */
import { createUser, getUserByEmail } from "./store";

export function syncUserFromPrisma(prismaUser: {
  id: string;
  name?: string | null;
  email?: string | null;
}) {
  if (!prismaUser.email) return null;
  const existing = getUserByEmail(prismaUser.email);
  if (existing) return existing;
  // أنشئ في JSON store — بدون كلمة مرور (NextAuth يتحكم في المصادقة)
  return createUser(prismaUser.id, prismaUser.name || "لاعب", prismaUser.email, "");
}
