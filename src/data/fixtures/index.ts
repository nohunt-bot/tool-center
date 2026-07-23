import type { DataSource, DataSourceMeta } from "@/data/types";
import {
  chronicFlagsFixture,
  errorCasesFixture,
  pinnedCardsFixture,
  toolCommandsFixture,
  toolFilesFixture,
} from "@/data/fixtures/cases";
import { uChartAnalysisFixture, tChartAnalysisFixture } from "@/data/fixtures/fdc";
import { graphQueryResultFixture } from "@/data/fixtures/graph";
import { sectionSettingsFixture } from "@/data/fixtures/settings";
import { crossDiagnosisFixture, spatialAnalysesFixture } from "@/data/fixtures/spatial";
import { getToolFixture, listToolSummariesFixture } from "@/data/fixtures/tools";
import { currentUserFixture, grantsFixture, sectionsFixture } from "@/data/fixtures/users";

/**
 * Stage A 的 DataSource 實作：全部資料來自 mockup（urd/tool-center-gui.html）整理出的
 * fixtures，不打任何真實 API。畫面上任何用到這個 source 的地方都要標示「假資料」（A1.6）。
 *
 * 完整資料只覆蓋 SCN-A01 · case FOCUS-DRIFT-011——其餘機台只有一覽層（spec §4）。
 */
export const fixturesDataSource: DataSource = {
  getCurrentUser() {
    return Promise.resolve(currentUserFixture);
  },
  listSections() {
    return Promise.resolve(sectionsFixture);
  },
  listGrants(sectionId) {
    return Promise.resolve(grantsFixture.filter((grant) => grant.sectionId === sectionId));
  },

  listTools(sectionId) {
    return Promise.resolve(listToolSummariesFixture(sectionId));
  },
  getTool(sectionId, toolId) {
    return Promise.resolve(getToolFixture(sectionId, toolId));
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

  getSectionSettings(sectionId) {
    if (sectionId !== "LITHO-02") {
      return Promise.reject(new Error(`fixtures: no section settings for "${sectionId}"`));
    }
    return Promise.resolve(sectionSettingsFixture);
  },
};

export const fixturesMeta: DataSourceMeta = {
  kind: "fixtures",
  note: "Stage A 假資料：整理自 urd/tool-center-gui.html mockup，僅供 UI 開發與驗收，非真實機台資料。",
};
