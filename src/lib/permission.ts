import type { Grant, Role, SectionId, User } from "@/domain/user";

/**
 * 權限矩陣的程式碼形式。權威定義見 docs/permission-matrix.md，兩者必須一致。
 *
 * 三條紀律：
 * 1. 任何權限檢查都要帶 sectionId——不帶的就是 bug。
 *    sectionId 是課代碼（英數字串），不是課名；拿課名（如「黃光二課」
 *    「LITHO-02」）比對是 bug，課名會被改、可能重複、有全形半形問題。
 * 2. 矩陣是資料結構，不是散落在元件裡的 if-else。
 * 3. 前端 gating 只是 UX；每個寫入端點都要在 server 端再驗一次（B1.3）。
 */

export const CAPABILITIES = [
  // 檢視
  "view.panes",
  "file.download",
  "copilot.ask",
  // 當機處理
  "toolCommand.write",
  "file.toggleCopilotRef",
  "case.pack",
  // 病史分析
  "pin.create",
  "pin.editTitle",
  "pin.promoteToCommon",
  // FDC
  "fdc.feedbackVote",
  "fdc.feedbackForm",
  "tchart.annotate",
  // 關聯圖
  "graph.vote",
  "graph.confirmPendingEdge",
  "graph.addNode",
  // 課別設定
  "settings.view",
  "settings.editDos",
  "settings.toggleMcp",
  "settings.toggleLockedMcp",
  "settings.expertTags",
  "kmSource.add",
  "kmSource.remove",
  "grant.manage",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const ALL: readonly Role[] = ["admin", "editor", "viewer"];
const WRITE: readonly Role[] = ["admin", "editor"];
const ADMIN_ONLY: readonly Role[] = ["admin"];
/** IT 全域鎖定，課別層任何人都不能改（mockup L1334） */
const NOBODY: readonly Role[] = [];

const MATRIX: Readonly<Record<Capability, readonly Role[]>> = {
  "view.panes": ALL,
  "file.download": ALL,
  "copilot.ask": ALL,

  // viewer 也可下 Tool Command——「部分放行」（permission-matrix C3）。
  // 註解可追溯可改；標註與回饋會進 KM 與 ML training queue，不熟該台機的人寫入會餵出雜訊。
  "toolCommand.write": ALL,
  "file.toggleCopilotRef": WRITE,
  "case.pack": WRITE,

  "pin.create": WRITE,
  // editor 只能改自己的——見 canEditPinTitle()
  "pin.editTitle": WRITE,
  "pin.promoteToCommon": ADMIN_ONLY,

  "fdc.feedbackVote": WRITE,
  "fdc.feedbackForm": WRITE,
  "tchart.annotate": WRITE,

  "graph.vote": WRITE,
  "graph.confirmPendingEdge": WRITE,
  "graph.addNode": WRITE,

  "settings.view": ALL,
  "settings.editDos": ADMIN_ONLY,
  "settings.toggleMcp": ADMIN_ONLY,
  "settings.toggleLockedMcp": NOBODY,
  "settings.expertTags": ADMIN_ONLY,
  "kmSource.add": WRITE,
  "kmSource.remove": ADMIN_ONLY,
  "grant.manage": ADMIN_ONLY,
};

function hasActiveGrant(
  grants: readonly Grant[],
  userId: string,
  sectionId: SectionId,
  now: Date,
): boolean {
  return grants.some(
    (grant) =>
      grant.userId === userId &&
      grant.sectionId === sectionId &&
      (grant.expiresAt === null || grant.expiresAt.getTime() > now.getTime()),
  );
}

export function resolveRole(
  user: User,
  sectionId: SectionId,
  grants: readonly Grant[] = [],
  now: Date = new Date(),
): Role {
  if (user.managerOf.includes(sectionId)) return "admin";
  if (user.sectionId === sectionId) return "editor";
  if (hasActiveGrant(grants, user.id, sectionId, now)) return "editor";
  return "viewer";
}

/** 能不能進入這個課別（先於角色判定）。沒有支援權限連看都看不到。 */
export function canEnterSection(user: User, sectionId: SectionId): boolean {
  return (
    user.sectionId === sectionId ||
    user.managerOf.includes(sectionId) ||
    user.supportSections.includes(sectionId)
  );
}

export function can(role: Role, capability: Capability): boolean {
  return MATRIX[capability].includes(role);
}

/** 卡片標題：admin 可改任何人的，editor 只能改自己的。 */
export function canEditPinTitle(role: Role, isOwner: boolean): boolean {
  if (!can(role, "pin.editTitle")) return false;
  return role === "admin" || isOwner;
}

export function allowedRoles(capability: Capability): readonly Role[] {
  return MATRIX[capability];
}
