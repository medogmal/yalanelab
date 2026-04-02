"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePlatformStore } from "@/lib/platform/store";

export default function SessionSync() {
  const { data: session, status } = useSession();
  const { setUser, fetchProfile } = usePlatformStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Fetch full profile from DB
      fetchProfile();
    }
  }, [session, status, fetchProfile]);

  return null;
}
