import type { AnomalyMarker, RecipeStep, TChartAnalysis, UChartAnalysis } from "@/domain/fdc";

/**
 * FDC fixtures：SCN-A01 · case FOCUS-DRIFT-011（mockup L1391–1668, canned answer L2199–2255）。
 *
 * 波形是程式生成的合理形狀，不是逐點照抄 SVG——但趨勢必須對：
 * u chart 呈現 STABLE → MEAN_SHIFT → MULTI_PEAK → TRENDING 四段（mockup L1457–1489）；
 * t chart 在 S2 Pump Down 偏移、S4 Expose 於 33.2s 有單點 data loss（mockup L1522–1600）。
 */

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

// ── u chart：90 天、四段（mockup L1457–1489）──────────────────────

/**
 * ① Day 1–30 STABLE/SINGLE_PEAK（μ≈2.1, σ≈0.4，baseline）
 * ② Day 30–48 MEAN_SHIFT/SINGLE_PEAK（階梯跳到 μ≈4.6）
 * ③ Day 48–70 STABLE/MULTI_PEAK（雙峰 4.2 / 5.8，日夜班交替）
 * ④ Day 70–90 TRENDING/SKEWED（斜率 +1.1nm/日，Day 86/88/90 對應 canned answer 的 10.4/10.9/11.2nm）
 */
function buildUChartPoints(): readonly [number, number][] {
  const points: [number, number][] = [];

  // ① baseline：圍繞 2.1nm 的小雜訊
  for (let day = 0; day <= 30; day += 2) {
    const noise = Math.sin(day * 1.7) * 0.15;
    points.push([day, round(2.1 + noise)]);
  }

  // ② mean shift：跳到 4.6nm 後持平
  for (let day = 32; day <= 48; day += 2) {
    const noise = Math.sin(day * 1.3) * 0.15;
    points.push([day, round(4.6 + noise)]);
  }

  // ③ multi-peak：時序無趨勢，但在兩個中心（4.2 / 5.8）交替
  const peaks = [5.8, 4.2];
  let peakIdx = 0;
  for (let day = 50; day <= 70; day += 2) {
    points.push([day, peaks[peakIdx % peaks.length]!]);
    peakIdx += 1;
  }

  // ④ trending：持續上升，尾端對齊「7 天內超規」canned answer 的實際數值
  const trendTail: [number, number][] = [
    [72, 6.0],
    [74, 6.6],
    [76, 7.2],
    [78, 7.8],
    [80, 8.4],
    [82, 9.0],
    [84, 9.6],
    [86, 10.4],
    [88, 10.9],
    [90, 11.2],
  ];
  points.push(...trendTail);

  return points;
}

