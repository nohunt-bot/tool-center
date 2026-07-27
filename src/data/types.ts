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
  /**
   * 債（P5b，Stage B 才處理，這裡先記）：機台頁若要同時要完整 `Tool`（含
   * `attributes`）與課別代碼，目前得先 `getToolSection(tid)` 反查課代碼，
   * 再拿著課代碼呼叫 `getTool(sectionCode, toolId)`——對上游是兩次往返。
   * `getTool` 的 `sectionCode` 參數在新路由（R5：`/tool/<tid>` 不帶課別段）
   * 下已經可以由 `toolId` 單獨推得，這個參數存在的理由已經消失，但**這一波
   * 不改 `getTool` 簽名**（範圍外）；Stage B 實作 upstream DataSource 時，
   * 應評估是否讓 `getTool` 也改成只吃 `toolId`（內部自己反查課別），把兩次
   * 往返收斂成一次。
   */
  listTools(sectionCode: SectionId): Promise<readonly ToolSummary[]>;
  getTool(sectionCode: SectionId, toolId: string): Promise<Tool>;
  /**
   * 由 toolId 反查所屬課別代碼（R5：機台子樹 `/tool/<tid>` 不帶課別段，
   * URL 上沒有 sectionCode 可用，sectionCode 一律由這裡反查，不能從呼叫端
   * 隨意帶一個 sectionCode 進來配對——這正是 0002 決策記錄裡「sid/tid
   * 任意配對造成權限升級」那個結構性漏洞要拔除的路徑）。
   *
   * 查無此機台時 reject 一個 `ToolNotFoundError`（本檔下方定義）——這是
   * 呼叫端（`tool/[tid]/layout.tsx`）唯一該轉成 `notFound()` 的失敗形態。
   * 任何其他 rejection（上游逾時、5xx、網路中斷……）都**不是**
   * `ToolNotFoundError`，呼叫端必須讓它繼續往上拋，不能被籠統的
   * `.catch()` 一併吞成「機台不存在」——否則維運會把真正的服務失敗誤讀成
   * 使用者輸入了錯的機台代碼。
   */
  getToolSection(toolId: string): Promise<SectionId>;

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

/**
 * `getToolSection()` 查無此機台時的專屬錯誤型別（P1）。
 *
 * 唯一目的：讓呼叫端能可靠分辨「查無此機台」與其他任何失敗（上游逾時、
 * 5xx、網路中斷……）——只有這個錯誤該被轉成 `notFound()`，其餘一律往上拋，
 * 不能用籠統的 `.catch(() => undefined)` 把所有失敗都壓成 404。
 * fixtures／upstream 兩種 `DataSource` 實作都必須遵守：查無此機台 reject
 * 這個型別的 instance，其他失敗 reject 別的錯誤（不是這個型別）。
 *
 * **風險記錄：`instanceof` 判斷跨打包邊界會失效。**
 * `tool/[tid]/layout.tsx` 用 `error instanceof ToolNotFoundError` 判斷
 * （見該檔 P1 修復的說明）。這在目前的架構下成立，因為 throw 端（Stage A
 * 是這裡的 fixtures 實作，Stage B 會是 `src/data/upstream/`）與 catch 端
 * （`tool/[tid]/layout.tsx`）同屬同一個 Next 編譯單元——`ToolNotFoundError`
 * 這個 class 在執行期只有一份，`instanceof` 比對的是同一個 constructor。
 *
 * 若 Stage B 把 upstream 實作搬到獨立 package（例如獨立發布、透過
 * `node_modules` 或 workspace 依賴引入，而非直接放在這個 Next app 的
 * `src/` 底下），這個 class 有可能被兩個不同的模組打包/解析路徑各自
 * resolve 一份，變成兩個不同的 constructor——這種情況下即使錯誤物件
 * 「看起來」是同一個型別，`instanceof` 也會回傳 `false`。
 *
 * 失效的方向：`instanceof` 判 false 時，`tool/[tid]/layout.tsx` 的
 * catch block 會把它當成「不是查無此機台」的一般錯誤往上拋，最終呈現
 * Next 的 500 頁——**退化成 500，不是退化回全部 404**，因此原本該有的
 * 「機台不存在」語意會消失，但不會反過來把所有請求誤判成成功或誤判成
 * 404。這是相對安全的失效模式（不會偽裝成別的、更容易誤判的狀態），
 * 但仍然是行為改變，Stage B 搬遷 upstream 實作時必須連帶檢查這裡是否
 * 還在同一個打包邊界內；若不在，需要換一種跨邊界穩定的判斷方式
 * （例如比對 `error.name === "ToolNotFoundError"` 這種資料而非
 * class identity，或改用 discriminated union 而非 class）。
 */
export class ToolNotFoundError extends Error {
  constructor(readonly toolId: string) {
    super(`unknown tool "${toolId}"`);
    this.name = "ToolNotFoundError";
  }
}
