import type { ChronicFlag, ErrorCase, PinnedCard, ToolCommand, ToolFile } from "@/domain/case";

/**
 * 當機處理 + 病史分析的 fixtures，全部掛在 SCN-A01（mockup L573–685）。
 *
 * FOCUS-DRIFT-011 這個 case id 是跨檔案一致性的錨點——u chart／t chart
 * fixtures（fdc.ts）用的也是同一個 id，對應同一個 alarm。
 */

export const toolCommandsFixture: readonly ToolCommand[] = [
  {
    id: "tc-01",
    tag: "WAIT",
    text: "wait particle result",
    author: "小王",
    at: new Date("2026-07-14T02:40:00+08:00"),
    etaHours: 3,
  },
  {
    id: "tc-02",
    tag: "WAIT",
    text: "wait parts（GV-2 閥件，明日到貨）",
    author: "陳工",
    at: new Date("2026-07-14T03:10:00+08:00"),
    etaHours: null,
  },
];

export const errorCasesFixture: readonly ErrorCase[] = [
  {
    id: "FOCUS-DRIFT-011",
    alarmCode: "FOCUS-DRIFT",
    title: "Focus error 緩升超 UCL",
    severity: "critical",
    status: "processing",
    at: new Date("2026-07-14T02:14:00+08:00"),
    caseNumber: "C-0703-021",
    assignee: "小王",
    rootCause: null,
    burstIndex: null,
  },
  {
    id: "STAGE-VIB-003",
    alarmCode: "STAGE-VIB",
    title: "Stage 振動尖峰",
    severity: "warning",
    status: "open",
    at: new Date("2026-07-14T02:14:00+08:00"),
    caseNumber: null,
    assignee: null,
    rootCause: null,
    // 同窗期第 2 發（60 秒限流，mockup L595）
    burstIndex: 2,
  },
  {
    id: "DOSE-WARN-007",
    alarmCode: "DOSE-WARN",
    title: "已結案",
    severity: "closed",
    status: "closed",
    at: new Date("2026-07-13T14:20:00+08:00"),
    caseNumber: null,
    assignee: "陳工",
    rootCause: "光源老化",
    burstIndex: null,
  },
  {
    // pin-02 打包引用的 case（mockup L681–683：GV-2 閥件更換後追蹤）
    id: "VAC-INTERLOCK-GV2",
    alarmCode: "VAC-INTERLOCK",
    title: "VAC_INTERLOCK 復發（GV-2 密封劣化）",
    severity: "closed",
    status: "closed",
    at: new Date("2026-05-20T00:00:00+08:00"),
    caseNumber: null,
    assignee: "陳工",
    rootCause: "GV-2 O-ring 更換",
    burstIndex: null,
  },
];

/**
 * 慢性問題（rule base，零 LLM，mockup L604）。
 *
 * 注意：STAGE-VIB-003 只有 90 天內 2 次，未達 CHRONIC_DEFINITION.minOccurrences（3 次）
 * 門檻，所以標 status: "watching"（觀察中 🟡）而非 "chronic"（慢性 🔴），對應 mockup L2242
 * 的「觀察中」標示——真正達標的只有 FOCUS-DRIFT-011。
 */
export const chronicFlagsFixture: readonly ChronicFlag[] = [
  {
    alarmCode: "FOCUS-DRIFT",
    occurrences: [
      new Date("2026-01-18T00:00:00+08:00"),
      new Date("2026-03-28T00:00:00+08:00"),
      new Date("2026-05-12T00:00:00+08:00"),
      new Date("2026-07-03T00:00:00+08:00"),
    ],
    // 前三次根因各不同：環境溫濕／干涉儀污染／鏡組溫控（mockup L2242）
    distinctRootCauses: 3,
    status: "chronic",
  },
  {
    alarmCode: "STAGE-VIB",
    occurrences: [new Date("2026-06-05T00:00:00+08:00"), new Date("2026-07-01T00:00:00+08:00")],
    distinctRootCauses: 2,
    status: "watching",
  },
];

export const toolFilesFixture: readonly ToolFile[] = [
  {
    id: "file-01",
    name: "ASML log book",
    kind: "logbook",
    sourcePath: "/SCN-A01/logbook",
    updatedAt: new Date("2026-07-14T03:20:00+08:00"),
    downloadUrl: "/fixtures/files/scn-a01/logbook",
    referencedByCopilot: true,
  },
  {
    id: "file-02",
    name: "AWE.LXX001.01",
    kind: "awe",
    sourcePath: "/SCN-A01/awe",
    updatedAt: new Date("2026-07-14T02:48:00+08:00"),
    downloadUrl: "/fixtures/files/scn-a01/awe.lxx001.01",
    referencedByCopilot: true,
  },
  {
    id: "file-03",
    name: "lot report.LXX001.01",
    kind: "lot_report",
    sourcePath: "/SCN-A01/lot_report",
    updatedAt: new Date("2026-07-14T01:05:00+08:00"),
    downloadUrl: "/fixtures/files/scn-a01/lot-report.lxx001.01",
    referencedByCopilot: false,
  },
];

export const pinnedCardsFixture: readonly PinnedCard[] = [
  {
    id: "pin-01",
    title: "Focus 漂移的 PM 週期相關性",
    body: "近三次 FOCUS-DRIFT 皆發生在 PM 後 2–4 天，PM 前 30 天內從未發生 → 高度懷疑 PM 程序引入偏差，非零件老化。",
    source: "fdc-query + case-query",
    author: "小王",
    authorId: "u-wang",
    createdAt: new Date("2026-07-03T00:00:00+08:00"),
    caseId: "FOCUS-DRIFT-011",
    status: "private",
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    id: "pin-02",
    title: "GV-2 閥件更換後追蹤",
    body: "GV-2 於 5/20 更換，至今 44 天無 VAC_INTERLOCK 復發（前期平均 8 天一次）→ 更換有效。",
    source: "log-digest 頻率統計",
    author: "陳工",
    authorId: "u-chen",
    createdAt: new Date("2026-07-03T00:00:00+08:00"),
    caseId: "VAC-INTERLOCK-GV2",
    status: "common",
    reviewedBy: "老李",
    reviewedAt: new Date("2026-07-03T00:00:00+08:00"),
  },
];
