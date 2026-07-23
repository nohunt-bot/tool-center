import type { Section } from "@/domain/tool";
import type { Grant, User } from "@/domain/user";

/**
 * 使用者、課別、授權的 fixtures（mockup L456–467）。
 *
 * 目前登入者＝小王：黃光二課（LITHO-02）editor，未跨課、未受任何支援授權。
 * mockup 下拉選單顯示黃光一課／蝕刻一課皆「需支援權限」而停用（L463–464），
 * 對應這裡的 supportSections 為空陣列。
 */

export const currentUserFixture: User = {
  id: "u-wang",
  name: "小王",
  sectionId: "LITHO-02",
  managerOf: [],
  supportSections: [],
};

export const sectionsFixture: readonly Section[] = [
  { id: "LITHO-02", name: "黃光二課" },
  { id: "LITHO-01", name: "黃光一課" },
  { id: "ETCH-01", name: "蝕刻一課" },
];

/**
 * admin 授予課外人員的 editor 權限（mockup 提及「開支援權限才能跨課」，
 * 但畫面本身沒有列出具體授權清單——這筆是示意用，展示 Grant 的形狀）。
 */
export const grantsFixture: readonly Grant[] = [
  {
    userId: "u-support-01",
    sectionId: "LITHO-02",
    role: "editor",
    grantedBy: "老李",
    grantedAt: new Date("2026-06-01T09:00:00+08:00"),
    expiresAt: new Date("2026-12-31T23:59:59+08:00"),
  },
];
