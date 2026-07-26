import { describe, expect, it } from "vitest";
import { sectionDisplayName, type Section } from "@/domain/tool";

const section: Section = { code: "SEC-1002", nameEn: "LITHO-02", nameZh: "黃光二課" };

/**
 * M4：sectionDisplayName 是 R5 的核心函式，改前零測試覆蓋。
 *
 * 現在的實作是 `locale === "zh-TW" ? section.nameZh : section.nameEn`——
 * 這代表「非 zh-TW 才拿 nameZh，其他任何值（含未來新增的 locale、含空
 * 字串）一律 fallback 到 nameEn」。這裡刻意釘住這個 fallback 語意本身
 * （不是只測 "zh-TW" 跟 "en" 兩個目前用得到的 locale），這樣以後真的加了
 * 第三個 locale（例如 "ja"）進 routing.ts，如果沒人特別處理它，這條測試
 * 至少能讓人看到「它現在會拿到英文名」是被斷言過、看過的行為，不是沒人
 * 注意到的靜默結果。
 */
describe("sectionDisplayName", () => {
  it("zh-TW → nameZh", () => {
    expect(sectionDisplayName(section, "zh-TW")).toBe("黃光二課");
  });

  it("en → nameEn", () => {
    expect(sectionDisplayName(section, "en")).toBe("LITHO-02");
  });

  it("未知 locale（非 zh-TW 的任意字串）→ 目前行為是 fallback 到 nameEn", () => {
    expect(sectionDisplayName(section, "ja")).toBe("LITHO-02");
  });

  it("空字串 locale → 一樣落在「非 zh-TW」分支，拿 nameEn", () => {
    expect(sectionDisplayName(section, "")).toBe("LITHO-02");
  });
});
