import type { Tool, ToolAttributes, ToolSummary } from "@/domain/tool";
import { ETCH01_CODE, LITHO02_CODE } from "@/data/fixtures/sections";

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
 *
 * P2(a)：下面 8 台都屬於 LITHO02_CODE，跨課情境（`getToolSection` 反查、
 * `SectionShell` 的權限 gating）在此之前連單元測試都構造不出來——這批
 * fixtures 全部只有一個課別，reviewer 是暫時改 fixture 才驗到跨課行為。
 * 補上 `ETC-D01`（屬 `ETCH01_CODE`，不是任務描述當例子提到的 `SEC-1001` /
 * `LITHO01_CODE`）讓跨課情境可以直接在單元測試裡構造：選 `ETCH01_CODE`
 * 是因為 `control-bar.test.tsx` 既有一條測試明確依賴「`LITHO01_CODE`
 * 目前沒有任何機台」這個事實（測「換一個沒有機台的課別，下拉不會殘留另一課
 * 的機台」）——塞一台機台進 `LITHO01_CODE` 會讓那條測試的前提整個變質。
 * `ETCH01_CODE` 沒有任何既有測試依賴它「沒有機台」，用它當跨課機台的家
 * 不會破壞任何既有斷言的意圖。
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
  /**
   * 唯一屬於別課（ETCH01_CODE，蝕刻一課）的機台——mockup 沒有這台，是這一輪
   * 為了讓跨課情境（`getToolSection` 反查、`SectionShell` 權限 gating）可以
   * 在單元測試裡構造出來而新增的（見上方檔案開頭的 P2(a) 說明），不是從
   * mockup 對出來的資料，屬性欄同樣走 `minimalAttributes()` 合理最小值填。
   */
  {
    id: "ETC-D01",
    sectionId: ETCH01_CODE,
    type: "Etcher",
    model: "Centris",
    status: "UP",
    chambers: [{ id: "M1", status: "UP" }],
    stats: { alarms7d: 1, mtbiHours: 96, note: null },
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
  "ETC-D01": minimalAttributes(toolSummaries[8]!, "10.32.4.201"),
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

/**
 * R5：由 toolId 反查所屬課代碼，不帶 sectionId 參數——機台子樹的 URL
 * （`/tool/<tid>`）本來就沒有課別段可傳，這裡是唯一合法的反查路徑。
 * `toolSummaries` 本身是全域機台清單（不分課別），`id` 在其中唯一，
 * 直接找就是權威答案，不需要呼叫端先猜一個 sectionId 再驗證。
 */
export function findToolSectionFixture(toolId: string): string | undefined {
  return toolSummaries.find((tool) => tool.id === toolId)?.sectionId;
}
