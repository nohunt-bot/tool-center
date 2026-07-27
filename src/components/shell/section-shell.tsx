import { notFound } from "next/navigation";
import { ControlBar } from "@/components/shell/control-bar";
import { Header } from "@/components/shell/header";
import { fixturesDataSource } from "@/data/fixtures";
import { canEnterSection } from "@/lib/permission";
import type { SectionId } from "@/domain/user";

/**
 * 課別頁（`section/[code]/layout.tsx`）與機台頁（`tool/[tid]/layout.tsx`）
 * 共用的 shell：Header（課別清單）＋ ControlBar（機台清單）。
 *
 * R5b：`tool/` 從 `section/[sid]/` 底下搬出來後，兩棵子樹都需要這層 shell——
 * 不複製兩份，抽成這個共用元件。兩邊呼叫端各自用自己的方式取得
 * `sectionCode` 再傳進來：
 * - `section/[code]/layout.tsx`：`code` 直接來自 URL。
 * - `tool/[tid]/layout.tsx`：`sectionCode` 由 `getToolSection(tid)` 反查
 *   （機台子樹的 URL 沒有課別段）。
 * 到這裡兩邊拿到的都已經是課代碼，`canEnterSection` 的檢查只寫這一份，
 * 兩棵子樹都會經過——這正是拔掉舊漏洞（sid/tid 任意配對取得 admin 權限）
 * 的關鍵：機台頁再也不能帶一個「使用者自己管的課」的 sectionCode 進來，
 * 因為 sectionCode 不是從 URL 讀的，是從這台機台本身反查出來的。
 *
 * ControlBar 需要的機台清單在這裡（Server Component）取，只把
 * `ToolSummary[]` 當 prop 往下傳——client 端的 ControlBar／Header 都不
 * import `@/data/fixtures`，避免機台屬性（`attributesByToolId`：內部 IP、
 * PE/EE 姓名、vendor、TAP/TCS 版本）被 tree-shaker 漏掉、打進 client bundle
 * （上一波 M1 修過的洩漏，見 `control-bar.tsx` 開頭的長註解）。
 *
 * P6（結構性約束，明確寫出來，不靠讀者自己推）：`sectionCode` 這個參數的
 * 型別是 `SectionId`，但 `SectionId` 本身只是 `string`（domain/user.ts 沒有
 * 開 branded type）——「呼叫端不能塞任意課代碼進來偽造權限」目前**不是**
 * 型別系統或執行期保證的，純粹是「事實上只有兩個呼叫端」這件事：
 * - `section/[code]/layout.tsx`：`code` 直接來自 URL 的 `[code]` 動態段
 *   （經這個檔案下面的 `canEnterSection` 檢查）。
 * - `tool/[tid]/layout.tsx`：`sectionCode` 由 `getToolSection(tid)`
 *   反查——全域機台清單的權威值，不是呼叫端自己組出來的。
 * `sectionCode` **不得**接受任何其他來源（例如某個表單欄位、某個 query
 * string、呼叫端自己拼出來的字串）——那樣會重新打開「sid/tid 任意配對
 * 取得權限」的舊漏洞（本檔上面的說明）。新增第三個呼叫端之前，必須先確認
 * 它傳進來的值符合上面兩種來源之一，不能假設「反正型別是 SectionId 就
 * 安全」。
 *
 * **`getCurrentUser()` 這裡刻意不包 try/catch，使用者資料源掛掉時整頁
 * 500 是故意的 fail-closed 行為，不是缺陷、不要「順手」修掉。**
 * 理由：這個元件的職責是算權限（下面的 `canEnterSection`）。拿不到
 * 使用者，就沒有輸入可以拿去判斷授權——這時候「假裝有一個預設使用者
 * 撐住畫面」等同於在無法判斷授權的情況下，替系統做出了一個授權決定
 * （究竟該當哪個角色看待、還是該當沒有支援權限的外人？沒有標準答案，
 * 任何預設都可能是誤放行）。降級 = 猜一個使用者去算權限，猜錯的後果
 * 是越權，不是單純的畫面難看。
 *
 * **不要照抄隔壁 `src/i18n/request.ts` 的 try/catch → fallback 模式。**
 * 那裡的降級是對的：`getCurrentUser()` 失敗時退回
 * `routing.defaultLocale`，猜錯了只是語系顯示錯誤，無害、可回復。
 * 這裡如果依樣畫葫蘆包一層 try/catch 退回某個「預設使用者」或「預設
 * 角色」，猜錯的後果是授權判斷錯誤——兩處看起來是同一種程式碼形狀
 * （`getCurrentUser()` 失敗時 fallback），但風險等級完全不同，不能套用
 * 同一個修法。
 *
 * 已知落差（記錄，不在這裡修）：目前失敗時使用者看到的是 Next 的通用
 * 500 頁，分辨不出「這是使用者資料源掛掉」還是其他伺服器錯誤。將來若要
 * 改善，正確的修法是**改呈現**（例如專屬 `error.tsx` 認得這種失敗、給出
 * 「暫時無法確認您的權限，請稍後再試」之類的訊息），**不是改成降級**成
 * 某個預設使用者去算權限。
 */
export async function SectionShell({
  sectionCode,
  children,
}: {
  sectionCode: SectionId;
  children: React.ReactNode;
}) {
  const [user, sections, tools] = await Promise.all([
    fixturesDataSource.getCurrentUser(),
    fixturesDataSource.listSections(),
    fixturesDataSource.listTools(sectionCode),
  ]);
  const section = sections.find((candidate) => candidate.code === sectionCode);

  // 無支援權限的課別，直接改 URL（或反查出別課的機台）也進不去（A1.11）。
  // B1.3 之後這個判斷會查使用者表並由 middleware 在 server 邊界擋下。
  if (!section || !canEnterSection(user, sectionCode)) {
    notFound();
  }

  const navSections = sections.map((candidate) => ({
    ...candidate,
    accessible: canEnterSection(user, candidate.code),
  }));

  return (
    <>
      <Header sectionId={sectionCode} sections={navSections} />
      <ControlBar sectionId={sectionCode} tools={tools} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </>
  );
}
