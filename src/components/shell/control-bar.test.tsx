import { NextIntlClientProvider } from "next-intl";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixturesDataSource } from "@/data/fixtures";
import { LITHO01_CODE, LITHO02_CODE } from "@/data/fixtures/sections";
import { ControlBar } from "@/components/shell/control-bar";
import zhMessages from "../../../messages/zh-TW.json";

// ControlBar 是 client component，用 next-intl 的 useRouter（@/i18n/navigation），
// 內部呼叫 next/navigation 的 useRouter／usePathname；jsdom 沒有 App Router
// context，兩個都要 mock 掉（做法沿用 overview-pane.test.tsx 的既有慣例）。
//
// R5／R6：機台子樹不帶課別段（`/tool/<tid>`、`/tool/<tid>/history`……），
// pathname 需要能依測試情境切換（一覽頁 vs 機台頁的不同路徑形狀），改用
// 可變變數讓每個 it 各自控制，而不是像改前那樣固定回傳一個值。
let mockPathname = `/section/${LITHO02_CODE}`;
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

function renderControlBar(props: { sectionId: string; tools: Parameters<typeof ControlBar>[0]["tools"] }) {
  return render(
    <NextIntlClientProvider locale="zh-TW" messages={zhMessages}>
      <ControlBar {...props} />
    </NextIntlClientProvider>,
  );
}

describe("ControlBar（M1 之後：tools 一律來自 props，不自己 import data layer）", () => {
  beforeEach(() => {
    mockPathname = `/section/${LITHO02_CODE}`;
    mockPush.mockClear();
  });

  it("依課別過濾：黃光二課（LITHO02_CODE）的 8 台機都出現在機台下拉裡", async () => {
    const tools = await fixturesDataSource.listTools(LITHO02_CODE);
    renderControlBar({ sectionId: LITHO02_CODE, tools });

    const toolSelect = screen.getByLabelText("機台") as HTMLSelectElement;
    const options = within(toolSelect).getAllByRole("option");
    expect(options).toHaveLength(8);
    for (const tool of tools) {
      expect(within(toolSelect).getByText(new RegExp(tool.id))).toBeInTheDocument();
    }
  });

  it("依課別過濾：換一個沒有機台的課別（黃光一課），機台下拉不會殘留另一課的機台", async () => {
    // LITHO01_CODE 目前的 fixtures 沒有任何機台——這正是 M7 要處理的「tools
    // 為空」情境；同時證明 ControlBar 完全照 props 給的 tools 渲染，不是
    // 內部藏了一份全域機台清單（改前 NAV_TOOLS 就是這種不分課別的全域清單）。
    const tools = await fixturesDataSource.listTools(LITHO01_CODE);
    expect(tools).toHaveLength(0);

    renderControlBar({ sectionId: LITHO01_CODE, tools });

    const toolSelect = screen.getByLabelText("機台") as HTMLSelectElement;
    expect(within(toolSelect).queryAllByRole("option")).toHaveLength(0);
  });

  it("M7：tools 為空時，機台下拉停用、且視圖下拉裡的 tool 模式選項全部 disabled（不允許切到 tool 模式）", () => {
    renderControlBar({ sectionId: LITHO01_CODE, tools: [] });

    const toolSelect = screen.getByLabelText("機台") as HTMLSelectElement;
    expect(toolSelect).toBeDisabled();

    const viewSelect = screen.getByLabelText("檢視") as HTMLSelectElement;
    const toolModeOptions = within(viewSelect)
      .getAllByRole("option")
      .filter((option) => (option as HTMLOptionElement).value !== "overview");
    expect(toolModeOptions.length).toBeGreaterThan(0);
    for (const option of toolModeOptions) {
      expect(option).toBeDisabled();
    }
  });

  it("有機台時，視圖下拉的 tool 模式選項不會被 disabled", async () => {
    const tools = await fixturesDataSource.listTools(LITHO02_CODE);
    renderControlBar({ sectionId: LITHO02_CODE, tools });

    const viewSelect = screen.getByLabelText("檢視") as HTMLSelectElement;
    const toolModeOptions = within(viewSelect)
      .getAllByRole("option")
      .filter((option) => (option as HTMLOptionElement).value !== "overview");
    expect(toolModeOptions.length).toBeGreaterThan(0);
    for (const option of toolModeOptions) {
      expect(option).not.toBeDisabled();
    }
  });
});

