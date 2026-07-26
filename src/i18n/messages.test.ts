import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import zhMessages from "../../messages/zh-TW.json";

/**
 * H7：這個 it 原本混在 overview-pane.test.tsx 的
 * `describe("OverviewPane（機台一覽）"...)` 底下當第 5 個 it，但它完全沒有
 * render OverviewPane——直接用 createTranslator 組一份對 messages/zh-TW.json
 * 的 translator 斷言格式化行為，測的是 i18n 訊息層本身，不是 OverviewPane
 * 元件，放在那個 describe 底下會造成「OverviewPane 有 5 個元件層級測試」的
 * 假象。搬到這裡（i18n 訊息層的測試檔），斷言逐字保留，強弱不變。
 */
describe("messages/zh-TW.json 的數字插值格式", () => {
  it("大數字傳進 t() 不會被 Intl.NumberFormat 加千分位（訊息檔是純 {count} 插值）", () => {
    // 這裡直接用 createTranslator 組一個 "overview" namespace 的 translator 來斷言，
    // 不用整個 render 一萬多個 brick——header/statAlarmOnly/statAlarmMtbi 三個 key
    // 目前都是純 {count} 插值，不是 {count, number}，所以就算 count 用 number 型別
    // 傳入也不會走千分位格式化。若訊息檔以後改成 {count, number}，這個斷言會先紅，
    // 提醒要重新評估數字格式（而不是像上一輪那樣用 String(...) 掩蓋掉這件事）。
    const t = createTranslator({ locale: "zh-TW", messages: zhMessages, namespace: "overview" });
    const bigCount = 12345;
    expect(t("header", { sectionName: "測試課", count: bigCount })).not.toContain(",");
    expect(t("statAlarmOnly", { count: bigCount })).not.toContain(",");
    expect(t("statAlarmMtbi", { count: bigCount, hours: bigCount })).not.toContain(",");
  });
});
