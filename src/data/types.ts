import type { ChronicFlag, ErrorCase, PinnedCard, ToolCommand, ToolFile } from "@/domain/case";
import type { TChartAnalysis, UChartAnalysis } from "@/domain/fdc";
import type { GraphQueryResult } from "@/domain/graph";
import type { SectionSettings } from "@/domain/settings";
import type { CrossDiagnosis, SpatialAnalysis, SpatialIndicator } from "@/domain/spatial";
import type { Section, Tool, ToolSummary } from "@/domain/tool";
import type { Grant, SectionId, User } from "@/domain/user";

/**
 * ★ Stage A（fixtures）與 Stage B（既有 API）的唯一接縫。
 *
 * Stage A 由 src/data/fixtures 實作，Stage B 換成 src/data/upstream，
 * **feature 層一行都不用改**。這條線斷了，Stage A 就是拋棄式工作（task D2）。
 *
 * 兩個設計約束：
 * 1. 每個查詢都帶課別識別碼——權限判定不帶 section 就是 bug（permission-matrix）。
 * 2. 回傳值一律是已驗證過 schema 的 domain 型別，不是原始 API 回應。
 *    型別轉換（既有 API 的形狀 → domain 型別）屬於 upstream 實作的責任。
 *
 * 命名選擇（R2）：這裡凡是課別參數一律叫 `sectionCode`，不叫 `sectionId`。
 * `SectionId`（domain/user.ts）這個型別名稱是既有命名，不在這波改動範圍內，
 * 但 `DataSource` 是 fixtures／upstream 共用的邊界契約，往內一律只有課代碼
 * （不是課名）這件事，值得在契約本身的參數名上直接說出來，不只是靠註解——
 * 呼叫端看到 `sectionCode: SectionId` 就知道要傳代碼、不是課名，不用回頭查
 * SectionId 的 JSDoc。全檔一致：下面四個方法都用這個名字。
 */
export type DataSource = {
  // ── 使用者與權限 ──────────────────────────────────────────
  getCurrentUser(): Promise<User>;
  listSections(): Promise<readonly Section[]>;
  listGrants(sectionCode: SectionId): Promise<readonly Grant[]>;

  // ── 機台 ──────────────────────────────────────────────────
  listTools(sectionCode: SectionId): Promise<readonly ToolSummary[]>;
  getTool(sectionCode: SectionId, toolId: string): Promise<Tool>;

  // ── 當機處理 ──────────────────────────────────────────────
  listToolCommands(toolId: string): Promise<readonly ToolCommand[]>;
  listErrorCases(toolId: string): Promise<readonly ErrorCase[]>;
  /** rule base：同 code 90 天 ≥3 次。零 LLM。 */
  listChronicFlags(toolId: string): Promise<readonly ChronicFlag[]>;
  listToolFiles(toolId: string): Promise<readonly ToolFile[]>;

  // ── 病史分析 ──────────────────────────────────────────────
  listPinnedCards(toolId: string): Promise<readonly PinnedCard[]>;

  // ── FDC ───────────────────────────────────────────────────
  getUChartAnalysis(toolId: string, caseId: string): Promise<UChartAnalysis>;
  /**
   * @param options.resolution 顯示解析度。1kHz 單片約 4 萬點，一律降採樣後回傳；
   *   異常點由 ML kernel 獨立產出，不受降採樣影響（task D7）。
   */
  getTChartAnalysis(
    toolId: string,
    caseId: string,
    options: { readonly waferId?: string; readonly resolution?: number },
  ): Promise<TChartAnalysis>;

  // ── 深度診斷 ──────────────────────────────────────────────
  getSpatialAnalysis(toolId: string, indicator: SpatialIndicator): Promise<SpatialAnalysis>;
  /** ML 後端產出，前端純渲染（task D6） */
  getCrossDiagnosis(toolId: string): Promise<CrossDiagnosis>;

  // ── 關聯圖 ────────────────────────────────────────────────
  queryGraph(toolId: string, symptom: string): Promise<GraphQueryResult>;

  // ── 課別設定 ──────────────────────────────────────────────
  getSectionSettings(sectionCode: SectionId): Promise<SectionSettings>;
};

/** Stage A 的實作是否為假資料——用於畫面上的誠實標示（A1.6） */
export type DataSourceMeta = {
  readonly kind: "fixtures" | "upstream";
  readonly note: string;
};
