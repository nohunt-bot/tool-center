import type { CrossDiagnosis, SpatialAnalysis } from "@/domain/spatial";

/**
 * 深度診斷：SCN-A01 五個空間指標 + 交叉診斷（mockup L711–973、L1239–1249）。
 *
 * Dual chuck 判定貫穿全部指標：
 *   overlay_fp / leveling → 分歧 → Chuck B 硬體
 *   focus_fp / field_focus / slit → 一致 → 共用光學系統
 */

export const spatialAnalysesFixture: Readonly<Record<string, SpatialAnalysis>> = {
  overlay_fp: {
    indicator: "overlay_fp",
    verdict: {
      kind: "divergent",
      implication: "問題在 Chuck B 本身（吸盤／leveling sensor／chuck 校正）",
    },
    chucks: [
      {
        chuck: "A",
        pattern: "RANDOM",
        abnormal: false,
        metrics: [
          { label: "|M|", value: "1.8nm" },
          { label: "3σ", value: "2.4nm" },
          { label: "殘差", value: "隨機" },
        ],
      },
      {
        chuck: "B",
        // mockup 標示為「TILT + EDGE ROLL-OFF」複合 pattern；schema 一格只能選一個，
        // 取主要的 TILT，EDGE ROLL-OFF 併入 mlStatement 文字說明（見報告 Open issues）
        pattern: "TILT",
        abnormal: true,
        metrics: [
          { label: "|M|", value: "5.4nm" },
          { label: "3σ", value: "6.8nm" },
          { label: "邊緣", value: "8.2nm" },
        ],
      },
    ],
    mlStatement:
      "Chuck B 呈 TILT（單向傾斜）+ EDGE ROLL-OFF（邊緣塌陷），向量往外放射——典型的 wafer 未完全吸附造成的放大誤差。" +
      "Chuck A 同批次同 recipe 完全正常 → 排除透鏡、光源、環境，鎖定 Chuck B 硬體。",
    suspects: [
      { label: "Chuck B 吸盤真空", kind: "part", refId: null },
      { label: "Chuck B leveling sensor", kind: "part", refId: null },
      { label: "Chuck B 表面異物", kind: "part", refId: null },
      { label: "SOP C-11 Chuck 清潔校正", kind: "sop", refId: "SOP-C-11" },
    ],
    flywheel: {
      author: "老李",
      at: new Date("2026-03-22T00:00:00+08:00"),
      statement:
        "Chuck B edge roll-off + 吸附真空度偏低 = 吸盤 O-ring 老化，更換後 overlay 3σ 從 6.9 降回 2.3nm。",
    },
    needsVendorSupport: false,
  },

  focus_fp: {
    indicator: "focus_fp",
    verdict: {
      kind: "consistent",
      implication: "問題在共用系統（透鏡／光源／環境）",
    },
    chucks: [
      {
        chuck: "A",
        pattern: "BOWL",
        abnormal: true,
        metrics: [
          { label: "中心", value: "-12nm" },
          { label: "邊緣", value: "+9nm" },
          { label: "PV", value: "21nm" },
        ],
      },
      {
        chuck: "B",
        pattern: "BOWL",
        abnormal: true,
        metrics: [
          { label: "中心", value: "-11nm" },
          { label: "邊緣", value: "+10nm" },
          { label: "PV", value: "21nm" },
        ],
      },
    ],
    mlStatement:
      "兩 chuck 皆呈 BOWL（碗狀）：中心離焦 -12nm、邊緣 +9nm，PV 21nm。對稱且一致 → 共用系統問題。" +
      "KM 裡沒有這台機 BOWL pattern 的處理紀錄。我知道 pattern 是什麼形狀，但不知道你們這台的 BOWL 通常是什麼原因" +
      "——是透鏡加熱？環境氣壓？還是 chuck 平整度共同劣化？我不猜，等你標註。",
    suspects: [
      { label: "投影透鏡（熱效應？）", kind: "hypothesis", refId: null },
      { label: "環境氣壓補償", kind: "hypothesis", refId: null },
      { label: "兩 chuck 共同劣化？", kind: "hypothesis", refId: null },
    ],
    // KM 無紀錄 → null（產品紅線 #5：我不猜，等你標註）
    flywheel: null,
    needsVendorSupport: false,
  },

  leveling: {
    indicator: "leveling",
    verdict: {
      kind: "divergent",
      implication: "Chuck B 有 hot spot，Chuck A 平坦",
    },
    chucks: [
      {
        chuck: "A",
        // mockup 標為「FLAT」，taxonomy 沒有這個 code；取語意最近的 RANDOM（無規律／無特徵）
        pattern: "RANDOM",
        abnormal: false,
        metrics: [
          { label: "PV", value: "1.8µm" },
          { label: "hot spot", value: "無" },
        ],
      },
      {
        chuck: "B",
        // mockup 標為「HOT SPOT ×2」，taxonomy 沒有專屬 code；取局部隆起最接近的 DOME
        pattern: "DOME",
        abnormal: true,
        metrics: [
          { label: "PV", value: "5.9µm" },
          { label: "hot spot", value: "×2（+4.2µm / +2.8µm）" },
        ],
      },
    ],
    mlStatement:
      "Chuck B 有 2 個 hot spot（+4.2µm / +2.8µm），位置固定（每片都在同座標）→ 不是 wafer 問題，是 chuck 表面問題（異物或凹凸）。" +
      "與 Overlay FP 的判定一致——兩個指標都指向 Chuck B 硬體，交叉驗證通過，信心提升。",
    suspects: [
      { label: "Chuck B 表面異物", kind: "part", refId: null },
      { label: "Burl 磨損", kind: "part", refId: null },
      { label: "SOP C-11 Chuck 清潔", kind: "sop", refId: "SOP-C-11" },
    ],
    flywheel: null,
    needsVendorSupport: false,
  },

  field_focus: {
    indicator: "field_focus",
    verdict: {
      kind: "consistent",
      implication: "兩 chuck 的 field 內分布相同 → 共用系統",
    },
    // mockup 顯示的是疊合所有 field 的單一分布圖，非分 chuck；兩 chuck 一致故複製同一份讀數
    chucks: [
      {
        chuck: "A",
        pattern: "SCAN_DIR_TILT",
        abnormal: true,
        metrics: [
          { label: "field 內 PV", value: "13nm" },
          { label: "scan 起點", value: "+7nm" },
          { label: "scan 終點", value: "-6nm" },
        ],
      },
      {
        chuck: "B",
        pattern: "SCAN_DIR_TILT",
        abnormal: true,
        metrics: [
          { label: "field 內 PV", value: "13nm" },
          { label: "scan 起點", value: "+7nm" },
          { label: "scan 終點", value: "-6nm" },
        ],
      },
    ],
    mlStatement:
      "Field 內沿 scan 方向呈線性傾斜（起點 +7nm → 終點 -6nm），且每個 field 都重複。兩 chuck 一致 → 與 chuck 無關。" +
      "掃描過程中 focus 追不上——可能是 leveling 即時補償的動態響應問題。",
    suspects: [
      { label: "Level sensor 動態響應", kind: "part", refId: null },
      { label: "Scan stage 同步", kind: "part", refId: null },
      { label: "Focus servo 增益", kind: "part", refId: null },
      { label: "SOP L-07", kind: "sop", refId: "SOP-L-07" },
    ],
    flywheel: null,
    needsVendorSupport: false,
  },

  slit: {
    indicator: "slit",
    verdict: {
      kind: "consistent",
      implication: "光學系統共用，chuck 無關",
    },
    chucks: [
      {
        chuck: "A",
        pattern: "ASYMMETRIC",
        abnormal: true,
        metrics: [
          { label: "左", value: "-0.2nm" },
          { label: "中", value: "+0.5nm" },
          { label: "右", value: "+5.8nm（超規）" },
        ],
      },
      {
        chuck: "B",
        pattern: "ASYMMETRIC",
        abnormal: true,
        metrics: [
          { label: "左", value: "-0.2nm" },
          { label: "中", value: "+0.5nm" },
          { label: "右", value: "+5.8nm（超規）" },
        ],
      },
    ],
    mlStatement:
      "像差沿 slit 由左向右單調惡化，右緣 +5.8nm 超規。左側正常 → 不是整體透鏡劣化，是單側光學元件問題。",
    suspects: [
      { label: "投影透鏡右側元件", kind: "part", refId: null },
      { label: "照明均勻性", kind: "hypothesis", refId: null },
      { label: "Reticle stage 傾斜", kind: "hypothesis", refId: null },
      { label: "需 ASML FSE 支援", kind: "hypothesis", refId: null },
    ],
    flywheel: null,
    // 超出課內可處理範圍——透鏡校正需原廠 FSE（mockup L967）
    needsVendorSupport: true,
  },
};

export const crossDiagnosisFixture: CrossDiagnosis = {
  toolId: "SCN-A01",
  lines: [
    {
      title: "Chuck B 硬體",
      detail:
        "Overlay TILT + Leveling hot spot 交叉驗證 → 課內可處理：清潔／換 O-ring（老李 3/22 case）",
      indicators: ["overlay_fp", "leveling"],
      scope: "in_section",
    },
    {
      title: "共用光學系統",
      detail:
        "Focus BOWL + Field repeating + Slit 右偏，兩 chuck 一致 → 部分需 FSE：slit 像差超出課內範圍",
      indicators: ["focus_fp", "field_focus", "slit"],
      scope: "needs_fse",
    },
  ],
  confidence: 0.85,
};
