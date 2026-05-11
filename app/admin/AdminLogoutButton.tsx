"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  };

  return (
    <button className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink" onClick={logout} type="button">
      退出后台
    </button>
  );
}
