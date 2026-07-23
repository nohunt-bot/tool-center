import { z } from "zod";
import { distPatternSchema, timePatternSchema } from "@/domain/taxonomy";

/**
 * FDC 判讀的型別。
 *
 * 產品紅線 #1：**pattern 由 ML kernel 判定，LLM 只做敘事翻譯**（mockup L1493）。
 * 因此 Segment 的 pattern 欄位一律來自 ML，前端與 LLM 都不得自行推斷。
 */

// ── u chart（by wafer 的統計點）─────────────────────────────────

export const specLimitsSchema = z.object({
  /** Control Limit（mockup L2221：CL ±10、ML ±12、SL ±15） */
  cl: z.number().positive(),
  ml: z.number().positive(),
  sl: z.number().positive(),
});
export type SpecLimits = z.infer<typeof specLimitsSchema>;

/** 事件旗標：只做時間並列，**不強行歸因**（產品紅線 #4，mockup L1435） */
export const TIMELINE_EVENT_KINDS = [
  "part_change",
  "calibration",
  "ec_change",
  "pm",
] as const;
export const timelineEventSchema = z.object({
  at: z.coerce.date(),
  kind: z.enum(TIMELINE_EVENT_KINDS),
  label: z.string().min(1),
  actor: z.string().nullable(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const segmentStatsSchema = z.object({
  mean: z.number().nullable(),
  sigma: z.number().nullable(),
  /** TRENDING 才有 */
  slopePerDay: z.number().nullable(),
  r2: z.number().nullable(),
  /** MULTI_PEAK 才有 */
  peaks: z.array(z.number()).nullable(),
});

export const segmentSchema = z.object({
  id: z.string().min(1),
  fromDay: z.number().int().nonnegative(),
  toDay: z.number().int().positive(),
  /** 兩個正交維度，皆由 ML 判定 */
  timePattern: timePatternSchema,
  distPattern: distPatternSchema,
  stats: segmentStatsSchema,
  /** 轉折點附近的事件（±3 天）——時間並列，因果由人判斷 */
  nearbyEvents: z.array(timelineEventSchema).readonly(),
});
export type Segment = z.infer<typeof segmentSchema>;

export const changepointSchema = z.object({
  atDay: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
});
export type Changepoint = z.infer<typeof changepointSchema>;

export const baselineVerdictSchema = z.object({
  shifted: z.boolean(),
  baseline: z.object({
    mean: z.number(),
    sigma: z.number(),
    windowLabel: z.string().min(1),
  }),
  current: z.object({
    mean: z.number(),
    sigma: z.number(),
    windowLabel: z.string().min(1),
  }),
  deltaValue: z.number(),
  sigmaMultiple: z.number(),
});
export type BaselineVerdict = z.infer<typeof baselineVerdictSchema>;

export const uChartAnalysisSchema = z.object({
  caseId: z.string().min(1),
  toolId: z.string().min(1),
  parameter: z.string().min(1),
  unit: z.string().min(1),
  windowDays: z.number().int().positive(),
  /** [dayOffset, value][]，已依 resolution 降採樣 */
  points: z.array(z.tuple([z.number(), z.number()])).readonly(),
  specs: specLimitsSchema,
  changepoints: z.array(changepointSchema).readonly(),
  segments: z.array(segmentSchema).readonly(),
  baseline: baselineVerdictSchema,
  events: z.array(timelineEventSchema).readonly(),
  /** LLM 敘事——只讀上面的 ML 輸出，不自行判定 */
  narrative: z.string().min(1),
});
export type UChartAnalysis = z.infer<typeof uChartAnalysisSchema>;

// ── t chart（毫秒級製程波形）───────────────────────────────────

export const RECIPE_STEP_VERDICTS = ["ok", "deviation", "data_loss", "unknown"] as const;
export const recipeStepVerdictSchema = z.enum(RECIPE_STEP_VERDICTS);
export type RecipeStepVerdict = z.infer<typeof recipeStepVerdictSchema>;

export const recipeStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fromSec: z.number().nonnegative(),
  toSec: z.number().positive(),
  verdict: recipeStepVerdictSchema,
});
export type RecipeStep = z.infer<typeof recipeStepSchema>;

/**
 * 異常標記由 **ML kernel 獨立產出**，與顯示用的降採樣是兩條管線（見 task D7）。
 * 這是為什麼「單點 data loss」不會因降採樣而消失——它不在波形陣列裡，在這裡。
 */
export const anomalyMarkerSchema = z.object({
  atSec: z.number().nonnegative(),
  kind: z.enum(["data_loss", "deviation"]),
  value: z.number(),
  label: z.string().min(1),
});
export type AnomalyMarker = z.infer<typeof anomalyMarkerSchema>;

/** 追根鏈路：step → 零件 → SOP（mockup L1577–1585） */
export const chainNodeSchema = z.object({
  kind: z.enum(["step", "part", "sop"]),
  id: z.string().min(1),
  label: z.string().min(1),
});
export type ChainNode = z.infer<typeof chainNodeSchema>;

/** 知識飛輪命中：這條知識是課裡的人寫的，不是模型推理的（mockup L1587） */
export const kmHitSchema = z.object({
  caseId: z.string().min(1),
  author: z.string().min(1),
  at: z.coerce.date(),
  statement: z.string().min(1),
  outcome: z.string().min(1),
});
export type KmHit = z.infer<typeof kmHitSchema>;

export const stepAnalysisSchema = z.object({
  stepId: z.string().min(1),
  verdict: recipeStepVerdictSchema,
  description: z.string().min(1),
  recipeTarget: z.string().nullable(),
  actual: z.string().nullable(),
  chain: z.array(chainNodeSchema).readonly(),
  /** null = KM 沒有紀錄 → 顯示「我不猜，等你標註」（產品紅線 #5） */
  kmHit: kmHitSchema.nullable(),
});
export type StepAnalysis = z.infer<typeof stepAnalysisSchema>;

export const tChartAnalysisSchema = z.object({
  caseId: z.string().min(1),
  toolId: z.string().min(1),
  waferId: z.string().min(1),
  parameter: z.string().min(1),
  durationSec: z.number().positive(),
  /** 原始取樣點數（1kHz 單片約 4 萬點）——顯示的是降採樣後的 samples */
  rawSampleCount: z.number().int().positive(),
  resolution: z.number().int().positive(),
  samples: z.array(z.tuple([z.number(), z.number()])).readonly(),
  /** 同 recipe 正常片的參考波形 */
  reference: z.array(z.tuple([z.number(), z.number()])).readonly(),
  recipeSteps: z.array(recipeStepSchema).readonly(),
  anomalies: z.array(anomalyMarkerSchema).readonly(),
  stepAnalyses: z.array(stepAnalysisSchema).readonly(),
  narrative: z.string().min(1),
});
export type TChartAnalysis = z.infer<typeof tChartAnalysisSchema>;
