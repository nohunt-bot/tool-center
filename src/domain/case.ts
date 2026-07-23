import { z } from "zod";

/** Tool Command：人下的註解，說明這台現在為什麼不動（mockup L573–576） */
export const TOOL_COMMAND_TAGS = ["WAIT", "HOLD", "PM", "TEST"] as const;
export const toolCommandTagSchema = z.enum(TOOL_COMMAND_TAGS);
export type ToolCommandTag = z.infer<typeof toolCommandTagSchema>;

export const toolCommandSchema = z.object({
  id: z.string().min(1),
  tag: toolCommandTagSchema,
  text: z.string().min(1),
  author: z.string().min(1),
  at: z.coerce.date(),
  /** 預計多久（「預計 3hr」）；沒填就是沒有承諾時間 */
  etaHours: z.number().positive().nullable(),
});
export type ToolCommand = z.infer<typeof toolCommandSchema>;

export const CASE_SEVERITIES = ["critical", "warning", "closed"] as const;
export const caseSeveritySchema = z.enum(CASE_SEVERITIES);

export const CASE_STATUSES = ["open", "processing", "closed"] as const;
export const caseStatusSchema = z.enum(CASE_STATUSES);

export const errorCaseSchema = z.object({
  /** alarm code + 序號，如 FOCUS-DRIFT-011 */
  id: z.string().min(1),
  alarmCode: z.string().min(1),
  title: z.string().min(1),
  severity: caseSeveritySchema,
  status: caseStatusSchema,
  at: z.coerce.date(),
  /** Case Center 的案號，如 C-0703-021 */
  caseNumber: z.string().nullable(),
  assignee: z.string().nullable(),
  /** 結案後才有 */
  rootCause: z.string().nullable(),
  /** 同窗期第 N 發（60 秒限流，mockup L595） */
  burstIndex: z.number().int().positive().nullable(),
});
export type ErrorCase = z.infer<typeof errorCaseSchema>;

/**
 * 慢性問題：rule base 判定（同 code 90 天 ≥3 次，mockup L604）。零 LLM。
 * 門檻定義見 domain/taxonomy.ts CHRONIC_DEFINITION。
 */
/** chronic：occurrences.length ≥ CHRONIC_DEFINITION.minOccurrences；watching：未達門檻但規則仍在盯 */
export const CHRONIC_FLAG_STATUSES = ["chronic", "watching"] as const;
export const chronicFlagStatusSchema = z.enum(CHRONIC_FLAG_STATUSES);
export type ChronicFlagStatus = z.infer<typeof chronicFlagStatusSchema>;

export const chronicFlagSchema = z.object({
  alarmCode: z.string().min(1),
  occurrences: z.array(z.coerce.date()).readonly(),
  /** 前幾次的根因各不相同 → 可能一直沒抓到真因 */
  distinctRootCauses: z.number().int().nonnegative(),
  status: chronicFlagStatusSchema,
});
export type ChronicFlag = z.infer<typeof chronicFlagSchema>;

/** 機台抓回的檔案（mockup L609–635） */
export const toolFileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.string().min(1),
  sourcePath: z.string().min(1),
  updatedAt: z.coerce.date(),
  downloadUrl: z.string().min(1),
  /** 勾選後這份檔案會進 Copilot 的 context */
  referencedByCopilot: z.boolean(),
});
export type ToolFile = z.infer<typeof toolFileSchema>;

/**
 * 打包卡片。個人 skill → 課級 common 需 admin 簽核（見 permission-matrix #9）。
 */
export const PIN_STATUSES = ["private", "pending", "common"] as const;
export const pinStatusSchema = z.enum(PIN_STATUSES);
export type PinStatus = z.infer<typeof pinStatusSchema>;

export const pinnedCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  /** 來源必須可溯源——產品紅線 #8 */
  source: z.string().min(1),
  author: z.string().min(1),
  authorId: z.string().min(1),
  createdAt: z.coerce.date(),
  /** 寫進哪個 case */
  caseId: z.string().min(1),
  status: pinStatusSchema,
  reviewedBy: z.string().nullable(),
  reviewedAt: z.coerce.date().nullable(),
});
export type PinnedCard = z.infer<typeof pinnedCardSchema>;
