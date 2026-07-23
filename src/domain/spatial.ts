import { z } from "zod";
import { spatialPatternSchema } from "@/domain/taxonomy";

/**
 * Scanner 空間指標與 dual chuck 診斷（mockup L711–1249）。
 *
 * Dual chuck 是天然的對照組：
 *   一致 → 問題在共用系統（透鏡／光源／環境／servo）
 *   分歧 → 問題在該 chuck 本身（吸盤／sensor／表面／校正）
 * 這一刀切下去，排查範圍直接減半（mockup L1279）。
 */

export const SPATIAL_INDICATORS = [
  "overlay_fp",
  "focus_fp",
  "leveling",
  "field_focus",
  "slit",
] as const;
export const spatialIndicatorSchema = z.enum(SPATIAL_INDICATORS);
export type SpatialIndicator = z.infer<typeof spatialIndicatorSchema>;

export const CHUCK_VERDICTS = ["consistent", "divergent", "not_applicable"] as const;
export const chuckVerdictSchema = z.object({
  kind: z.enum(CHUCK_VERDICTS),
  /** 這個判定把嫌疑範圍縮到哪裡 */
  implication: z.string().min(1),
});
export type ChuckVerdict = z.infer<typeof chuckVerdictSchema>;

export const chuckMapSchema = z.object({
  chuck: z.enum(["A", "B"]),
  pattern: spatialPatternSchema,
  abnormal: z.boolean(),
  /** 顯示用的量測值（|M|、3σ、PV…），保留單位字串以免前端誤算 */
  metrics: z.array(z.object({ label: z.string(), value: z.string() })).readonly(),
});
export type ChuckMap = z.infer<typeof chuckMapSchema>;

/** 嫌疑節點；kind=sop 時可點進 SOP */
export const suspectSchema = z.object({
  label: z.string().min(1),
  kind: z.enum(["part", "sop", "hypothesis"]),
  refId: z.string().nullable(),
});
export type Suspect = z.infer<typeof suspectSchema>;

export const spatialAnalysisSchema = z.object({
  indicator: spatialIndicatorSchema,
  verdict: chuckVerdictSchema,
  chucks: z.array(chuckMapSchema).readonly(),
  /** ML 對這個指標的判定敘述 */
  mlStatement: z.string().min(1),
  suspects: z.array(suspectSchema).readonly(),
  /** 命中歷史標註時才有；null = KM 無紀錄，顯示「我不猜」 */
  flywheel: z
    .object({
      author: z.string().min(1),
      at: z.coerce.date(),
      statement: z.string().min(1),
    })
    .nullable(),
  /** 超出課內可處理範圍（如透鏡校正需原廠 FSE，mockup L967） */
  needsVendorSupport: z.boolean(),
});
export type SpatialAnalysis = z.infer<typeof spatialAnalysisSchema>;

/**
 * 交叉診斷結論：**ML 後端產出，前端純渲染**（task D6）。
 * 前端不得有任何彙整規則。
 */
export const crossDiagnosisLineSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  /** 由哪些指標交叉驗證得出 */
  indicators: z.array(spatialIndicatorSchema).readonly(),
  scope: z.enum(["in_section", "needs_fse"]),
});

export const crossDiagnosisSchema = z.object({
  toolId: z.string().min(1),
  lines: z.array(crossDiagnosisLineSchema).readonly(),
  confidence: z.number().min(0).max(1),
});
export type CrossDiagnosis = z.infer<typeof crossDiagnosisSchema>;
