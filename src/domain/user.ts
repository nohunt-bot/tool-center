import { z } from "zod";
import { routing } from "@/i18n/routing";

/**
 * 角色**相對於課別**計算，不是使用者的全域屬性。
 * 同一人在 A 課是 admin、切到 B 課就是 viewer。
 * 完整矩陣見 docs/permission-matrix.md。
 */
export const ROLES = ["admin", "editor", "viewer"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

/**
 * 課代碼（英數字串），不是課名。
 *
 * 課別的「名稱」（`Section.nameEn`／`Section.nameZh`）會被改、可能重複、
 * 有全形半形問題，不能拿來當識別碼——凡是 SectionId 型別的值都必須是課代碼，
 * 拿課名（如「黃光二課」「LITHO-02」）塞進來比對是 bug。型別本身仍是
 * `string`（沒有另開 branded type），這條規則靠註解與 review 把關，不是型別
 * 系統強制的。
 */
export const sectionIdSchema = z.string().min(1);
export type SectionId = z.infer<typeof sectionIdSchema>;

/**
 * 使用者介面語系。值域對齊 `routing.locales`（`@/i18n/routing`）——不另開
 * 一份獨立的語系清單，避免兩處定義漂移。
 *
 * R7（`docs/decisions/0002-route-and-locale.md`）：`localePrefix: "never"`
 * 之後 URL 不帶語系段，`User.locale` 是畫面語系的真相來源，cookie 只當
 * 快取（見 `src/i18n/request.ts`）。
 */
export const localeSchema = z.enum(routing.locales);
export type Locale = z.infer<typeof localeSchema>;

export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** 所屬課別——在此課別為 editor */
  sectionId: sectionIdSchema,
  /** 擔任 manager 的課別——在這些課別為 admin */
  managerOf: z.array(sectionIdSchema).readonly(),
  /** 可跨課進入的課別（沒有支援權限連看都看不到） */
  supportSections: z.array(sectionIdSchema).readonly(),
  /** 畫面語系——見 localeSchema 的說明 */
  locale: localeSchema,
});
export type User = z.infer<typeof userSchema>;

/**
 * admin 授予課外人員的權限。
 * 只授予 editor，不授予 admin——避免權限升級路徑失控（permission-matrix C1）。
 * 要給 admin 請 IT 改 managerOf。
 */
export const grantSchema = z.object({
  userId: z.string().min(1),
  sectionId: sectionIdSchema,
  role: z.literal("editor"),
  grantedBy: z.string().min(1),
  grantedAt: z.coerce.date(),
  /** null = 長期有效；支援情境可設時效 */
  expiresAt: z.coerce.date().nullable(),
});
export type Grant = z.infer<typeof grantSchema>;
