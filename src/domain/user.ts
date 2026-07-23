import { z } from "zod";

/**
 * 角色**相對於課別**計算，不是使用者的全域屬性。
 * 同一人在 A 課是 admin、切到 B 課就是 viewer。
 * 完整矩陣見 docs/permission-matrix.md。
 */
export const ROLES = ["admin", "editor", "viewer"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const sectionIdSchema = z.string().min(1);
export type SectionId = z.infer<typeof sectionIdSchema>;

export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** 所屬課別——在此課別為 editor */
  sectionId: sectionIdSchema,
  /** 擔任 manager 的課別——在這些課別為 admin */
  managerOf: z.array(sectionIdSchema).readonly(),
  /** 可跨課進入的課別（沒有支援權限連看都看不到） */
  supportSections: z.array(sectionIdSchema).readonly(),
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
