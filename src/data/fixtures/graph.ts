import type { GraphQueryResult } from "@/domain/graph";

/**
 * 關聯圖查詢：SCN-A01 · 查詢「chamber pressure 異常」（mockup L993–1084）。
 *
 * 兩層分離：物理層（chamber → Turbo Pump / Gate Valve / MFC-2，靜態拓撲）
 * 與經驗層（chamber → GV-2 O-ring / TP-1 軸承 / 壓力計 PS-1，案例累積）。
 * 節點 id 與 t chart fixture（fdc.ts）的 chain part id（TP-1、GV-2）保持一致。
 */
export const graphQueryResultFixture: GraphQueryResult = {
  originNodeId: "node-chamber-pressure",
  originLabel: "chamber pressure",
  nodes: [
    { id: "node-chamber-pressure", partNumber: null, label: "chamber pressure", kind: "symptom" },
    { id: "TP-1", partNumber: "ASM-VP-0142", label: "Turbo Pump", kind: "part" },
    { id: "GV-2", partNumber: null, label: "Gate Valve", kind: "part" },
    { id: "MFC-2", partNumber: null, label: "MFC-2", kind: "part" },
    { id: "GV-2-ORING", partNumber: null, label: "GV-2 O-ring", kind: "part" },
    { id: "TP-1-BEARING", partNumber: null, label: "TP-1 軸承", kind: "part" },
    { id: "PS-1", partNumber: null, label: "壓力計 PS-1", kind: "part" },
  ],
  edges: [
    // 物理層（靜態拓撲，Day-1 就有）
    {
      id: "edge-phy-tp1",
      from: "node-chamber-pressure",
      to: "TP-1",
      layer: "physical",
      weight: null,
      coOccurrences: null,
      confidence: "high",
      confirmed: true,
      scope: null,
    },
    {
      id: "edge-phy-gv2",
      from: "node-chamber-pressure",
      to: "GV-2",
      layer: "physical",
      weight: null,
      coOccurrences: null,
      confidence: "high",
      confirmed: true,
      scope: null,
    },
    {
      id: "edge-phy-mfc2",
      from: "node-chamber-pressure",
      to: "MFC-2",
      layer: "physical",
      weight: null,
      coOccurrences: null,
      confidence: "high",
      confirmed: true,
      scope: null,
    },
    // 經驗層（案例累積，本台優先、同型機兜底）
    {
      id: "edge-exp-gv2oring",
      from: "node-chamber-pressure",
      to: "GV-2-ORING",
      layer: "experience",
      weight: 0.92,
      coOccurrences: 5,
      confidence: "high",
      confirmed: true,
      scope: "this_tool",
    },
    {
      id: "edge-exp-tp1bearing",
      from: "node-chamber-pressure",
      to: "TP-1-BEARING",
      layer: "experience",
      weight: 0.48,
      coOccurrences: 2,
      confidence: "high",
      confirmed: true,
      scope: "tool_group",
    },
    {
      id: "edge-exp-ps1",
      from: "node-chamber-pressure",
      to: "PS-1",
      layer: "experience",
      weight: 0.15,
      coOccurrences: 1,
      confidence: "low",
      confirmed: false,
      scope: "this_tool",
    },
  ],
  candidates: [
    {
      nodeId: "GV-2-ORING",
      label: "GV-2 O-ring",
      source: "both",
      weight: 0.92,
      rationale: "物理上直連 chamber；歷史 5 次命中（本台 3 次、同型 2 次），確認率 100%",
    },
    {
      nodeId: "TP-1-BEARING",
      label: "TP-1 軸承",
      source: "both",
      weight: 0.48,
      rationale: "歷史 2 次（皆同型機，本台未發生），確認率 100%",
    },
    {
      nodeId: "MFC-2",
      label: "MFC-2",
      source: "physical",
      weight: 0.15,
      rationale: "物理上連著，但歷史從未成為根因——純骨架推理，信心低",
    },
  ],
};
