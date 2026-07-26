/**
 * A0 階段的導覽用假資料的殘留部分——**A1.4 已把機台清單搬到 src/data/fixtures/**。
 *
 * R3：這裡原本還有一份獨立的機台清單常數（8 筆），跟
 * `@/data/fixtures/tools` 的機台 fixture id／type／status 8/8 完全相同，是
 * A1.7 遺留的重複資料，已收斂掉——機台清單改走
 * `listToolSummariesFixture(sectionCode)`（見 control-bar.tsx）。
 * `DEFAULT_SECTION_ID` 原本是課名（"LITHO-02"），現在改成課代碼——課代碼是
 * 唯一識別碼，用於 URL 與權限鍵，課名不能拿來當識別碼用。
 *
 * 剩下的 TOOL_MODES／isToolMode 是純型別與純函式，不含任何使用者可見的
 * 中文，沒有搬去 src/data/fixtures/ 的理由，留在這裡。
 */

import { LITHO02_CODE } from "@/data/fixtures/sections";

export const DEFAULT_SECTION_ID = LITHO02_CODE;

export const TOOL_MODES = ["live", "history", "diagnosis"] as const;
export type ToolMode = (typeof TOOL_MODES)[number];

export function isToolMode(value: string): value is ToolMode {
  return (TOOL_MODES as readonly string[]).includes(value);
}