/**
 * R5：機台子樹不帶課別段——路徑判斷從「找 'tool' 這個片段在路徑中間的位置」
 * 改成「看第一段是不是 'tool'」，且 `/tool/<tid>` 本身（沒有第三段）＝
 * 當機處理（"live"），不是缺資料的 fallback。這裡直接釘住新的路徑形狀，
 * 避免退回舊的 `/section/<sid>/tool/<tid>/<mode>` 判斷邏輯。
 */
describe("ControlBar（R5：新路徑形狀的檢視偵測）", () => {
  beforeEach(() => {
    mockPathname = `/section/${LITHO02_CODE}`;
    mockPush.mockClear();
  });

  it("`/tool/<tid>`（無 mode 段）：檢視偵測為當機處理，機台下拉帶出正確的 toolId", async () => {
    const tools = await fixturesDataSource.listTools(LITHO02_CODE);
    mockPathname = `/tool/${tools[0]!.id}`;
    renderControlBar({ sectionId: LITHO02_CODE, tools });

    const viewSelect = screen.getByLabelText("檢視") as HTMLSelectElement;
    expect(viewSelect.value).toBe("live");
    const toolSelect = screen.getByLabelText("機台") as HTMLSelectElement;
    expect(toolSelect.value).toBe(tools[0]!.id);
    expect(toolSelect).not.toBeDisabled();
  });

  it("`/tool/<tid>/history`：檢視偵測為病史分析", async () => {
    const tools = await fixturesDataSource.listTools(LITHO02_CODE);
    mockPathname = `/tool/${tools[0]!.id}/history`;
    renderControlBar({ sectionId: LITHO02_CODE, tools });

    const viewSelect = screen.getByLabelText("檢視") as HTMLSelectElement;
    expect(viewSelect.value).toBe("history");
  });

  it("`/tool/<tid>/diagnosis`：檢視偵測為深度診斷", async () => {
    const tools = await fixturesDataSource.listTools(LITHO02_CODE);
    mockPathname = `/tool/${tools[0]!.id}/diagnosis`;
    renderControlBar({ sectionId: LITHO02_CODE, tools });

    const viewSelect = screen.getByLabelText("檢視") as HTMLSelectElement;
    expect(viewSelect.value).toBe("diagnosis");
  });

  it("切到一覽：push 目標是 `/section/<code>`，不帶機台段", async () => {
    const tools = await fixturesDataSource.listTools(LITHO02_CODE);
    mockPathname = `/tool/${tools[0]!.id}/history`;
    renderControlBar({ sectionId: LITHO02_CODE, tools });

    const viewSelect = screen.getByLabelText("檢視") as HTMLSelectElement;
    viewSelect.value = "overview";
    viewSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(mockPush).toHaveBeenCalledWith(`/section/${LITHO02_CODE}`);
  });

  it("切到當機處理：push 目標是 `/tool/<tid>`，沒有 mode 段（不再有 `/live`）", async () => {
    const tools = await fixturesDataSource.listTools(LITHO02_CODE);
    mockPathname = `/section/${LITHO02_CODE}`;
    renderControlBar({ sectionId: LITHO02_CODE, tools });

    const viewSelect = screen.getByLabelText("檢視") as HTMLSelectElement;
    viewSelect.value = "live";
    viewSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(mockPush).toHaveBeenCalledWith(`/tool/${tools[0]!.id}`);
  });

  it("切到病史分析：push 目標是 `/tool/<tid>/history`，不帶課別段", async () => {
    const tools = await fixturesDataSource.listTools(LITHO02_CODE);
    mockPathname = `/tool/${tools[0]!.id}`;
    renderControlBar({ sectionId: LITHO02_CODE, tools });

    const viewSelect = screen.getByLabelText("檢視") as HTMLSelectElement;
    viewSelect.value = "history";
    viewSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(mockPush).toHaveBeenCalledWith(`/tool/${tools[0]!.id}/history`);
  });

  it("切換機台下拉：push 目標帶上新的 toolId，維持目前檢視模式", async () => {
    const tools = await fixturesDataSource.listTools(LITHO02_CODE);
    mockPathname = `/tool/${tools[0]!.id}/diagnosis`;
    renderControlBar({ sectionId: LITHO02_CODE, tools });

    const toolSelect = screen.getByLabelText("機台") as HTMLSelectElement;
    toolSelect.value = tools[1]!.id;
    toolSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(mockPush).toHaveBeenCalledWith(`/tool/${tools[1]!.id}/diagnosis`);
  });
});
