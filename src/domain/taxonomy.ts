import { z } from "zod";

/**
 * 受控詞彙——產品紅線之一（mockup L1683「受控詞彙，不自由填寫」）。
 *
 * 為什麼要受控：回饋與標註最終要餵給 ML training queue。如果每個人用自己的說法描述
 * 同一個現象，模型學不會（mockup L2063）。所以所有回饋一律走下拉，選項只能從這裡來。
 *
 * 為什麼時序與分布要分開：它們是**正交的兩個維度**（mockup L1453）。
 * SPIKE 是時序行為（突起後回復），SINGLE_PEAK 是分布形狀（單峰）——
 * 兩者可以同時成立，混在一起標就會互相污染。
 *
 * 英文 code 是識別碼不是翻譯（見 task D9），中文是說明。
 */

// ── 時序行為：怎麼變 ────────────────────────────────────────────
export const TIME_PATTERNS = [
  "STABLE",
  "TRENDING",
  "MEAN_SHIFT",
  "SPIKE",
  "OSCILLATION",
  "RAMP_DECAY",
] as const;

export const timePatternSchema = z.enum(TIME_PATTERNS);
export type TimePattern = z.infer<typeof timePatternSchema>;

export const TIME_PATTERN_LABEL: Readonly<Record<TimePattern, string>> = {
  STABLE: "平穩無趨勢",
  TRENDING: "單向持續變化（上升／下降）",
  MEAN_SHIFT: "階梯式跳變（水位重設）",
  SPIKE: "單一突起後回復（transient）",
  OSCILLATION: "週期性震盪",
  RAMP_DECAY: "衝高後緩降",
};

// ── 分布形狀：長什麼樣 ──────────────────────────────────────────
export const DIST_PATTERNS = [
  "SINGLE_PEAK",
  "MULTI_PEAK",
  "SKEWED",
  "HEAVY_TAIL",
  "UNIFORM",
] as const;

export const distPatternSchema = z.enum(DIST_PATTERNS);
export type DistPattern = z.infer<typeof distPatternSchema>;

export const DIST_PATTERN_LABEL: Readonly<Record<DistPattern, string>> = {
  SINGLE_PEAK: "單峰",
  MULTI_PEAK: "多峰（雙模態以上）",
  SKEWED: "偏態（左偏／右偏）",
  HEAVY_TAIL: "厚尾（極端值偏多）",
  UNIFORM: "均勻分布",
};

// ── 空間 pattern（mockup L1255–1270）──────────────────────────
/** wafer 層級的形狀 */
export const WAFER_PATTERNS = [
  "BOWL",
  "DOME",
  "TILT",
  "SADDLE",
  "EDGE_ROLL_OFF",
  "RANDOM",
] as const;
/** field 層級 */
export const FIELD_PATTERNS = ["SCAN_DIR_TILT", "CORNER_HEAVY"] as const;
/** slit 層級 */
export const SLIT_PATTERNS = ["SYMMETRIC", "ASYMMETRIC"] as const;

export const SPATIAL_PATTERNS = [
  ...WAFER_PATTERNS,
  ...FIELD_PATTERNS,
  ...SLIT_PATTERNS,
] as const;

export const spatialPatternSchema = z.enum(SPATIAL_PATTERNS);
export type SpatialPattern = z.infer<typeof spatialPatternSchema>;

export const SPATIAL_PATTERN_LABEL: Readonly<Record<SpatialPattern, string>> = {
  BOWL: "碗狀（中心低）",
  DOME: "凸起（中心高）",
  TILT: "單向傾斜",
  SADDLE: "馬鞍",
  EDGE_ROLL_OFF: "邊緣塌陷",
  RANDOM: "無規律",
  SCAN_DIR_TILT: "掃描方向傾斜",
  CORNER_HEAVY: "角落偏重",
  SYMMETRIC: "對稱",
  ASYMMETRIC: "單側惡化",
};

/**
 * SPIKE 的判定門檻（mockup L2202–2205）。
 * 寫死在這裡是刻意的——這是 rule base 的定義，不是 LLM 憑感覺數的。
 * 前端只用來顯示定義；實際判定在 ML kernel，兩邊必須一致。
 */
export const SPIKE_DEFINITION = {
  deviationSigma: 3,
  recoveryWithinMinutes: 30,
  recoveryBandSigma: 1,
} as const;

/**
 * 慢性問題的 rule base 門檻（mockup L604）。零 LLM。
 */
export const CHRONIC_DEFINITION = {
  windowDays: 90,
  minOccurrences: 3,
} as const;

export type PatternLabelPair = {
  readonly time: TimePattern;
  readonly dist: DistPattern;
};

export const patternLabelPairSchema = z.object({
  time: timePatternSchema,
  dist: distPatternSchema,
});