export const uChartAnalysisFixture: UChartAnalysis = {
  caseId: "FOCUS-DRIFT-011",
  toolId: "SCN-A01",
  parameter: "focus_error",
  unit: "nm",
  windowDays: 90,
  points: buildUChartPoints(),
  // CL ±10 / ML ±12 / SL ±15（mockup L2217–2225）
  specs: { cl: 10, ml: 12, sl: 15 },
  changepoints: [
    { atDay: 30, confidence: 0.91 },
    { atDay: 48, confidence: 0.87 },
    { atDay: 70, confidence: 0.89 },
    { atDay: 90, confidence: 0.96 },
  ],
  segments: [
    {
      id: "seg-01",
      fromDay: 1,
      toDay: 30,
      timePattern: "STABLE",
      distPattern: "SINGLE_PEAK",
      stats: { mean: 2.1, sigma: 0.4, slopePerDay: null, r2: null, peaks: null },
      nearbyEvents: [],
    },
    {
      id: "seg-02",
      fromDay: 30,
      toDay: 48,
      timePattern: "MEAN_SHIFT",
      distPattern: "SINGLE_PEAK",
      stats: { mean: 4.6, sigma: 0.5, slopePerDay: null, r2: null, peaks: null },
      nearbyEvents: [
        {
          at: new Date("2026-06-02T00:00:00+08:00"),
          kind: "part_change",
          label: "更換鏡組溫控模組",
          actor: "老李",
        },
      ],
    },
    {
      id: "seg-03",
      fromDay: 48,
      toDay: 70,
      timePattern: "STABLE",
      distPattern: "MULTI_PEAK",
      stats: { mean: null, sigma: null, slopePerDay: null, r2: null, peaks: [4.2, 5.8] },
      nearbyEvents: [
        {
          at: new Date("2026-06-20T00:00:00+08:00"),
          kind: "calibration",
          label: "執行 focus 校正",
          actor: "陳工",
        },
      ],
    },
    {
      id: "seg-04",
      fromDay: 70,
      toDay: 90,
      timePattern: "TRENDING",
      distPattern: "SKEWED",
      stats: { mean: null, sigma: null, slopePerDay: 1.1, r2: 0.94, peaks: null },
      nearbyEvents: [
        {
          at: new Date("2026-07-12T00:00:00+08:00"),
          kind: "ec_change",
          label: "修改 EC 參數",
          actor: "PE 陳",
        },
        {
          at: new Date("2026-07-14T00:00:00+08:00"),
          kind: "pm",
          label: "PM",
          actor: null,
        },
      ],
    },
  ],
  baseline: {
    shifted: true,
    baseline: { mean: 2.1, sigma: 0.4, windowLabel: "前 30 天" },
    current: { mean: 7.8, sigma: 1.2, windowLabel: "近 7 天" },
    deltaValue: 5.7,
    sigmaMultiple: 14.3,
  },
  events: [
    {
      at: new Date("2026-06-02T00:00:00+08:00"),
      kind: "part_change",
      label: "更換鏡組溫控模組",
      actor: "老李",
    },
    {
      at: new Date("2026-06-20T00:00:00+08:00"),
      kind: "calibration",
      label: "執行 focus 校正",
      actor: "陳工",
    },
    {
      at: new Date("2026-07-12T00:00:00+08:00"),
      kind: "ec_change",
      label: "修改 EC 參數",
      actor: "PE 陳",
    },
    {
      at: new Date("2026-07-14T00:00:00+08:00"),
      kind: "pm",
      label: "PM",
      actor: null,
    },
  ],
  narrative:
    "這台機的 focus error 在 90 天內經歷四個階段。前 30 天穩定在 2.1nm，Day 30 更換鏡組溫控模組後出現階梯式跳升（+2.5nm），" +
    "這不是漸進老化，是換件當下的水位重設。中段出現雙峰分布，可能是兩種運作條件交替；最值得注意的是最後 20 天的持續上升趨勢" +
    "（+1.1nm/日，線性度高），Day 70 前後有 EC 修改與 PM 兩個事件，時間相近難以區分。結論：Baseline 已明顯偏移（+5.7nm），" +
    "且仍在惡化中。建議優先查 Day 70 的 EC 變更內容——趨勢起點與它吻合。",
};

// ── t chart：單片 42 秒、1kHz（mockup L1504–1668）───────────────────

const RECIPE_STEPS: readonly RecipeStep[] = [
  { id: "S1", name: "S1 Load", fromSec: 0, toSec: 8, verdict: "ok" },
  { id: "S2", name: "S2 Pump Down", fromSec: 8, toSec: 22, verdict: "deviation" },
  { id: "S3", name: "S3 Stabilize", fromSec: 22, toSec: 28, verdict: "ok" },
  { id: "S4", name: "S4 Expose", fromSec: 28, toSec: 38, verdict: "data_loss" },
  { id: "S5", name: "S5 Vent", fromSec: 38, toSec: 42, verdict: "ok" },
];

const ANOMALIES: readonly AnomalyMarker[] = [
  {
    atSec: 21.5,
    kind: "deviation",
    value: 5.8e-6,
    label: "抽不到位（recipe 目標 3.0e-6 torr @14s，實際 22s 仍在 5.8e-6）",
  },
  {
    atSec: 33.2,
    kind: "data_loss",
    value: 8.8e-6,
    label: "單點 data loss（值跳到 8.8e-6 後立即回復）",
  },
];

/** target 壓力（S2 之後穩定於此，torr） */
const TARGET_TORR = 3.0e-6;

/** 正常參考波形：S2 於 14s 內順利抽到 target，之後維持平穩 */
function referencePressureAt(t: number): number {
  if (t <= 8) return 1e-3 - (t / 8) * (1e-3 - 1e-4);
  if (t <= 14) return 1e-4 - ((t - 8) / 6) * (1e-4 - TARGET_TORR);
  if (t <= 38) return TARGET_TORR;
  return TARGET_TORR + ((t - 38) / 4) * (1e-3 - TARGET_TORR);
}

