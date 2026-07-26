import { describe, expect, it } from "vitest";
import {
  chronicFlagSchema,
  errorCaseSchema,
  pinnedCardSchema,
  toolCommandSchema,
  toolFileSchema,
} from "@/domain/case";
import {
  chronicFlagsFixture,
  errorCasesFixture,
  pinnedCardsFixture,
  toolCommandsFixture,
  toolFilesFixture,
} from "@/data/fixtures/cases";
import { tChartAnalysisSchema, uChartAnalysisSchema } from "@/domain/fdc";
import { tChartAnalysisFixture, uChartAnalysisFixture } from "@/data/fixtures/fdc";
import { graphQueryResultSchema } from "@/domain/graph";
import { graphQueryResultFixture } from "@/data/fixtures/graph";
import { sectionSettingsSchema } from "@/domain/settings";
import { sectionSettingsFixture } from "@/data/fixtures/settings";
import { CHRONIC_DEFINITION } from "@/domain/taxonomy";
import { crossDiagnosisSchema, spatialAnalysisSchema } from "@/domain/spatial";
import { crossDiagnosisFixture, spatialAnalysesFixture } from "@/data/fixtures/spatial";
import { sectionSchema, toolSchema, toolSummarySchema } from "@/domain/tool";
import { LITHO02_CODE, sectionsFixture } from "@/data/fixtures/sections";
import { getToolFixture, listToolSummariesFixture } from "@/data/fixtures/tools";
import { grantSchema, userSchema } from "@/domain/user";
import { currentUserFixture, grantsFixture } from "@/data/fixtures/users";

/**
 * 這個測試就是「fixtures 真的符合型別」的證明——
 * 每個 fixture 都要能通過對應 domain 型別的 zod schema `.parse()`。
 */

const KNOWN_TOOL_IDS = [
  "SCN-A01",
  "SCN-A02",
  "SCN-A03",
  "TRK-B01",
  "TRK-B02",
  "TRK-B03",
  "OVL-C01",
  "CD-C02",
] as const;

