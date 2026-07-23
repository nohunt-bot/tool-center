import { z } from "zod";

/**
 * 維修關聯圖：**兩層分離**（產品紅線 #7，mockup L987–990）。
 *
 * 物理層 = 機台架構，Day-1 就有，同型機可移植。
 * 經驗層 = 歷史案例長出來的，越用越準，**不移植**（每台的老毛病不一樣）。
 *
 * 不混在一起的理由：使用者要知道候選零件是「物理上連著」還是「歷史上一起壞過」——
 * 連著不代表會壞（mockup L1083）。
 */

export const GRAPH_LAYERS = ["physical", "experience"] as const;
export const graphLayerSchema = z.enum(GRAPH_LAYERS);
export type GraphLayer = z.infer<typeof graphLayerSchema>;

export const GRAPH_NODE_KINDS = ["part", "symptom", "sop"] as const;

export const graphNodeSchema = z.object({
  /** 節點粒度 = 換件料號（mockup L1108）。以料號主檔為權威來源（task D8）。 */
  id: z.string().min(1),
  partNumber: z.string().nullable(),
  label: z.string().min(1),
  kind: z.enum(GRAPH_NODE_KINDS),
});
export type GraphNode = z.infer<typeof graphNodeSchema>;

export const graphEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  layer: graphLayerSchema,
  /** 經驗邊才有：共現次數 × 確認率 */
  weight: z.number().min(0).max(1).nullable(),
  coOccurrences: z.number().int().nonnegative().nullable(),
  /** 建圖時 Agent 的信心；low 畫虛線待人確認（mockup L1099） */
  confidence: z.enum(["high", "low"]),
  confirmed: z.boolean(),
  /** 經驗邊的來源：本台 or 同型機。本台優先（mockup L1082） */
  scope: z.enum(["this_tool", "tool_group"]).nullable(),
});
export type GraphEdge = z.infer<typeof graphEdgeSchema>;

/**
 * 查詢結果的候選零件。
 * 排序規則：本台經驗 > 同型機經驗 > 純物理連接。
 * 「僅物理」永遠排最後——那是骨架推理，不是經驗。
 */
export const CANDIDATE_SOURCES = ["physical", "experience", "both"] as const;

export const candidateSchema = z.object({
  nodeId: z.string().min(1),
  label: z.string().min(1),
  source: z.enum(CANDIDATE_SOURCES),
  /** 0–1，用於排序與權重條寬度 */
  weight: z.number().min(0).max(1),
  rationale: z.string().min(1),
});
export type Candidate = z.infer<typeof candidateSchema>;

export const graphQueryResultSchema = z.object({
  originNodeId: z.string().min(1),
  originLabel: z.string().min(1),
  nodes: z.array(graphNodeSchema).readonly(),
  edges: z.array(graphEdgeSchema).readonly(),
  candidates: z.array(candidateSchema).readonly(),
});
export type GraphQueryResult = z.infer<typeof graphQueryResultSchema>;
