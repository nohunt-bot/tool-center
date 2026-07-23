/**
 * A0 階段的導覽用假資料——**A1.4 會被 src/data/fixtures/ 取代**。
 *
 * 只放讓 shell 能運作的最小集合（課別清單、機台清單），
 * 形狀刻意保持簡單，不要在這裡長出 domain 型別——那是 A1.1 的事。
 */

import type { ToolStatus } from "@/lib/status";

export const DEFAULT_SECTION_ID = "LITHO-02";

export type NavSection = {
  readonly id: string;
  readonly name: string;
  /** 使用者有無此課別的進入權（跨課需支援權限，mockup L463–466） */
  readonly accessible: boolean;
};

export const NAV_SECTIONS: readonly NavSection[] = [
  { id: "LITHO-02", name: "黃光二課", accessible: true },
  { id: "LITHO-01", name: "黃光一課", accessible: false },
  { id: "ETCH-01", name: "蝕刻一課", accessible: false },
];

export type NavTool = {
  readonly id: string;
  readonly type: string;
  readonly status: ToolStatus;
};

export const NAV_TOOLS: readonly NavTool[] = [
  { id: "SCN-A01", type: "Scanner", status: "DOWN" },
  { id: "SCN-A02", type: "Scanner", status: "LOST" },
  { id: "SCN-A03", type: "Scanner", status: "UP" },
  { id: "TRK-B01", type: "Track", status: "UP" },
  { id: "TRK-B02", type: "Track", status: "PM" },
  { id: "TRK-B03", type: "Track", status: "LOST" },
  { id: "OVL-C01", type: "Overlay", status: "WEQ" },
  { id: "CD-C02", type: "CD-SEM", status: "OFF" },
];

export const TOOL_MODES = ["live", "history", "diagnosis"] as const;
export type ToolMode = (typeof TOOL_MODES)[number];

export const TOOL_MODE_LABEL: Readonly<Record<ToolMode, string>> = {
  live: "當機處理",
  history: "病史分析",
  diagnosis: "深度診斷",
};

export function isToolMode(value: string): value is ToolMode {
  return (TOOL_MODES as readonly string[]).includes(value);
}