/** 實際波形：S2 抽不到位（22s 仍停在 5.8e-6），S4 於 33.2s 單點 data loss */
function actualPressureAt(t: number): number {
  const DEVIATED_TORR = 5.8e-6;
  if (t <= 8) return 1e-3 - (t / 8) * (1e-3 - 1e-4);
  if (t <= 22) return 1e-4 - ((t - 8) / 14) * (1e-4 - DEVIATED_TORR);
  if (t <= 38) {
    // S4 Expose 內 33.2s 單點 data loss：立即跳高後立即回復，不影響前後採樣
    if (Math.abs(t - 33.2) < 0.05) return 8.8e-6;
    return DEVIATED_TORR - ((t - 22) / 16) * (DEVIATED_TORR - 4.5e-6);
  }
  return 4.5e-6 + ((t - 38) / 4) * (1e-3 - 4.5e-6);
}

/** 42 秒、每秒 20 點降採樣（~840 點），代表原始 1kHz（42000 點）的顯示解析度 */
function buildTChartSamples(fn: (t: number) => number): readonly [number, number][] {
  const samples: [number, number][] = [];
  const stepSec = 0.05;
  for (let t = 0; t <= 42; t += stepSec) {
    samples.push([round(t, 2), fn(t)]);
  }
  return samples;
}

export const tChartAnalysisFixture: TChartAnalysis = {
  caseId: "FOCUS-DRIFT-011",
  toolId: "SCN-A01",
  waferId: "A0714-023",
  parameter: "chamber_pressure",
  durationSec: 42,
  // 1kHz 單片約 4 萬點（mockup「單片 42 秒」，1000Hz × 42s）
  rawSampleCount: 42000,
  resolution: 20,
  samples: buildTChartSamples(actualPressureAt),
  reference: buildTChartSamples(referencePressureAt),
  recipeSteps: RECIPE_STEPS,
  anomalies: ANOMALIES,
  stepAnalyses: [
    {
      stepId: "S1",
      verdict: "ok",
      description: "與 recipe 目標一致，無偏移。",
      recipeTarget: null,
      actual: null,
      chain: [],
      kmHit: null,
    },
    {
      stepId: "S2",
      verdict: "deviation",
      description:
        "recipe 要求 14 秒內抽到 3.0e-6 torr，實際 22 秒仍停在 5.8e-6——抽不到位，非 data loss。",
      recipeTarget: "3.0e-6 torr @ 14s",
      actual: "5.8e-6 torr @ 22s",
      chain: [
        { kind: "step", id: "S2", label: "S2 Pump Down" },
        { kind: "part", id: "TP-1", label: "Turbo Pump TP-1" },
        { kind: "part", id: "GV-2", label: "Gate Valve GV-2" },
        { kind: "sop", id: "SOP-V-03", label: "SOP V-03 真空排查" },
      ],
      kmHit: {
        caseId: "C-0512-009",
        author: "陳工",
        at: new Date("2026-05-12T00:00:00+08:00"),
        statement: "S2 抽不到位 = GV-2 密封劣化",
        outcome: "換件後恢復，2.5hr 解決",
      },
    },
    {
      stepId: "S3",
      verdict: "ok",
      description: "與 recipe 目標一致，無偏移。",
      recipeTarget: null,
      actual: null,
      chain: [],
      kmHit: null,
    },
    {
      stepId: "S4",
      verdict: "data_loss",
      description:
        "33.2s 處單點 data loss（值跳到 8.8e-6 後立即回復），非持續偏移。recipe 此段為曝光，理論上壓力應恆定。",
      recipeTarget: "Expose · 壓力恆定 3.0e-6 torr",
      actual: "單點 loss（1 sample）@ 33.2s",
      chain: [{ kind: "step", id: "S4", label: "S4 Expose" }],
      // KM 沒有這個現象的紀錄 → 顯示「我不猜，等你標註」（產品紅線 #5）
      kmHit: null,
    },
    {
      stepId: "S5",
      verdict: "ok",
      description: "與 recipe 目標一致，無偏移。",
      recipeTarget: null,
      actual: null,
      chain: [],
      kmHit: null,
    },
  ],
  narrative:
    "u chart 只說「focus +11.2nm 超規」。t chart 說得更清楚：真正的問題在 S2 Pump Down——沒抽到位" +
    "（22 秒仍在 5.8e-6，目標 3.0e-6）。腔體真空度不足，曝光時折射率偏差 → focus 讀值飄。這不是 focus 系統的問題，" +
    "是真空系統的問題。換 focus 相關零件不會解決——這正是 u chart 看不出來的事。S4 那個單點 loss 我不知道是什麼，等你標註。",
};
