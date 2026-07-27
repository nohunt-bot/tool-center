import { ToolNotFoundError, type DataSource, type DataSourceMeta } from "@/data/types";
import { resolveSectionCode } from "@/data/section-ref";
import {
  chronicFlagsFixture,
  errorCasesFixture,
  pinnedCardsFixture,
  toolCommandsFixture,
  toolFilesFixture,
} from "@/data/fixtures/cases";
import { uChartAnalysisFixture, tChartAnalysisFixture } from "@/data/fixtures/fdc";
import { graphQueryResultFixture } from "@/data/fixtures/graph";
import { LITHO02_CODE, sectionsFixture } from "@/data/fixtures/sections";
import { sectionSettingsFixture } from "@/data/fixtures/settings";
import { crossDiagnosisFixture, spatialAnalysesFixture } from "@/data/fixtures/spatial";
import {
  findToolSectionFixture,
  getToolFixture,
  listToolSummariesFixture,
} from "@/data/fixtures/tools";
import { currentUserFixture, grantsFixture } from "@/data/fixtures/users";

export { sectionsFixture } from "@/data/fixtures/sections";

/**
 * Stage A 的 DataSource 實作：全部資料來自 mockup（urd/tool-center-gui.html）整理出的
 * fixtures，不打任何真實 API。畫面上任何用到這個 source 的地方都要標示「假資料」（A1.6）。
 *
 * 完整資料只覆蓋 SCN-A01 · case FOCUS-DRIFT-011——其餘機台只有一覽層（spec §4）。
 */
export const fixturesDataSource: DataSource = {
  getCurrentUser() {
    // R2 正規化點：使用者記錄裡的課別參照 → 課代碼，只在這裡（DataSource
    // 邊界）做一次。這批 fixtures 的 currentUserFixture 本來就直接存代碼，
    // 所以下面全部走 resolveSectionCode() 的直通分支，行為不變——但位置與
    // 轉換時機先立好，Stage B 接真實 API 時，不管上游回的是課代碼還是課名，
    // 轉換都發生在這一行，不會擴散到元件或頁面裡。見 @/data/section-ref。
    return Promise.resolve({
      ...currentUserFixture,
      sectionId: resolveSectionCode(currentUserFixture.sectionId, sectionsFixture),
      managerOf: currentUserFixture.managerOf.map((ref) => resolveSectionCode(ref, sectionsFixture)),
      supportSections: currentUserFixture.supportSections.map((ref) =>
        resolveSectionCode(ref, sectionsFixture),
      ),
    });
  },
  listSections() {
    return Promise.resolve(sectionsFixture);
  },
  listGrants(sectionCode) {
    // M2：跟 getCurrentUser() 一樣在 DataSource 邊界做正規化。section-ref.ts
    // 的 docstring 本來就把 Grant.sectionId 列進適用範圍，這裡補上實作，
    // 不然 Stage B 若上游 grant 回課名，這個 filter 會靜默回傳空陣列——
    // 使用者的支援授權無聲消失（權限降級，卻不報錯），比丟例外更危險。
    return Promise.resolve(
      grantsFixture.filter(
        (grant) => resolveSectionCode(grant.sectionId, sectionsFixture) === sectionCode,
      ),
    );
  },

  listTools(sectionCode) {
    return Promise.resolve(listToolSummariesFixture(sectionCode));
  },
  // P1 對齊：宣告成 async——getToolFixture() 查無機台時是同步 throw，
  // 若這裡寫成 `return Promise.resolve(getToolFixture(...))`，那個 throw
  // 會發生在 Promise.resolve() 的參數求值階段，也就是「同步」丟出例外
  // （呼叫端就算包 .then/.catch 也接不到，得用 try/catch 才接得住），
  // 跟 `getToolSection` 底下「reject 一個 rejected promise」的風格不一致。
  // 宣告成 async function 後，函式內任何同步 throw 都會被自動包成 rejected
  // promise，呼叫端不管走 await/.catch 都能一致地接住失敗——不用去猜某個
  // DataSource 方法的失敗是「同步丟」還是「非同步 reject」。
  async getTool(sectionCode, toolId) {
    return getToolFixture(sectionCode, toolId);
  },
  getToolSection(toolId) {
    const sectionCode = findToolSectionFixture(toolId);
    if (sectionCode === undefined) {
      return Promise.reject(new ToolNotFoundError(toolId));
    }
    return Promise.resolve(sectionCode);
  },

  listToolCommands(toolId) {
    if (toolId !== "SCN-A01") return Promise.resolve([]);
    return Promise.resolve(toolCommandsFixture);
  },
  listErrorCases(toolId) {
    if (toolId !== "SCN-A01") return Promise.resolve([]);
    return Promise.resolve(errorCasesFixture);
  },
  listChronicFlags(toolId) {
    if (toolId !== "SCN-A01") return Promise.resolve([]);
    return Promise.resolve(chronicFlagsFixture);
  },
  listToolFiles(toolId) {
    if (toolId !== "SCN-A01") return Promise.resolve([]);
    return Promise.resolve(toolFilesFixture);
  },

  listPinnedCards(toolId) {
    if (toolId !== "SCN-A01") return Promise.resolve([]);
    return Promise.resolve(pinnedCardsFixture);
  },

  getUChartAnalysis(toolId, caseId) {
    if (toolId !== "SCN-A01" || caseId !== "FOCUS-DRIFT-011") {
      return Promise.reject(
        new Error(`fixtures: no u chart analysis for tool "${toolId}" case "${caseId}"`),
      );
    }
    return Promise.resolve(uChartAnalysisFixture);
  },
  getTChartAnalysis(toolId, caseId) {
    if (toolId !== "SCN-A01" || caseId !== "FOCUS-DRIFT-011") {
      return Promise.reject(
        new Error(`fixtures: no t chart analysis for tool "${toolId}" case "${caseId}"`),
      );
    }
    // waferId/resolution 只是顯示解析度參數；fixtures 一律回傳同一份已生成的波形。
    return Promise.resolve(tChartAnalysisFixture);
  },

  getSpatialAnalysis(toolId, indicator) {
    if (toolId !== "SCN-A01") {
      return Promise.reject(new Error(`fixtures: no spatial analysis for tool "${toolId}"`));
    }
    const analysis = spatialAnalysesFixture[indicator];
    if (!analysis) {
      return Promise.reject(new Error(`fixtures: unknown spatial indicator "${indicator}"`));
    }
    return Promise.resolve(analysis);
  },
  getCrossDiagnosis(toolId) {
    if (toolId !== "SCN-A01") {
      return Promise.reject(new Error(`fixtures: no cross diagnosis for tool "${toolId}"`));
    }
    return Promise.resolve(crossDiagnosisFixture);
  },

  queryGraph(toolId) {
    if (toolId !== "SCN-A01") {
      return Promise.reject(new Error(`fixtures: no graph query result for tool "${toolId}"`));
    }
    // symptom 是查詢字串（如「chamber pressure 異常」）；fixtures 一律回傳同一份查詢結果。
    return Promise.resolve(graphQueryResultFixture);
  },

  getSectionSettings(sectionCode) {
    if (sectionCode !== LITHO02_CODE) {
      return Promise.reject(new Error(`fixtures: no section settings for "${sectionCode}"`));
    }
    return Promise.resolve(sectionSettingsFixture);
  },
};

export const fixturesMeta: DataSourceMeta = {
  kind: "fixtures",
  note: "Stage A 假資料：整理自 urd/tool-center-gui.html mockup，僅供 UI 開發與驗收，非真實機台資料。",
};
