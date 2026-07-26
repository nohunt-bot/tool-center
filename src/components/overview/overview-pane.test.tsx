import { createTranslator, NextIntlClientProvider } from "next-intl";
import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fixturesDataSource } from "@/data/fixtures";
import { LITHO02_CODE } from "@/data/fixtures/sections";
import type { ToolSummary } from "@/domain/tool";
import { statusToken, TOOL_STATUSES } from "@/lib/status";
import { OverviewPane } from "@/components/overview/overview-pane";
import zhMessages from "../../../messages/zh-TW.json";

// Brick 仍是 client component、用 next-intl 的 useRouter（@/i18n/navigation），
// 它內部呼叫 next/navigation 的 useRouter 與 usePathname；jsdom 沒有 App Router
// context，兩個都要 mock 掉。
//
// M8：路徑裡的課別片段改用 LITHO02_CODE（課代碼），不再寫死 "LITHO-02"
// （課名）——URL 位置放課名本來就不對（見 @/domain/user 的 SectionId：URL
// 與權限鍵一律用代碼），目前雖然全樹沒有人真的讀 usePathname() 的回傳值
// （純一致性問題，不影響現有測試斷言），但保持這裡的假資料跟 R2/R3
// 之後「URL 只用課代碼」的規則一致，不要讓讀這份測試的人以為課名可以
// 出現在這個位置。
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => `/section/${LITHO02_CODE}`,
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

// OverviewPane（F4 之後）是 Server Component，改用 next-intl/server 的
// getTranslations()。next-intl 的 "next-intl/server" 匯出在沒有 "react-server"
// 這個 package export condition 的環境下（Vitest/jsdom 就是這種環境）一律丟
// 「not supported in Client Components」，不管環境是不是真的在跑 client code——
// 這是 next-intl 對 RSC-only API 的保護機制，不是我們能配置繞過的 Vitest 選項。
// 用 next-intl 主要匯出的 createTranslator（isomorphic，沒有這層限制；next-intl
// 底層直接 re-export 同一個 use-intl 實例，兩者輸出逐字元相同）直接組一個
// 讀 zh-TW.json 的 translator 來頂替，讓 OverviewPane 能在測試裡真的跑 t()。
vi.mock("next-intl/server", async (importOriginal) => {
  // 真實 getTranslations() 接受三種呼叫形式：字串 namespace、
  // { locale, namespace } 物件（layout.tsx 就是這樣用的），或完全不傳參數。
  // 只支援字串形式的 mock，一旦有檔案改用物件形式，測試會以難懂的
  // 「undefined is not a function」爆掉，而不是清楚指出 mock 沒跟上真實 API。
  const original = await importOriginal<typeof import("next-intl/server")>();
  return {
    ...original,
    getTranslations: async (arg?: string | { locale?: string; namespace?: string }) => {
      const namespace = typeof arg === "string" ? arg : arg?.namespace;
      // namespace 在這裡只會是 OverviewPane 實際傳的 "overview"，但 createTranslator
      // 的型別要求 namespace 是從 messages 型別推導出的字面量聯集、不接受一般 string；
      // 這裡是測試用的 mock 工廠，用 `never` 讓賦值過關，不影響任何執行期行為。
      return createTranslator({ locale: "zh-TW", messages: zhMessages, namespace: namespace as never });
    },
  };
});

// i18n 架構化之後 Brick 仍要靠 useTranslations，需要 NextIntlClientProvider
// 包起來，否則 next-intl 會丟「no context」的例外。OverviewPane 本身已經是
// Server Component、翻譯在呼叫時就解析完了，不需要這層 context，但子層的
// Brick 需要，所以還是保留。
async function renderPane(props: {
  sectionId: string;
  sectionName: string;
  tools: readonly ToolSummary[];
}) {
  return render(
    <NextIntlClientProvider locale="zh-TW" messages={zhMessages}>
      {await OverviewPane(props)}
    </NextIntlClientProvider>,
  );
}

let tools: readonly ToolSummary[];

beforeAll(async () => {
  tools = await fixturesDataSource.listTools(LITHO02_CODE);
});

describe("OverviewPane（機台一覽）", () => {
  it("8 台機台的 brick 都 render，且各自的 id 都出現", async () => {
    await renderPane({ sectionId: LITHO02_CODE, sectionName: "黃光二課", tools });
    // 只有 brick 是 role=button（legend/統計的色塊是 <i>）
    expect(screen.getAllByRole("button")).toHaveLength(8);
    for (const tool of tools) {
      expect(screen.getByText(tool.id)).toBeInTheDocument();
    }
  });

  it("頂部 DOWN/LOST/PM 計數與資料一致（不寫死）", async () => {
    const count = (status: string) => tools.filter((tool) => tool.status === status).length;
    // mockup L497 的黃光二課：DOWN 1 / LOST 2 / PM 1
    expect({ DOWN: count("DOWN"), LOST: count("LOST"), PM: count("PM") }).toEqual({
      DOWN: 1,
      LOST: 2,
      PM: 1,
    });

    const { container } = await renderPane({
      sectionId: LITHO02_CODE,
      sectionName: "黃光二課",
      tools,
    });
    expect(within(container).getByText(/黃光二課 · 8 台/)).toBeInTheDocument();
    expect(container.textContent).toContain("DOWN 1");
    expect(container.textContent).toContain("LOST 2");
    expect(container.textContent).toContain("PM 1");
  });

  it("六種狀態各自的 brick 都套到正確的狀態底色 class（色義一致）", async () => {
    const { container } = await renderPane({
      sectionId: LITHO02_CODE,
      sectionName: "黃光二課",
      tools,
    });
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

  it("空課別顯示無資料訊息，不崩", async () => {
    await renderPane({ sectionId: "ETCH-09", sectionName: "測試課", tools: [] });
    expect(screen.getByText(/目前無機台資料/)).toBeInTheDocument();
  });

  it("H8：底部 footerNote 說明文字真的有 render 出來", async () => {
    // 之前 header／emptyState 的訊息鍵打錯字會被既有測試抓到，但 footerNote
    // 沒有任何斷言覆蓋，打錯字會靜靜地全數通過（這個缺口早於這一輪就存在）。
    // 這裡直接斷言 render 出來的內容包含 footerNote 訊息鍵的實際文字，改壞
    // messages/zh-TW.json 的 overview.footerNote 鍵值就會讓這條測試變紅。
    await renderPane({ sectionId: LITHO02_CODE, sectionName: "黃光二課", tools });
    expect(
      screen.getByText("大格＝機台 · 小格＝chamber · 底色＝狀態（兩者可不同，色義一致）· 點 brick 直接進入"),
    ).toBeInTheDocument();
  });
});
