import { describe, expect, it } from "vitest";
import { isToolStatus, statusClass, statusToken, TOOL_STATUSES } from "@/lib/status";

describe("狀態 token", () => {
  it("六種狀態全部有定義（對應 mockup legend L497–505）", () => {
    expect(TOOL_STATUSES).toEqual(["UP", "DOWN", "OFF", "WEQ", "PM", "LOST"]);
    for (const status of TOOL_STATUSES) {
      expect(statusToken(status).bg).toBeTruthy();
      expect(statusToken(status).fg).toBeTruthy();
    }
  });

  it("每個狀態的底色都不同——色義一致的前提是色彩本身可區分", () => {
    const backgrounds = TOOL_STATUSES.map((status) => statusToken(status).bg);
    expect(new Set(backgrounds).size).toBe(TOOL_STATUSES.length);
  });

  it("PM 是淺色底，必須配深色字（mockup L17）", () => {
    expect(statusToken("PM").fg).toBe("text-st-pm-fg");
    expect(statusToken("PM").fg).not.toBe(statusToken("UP").fg);
  });

  it("statusClass 同時給出底色與前景色", () => {
    expect(statusClass("DOWN")).toBe("bg-st-down text-st-down-fg");
  });

  it("isToolStatus 擋掉非法值", () => {
    expect(isToolStatus("UP")).toBe(true);
    expect(isToolStatus("RUNNING")).toBe(false);
    expect(isToolStatus(undefined)).toBe(false);
  });
});