describe("fixtures：使用者與課別", () => {
  it("currentUserFixture 符合 userSchema", () => {
    expect(() => userSchema.parse(currentUserFixture)).not.toThrow();
  });

  // R3：課別 fixture 收斂成 @/data/fixtures/sections 的唯一一份之後，這裡補上
  // 原本缺的 .parse() 逐筆驗證（K3）——收斂之前有兩份（nav.ts／users.ts）
  // 各自需要手動同步的重複，現在只剩一份，不需要「兩份同步」測試。
  it("sectionsFixture 每一筆都符合 sectionSchema", () => {
    expect(sectionsFixture.length).toBeGreaterThan(0);
    for (const section of sectionsFixture) {
      expect(() => sectionSchema.parse(section)).not.toThrow();
    }
  });

  it("sectionsFixture 的 code 各自唯一（課代碼是識別碼，不能重複）", () => {
    const codes = sectionsFixture.map((section) => section.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("grantsFixture 每一筆都符合 grantSchema", () => {
    for (const grant of grantsFixture) {
      expect(() => grantSchema.parse(grant)).not.toThrow();
    }
  });
});

describe("fixtures：機台", () => {
  it("黃光二課（LITHO02_CODE）的 8 台機一覽資料都符合 toolSummarySchema", () => {
    const summaries = listToolSummariesFixture(LITHO02_CODE);
    expect(summaries).toHaveLength(8);
    for (const summary of summaries) {
      expect(() => toolSummarySchema.parse(summary)).not.toThrow();
    }
  });

  it("每台已知機台的完整資料都符合 toolSchema", () => {
    for (const toolId of KNOWN_TOOL_IDS) {
      const tool = getToolFixture(LITHO02_CODE, toolId);
      expect(() => toolSchema.parse(tool)).not.toThrow();
    }
  });

  it("未知機台 id 丟明確錯誤", () => {
    expect(() => getToolFixture(LITHO02_CODE, "NO-SUCH-TOOL")).toThrow();
  });
});

describe("fixtures：當機處理 + 病史分析（SCN-A01）", () => {
  it("toolCommandsFixture 每一筆都符合 toolCommandSchema", () => {
    for (const cmd of toolCommandsFixture) {
      expect(() => toolCommandSchema.parse(cmd)).not.toThrow();
    }
  });

  it("errorCasesFixture 每一筆都符合 errorCaseSchema", () => {
    for (const errorCase of errorCasesFixture) {
      expect(() => errorCaseSchema.parse(errorCase)).not.toThrow();
    }
  });

  it("chronicFlagsFixture 每一筆都符合 chronicFlagSchema", () => {
    for (const flag of chronicFlagsFixture) {
      expect(() => chronicFlagSchema.parse(flag)).not.toThrow();
    }
  });

  it("toolFilesFixture 每一筆都符合 toolFileSchema", () => {
    for (const file of toolFilesFixture) {
      expect(() => toolFileSchema.parse(file)).not.toThrow();
    }
  });

  it("pinnedCardsFixture 每一筆都符合 pinnedCardSchema", () => {
    for (const card of pinnedCardsFixture) {
      expect(() => pinnedCardSchema.parse(card)).not.toThrow();
    }
  });

  it("錯誤案例的 case id 與 FDC fixtures 的 caseId 一致（跨檔案錨點）", () => {
    const focusDrift = errorCasesFixture.find((c) => c.id === "FOCUS-DRIFT-011");
    expect(focusDrift).toBeDefined();
    expect(uChartAnalysisFixture.caseId).toBe("FOCUS-DRIFT-011");
    expect(tChartAnalysisFixture.caseId).toBe("FOCUS-DRIFT-011");
  });

  it("chronicFlag 的 status 與 occurrences 次數一致：chronic ⟺ 次數達 CHRONIC_DEFINITION.minOccurrences", () => {
    for (const flag of chronicFlagsFixture) {
      const isChronic = flag.occurrences.length >= CHRONIC_DEFINITION.minOccurrences;
      expect(flag.status === "chronic").toBe(isChronic);
    }
  });

  it("每個 pinnedCard 的 caseId 都指向一個存在的 errorCase（referential integrity）", () => {
    const knownCaseIds = new Set(errorCasesFixture.map((c) => c.id));
    for (const card of pinnedCardsFixture) {
      expect(knownCaseIds.has(card.caseId)).toBe(true);
    }
  });
});

describe("fixtures：FDC（SCN-A01 · FOCUS-DRIFT-011）", () => {
  it("uChartAnalysisFixture 符合 uChartAnalysisSchema", () => {
    expect(() => uChartAnalysisSchema.parse(uChartAnalysisFixture)).not.toThrow();
  });

  it("u chart 四段依序為 STABLE → MEAN_SHIFT → MULTI_PEAK → TRENDING（時序 × 分布兩個正交維度）", () => {
    const pairs = uChartAnalysisFixture.segments.map((s) => `${s.timePattern}/${s.distPattern}`);
    expect(pairs).toEqual([
      "STABLE/SINGLE_PEAK",
      "MEAN_SHIFT/SINGLE_PEAK",
      "STABLE/MULTI_PEAK",
      "TRENDING/SKEWED",
    ]);
  });

  it("tChartAnalysisFixture 符合 tChartAnalysisSchema", () => {
    expect(() => tChartAnalysisSchema.parse(tChartAnalysisFixture)).not.toThrow();
  });

  it("t chart rawSampleCount 約為 1kHz × 42s，samples 已降採樣", () => {
    expect(tChartAnalysisFixture.rawSampleCount).toBe(42000);
    expect(tChartAnalysisFixture.samples.length).toBeLessThan(1000);
    expect(tChartAnalysisFixture.samples.length).toBeGreaterThan(500);
  });

  it("33.2s 附近的單點 data loss 在 anomalies 陣列裡，不靠 samples 呈現", () => {
    const dataLoss = tChartAnalysisFixture.anomalies.find((a) => a.kind === "data_loss");
    expect(dataLoss).toBeDefined();
    expect(dataLoss?.atSec).toBeCloseTo(33.2, 1);
  });

  it("S2 Pump Down 在 recipeSteps 與 stepAnalyses 都判定為偏移", () => {
    const s2Step = tChartAnalysisFixture.recipeSteps.find((s) => s.id === "S2");
    const s2Analysis = tChartAnalysisFixture.stepAnalyses.find((s) => s.stepId === "S2");
    expect(s2Step?.verdict).toBe("deviation");
    expect(s2Analysis?.verdict).toBe("deviation");
  });
});

describe("fixtures：深度診斷（SCN-A01）", () => {
  it("五個空間指標都符合 spatialAnalysisSchema", () => {
    const indicators = ["overlay_fp", "focus_fp", "leveling", "field_focus", "slit"] as const;
    expect(Object.keys(spatialAnalysesFixture).sort()).toEqual([...indicators].sort());
    for (const indicator of indicators) {
      expect(() => spatialAnalysisSchema.parse(spatialAnalysesFixture[indicator])).not.toThrow();
    }
  });

  it("crossDiagnosisFixture 符合 crossDiagnosisSchema", () => {
    expect(() => crossDiagnosisSchema.parse(crossDiagnosisFixture)).not.toThrow();
  });
});

describe("fixtures：關聯圖（SCN-A01）", () => {
  it("graphQueryResultFixture 符合 graphQueryResultSchema", () => {
    expect(() => graphQueryResultSchema.parse(graphQueryResultFixture)).not.toThrow();
  });

  it("關聯圖節點 id 與 t chart 追根鏈路的零件 id 一致（TP-1、GV-2）", () => {
    const nodeIds = graphQueryResultFixture.nodes.map((n) => n.id);
    expect(nodeIds).toEqual(expect.arrayContaining(["TP-1", "GV-2"]));
  });
});

describe("fixtures：課別設定（LITHO-02）", () => {
  it("sectionSettingsFixture 符合 sectionSettingsSchema", () => {
    expect(() => sectionSettingsSchema.parse(sectionSettingsFixture)).not.toThrow();
  });
});
