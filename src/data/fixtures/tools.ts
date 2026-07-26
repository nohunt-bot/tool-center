import type { Tool, ToolAttributes, ToolSummary } from "@/domain/tool";
import { LITHO02_CODE } from "@/data/fixtures/sections";

/**
 * 黃光二課（課代碼 LITHO02_CODE，顯示名「黃光二課」／"LITHO-02"）8 台機的
 * 一覽資料（mockup L494–565）。
 *
 * mockup 只給 SCN-A01 完整的機台屬性側欄（L641–654）；其餘機台一覽層
 * （brick + chamber + 7 日統計）齊全，屬性欄用同型機推得的合理最小值填，
 * 不是編出來的亂數（見 report「Open issues」）。
 *
 * R3：這裡原本還有一份 `sectionFixture`（單筆課別資料），跟
 * `@/data/fixtures/sections` 的 `sectionsFixture` 是同一份資料的第三個副本，
 * 已收斂掉——課別資料只在 sections.ts 那一份。
 */

const toolSummaries: readonly ToolSummary[] = [
  {
    id: "SCN-A01",
    sectionId: LITHO02_CODE,
    type: "Scanner",
    model: "XT-1900i",
    status: "DOWN",
    chambers: [
      { id: "EXP", status: "DOWN" },
      { id: "MA", status: "UP" },
    ],
    stats: { alarms7d: 2, mtbiHours: 82, note: null },
  },
  {
    id: "SCN-A02",
    sectionId: LITHO02_CODE,
    type: "Scanner",
    model: "XT-1900i",
    status: "LOST",
    chambers: [
      { id: "EXP", status: "LOST" },
      { id: "MA", status: "UP" },
    ],
    stats: { alarms7d: 11, mtbiHours: null, note: "FOCUS-DRIFT 7 成" },
  },
  {
    id: "SCN-A03",
    sectionId: LITHO02_CODE,
    type: "Scanner",
    model: "XT-1900i",
    status: "UP",
    chambers: [
      { id: "EXP", status: "UP" },
      { id: "MA", status: "WEQ" },
    ],
    stats: { alarms7d: 3, mtbiHours: 61, note: null },
  },
  {
    id: "TRK-B01",
    sectionId: LITHO02_CODE,
    type: "Track",
    model: "ACT12",
    status: "UP",
    chambers: [
      { id: "COT1", status: "UP" },
      { id: "COT2", status: "PM" },
      { id: "DEV1", status: "UP" },
      { id: "DEV2", status: "UP" },
    ],
    stats: { alarms7d: 4, mtbiHours: 48, note: null },
  },
  {
    id: "TRK-B02",
    sectionId: LITHO02_CODE,
    type: "Track",
    model: "ACT12",
    status: "PM",
    chambers: [
      { id: "COT1", status: "PM" },
      { id: "COT2", status: "PM" },
      { id: "DEV1", status: "OFF" },
    ],
    // mockup 只給「PM 中 · 待料」這行註記，沒有 7 日 alarm 數字——PM 中無新 alarm 是合理最小值
    stats: { alarms7d: 0, mtbiHours: null, note: "PM 中 · 待料" },
  },
  {
    id: "TRK-B03",
    sectionId: LITHO02_CODE,
    type: "Track",
    model: "ACT12",
    status: "LOST",
    chambers: [
      { id: "COT1", status: "LOST" },
      { id: "DEV1", status: "UP" },
    ],
    stats: { alarms7d: 8, mtbiHours: null, note: "PUMP-LOW 5 成" },
  },
  {
    id: "OVL-C01",
    sectionId: LITHO02_CODE,
    type: "Overlay",
    model: "KLA Archer",
    status: "WEQ",
    chambers: [{ id: "M1", status: "WEQ" }],
    stats: { alarms7d: 2, mtbiHours: 70, note: null },
  },
  {
    id: "CD-C02",
    sectionId: LITHO02_CODE,
    type: "CD-SEM",
    model: "CG5000",
    status: "OFF",
    chambers: [{ id: "M1", status: "OFF" }],
    stats: { alarms7d: 0, mtbiHours: null, note: null },
  },
];

/** SCN-A01 機台屬性側欄——mockup 唯一給全的一份（L642–653） */
const scnA01Attributes: ToolAttributes = {
  toolType: "Scanner",
  toolGroup: "LITHO-SCN",
  vendor: "ASML",
  model: "XT-1900i",
  fab: "Fab1",
  ip: "10.32.4.101",
  fdcMode: "Online-Full",
  tapVer: "v3.2.1",
  tcsVer: "v5.0.4",
  ownerPe: "陳PE",
  ownerEe: "林EE",
  sponsor: "老李",
};

/**
 * 其餘機台沒有 mockup 側欄可對——用同型機推得的最小合理值填，
 * 不是這批 fixtures 的權威資料（見報告 Open issues）。
 */
function minimalAttributes(summary: ToolSummary, ip: string): ToolAttributes {
  const groupByType: Record<string, string> = {
    Scanner: "LITHO-SCN",
    Track: "LITHO-TRK",
    Overlay: "LITHO-OVL",
    "CD-SEM": "LITHO-CD",
  };
  const vendorByType: Record<string, string> = {
    Scanner: "ASML",
    Track: "Tokyo Electron",
    Overlay: "KLA",
    "CD-SEM": "Hitachi",
  };
  return {
    toolType: summary.type,
    toolGroup: groupByType[summary.type] ?? summary.type,
    vendor: vendorByType[summary.type] ?? "未知",
    model: summary.model,
    fab: "Fab1",
    ip,
    fdcMode: "Online-Full",
    tapVer: "v3.2.1",
    tcsVer: "v5.0.4",
    ownerPe: "陳PE",
    ownerEe: "林EE",
    sponsor: "老李",
  };
}

const attributesByToolId: Readonly<Record<string, ToolAttributes>> = {
  "SCN-A01": scnA01Attributes,
  "SCN-A02": minimalAttributes(toolSummaries[1]!, "10.32.4.102"),
  "SCN-A03": minimalAttributes(toolSummaries[2]!, "10.32.4.103"),
  "TRK-B01": minimalAttributes(toolSummaries[3]!, "10.32.4.111"),
  "TRK-B02": minimalAttributes(toolSummaries[4]!, "10.32.4.112"),
  "TRK-B03": minimalAttributes(toolSummaries[5]!, "10.32.4.113"),
  "OVL-C01": minimalAttributes(toolSummaries[6]!, "10.32.4.121"),
  "CD-C02": minimalAttributes(toolSummaries[7]!, "10.32.4.122"),
};

export function listToolSummariesFixture(sectionId: string): readonly ToolSummary[] {
  return toolSummaries.filter((tool) => tool.sectionId === sectionId);
}

/** 未知機台丟明確錯誤——不要默默回傳假機台（spec §4） */
export function getToolFixture(sectionId: string, toolId: string): Tool {
  const summary = toolSummaries.find((tool) => tool.id === toolId && tool.sectionId === sectionId);
  const attributes = attributesByToolId[toolId];
  if (!summary || !attributes) {
    throw new Error(`fixtures: unknown tool "${toolId}" in section "${sectionId}"`);
  }
  return { ...summary, attributes };
}
