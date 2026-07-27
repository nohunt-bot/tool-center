import { NextIntlClientProvider } from "next-intl";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header, type NavSection } from "@/components/shell/header";
import { ETCH01_CODE, LITHO01_CODE, LITHO02_CODE } from "@/data/fixtures/sections";
import zhMessages from "../../../messages/zh-TW.json";

// Header 是 client component，只用到 @/i18n/navigation 的 useRouter；直接
// mock 這個模組本身（而不是它底下轉呼叫的 next/navigation），避免連帶要
// 補 next-intl createNavigation 內部包裝會用到的 usePathname（沿用
// control-bar.test.tsx 的做法）。jsdom 沒有 App Router context，要 mock 掉。
//
// R7：語系切換已整個移除（不再讀網址列查詢參數保留 query 做 locale 切換）。
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

const sections: readonly NavSection[] = [
  { code: LITHO02_CODE, nameEn: "LITHO-02", nameZh: "黃光二課", accessible: true },
  { code: LITHO01_CODE, nameEn: "LITHO-01", nameZh: "黃光一課", accessible: false },
  { code: ETCH01_CODE, nameEn: "ETCH-01", nameZh: "蝕刻一課", accessible: false },
];

function renderHeader() {
  return render(
    <NextIntlClientProvider locale="zh-TW" messages={zhMessages}>
      <Header sectionId={LITHO02_CODE} sections={sections} />
    </NextIntlClientProvider>,
  );
}

/**
 * M3：commander 依 mockup（urd/tool-center-gui.html:462–464）定案——課別下拉
 * 要「中英文名同時顯示」（例：「黃光二課 LITHO-02（我的課別）」）。前一輪把
 * nameEn 整個移除，這裡補一條斷言釘住「兩個名字都要出現」，不能再被誤刪。
 */
describe("Header（課別下拉：M3 中英文雙名稱）", () => {
  it("每個課別選項同時顯示中文名與英文名（固定「中文 英文」順序，不隨 locale 變動）", async () => {
    renderHeader();
    const sectionSelect = await screen.findByLabelText("課別");

    const myOption = within(sectionSelect).getByText(/黃光二課 LITHO-02/);
    expect(myOption).toBeInTheDocument();
    expect(myOption.textContent).toContain("黃光二課");
    expect(myOption.textContent).toContain("LITHO-02");
    expect(myOption.textContent).toContain("（我的課別）");

    const restrictedOption = within(sectionSelect).getByText(/黃光一課 LITHO-01/);
    expect(restrictedOption.textContent).toContain("黃光一課");
    expect(restrictedOption.textContent).toContain("LITHO-01");
    expect(restrictedOption.textContent).toContain("（需支援權限）");
  });

  it("課代碼（section.code）本身不出現在選項文字裡——下拉顯示的是 nameZh／nameEn，value 才是 code", async () => {
    renderHeader();
    const sectionSelect = await screen.findByLabelText("課別");
    const option = within(sectionSelect).getByText(/黃光二課 LITHO-02/);
    expect(option.textContent).not.toContain(LITHO02_CODE);
  });
});
