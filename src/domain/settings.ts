import { z } from "zod";
import { sectionIdSchema } from "@/domain/user";

/**
 * 課別設定（mockup L1295–1367）。
 * IT 全域白名單決定「能不能用」，這裡決定「這個課要不要用」——兩道閘。
 */

export const mcpToolSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  enabled: z.boolean(),
  /** IT 全域鎖定，課別不可改（mockup L1334） */
  lockedByIt: z.boolean(),
});
export type McpTool = z.infer<typeof mcpToolSchema>;

export const expertTagSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  tags: z.array(z.string().min(1)).readonly(),
});
export type ExpertTag = z.infer<typeof expertTagSchema>;

export const kmSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** 登錄的是連結，不是把檔案搬進來（mockup L1361） */
  url: z.string().url(),
  addedBy: z.string().min(1),
  addedAt: z.coerce.date(),
  connected: z.boolean(),
});
export type KmSource = z.infer<typeof kmSourceSchema>;

export const sectionSettingsSchema = z.object({
  sectionId: sectionIdSchema,
  /** 進 Agent system prompt 的課別 DOs */
  dos: z.string(),
  mcpTools: z.array(mcpToolSchema).readonly(),
  expertTags: z.array(expertTagSchema).readonly(),
  kmSources: z.array(kmSourceSchema).readonly(),
});
export type SectionSettings = z.infer<typeof sectionSettingsSchema>;
