import { z } from "zod";
import { TOOL_STATUSES } from "@/lib/status";
import { sectionIdSchema } from "@/domain/user";

export const toolStatusSchema = z.enum(TOOL_STATUSES);

/** 小格：chamber。底色可與機台不同，但色義一致（mockup L565）。 */
export const chamberSchema = z.object({
  id: z.string().min(1),
  status: toolStatusSchema,
});
export type Chamber = z.infer<typeof chamberSchema>;

/** 機台屬性側欄（mockup L641–654） */
export const toolAttributesSchema = z.object({
  toolType: z.string(),
  toolGroup: z.string(),
  vendor: z.string(),
  model: z.string(),
  fab: z.string(),
  ip: z.string(),
  fdcMode: z.string(),
  tapVer: z.string(),
  tcsVer: z.string(),
  ownerPe: z.string(),
  ownerEe: z.string(),
  sponsor: z.string(),
});
export type ToolAttributes = z.infer<typeof toolAttributesSchema>;

export const toolStatsSchema = z.object({
  alarms7d: z.number().int().nonnegative(),
  /** PM 中或資料不足時可能沒有 MTBI */
  mtbiHours: z.number().positive().nullable(),
  /** brick 上那行補充（「PM 中 · 待料」「FOCUS-DRIFT 7 成」） */
  note: z.string().nullable(),
});
export type ToolStats = z.infer<typeof toolStatsSchema>;

export const toolSchema = z.object({
  id: z.string().min(1),
  sectionId: sectionIdSchema,
  type: z.string().min(1),
  model: z.string().min(1),
  status: toolStatusSchema,
  chambers: z.array(chamberSchema).readonly(),
  stats: toolStatsSchema,
  attributes: toolAttributesSchema,
});
export type Tool = z.infer<typeof toolSchema>;

/** 一覽頁不需要 attributes，避免每台都拉完整資料 */
export const toolSummarySchema = toolSchema.omit({ attributes: true });
export type ToolSummary = z.infer<typeof toolSummarySchema>;

export const sectionSchema = z.object({
  /** 課代碼——唯一識別，用於 URL 與權限鍵（見 domain/user 的 SectionId）。 */
  code: sectionIdSchema,
  /** 英文課名（如 "LITHO-02"）。純顯示欄位，唯一性未確認，不可用於查詢。 */
  nameEn: z.string().min(1),
  /** 中文課名（如「黃光二課」）。純顯示欄位。 */
  nameZh: z.string().min(1),
});
export type Section = z.infer<typeof sectionSchema>;

/**
 * 課別顯示名稱：依 locale 選 nameZh 或 nameEn（R5，顯示層最小改動）。
 *
 * 這是「資料」在地化（哪個名字給哪個 locale 看），跟 messages/ 的 UI 文案
 * 在地化是兩套機制，不要混在一起。
 *
 * User.locale 欄位是之後才會做的事（這一波還沒有 locale 來源）：呼叫端自己
 * 用現有管道拿到目前語系（例如 next-intl 的 useLocale()／getLocale()）再傳進來，
 * 這個函式本身不去挖 locale 從哪來。
 */
export function sectionDisplayName(section: Section, locale: string): string {
  return locale === "zh-TW" ? section.nameZh : section.nameEn;
}
