export type AdminRole =
  | "super_admin"
  | "admin"
  | "secretariat_admin"
  | "member_admin"
  | "application_reviewer"
  | "reviewer"
  | "certification_admin"
  | "finance_admin"
  | "content_admin"
  | "development_admin"
  | "data_center_admin"
  | "notification_admin"
  | "readonly_observer"
  | "readonly_auditor"
  | "viewer";

export type AdminModuleKey =
  | "dashboard"
  | "workbench"
  | "applications"
  | "certification"
  | "payments"
  | "content"
  | "development"
  | "dataCenter"
  | "notifications"
  | "users"
  | "roles"
  | "permissions"
  | "masterData"
  | "auditLogs";

export type AdminAction = "read" | "write" | "review" | "finance" | "certificate" | "configure" | "audit" | "export";
export type AdminPermission = `${AdminModuleKey}:${AdminAction}`;

export type AdminSessionLike = {
  actorType?: "admin" | "legacy_admin" | string;
  role?: string;
};

export type AdminNavItem = {
  href: string;
  label: string;
  module: AdminModuleKey;
  note: string;
  permission: AdminPermission;
  reserved?: boolean;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const adminRoleLabels: Record<AdminRole, string> = {
  super_admin: "超级管理员",
  admin: "兼容管理员",
  secretariat_admin: "秘书处管理员",
  member_admin: "会员管理员",
  application_reviewer: "申请审核员",
  reviewer: "申请审核员",
  certification_admin: "证书管理员",
  finance_admin: "财务审核员",
  content_admin: "内容管理员",
  development_admin: "发展中心管理员",
  data_center_admin: "资料中心管理员",
  notification_admin: "通知管理员",
  readonly_observer: "只读观察员",
  readonly_auditor: "只读观察员",
  viewer: "只读观察员"
};

export const adminModuleLabels: Record<AdminModuleKey, string> = {
  dashboard: "后台首页工作台",
  workbench: "审核工作台",
  applications: "申请与审核",
  certification: "认证与证书",
  payments: "财务审核",
  content: "内容管理 CMS",
  development: "发展中心管理",
  dataCenter: "资料中心管理",
  notifications: "通知记录",
  users: "用户管理",
  roles: "角色管理",
  permissions: "权限管理",
  masterData: "主数据配置",
  auditLogs: "系统与审计"
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "工作台",
    items: [{ href: "/admin", label: "工作台总览", module: "dashboard", note: "待办、指标、风险、环境", permission: "dashboard:read" }]
  },
  {
    title: "申请与审核",
    items: [
      { href: "/admin/applications", label: "会员申请", module: "applications", note: "个人 / 机构申请、补件", permission: "applications:read" },
      { href: "/admin/certification-applications", label: "认证建档申请", module: "certification", note: "材料审核、证书、PDF", permission: "certification:read" },
      { href: "/admin/workbench", label: "审核中心", module: "workbench", note: "初审、复审、付款、发证", permission: "workbench:read" },
      { href: "/admin/payments", label: "财务中心", module: "payments", note: "Bank Transfer、凭证审核", permission: "payments:read" },
      { href: "/admin/workbench#risk", label: "争议与风控", module: "workbench", note: "预留 / 需审计", permission: "workbench:read", reserved: true }
    ]
  },
  {
    title: "内容与数据",
    items: [
      { href: "/admin/content", label: "内容 CMS", module: "content", note: "频道首页、公告、推荐位", permission: "content:read" },
      { href: "/admin/development", label: "发展中心管理", module: "development", note: "项目、活动、成果资料", permission: "development:read" },
      { href: "/admin/development#course-activity", label: "课程活动中心", module: "development", note: "预留 / 后续接入", permission: "development:read", reserved: true },
      { href: "/admin/development#cooperation", label: "合作中心", module: "development", note: "预留 / 后续接入", permission: "development:read", reserved: true },
      { href: "/admin/data-center", label: "资料中心", module: "dataCenter", note: "公开字段、纠错、撤回", permission: "dataCenter:read" },
      { href: "/admin/notifications", label: "通知中心", module: "notifications", note: "通知日志、失败重试", permission: "notifications:read" }
    ]
  },
  {
    title: "权限与配置",
    items: [
      { href: "/admin/users", label: "管理员用户", module: "users", note: "用户、邀请、禁用预留", permission: "users:read" },
      { href: "/admin/roles", label: "角色管理", module: "roles", note: "角色、职责、租户预留", permission: "roles:read" },
      { href: "/admin/permissions", label: "权限管理", module: "permissions", note: "菜单、模块、授权预留", permission: "permissions:read" },
      { href: "/admin/master-data", label: "主数据配置", module: "masterData", note: "引荐人、宫观、模板、费用", permission: "masterData:read" }
    ]
  },
  {
    title: "系统与审计",
    items: [{ href: "/admin/audit-logs", label: "审计日志", module: "auditLogs", note: "只读、不可篡改", permission: "auditLogs:read" }]
  }
];

