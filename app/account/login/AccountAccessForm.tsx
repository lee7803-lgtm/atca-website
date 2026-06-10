"use client";

import { FormEvent, useState } from "react";

export function AccountAccessForm() {
  const [message, setMessage] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("V2.0 用户账号数据库尚未执行迁移。本轮只提供登录 / 注册入口和绑定设计，请继续使用 V1.3 申请查询与证书核验入口。");
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <form className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8" onSubmit={submit}>
        <h2 className="font-serif text-2xl text-porcelain">登录</h2>
        <p className="mt-3 text-sm leading-7 text-[#5f5b52]">用于后续注册用户、会员、认证申请人和机构账号登录。</p>
        <label className="mt-6 grid gap-2">
          <span className="text-sm font-medium text-porcelain">邮箱 / 手机号</span>
          <input className="form-input" autoComplete="username" placeholder="请输入邮箱或手机号" />
        </label>
        <label className="mt-5 grid gap-2">
          <span className="text-sm font-medium text-porcelain">密码</span>
          <input className="form-input" autoComplete="current-password" placeholder="请输入密码" type="password" />
        </label>
        <button className="mt-6 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" type="submit">
          登录用户中心
        </button>
      </form>

      <form className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8" onSubmit={submit}>
        <h2 className="font-serif text-2xl text-porcelain">注册</h2>
        <p className="mt-3 text-sm leading-7 text-[#5f5b52]">用于后续创建注册用户、会员账号、机构账号并绑定既有申请记录。</p>
        <label className="mt-6 grid gap-2">
          <span className="text-sm font-medium text-porcelain">姓名 / 机构联系人</span>
          <input className="form-input" autoComplete="name" placeholder="请输入姓名" />
        </label>
        <label className="mt-5 grid gap-2">
          <span className="text-sm font-medium text-porcelain">邮箱 / 手机号</span>
          <input className="form-input" autoComplete="email" placeholder="用于登录和接收通知" />
        </label>
        <button className="mt-6 w-full rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-center text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" type="submit">
          创建账号
        </button>
      </form>

      {message ? (
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-5 text-sm leading-7 text-[#7F1D1D] lg:col-span-2">
          {message}
        </div>
      ) : null}
    </div>
  );
}

