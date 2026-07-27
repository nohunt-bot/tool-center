import { describe, expect, it } from "vitest";
import { SectionShell } from "@/components/shell/section-shell";
import { ETCH01_CODE, LITHO02_CODE } from "@/data/fixtures/sections";

/**
 * P2(b)：`SectionShell` 是 R5 拔掉「sid/tid 任意配對取得權限」漏洞後，兩棵
 * 子樹（`section/[code]/layout.tsx`、`tool/[tid]/layout.tsx`）共用的唯一
 * gating 實作，但在這一波之前一條測試都沒有覆蓋到它。
 *
 * `SectionShell` 是 async Server Component——`notFound()`（next/navigation）
 * 本身就是同步 throw 一個帶 `digest: "NEXT_HTTP_ERROR_FALLBACK;404"` 的
 * Error（見 node_modules/next/dist/client/components/not-found.js），不需要
 * 完整的 App Router render context 才能觸發，所以這裡直接呼叫這個函式並
 * await 它回傳的 promise 即可驗證，不需要 render 到 DOM（`notFound()` 在
 * `return` JSX 之前就會丟出，Header／ControlBar 的函式本體根本不會被呼叫
 * 到，不需要額外 mock next-intl／next/navigation 的 router）。
 *
 * 目前登入者 fixture（`currentUserFixture`）：`sectionId: LITHO02_CODE`，
 * `managerOf: []`，`supportSections: []`——除了 LITHO02_CODE 本身，其他任何
 * 課別都應該被擋下來。
 */
describe("SectionShell（無支援權限的課別必須擋下來，A1.11）", () => {
  it("目前登入者所屬課別（LITHO02_CODE）：正常放行，不 notFound()", async () => {
    await expect(
      SectionShell({ sectionCode: LITHO02_CODE, children: null }),
    ).resolves.toBeDefined();
  });

  it("無支援權限的課別下的機台會被擋：目前登入者沒有 ETCH01_CODE 的支援權限，" +
    "即使呼叫端把這個課代碼傳進來（例如反查出別課的機台），SectionShell 仍必須 notFound()，" +
    "不能讓「這個課別確實存在」誤判成「可以進入」", async () => {
    const rejection = SectionShell({ sectionCode: ETCH01_CODE, children: null });
    await expect(rejection).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
});
