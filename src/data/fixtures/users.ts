import type { Grant, User } from "@/domain/user";
import { LITHO02_CODE } from "@/data/fixtures/sections";

/**
 * 使用者、授權的 fixtures（mockup L456–467）。
 *
 * 目前登入者＝小王：黃光二課（課代碼 LITHO02_CODE）editor，未跨課、未受任何
 * 支援授權。mockup 下拉選單顯示黃光一課／蝕刻一課皆「需支援權限」而停用
 * （L463–464），對應這裡的 supportSections 為空陣列。
 *
 * 課別清單本身（code/nameEn/nameZh）已收斂到 `@/data/fixtures/sections`
 * （R3），這裡只留使用者與授權——sectionId 一律是課代碼，不是課名。
 */

export const currentUserFixture: User = {
  id: "u-wang",
  name: "小王",
  sectionId: LITHO02_CODE,
  managerOf: [],
  supportSections: [],
};

/**
 * admin 授予課外人員的 editor 權限（mockup 提及「開支援權限才能跨課」，
 * 但畫面本身沒有列出具體授權清單——這筆是示意用，展示 Grant 的形狀）。
 */
export const grantsFixture: readonly Grant[] = [
  {
    userId: "u-support-01",
    sectionId: LITHO02_CODE,
    role: "editor",
    grantedBy: "老李",
    grantedAt: new Date("2026-06-01T09:00:00+08:00"),
    expiresAt: new Date("2026-12-31T23:59:59+08:00"),
  },
];