const permissionsByRole: Record<AdminRole, AdminPermission[]> = {
  super_admin: ["dashboard:read"],
  admin: ["dashboard:read"],
  secretariat_admin: [
    "dashboard:read",
    "workbench:read",
    "applications:read",
    "applications:write",
    "applications:review",
    "applications:export",
    "certification:read",
    "certification:write",
    "certification:review",
    "certification:export",
    "content:read",
    "content:write",
    "development:read",
    "dataCenter:read",
    "notifications:read",
    "masterData:read",
    "masterData:write",
    "auditLogs:read"
  ],
  member_admin: ["dashboard:read", "workbench:read", "applications:read", "applications:write", "applications:review", "applications:export", "masterData:read"],
  application_reviewer: ["dashboard:read", "workbench:read", "applications:read", "applications:write", "applications:review", "applications:export", "masterData:read"],
  reviewer: ["dashboard:read", "workbench:read", "applications:read", "applications:write", "applications:review", "applications:export", "masterData:read"],
  certification_admin: [
    "dashboard:read",
    "workbench:read",
    "certification:read",
    "certification:write",
    "certification:review",
    "certification:certificate",
    "certification:export",
    "masterData:read"
  ],
  finance_admin: ["dashboard:read", "workbench:read", "payments:read", "payments:write", "payments:finance", "payments:export", "auditLogs:read"],
  content_admin: ["dashboard:read", "content:read", "content:write", "development:read", "development:write"],
  development_admin: ["dashboard:read", "development:read", "development:write", "content:read"],
  data_center_admin: ["dashboard:read", "dataCenter:read", "dataCenter:write", "development:read"],
  notification_admin: ["dashboard:read", "notifications:read", "notifications:write", "auditLogs:read"],
  readonly_observer: [
    "dashboard:read",
    "workbench:read",
    "applications:read",
    "certification:read",
    "payments:read",
    "content:read",
    "development:read",
    "dataCenter:read",
    "notifications:read",
    "users:read",
    "roles:read",
    "permissions:read",
    "masterData:read",
    "auditLogs:read"
  ],
  readonly_auditor: [
    "dashboard:read",
    "workbench:read",
    "applications:read",
    "certification:read",
    "payments:read",
    "content:read",
    "development:read",
    "dataCenter:read",
    "notifications:read",
    "users:read",
    "roles:read",
    "permissions:read",
    "masterData:read",
    "auditLogs:read"
  ],
  viewer: [
    "dashboard:read",
    "workbench:read",
    "applications:read",
    "certification:read",
    "payments:read",
    "content:read",
    "development:read",
    "dataCenter:read",
    "notifications:read",
    "users:read",
    "roles:read",
    "permissions:read",
    "masterData:read",
    "auditLogs:read"
  ]
};

const allPermissions = Array.from(new Set(Object.values(permissionsByRole).flat()));
permissionsByRole.super_admin = allPermissions;
permissionsByRole.admin = allPermissions;

const roleAliases: Record<string, AdminRole> = {
  certificate_admin: "certification_admin",
  readonly: "readonly_observer",
  readonly_admin: "readonly_observer",
  readonly_auditor: "readonly_observer",
  viewer: "readonly_observer",
  reviewer: "application_reviewer",
  admin: "admin",
  superadmin: "super_admin"
};

export function resolveAdminRole(sessionOrRole?: AdminSessionLike | string | null): AdminRole {
  if (!sessionOrRole) return "viewer";
  if (typeof sessionOrRole !== "string" && sessionOrRole.actorType === "legacy_admin") return "admin";

  const rawRole = typeof sessionOrRole === "string" ? sessionOrRole : sessionOrRole.role || "";
  const normalized = rawRole.trim().toLowerCase();
  if (!normalized) return "viewer";
  if (normalized in permissionsByRole) return normalized as AdminRole;
  return roleAliases[normalized] || "viewer";
}

export function getAdminRoleLabel(sessionOrRole?: AdminSessionLike | string | null) {
  return adminRoleLabels[resolveAdminRole(sessionOrRole)];
}

export function getAdminPermissions(sessionOrRole?: AdminSessionLike | string | null) {
  return permissionsByRole[resolveAdminRole(sessionOrRole)];
}

export function hasAdminPermission(sessionOrRole: AdminSessionLike | string | undefined | null, permission: AdminPermission) {
  return getAdminPermissions(sessionOrRole).includes(permission);
}

export function getVisibleAdminNavGroups(sessionOrRole: AdminSessionLike | string | undefined | null) {
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAdminPermission(sessionOrRole, item.permission))
    }))
    .filter((group) => group.items.length > 0);
}

export function getAccessibleModuleLabels(sessionOrRole: AdminSessionLike | string | undefined | null) {
  const moduleKeys = new Set<AdminModuleKey>();
  for (const permission of getAdminPermissions(sessionOrRole)) {
    if (permission.endsWith(":read")) moduleKeys.add(permission.split(":")[0] as AdminModuleKey);
  }
  return Array.from(moduleKeys).map((key) => adminModuleLabels[key]).filter(Boolean);
}

export function getDeniedModuleLabels(sessionOrRole: AdminSessionLike | string | undefined | null) {
  const accessible = new Set(getAccessibleModuleLabels(sessionOrRole));
  return Object.values(adminModuleLabels).filter((label) => !accessible.has(label));
}

export function formatAdminPermission(permission: AdminPermission) {
  const [moduleKey, action] = permission.split(":") as [AdminModuleKey, AdminAction];
  const actionLabel: Record<AdminAction, string> = {
    read: "查看",
    write: "写入",
    review: "审核",
    finance: "财务处理",
    certificate: "证书处理",
    configure: "配置",
    audit: "审计",
    export: "导出"
  };

  return `${adminModuleLabels[moduleKey] || moduleKey} / ${actionLabel[action] || action}`;
}

export function getAdminEnvironmentLabel() {
  if (process.env.VERCEL_ENV === "production") return "Production";
  if (process.env.VERCEL_ENV === "preview") return "Preview";
  if (process.env.VERCEL_ENV === "development" || process.env.NODE_ENV === "development") return "Local";
  if (process.env.NODE_ENV === "production") return "Production-like";
  return "Unknown";
}

export function isDangerousProductionEnvironment() {
  return getAdminEnvironmentLabel() === "Production";
}
