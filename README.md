# atca-website

## 一键部署到 Vercel（最小步骤）

### 方式 A：使用 Vercel 控制台（推荐）
1. 将本仓库推送到 GitHub / GitLab / Bitbucket。
2. 登录 [Vercel](https://vercel.com/) 并点击 **Add New Project**。
3. 选择本仓库并导入。
4. 保持默认配置（Framework Preset 会自动识别为 **Next.js**）。
5. 点击 **Deploy**。
6. 部署完成后，Vercel 会自动提供公网访问链接（Preview / Production）。

---

### 方式 B：CLI 一键部署
> 适合本地命令行快速拿到预览链接。

```bash
# 1) 安装 Vercel CLI
npm i -g vercel

# 2) 在项目根目录执行一键部署
vercel
```

首次运行会提示登录并绑定项目，按提示确认即可。完成后会返回一个公网 Preview URL。

---

### 可选：发布到正式域名（Production）
```bash
vercel --prod
```

---

## 本地预览（部署前可先检查）
```bash
npm install
npm run dev
```
浏览器打开：`http://localhost:3000`
