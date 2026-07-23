import { describe, expect, it } from "vitest";
import {
  DIST_PATTERN_LABEL,
  DIST_PATTERNS,
  distPatternSchema,
  SPATIAL_PATTERN_LABEL,
  SPATIAL_PATTERNS,
  spatialPatternSchema,
  TIME_PATTERN_LABEL,
  TIME_PATTERNS,
  timePatternSchema,
} from "@/domain/taxonomy";

/**
 * 這組測試守的是產品紅線：受控詞彙必須是單一真相來源。
 * 只要有人在別處自行加了一個選項、或改了 enum 卻忘了補說明，這裡就會紅。
 */
describe("受控 taxonomy", () => {
  it("時序 6 種、分布 5 種、空間 10 種（mockup L1930–1946、L1255–1270）", () => {
    expect(TIME_PATTERNS).toHaveLength(6);
    expect(DIST_PATTERNS).toHaveLength(5);
    expect(SPATIAL_PATTERNS).toHaveLength(10);
  });

  it("每個 code 都有中文說明——沒有說明的選項等於沒有定義", () => {
    for (const code of TIME_PATTERNS) expect(TIME_PATTERN_LABEL[code]).toBeTruthy();
    for (const code of DIST_PATTERNS) expect(DIST_PATTERN_LABEL[code]).toBeTruthy();
    for (const code of SPATIAL_PATTERNS) expect(SPATIAL_PATTERN_LABEL[code]).toBeTruthy();
  });

  it("說明表沒有多餘鍵值（enum 與 label 完全對齊）", () => {
    expect(Object.keys(TIME_PATTERN_LABEL).sort()).toEqual([...TIME_PATTERNS].sort());
    expect(Object.keys(DIST_PATTERN_LABEL).sort()).toEqual([...DIST_PATTERNS].sort());
    expect(Object.keys(SPATIAL_PATTERN_LABEL).sort()).toEqual([...SPATIAL_PATTERNS].sort());
  });

  it("zod schema 擋掉不在詞彙表內的值", () => {
    expect(timePatternSchema.safeParse("MEAN_SHIFT").success).toBe(true);
    expect(timePatternSchema.safeParse("SINGLE_PEAK").success).toBe(false);
    expect(distPatternSchema.safeParse("SPIKE").success).toBe(false);
    expect(spatialPatternSchema.safeParse("BOWL").success).toBe(true);
    expect(spatialPatternSchema.safeParse("bowl").success).toBe(false);
  });

  it("時序與分布是正交維度——不共用任何 code", () => {
    const overlap = TIME_PATTERNS.filter((code) =>
      (DIST_PATTERNS as readonly string[]).includes(code),
    );
    expect(overlap).toEqual([]);
  });
});
