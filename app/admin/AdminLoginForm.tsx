"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const result = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        setMessage(result.message || "后台验证未通过。");
        return;
      }

      router.push("/admin/applications");
      router.refresh();
    } catch {
      setMessage("后台验证服务暂时不可用，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-8 max-w-lg rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8" onSubmit={submit}>
      <label className="grid gap-3">
        <span className="text-sm font-medium text-porcelain">后台密码</span>
        <input className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      {message ? <div className="mt-5 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]">{message}</div> : null}
      <button className="mt-6 rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "正在验证..." : "进入后台"}
      </button>
    </form>
  );
}
