import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fixturesDataSource } from "@/data/fixtures";
import type { ToolSummary } from "@/domain/tool";
import { statusToken, TOOL_STATUSES } from "@/lib/status";
import { OverviewPane } from "@/components/overview/overview-pane";

// Brick 用 next/navigation 的 useRouter；jsdom 沒有 App Router context，mock 掉。
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

let tools: readonly ToolSummary[];

beforeAll(async () => {
  tools = await fixturesDataSource.listTools("LITHO-02");
});

describe("OverviewPane（機台一覽）", () => {
  it("8 台機台的 brick 都 render，且各自的 id 都出現", () => {
    render(<OverviewPane sectionId="LITHO-02" sectionName="黃光二課" tools={tools} />);
    // 只有 brick 是 role=button（legend/統計的色塊是 <i>）
    expect(screen.getAllByRole("button")).toHaveLength(8);
    for (const tool of tools) {
      expect(screen.getByText(tool.id)).toBeInTheDocument();
    }
  });

  it("頂部 DOWN/LOST/PM 計數與資料一致（不寫死）", () => {
    const count = (status: string) => tools.filter((tool) => tool.status === status).length;
    // mockup L497 的黃光二課：DOWN 1 / LOST 2 / PM 1
    expect({ DOWN: count("DOWN"), LOST: count("LOST"), PM: count("PM") }).toEqual({
      DOWN: 1,
      LOST: 2,
      PM: 1,
    });

    const { container } = render(
      <OverviewPane sectionId="LITHO-02" sectionName="黃光二課" tools={tools} />,
    );
    expect(within(container).getByText(/黃光二課 · 8 台/)).toBeInTheDocument();
    expect(container.textContent).toContain("DOWN 1");
    expect(container.textContent).toContain("LOST 2");
    expect(container.textContent).toContain("PM 1");
  });

  it("六種狀態各自的 brick 都套到正確的狀態底色 class（色義一致）", () => {
    const { container } = render(
      <OverviewPane sectionId="LITHO-02" sectionName="黃光二課" tools={tools} />,
    );
    const present = new Set(tools.map((tool) => tool.status));
    for (const status of TOOL_STATUSES) {
      if (!present.has(status)) continue;
      const bgClass = statusToken(status).bg;
      expect(
        container.querySelector(`.${bgClass}`),
        `狀態 ${status} 應有套 ${bgClass} 的元素`,
      ).not.toBeNull();
    }
  });

  it("空課別顯示無資料訊息，不崩", () => {
    render(<OverviewPane sectionId="ETCH-09" sectionName="測試課" tools={[]} />);
    expect(screen.getByText(/目前無機台資料/)).toBeInTheDocument();
  });
});
