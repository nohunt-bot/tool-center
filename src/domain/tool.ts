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
  id: sectionIdSchema,
  name: z.string().min(1),
});
export type Section = z.infer<typeof sectionSchema>;
