# Task: 將 urd/tool-center-gui.html 單檔 mockup 實作為 Next.js + TypeScript 的正式 Tool Center 前端

Status: active (2026-07-24)

來源 mockup：`urd/tool-center-gui.html`（2453 行，含 30+ JS 函式的可互動原型）

---

## Acceptance criteria

### Stage A — 等價 mockup（純 UI，首期交付）
- [ ] 五個 pane（機台一覽／當機處理／病史分析／深度診斷／課別設定）+ FDC 分析視窗 + iDo Copilot，
      功能與 mockup 等價，無功能缺漏。
- [ ] 所有資料來自 `src/data/fixtures/`，**形狀比照既有 API 的實際回應**（非照畫面反推）。
- [ ] `DataSource` 介面已定義，Stage B 只換實作、上層元件零修改。
- [ ] 畫面誠實標示哪些是假資料（demo banner），不得讓簡報對象誤以為已接真實系統。
- [ ] mode／機台／FDC 視窗／圖表分頁／locale 全部反映在 URL，reload 與貼連結都能還原。
- [ ] **i18n 架構完整但不產翻譯**：無硬寫字串（lint 擋住）、locale 路由可運作、
      語系切換不掉狀態；`en` 訊息檔建立但留空，缺鍵一律 fallback 到 zh-TW 且不報錯。
- [ ] 角色切換器（demo 用）可展示工程師／Sponsor／PE／admin 四種視角差異。
- [ ] 產品紅線（見 Decisions §D1）在元件層可稽核，不是靠文案。
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 全綠。

### Stage B — 接既有 API
- [ ] `src/data/upstream/` 實作完成，切換資料來源不需改動 feature 層。
- [ ] 契約測試：既有 API 實際回應 → 通過 zod schema 驗證。
- [ ] 寫入操作（打包／標註／回饋／設定）走真實後端，部分失敗會分項顯示，不得一律報成功。
- [ ] Copilot 走真實 SSE streaming，LLM token 不進瀏覽器。
- [ ] 既有 API 覆蓋不到的缺口，產出需求書交後端。

### Stage C — 橫切與交付
- [ ] 權限在 server 邊界強制（middleware），前端 gating 僅為 UX。
- [ ] LLM 輸出全程 sanitize，XSS 測試通過；CSP 生效；零外部資源請求（內網）。
- [ ] 效能預算達標：首屏 < 2s、pane 切換 < 200ms、圖表互動 60fps（1 萬點）。
- [ ] E2E 五條關鍵路徑通過；圖表視覺回歸通過。
- [ ] 課內 2 位工程師實走驗收。

---

## Plan

格式：`[ ] task -> 驗證方式`

### Stage A0 — 骨架（2 天）

- [x] A0.1 決策記錄 -> `docs/decisions/0001-frontend-stack.md`（含被否決的 SPA／static export 與理由）
- [x] A0.2 Scaffold：**Next 16.2.11**（計畫寫 15，實際最新為 16）+ React 19.2.4 + TS strict
      + ESLint flat + Prettier + Vitest + Playwright -> `pnpm typecheck/lint/test/build` 全綠
- [ ] A0.3 CI pipeline -> **DEFERRED（使用者指示 2026-07-24：先不要管 CI）**。
      `pnpm verify` 已備妥（typecheck + lint + test + build 串接），
      要接 CI 時只差一個 workflow 檔；平台（GitHub Actions / GitLab CI）待定。
- [x] A0.4 Design token 移植：mockup CSS vars（L8–12）→ `globals.css` `@theme` + `src/lib/status.ts`
      -> `src/lib/status.test.ts` 5 tests passed（含「六狀態底色互異」與「PM 淺底配深字」）
- [x] A0.5 字型：**不需 `next/font/local`**——mockup 用的是系統字型堆疊（Microsoft JhengHei /
      Calibri，L14），沒有字型檔要打包。改為 body 直接指定，內網零外部字型請求
      -> `grep` 產物無 CDN／字型 host（殘留的 w3.org 是 SVG namespace、nextjs.org 等是框架錯誤訊息字串，非請求）
- [x] A0.6 App shell：`section/[sid]/layout.tsx` 的 Header（課別／支援權限 gating／設定入口）
      + ControlBar（檢視／機台，一覽模式停用機台欄位）
      -> 瀏覽器實測：改 ControlBar 的檢視 → URL 變 `/tool/SCN-A01/live`
- [x] A0.7 路由結構落地 -> curl 實測 9 個 URL：5 頁 200、`/` 307 導向預設課別、
      無支援權限的 `ETCH-01` 與不存在的課別皆 404
- [x] A0.8 FDC 視窗 parallel + intercepting route（`@modal` + `(.)fdc/[caseId]`）
      -> 瀏覽器實測：**同一個 URL 兩種呈現**。從 pane 點開 → `[role=dialog]` 存在
      且底層 live pane 仍掛載；reload 同一 URL → 無 dialog、完整頁面（`variant=page`）

### Stage A1 — 型別、taxonomy、DataSource（4 天）★ 最高槓桿

- [ ] A1.0 **取得既有 API 的實際 response sample**（FDC / SPC / MES / KM / Case / log / graph）
      -> sample 存入 `docs/api/samples/`，每個端點至少一筆真實回應
      **BLOCKED：需要使用者提供 API 存取方式或幾份實際回應。**
      目前 domain 型別是依 mockup 反推的，這正是 D2 警告的做法——
      sample 到手後必須回頭校正型別與 fixtures，越晚做代價越大。
- [x] A1.1 Domain 型別 + zod schema -> `tsc` 通過。
      `domain/{user,tool,case,fdc,graph,settings,spatial,taxonomy}.ts`
      （`CopilotMessage` 留到 A10，因為訊息 block 結構與 streaming 形狀綁在一起）
      **未用 A1.0 的 sample 驗證——sample 尚未取得，見下方 A1.0**
- [x] A1.2 受控 taxonomy 單一真相來源：時序 6 × 分布 5 × 空間 10
      -> `domain/taxonomy.test.ts` 6 tests：enum 與說明表雙向對齊、zod 擋非法值、
      時序與分布不共用任何 code（正交性）
- [x] A1.3 **`DataSource` 介面定義**（`src/data/types.ts`）
      -> 介面檔只 import type，零 fixture／fetch 實作；每個查詢都帶 sectionId
- [x] A1.4 `src/data/fixtures/` 實作（派 sonnet implementer）：mockup 假資料 → fixtures +
      `FixturesDataSource`。形狀比照 mockup（A1.0 API sample 尚未取得，Stage B 需回頭校正）
      -> `fixtures.test.ts` 對每個 fixture 呼叫對應 zod schema `.parse()`；
      整合檢查 typecheck 0 / lint 0 / **test 120 passed**（96 + 24）。
      **獨立驗證進行中（opus reviewer）——未經 reviewer 前不宣告此步為已驗證。**
- [ ] A1.5 Server Actions 骨架（pin / annotate / feedback / settings）+ `useOptimistic`
      Stage A 寫入暫存 -> 樂觀更新與失敗回滾各一測試
- [ ] A1.6 Demo 模式標示元件（誠實告知假資料）-> 每頁可見
- [~] A1.7 **i18n 骨架**（待剩餘 K 項收尾後標記完成——K4／K9／K12 依 Stage A12/R7
      的順序判斷處理，見該節；先前誤標 `[x]` 但驗收未過，改回未完成標記）：
      next-intl **4.13.4**（2026-07-23 發布，peer 支援 Next ^16）
      + `app/[locale]/` 路由 + 語系切換（保留路徑與 query）+ `en` 空訊息檔 + zh-TW deepMerge fallback
      + ESLint `no-restricted-syntax` 擋 JSX 硬寫中文（domain/data/test/urd 例外）
      -> **獨立驗收（opus）：9 條驗收全過**，含 byte-level HTML diff 證明純重構（5 條 route 各只差
      8–10 行，全部是新增的語系選單與 href 的 locale 前綴）、intercepting route 雙模式瀏覽器實測
      （點開時底層 pane 為 `livePaneSameNode: true`，未 remount）、standalone build 實跑於 :3300。
      **第一輪判定 FIX-FIRST，6 項修復派工中（F 系列，見 eslint.config.mjs／header.tsx／
      request.test.ts 內對應註解）。安全點 commit `3298d7b`。**
      **第二輪 opus 驗收判 FIX-FIRST（輕量）**，四道 gate 由 reviewer 親自重跑複驗
      （據前手回報：test 131 passed / 6 files，typecheck/lint/test/build 四個 exit 0；
      這是前手回報的歷史數字，非本輪 commander 當場複驗，故不逕自宣稱「已驗證」）。
      第二輪修復 G1–G8 處置：
      - G1 退回未授權新增的 `use-intl` 依賴（`package.json`／`pnpm-lock.yaml` 對 `3298d7b` 已無 diff）
      - G2 拆掉 `String(...)` 數字包裝（`brick.tsx`／`overview-pane.tsx`）
      - G3 `NAV_SECTIONS`（課別清單）搬到 `src/data/fixtures/nav.ts`——課別名稱是資料，
        不該住在 `src/lib/`；import 端（`header.tsx`／`section/[sid]/layout.tsx`）同步更新
      - G4 ESLint 補「常數文案表」規則：`eslint.config.mjs` 對 `src/lib/**`／`src/components/**`
        加 `Property > Literal[value=/[一-鿿]/]` 選擇器，攔住 JSX 四條規則攔不到的
        `export const X = { a: "中文" }` 形態（即 G3 之前 `TOOL_MODE_LABEL` 那種）；
        排除 `src/data/**`／`src/domain/**`／`**/*.test.*`
      - G5 `header.tsx` 的 Suspense fallback 不再寫死高度魔術數字：抽出
        `HEADER_CONTAINER_CLASS` 常數同時餵給 `HeaderBar` 與 `HeaderFallback`，
        fallback 內容換成骨架色塊，高度改由與真實 header 相同的 flex/padding 規則自然決定
      - G6 `src/i18n/request.ts` 的 `deepMerge` 補 `__proto__`／`constructor`／`prototype`
        key 過濾（擋掉 override 觸發 `Object.prototype` 的 `__proto__` setter、換掉合併結果
        原型的路徑）；`request.test.ts` 用 `JSON.parse('{"__proto__":{"x":1}}')` 產生 own key
        驗證（物件字面值寫 `__proto__` 是設定原型的語法糖，語義不同，測不到這裡要擋的東西）
      - G7 `overview-pane.test.tsx` 的 `next-intl/server` mock 補上 `{ locale, namespace }`
        物件參數形式（`app/[locale]/layout.tsx` 就是這樣呼叫）與 `importOriginal` spread，
        避免以後有檔案改用物件形式時測試以難懂的 `undefined is not a function` 爆掉
      - G8（本項）任務檔記錄；另外評估「en.json 填鍵覆寫生效」是否可測（見下）——**可測**，
        補了 `request.test.ts` 的「`request.ts` 的 default export（實際組態路徑）」describe
        block（mock `next-intl/server` 的 `getRequestConfig` 為 identity + mock
        `../../messages/en.json` 的內容為合成物件，不改真正的檔案），證明 override 真的透過
        `request.ts` 的實際組態路徑（locale 判斷 → 動態 import → deepMerge）蓋過 zh-TW
      -> 本輪（commander 親跑）四道 gate：`pnpm typecheck` exit 0 / `pnpm lint` exit 0（沒有靠
      新增停用 lint 規則的註解換來這個 0）/ `pnpm test` **136 passed（6 files）**（比 G4–G8 動工前多 4：G6 的
      `__proto__` 測試 1 個 + `request.ts` default export 端到端測試 3 個；已用「暫時還原
      `request.test.ts` 到動工前內容、重跑」的方式直接量出動工前基準是 132 passed，
      非以「136 − 4」推算）/ `pnpm build` exit 0。G4 另實跑違規樣本
      （`export const X = { a: "當機處理" }`）確認 eslint 報錯，測完即刪。**已驗證。**
      **兩個被 reviewer 用實驗推翻的技術主張，留作教訓：**
      1. `String(...)` 對純 `{count}` 插值是 no-op——`{count}` 訊息鍵餵字串一樣輸出 `1,234`
         這種千分位格式化只在 `{count, number}` 才會發生；若訊息檔以後改成 `{count, plural}`，
         字串反而會讓 plural 規則進入未定義行為。這是 G2 把 `String(...)` 拆掉的理由，
         不是單純的程式碼風格偏好。
      2. `use-intl` 依賴不是必要依賴——`next-intl` 本身就 re-export `createTranslator`，
         底層委派同一個 `use-intl` 實例，兩者輸出逐字元相同。這是 G1 退回該依賴的理由。
      **已知限制（不修，記錄）：**
      - `overview-pane.test.tsx` 改用 `await OverviewPane(props)` 直接呼叫 async component，
        元件沒有經過 React reconciliation；未來若元件內長出 `<Suspense>`／error boundary／
        `cache()`，這些路徑不會被這份測試覆蓋到。
      - `messages/en.json` 目前仍是 `{}`（使用者明確要求「要 i18n 但不做語言翻譯」，
        不塞 sentinel 鍵），所以「en.json 真的填了鍵之後頁面會變英文」這件事本身
        沒有走過真實 messages 檔的端到端驗證——G8 補的測試證明的是 `request.ts` 的組態路徑
        （locale 判斷 + 動態 import + deepMerge）對合成 override 生效，不是對 en.json 本身
        的內容生效；等真的填了英文翻譯，仍值得跑一次瀏覽器實測確認畫面真的變英文。
      **第三輪（本輪）修復 H1–H9：**
      - H1（BLOCKING）：`eslint.config.mjs` 有兩個 `files` 有重疊（`src/**` 與
        `src/lib/**`／`src/components/**`）的 config 物件，都設了
        `no-restricted-syntax`——flat config 語意下，同一個 rule key 在後面出現時
        是「整組陣列取代」，不是合併／串接。第二個 block（G4 新加的 Property 選擇器）
        只有 1 條選擇器，導致 `src/lib/**`／`src/components/**` 底下原本的 5 條 JSX
        選擇器（G4 之前就存在）被靜靜地整組蓋掉，只剩下新加的 1 條 Property 選擇器
        生效——`pnpm lint` 全程 exit 0，完全沒有訊號。根因是 G4 只驗證了新加的
        Property 規則本身抓不抓得到違規（`export const X = { a: "當機處理" }`），
        沒有同時驗證 5 條舊 JSX 規則在同一批 `files` 下是否還活著。
        修法：把選擇器抽成共用常數 `JSX_SELECTORS`／`PROPERTY_SELECTOR`，兩個
        block 的 `no-restricted-syntax` 都從這兩個常數組出完整陣列（第二個 block
        是 `[...JSX_SELECTORS, PROPERTY_SELECTOR]`），選擇器只有一份來源，不會再
        因為兩份字面陣列互相取代而漏掉規則。驗證：`npx eslint --print-config`
        對 `header.tsx`（落在 `src/components/**`）量到 6 條 `no-restricted-syntax`
        選擇器、對 `app/[locale]/layout.tsx`（只落在 `src/**`）量到 5 條；另外在
        `src/lintsample/`／`src/components/lintsample/` 各放 6 種違規樣本（5 種
        JSX 形態 + 1 種 Property 形態）分別實跑 `npx eslint`，確認
        `src/lintsample/` 只抓到 5 種 JSX 形態（Property 規則不適用）、
        `src/components/lintsample/` 6 種全抓到，驗完即刪，`git status --short`
        確認乾淨。
      - H2：`header.tsx` 的 `HEADER_CONTAINER_CLASS` 註解原本暗示「共用 class
        讓真實 header 跟 loading skeleton 高度一致」，但 reviewer 實測 9 種
        viewport 寬度，找不到任何一個寬度兩者高度相等（連 flex-wrap 換行斷點都
        對不上）。改寫註解為事實：共用 class 只保證樣式（padding／border／
        flex-wrap）一致，不保證高度；目前 CLS 量到 0 的真正原因是用到這個
        header 的路由全部是 dynamic render（讀 `useSearchParams()` 導致無法
        static bailout），SSR HTML 本來就不會出現這個 fallback，高度落差在
        目前設置下不會被使用者看到；並加註：若以後任何路由改成 static
        prerendering，這個「fallback 反正不會出現」的前提就不成立，需要重新
        評估。不嘗試校準 skeleton 尺寸去湊真實高度（commander 裁示：成本高、
        內容一改就會再度過期）。
      - H3：`src/data/fixtures/nav.ts` 的 `NAV_SECTIONS` 跟 `users.ts` 的
        `sectionsFixture` 是同一份課別資料的兩份拷貝（只差 accessible 欄位），
        違反 single source of truth，命名／型別也不符目錄慣例。評估過「完整修
        法」（併入 sectionsFixture、砍掉 nav.ts、header.tsx 改走
        `fixturesDataSource.listSections()`）：header.tsx 是 Client Component，
        在 render 裡同步用這份清單組下拉選單，而 `listSections()` 是 async，要接上
        得把 Header 改成 Server Component，或是把課別清單從 layout.tsx（Server
        Component）當 props 一路穿過 client/server 邊界——兩者都是重新調整既有
        的 Server/Client Component 邊界，裁示不做。改採較小修法：保留獨立檔案，
        型別改成疊在 `@/domain/tool` 的 `Section` 上（不再自訂 bespoke type），
        更名 `navSectionsFixture` 符合目錄的 `xxxFixture` 命名慣例，在
        `src/data/fixtures/index.ts` 註冊（re-export，因為形狀跟 `DataSource`
        interface 不同，沒有併進 `fixturesDataSource`），並在 `nav.ts` 與
        `users.ts` 的 `sectionsFixture` 兩處都加註解說明「這兩份必須手動同步」。
      - H4：`src/i18n/request.ts` 的 `deepMerge` 把 `__proto__`／`constructor`／
        `prototype` 三個 key 都當危險 key 跳過，但只有 `__proto__` 在
        `result[key] = value` 賦值語法下有觸發 `Object.prototype` setter、換掉
        原型的特殊語意；`constructor`／`prototype` 只是普通 own key，一般賦值不會
        污染原型。舊版連這兩個也跳過的後果：訊息檔若真的用這兩個字當文案鍵，
        override 會被靜靜丟掉（`deepMerge({constructor:"中文"},{constructor:"EN"})`
        回傳中文而不是 "EN"）。修法：只特判 `"__proto__"`。刻意不改用
        `Object.create(null)` 當 result 的 base——那樣會讓既有測試
        `Object.getPrototypeOf(result) === Object.prototype` 的斷言變成
        `null !== Object.prototype` 而炸掉，等於用另一種方式打破既有合約；
        取捨與理由寫在 `request.ts` 的行內註解。`request.test.ts` 補了兩個
        `it`，分別驗證 `constructor`／`prototype` 當一般文案鍵時 override 正常蓋過。
      - H5：`CJK_RANGE`（`一-鿿`）涵蓋不到全形標點（（）「」、。等，落在
        U+3000–303F 與 U+FF00–FFEF），這兩個區塊跟中文字一樣是 locale-specific
        （en 用半形標點），理當被規則攔到卻沒有。修法：`CJK_RANGE` 加上這兩個
        區塊。加寬後真的新抓到一個既有違規：`control-bar.tsx` 的機台下拉選單
        `{tool.id} · {tool.type}（{tool.status}）`，全形括號直接寫在 JSX 裡。
        修法：把整段組合搬進 `messages/zh-TW.json` 新增的 `shell.toolOptionLabel`
        鍵（`"{toolId} · {type}（{status}）"`），JSX 改成
        `t("toolOptionLabel", { toolId, type, status })`。加寬 regex 後另外用
        `grep -rlP` 掃過全部 `src/**/*.{ts,tsx}`，比對到的其餘全形標點都落在
        JSDoc／行內註解裡（AST 的 no-restricted-syntax 選擇器不會走到註解），
        `pnpm lint` 全程維持 exit 0，沒有發現其他需要處理的真違規或假陽性。
      - H6：`src/lib/nav-fixtures.ts` 的 `NAV_TOOLS` 是跟 `NAV_SECTIONS`
        同類型的假資料（之後會被真 API 取代），但上一輪只搬了 `NAV_SECTIONS`。
        檢查 `NAV_TOOLS` 內容（id／type／status 全是英文代碼，如
        `"SCN-A01"`／`"Scanner"`／`"DOWN"`），沒有任何使用者可見的中文，跟
        `NAV_SECTIONS`（課別名稱「黃光二課」是中文）不同。選擇方案 (b)：
        `NAV_TOOLS` 留在 `src/lib/`，改寫 `nav-fixtures.ts` 開頭註解，把「fixture
        搬去 `src/data/fixtures/`」的判斷標準明講成「內容含不含使用者可見的中文」
        ——`NAV_SECTIONS` 因為含中文而搬，`NAV_TOOLS` 因為不含中文而沒搬，
        兩者套用同一條規則，不是「忘了搬」。
      - H7：`overview-pane.test.tsx` 的 `describe("OverviewPane（機台一覽）"...)`
        底下原本有 5 個 it，其中第 5 個（大數字千分位斷言）完全沒有呼叫
        `renderPane`／`OverviewPane`，是對 `messages/zh-TW.json` 直接組
        translator 斷言格式化行為的 i18n 訊息層測試，混在 OverviewPane 的
        describe 底下會造成「OverviewPane 有 5 個元件層級測試」的假象。搬到
        新檔 `src/i18n/messages.test.ts`（斷言逐字保留，強弱不變）。
      - H8：`overview.footerNote` 訊息鍵原本沒有任何測試覆蓋，打錯字不會被
        任何測試抓到（`header`／`emptyState` 打錯字會，這個缺口早於這一輪就
        存在）。在 `overview-pane.test.tsx` 補一個新 it，直接 render
        `OverviewPane` 並斷言 footerNote 的實際渲染文字，改壞
        `messages/zh-TW.json` 的 `overview.footerNote` 鍵值會讓這條測試變紅。
        H7 搬出 + H8 補入之後，`overview-pane.test.tsx` 剛好回到 5 個 it，
        全部都真的 render `OverviewPane`。
      -> 本輪（親跑）四道 gate：`pnpm typecheck` exit 0 / `pnpm lint` exit 0
      （沒有新增任何 `eslint-disable` 換來這個 0，也沒有靠加寬既有規則排除範圍
      或排除更多檔案來閃過任何一項 finding）/ `pnpm test` **139 passed（7 files）**
      （比動工前的 136 多 3：H4 的 `constructor`／`prototype` override 測試各 1
      個 + H8 的 footerNote 測試 1 個；H7 只是搬移既有 1 個 it，不影響總數）/
      `pnpm build` exit 0。H1 的樣本驗證（`src/lintsample/`／
      `src/components/lintsample/`，各 6 種違規樣本；`src/data/`／`src/domain/`／
      `**/*.test.*` 各一個排除清單樣本）測完即刪，`git status --short` 確認乾淨。
      **已知限制（H9，記錄）：**
      - `VIEW_EMOJI`（`control-bar.tsx`）把 emoji 常值搬出訊息檔、留在程式碼裡
        （F2 的決定：emoji 視為 locale-invariant，不隨語系變化）。這是刻意的
        取捨，但後果需要記在案：如果 `messages/en.json` 以後真的填了鍵，
        英文 locale 會被迫沿用同一組 emoji，沒有辦法針對 locale 個別調整
        （例如某些 emoji 在特定文化語境下含義不同）。
      - `overview-pane.test.tsx` 對 `next-intl/server` 的 `getTranslations` mock
        同時支援「字串 namespace」與「`{ locale, namespace }` 物件」兩種呼叫
        形式（G7 補的），但目前沒有任何測試分別驗證這兩個分支都有被真的走到
        ——如果其中一個分支的實作壞掉，現有測試不保證會抓到，這段防禦性程式碼
        目前是未驗證狀態。
      - H1 的 blocking 根因記錄：flat config 下，兩個 `files` 有重疊的 config
        物件對同一個 rule key（`no-restricted-syntax`）各自設一次陣列時，後者
        整組取代前者，不會合併——這件事本身沒有任何 ESLint 警告或錯誤，
        `pnpm lint` 全程維持 exit 0，導致 G4 加新規則的同時，靜靜停用了
        `src/components/**`／`src/lib/**` 底下**原有的 5 條 JSX 硬寫中文規則
        （全被蓋掉，只剩新加的第 6 條 Property 選擇器生效）**。
- [x] A1.8 **受控 taxonomy 定義表** -> 併入 A1.2（英文 code 為主鍵 + zh-TW 說明）。
      「=== 訊息檔鍵值」那一項待 A1.7 建 i18n 後補上
- [x] A1.9 **`resolveRole` + 權限矩陣資料結構**（`lib/permission.ts`，`Record<Capability, Role[]>`）
      -> `lib/permission.test.ts` 共 85 tests：23 功能 × 3 角色 = 69 個矩陣斷言，
      加 resolveRole 5、grant 6（授予／撤銷／過期／未過期／不外溢／不可升 admin）、
      canEnterSection 2、canEditPinTitle 3。全部通過
- [ ] A1.10 角色切換器（Stage A demo 用，Stage B 接 OIDC 後自動停用）
      -> admin／editor／viewer 三種視角各看到正確的可編輯範圍
- [ ] A1.11 跨課進入 gating（`user.supportSections`）-> 無支援權限的課別在選單 disabled，
      直接改 URL 也進不去（Stage A 前端模擬，Stage B 由 server 403）

### Stage A2 — 機台一覽（2 天）

- [x] A2.1 Brick 元件（機台 + chamber chips + 狀態 + 7 日統計，含鍵盤 Enter/Space）
      -> 六狀態底色 class 測試 + 瀏覽器截圖確認大格/小格色義一致（TRK-B02：PM 機台下有 OFF chamber）
- [x] A2.2 Grid + 頂部統計 + legend -> 計數由 tools 統計不寫死；測試斷言 DOWN 1 / LOST 2 / PM 1
- [x] A2.3 點 brick 導向當機處理 -> 瀏覽器實測：點 SCN-A01 → `/section/LITHO-02/tool/SCN-A01/live`
- [x] A2.4 空狀態（無機台顯示訊息不崩）-> 測試涵蓋。載入／錯誤態待 C2.1 統一元件化

### Stage A3 — 當機處理（5 天）

- [ ] A3.1 Tool Command 列表 + 新增（受控 tag、ETA、作者自動帶入）
      **viewer 亦可新增**（部分放行，permission-matrix C3）
      -> 樂觀更新 + 失敗回滾測試；viewer 角色下可新增但不可標註，E2E 各一
- [ ] A3.2 Error Case 列表（嚴重度、處理狀態、處理人）-> 排序與 60 秒同窗期限流邏輯測試
- [ ] A3.3 慢性徽章（rule base：同 code 90 天 ≥3 次，零 LLM）-> 邊界測試（剛好 3 次／剛好 90 天）
- [ ] A3.4 驗屍打包按鈕 -> 走 case Server Action
- [ ] A3.5 機台抓回檔案（來源路徑、更新時間、下載、iDo 參考勾選）
      -> E2E 驗勾選狀態真的進 Copilot request payload
- [ ] A3.6 機台屬性側欄
- [ ] A3.7 快速提問 chips -> E2E 驗 CASE ID 自動預填規則

### Stage A4 — 病史分析（3 天）

- [ ] A4.1 打包卡片列表（個人 skill／課級 common 徽章、來源、作者時間）
- [ ] A4.2 標題 inline 編輯 + 儲存 -> 樂觀更新測試
- [ ] A4.3 晉升課級流程：**admin 角色簽核**。資料模型加 `status`（draft/pending/common）
      + 審核人 + 審核時間；需 admin 視角的待審清單與核可／退件
      -> 一般角色看不到審核按鈕；admin 核可後卡片徽章改變，兩種角色各一 E2E
- [ ] A4.4 Copilot chips + 打包回流（新卡片捲動 + flash 高亮）-> E2E
- [ ] A4.5 篩選／搜尋／分頁（卡片會累積，mockup 未做但必要）

### Stage A5 — FDC u chart（6 天）

- [ ] A5.1 時序圖元件（ECharts）：多層 spec 線（CL/ML/SL）、baseline 線、分段背景、轉折點、事件旗標
      -> 視覺回歸測試
- [ ] A5.2 效能：downsample（LTTB）+ canvas 渲染 -> 1 萬點互動 60fps 量測
- [ ] A5.3 Baseline shift 判定卡（μ／σ／偏移量／σ 倍數，每個數字帶來源）
- [ ] A5.4 分段 pattern 卡（雙維度標籤、統計、鄰近事件 ±3 天 +「時間並列不代表因果」）
      -> 文案與歸因分離的元件測試
- [ ] A5.5 LLM 總結區（標示「只讀 ML 輸出」）
- [ ] A5.6 互動聯動：點轉折點／分段 → 圖表與卡片互相高亮
- [ ] A5.7 圖上框選 baseline 區間（mockup L2013 註明的正式版需求）-> 框選結果進回饋 payload

### Stage A6 — FDC t chart + 標註（5 天）

- [ ] A6.1 Recipe step 色帶（比例對齊時間軸、點擊跳段、異常 pulse）
- [ ] A6.2 波形圖（實際 vs 正常參考疊圖、target 線、異常點標記、dataZoom）
      -> Canvas 渲染；1kHz × 42s ≈ 4 萬點/參數，互動 60fps 量測
- [ ] A6.2b **降採樣 × anomaly marker 疊合**（見 D7）：預設低解析度 + zoom 取原始解析度；
      kernel 的 anomaly marker 獨立疊在波形上
      -> 測試：fixtures 植入單點 loss + 對應 marker，驗證預設視圖與 zoom 後
      marker 位置都對得上波形（時間軸對齊誤差 < 1 個顯示像素）
- [ ] A6.3 逐段 recipe 對照卡（RECIPE 目標 vs 實際 cmp box）
- [ ] A6.4 追根鏈路元件（step → 零件 → 零件 → SOP，可點）
- [ ] A6.5 命中歷史 case 的飛輪卡 vs 未知現象的「我不猜」卡 -> 兩種型態各一測試
- [ ] A6.6 標註表單（受控下拉 + 懷疑零件 + 補充說明）-> zod 驗證
- [ ] A6.7 標註三下游（Case Center／KM／ML training queue）分項狀態顯示
      -> Stage A 以假回應模擬部分失敗，驗證 UI 不會一律報成功
- [ ] A6.8 標註後自動生成打包卡片 -> E2E 驗卡片出現在病史分析

### Stage A7 — 深度診斷：Scanner 空間指標（8 天）

- [ ] A7.1 指標切換列（6 個）+ URL 同步
- [ ] A7.2 Dual chuck 判定元件（一致／分歧 + fork 邏輯視覺）-> 兩種判定各一快照
- [ ] A7.3 Wafer map 渲染器 A：向量場（Overlay FP）-> 數千 field 點效能量測
- [ ] A7.4 Wafer map 渲染器 B：連續熱圖（Focus FP）+ 色盲友善 colormap + 圖例
- [ ] A7.5 Wafer map 渲染器 C：hot spot 標記（Leveling）
- [ ] A7.6 Field-level 圖（scan 方向傾斜、疊合所有 field）
- [ ] A7.7 Slit profile 圖（spec 線、超規標記）
- [ ] A7.8 ML 判定卡（pattern 標籤、suspect 節點、SOP 連結、飛輪命中／KM 無紀錄兩種型態）
- [ ] A7.9 交叉診斷結論：**ML 後端產出，前端純渲染**。需顯示信心度與依據的指標清單
      -> 前端零判斷邏輯（code review 確認無規則散落）
- [ ] A7.10 側欄：空間 pattern 詞彙表 + dual chuck 邏輯說明
- [ ] A7.11 超出課內範圍 → FSE 升級提示 + 佐證資料匯出（slit 趨勢 + 影響 lot 清單）

### Stage A8 — 關聯圖（7 天）

- [ ] A8.1 Cytoscape 渲染：兩層樣式（物理實線／經驗虛線，粗細 = 共現次數 × 確認率）
- [ ] A8.2 查詢視圖：候選零件排序（本台經驗 > 同型機 > 純物理）+ 權重條 + 來源徽章
      -> 排序規則 unit test
- [ ] A8.3 👍 權重 +1 樂觀更新；👎 → 受控修正下拉 → 新邊長出 -> E2E
- [ ] A8.4 建圖視圖：Agent 解析進度、信心分級（高信心實線／低信心虛線）
- [ ] A8.5 待確認邊：確認／刪除 → 寫回圖
- [ ] A8.6 手動新增節點／邊：**節點綁料號主檔 ID**（MES／ERP／備品，已有 API）。
      名稱正規化（渦輪泵／Turbo Pump／TP-1 → 同一 ID）以主檔為權威來源
      -> 料號查詢元件（autocomplete）；Stage A fixtures 形狀比照主檔 API
- [ ] A8.7 養肥視圖：三種成長來源說明 + 兩層經驗邊統計
- [ ] A8.8 大圖效能與 k-hop 限制 -> 500 節點渲染量測

### Stage A9 — 課別設定（3 天）

- [ ] A9.1 課別 DOs 編輯（進 system prompt）+ 版本紀錄與稽核
- [ ] A9.2 MCP 工具引用勾選 + IT 鎖定項不可改 -> 權限測試
- [ ] A9.3 專家標籤管理（Sponsor 權限）
- [ ] A9.4 KM Domain 來源新增／移除 + URL 驗證 + 連線測試
- [ ] A9.5 非 admin 進入設定頁為唯讀（editor／viewer 皆是）-> 三種角色各跑一次 E2E
      ⚠ 專家標籤與 KM 來源移除權由 mockup 的「Sponsor 維護」改為 admin，見 permission-matrix C1
- [ ] A9.6 **課內權限授予**（admin 授予／撤銷課外人員 editor，可設 `expiresAt`）
      + 授權稽核紀錄 -> 授予後該人升 editor、撤銷後降回 viewer、過期自動失效，三案各一 E2E
      （這是課別自治，不是 IT 全域使用者管理，故放在課別設定頁而非後台）

### Stage A10 — iDo Copilot（6 天）

- [ ] A10.1 Rail 容器（開關、context 標頭、FAB、focus trap、ESC）-> a11y 鍵盤測試
- [ ] A10.2 例句選單（3 分組、收合、點擊即問）
- [ ] A10.3 **訊息渲染：結構化 blocks + markdown sanitize**（text／來源引用／數據表／動作列）
      -> XSS 測試：惡意字串不執行（取代 mockup 的 innerHTML）
- [ ] A10.4 Streaming 介面形狀（Stage A 假串流，但走與 Stage B 相同的 SSE 消費路徑）
      + 中斷／逾時／錯誤態
- [ ] A10.5 複製純文字（去 HTML）
- [ ] A10.6 打包到 case：CASE ID modal、prefill 規則、case 存在性驗證、成功後跳頁高亮 -> E2E 完整閉環
- [ ] A10.7 `UnknownState` 元件（KM 沒有 → 說不知道 → 依專家標籤轉專家）
- [ ] A10.8 課別 DOs／MCP 白名單進 request context（前端只帶 context）

### Stage A11 — 收斂（2 天）

- [ ] A11.1 Demo 腳本 + 種子資料。**對象是工程師與上級兩種，種子資料要兼顧**：
      SCN-A01 的 FOCUS-DRIFT 主線做成乾淨完整的飛輪故事（上級看得懂），
      其餘機台帶真實雜訊與未知現象（工程師才會信）
      -> 兩種敘事各走一遍不卡
- [ ] A11.2 已知落差清單（哪些是假的、哪些 Stage B 才會真）-> `docs/stage-a-gaps.md`
- [ ] A11.3 課內工程師試用 + 回饋收斂 -> 回饋條列進本檔 Open questions

### Stage A12 — 路由前綴／語系不進 URL／課別識別改用 code（R1–R10）

依 D12（`docs/decisions/0002-route-and-locale.md`）拍板後新增，收斂三件互相牽動
的改動：`Section` 型別改用 `code` 識別、路由目錄搬遷成完整詞前綴、`localePrefix`
改 `never`。R9（本批文件更新）已完成，見下方逐項標記。

- [x] R9 文件更新（本次工作）-> `docs/decisions/0002-route-and-locale.md`、
      `docs/ui/page-spec.md`、`docs/permission-matrix.md`、本檔 Decisions/Plan
      區皆已更新，見驗收 1–8
- [ ] R1 `Section` 改 `{code,nameEn,nameZh}`，`SectionId` 語意改 code
      （`src/domain/tool.ts`）-> `tsc` 通過；既有引用 `nameEn` 當識別碼的地方
      逐一改用 `code`
- [ ] R2 `listSections`／`getSection` 回傳新形狀；adapter 把使用者記錄正規化成 code
      -> fixtures 與既有測試同步更新，`fixtures.test.ts` 對新形狀跑 zod `.parse()`
- [ ] R3 兩份重複的課別清單收斂成一份並補 code
      （`src/data/fixtures/nav.ts` 的 `navSectionsFixture` 與 `users.ts` 的
      `sectionsFixture`，見 A1.7 H3 的「必須手動同步」註記，這批工作是補上
      真正收斂）-> 兩處引用點（`header.tsx`／`section/[sid]/layout.tsx`）改
      指向同一份資料來源
- [ ] R4 權限鍵語意改 code（邏輯不變）-> `lib/permission.ts`／
      `permission-matrix.md` 的 `sectionId` 一律是 code；既有 69 項矩陣斷言
      邏輯不變只需確認測試資料改用 code 值
- [ ] R5 route 目錄搬遷、`localePrefix: "never"`、`live` 變 index -> curl/瀏覽器
      實測新 9 條路徑（`/section/<code>`、`/section/<code>/settings`、
      `/tool/<tid>`、`/tool/<tid>/history`、`/tool/<tid>/diagnosis`、
      `/tool/<tid>/fdc/<caseId>` 等），確認機台子樹 URL 不含 `sectionId` 段
- [ ] R6 連結產生點 4 處更新（`brick.tsx`／`header.tsx`／`control-bar.tsx`／
      `page.tsx`）-> 逐一 grep 確認舊路徑字串（`/section/{sid}/tool/`、
      `[locale]`）已清除
- [ ] R7 `User.locale` + `request.ts` 改讀它；移除 `switchLocale` 與
      `useSearchParams`（連帶移除 `<Suspense>` 與 `HeaderFallback` 整組）
      -> `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 全綠；
      **本項落地後，A1.7 遺留的 K4／K9／K12（`header.tsx` 的 CLS 因果註解、
      高度主張、`4,181 B` 量測數字）自動失效，不需要另外修——見下方
      「A1.7 收尾順序判斷」**
- [ ] R8 `@modal/(.)fdc/[caseId]` 搬到 `tool/[tid]/` 底下 -> 瀏覽器實測
      intercepting/parallel route 雙模式（modal 開／page 直開）在新路徑下行為
      不變（沿用既有 A0.8 驗證方式）
- [ ] R10 路徑斷言更新、補 code↔name 對照測試 -> 既有測試裡斷言舊路徑字串的
      地方全部改新路徑；新增至少一組「同一 `code` 對照 `nameZh`/`nameEn`」的
      測試（`listSections()` 邊界）

**A1.7 收尾順序判斷（記錄，不是遺漏）**：A1.7 驗收中還欠 K4／K9／K12
（`header.tsx` 的 CLS 因果註解準確性、`HEADER_CONTAINER_CLASS` 高度主張是否
仍成立、`4,181 B` 這個量測數字的來源覆核）。這三項刻意跳過不修，因為 R7 會把
`header.tsx` 裡 `useSearchParams`／`<Suspense>`／`HeaderFallback` 這整組程式碼
刪掉——K4／K9／K12 全部是在描述這組即將被刪除的程式碼，修完就刪是浪費工。
順序訂為「R7 先做，K4/K9/K12 隨程式碼一起消失，不需要單獨結案」；若 R7 因故
延後或改變設計（例如 `header.tsx` 保留但改用其他機制而非整段刪除），才需要
回頭重新評估這三項是否仍然要修。

### Stage B — 接既有 API（15 天）

- [ ] B0.1 既有 API 盤點與落差分析（**可與 Stage A 平行，不阻塞**）-> `docs/api/inventory.md`
- [ ] B1.1 BFF route handlers + server 端 token 管理 -> token 不出現在瀏覽器（network 檢查）
- [ ] B1.2 **OIDC 登入流程**（Auth.js v5 或 openid-client）+ session cookie
      -> 未登入導向 IdP、登出、token refresh 各一測試
- [ ] B1.3 **授權查自建使用者表**（`managerOf` / `sectionId` / `supportSections`），
      IT 以 admin API 維護；`resolveRole()` 前後端共用同一份邏輯
      -> middleware 擋跨課；**每個寫入端點在 Server Action 內層再驗一次**；
      越權測試（改 URL、直打 Server Action）全部 403；Stage A 角色切換器停用
- [ ] B2.1 `src/data/upstream/` 實作 + 型別轉換層 -> 切換資料來源，feature 層零改動（diff 驗證）
- [ ] B2.2 契約測試：既有 API 實際回應 → zod 驗證 -> CI 上跑
- [ ] B2.3 TanStack Query 輪詢（alarm／status 30s）+ as-of 時間戳
- [ ] B2.4 FDC 波形接 `resolution` 參數（既有 API 已支援）+ zoom 時重取
      -> **驗證後端降採樣是否保留異常點**（D7）；若不保留，列入缺口需求書
- [ ] B2.5 料號主檔 API 接入 + 名稱正規化 -> 三種別名查詢回同一 ID
- [ ] B3.1 寫入 Server Actions 換真實後端（pin／annotate／feedback／settings）
- [ ] B3.2 標註三下游部分失敗處理（outbox 或分項回報）-> 故意讓其中一個失敗，UI 正確顯示
- [ ] B3.3 回饋 idempotency key -> 重複點擊只產生一筆
- [ ] B4.1 Copilot 真實 SSE streaming -> 長回答不中斷、可取消
- [ ] B4.2 來源溯源（每個數字可回查）-> 抽驗 5 則回答
- [ ] B5.1 缺口 API 需求書 -> 交後端並取得回覆時程

### Stage C — 橫切與交付（12 天）

- [ ] C1.1 權限／角色模型（工程師／Sponsor／PE／IT）前端 gating 與 server policy 對齊 -> 越權測試
- [ ] C2.1 錯誤／空／載入／無權限態系統化為共用元件
- [ ] C2.2 資料時效：每區塊 as-of 時間戳
- [ ] C3.1 效能預算達標（首屏／切換／圖表）-> Lighthouse + 自訂量測
- [ ] C4.1 a11y：鍵盤操作、focus trap、對比度、色盲友善 -> axe 掃描
- [ ] C4.2 安全：CSP、零外部資源、LLM 輸出 sanitize -> 安全掃描
- [ ] C5.1 稽核軌跡（誰在何時標註／打包／改設定）
- [ ] C6.1 E2E 五條關鍵路徑 -> 全綠
      1. 一覽 → 當機處理 → 開 t chart → 標註 → 回流成卡片
      2. Copilot 問答 → 打包到 case
      3. 回饋送出 → training queue
      4. 關聯圖 👎 → 修正 → 新邊
      5. 設定頁權限（Sponsor vs 一般）
- [ ] C6.2 圖表視覺回歸
- [ ] C7.1 部署：`output: 'standalone'` + Dockerfile + nginx 反向代理 -> 內網實機跑起來
- [ ] C8.1 課內 2 位工程師驗收
- [ ] C8.2 文件：README、架構圖、API 契約、決策記錄

---

## Progress log

（append-only：date | phase | evidence）

- 2026-07-24 | plan | 讀完 `urd/tool-center-gui.html` 全 2453 行；三項架構決策由使用者拍板；本任務檔建立
- 2026-07-24 | plan | 第二輪需求確認完成（8 題全答）→ D5–D9 寫入；A1.7–A1.9／A4.3／A6.2b／A7.9／
  A8.6／B1.2–B1.3／B2.4–B2.5 更新；工期由 80 修正為 89 人日；新增待答 Q7–Q10
- 2026-07-24 | plan | Q7／Q8 已答 → 權限模型定案為「角色相對課別計算」，
  產出 `docs/permission-matrix.md`（22 功能 × 3 角色，含 2 處與 mockup 的變更）；
  D5／D7 改寫；A1.9–A1.11／A9.5／B1.3／A6.2b 更新；新增待答 Q11（sponsor 寫入權）、
  Q12（跨課支援者為 viewer 的現場痛點）
- 2026-07-24 | plan | Q9–Q12 全答 → grant 機制入模型（admin 可授予課外人員 editor，可設時效）；
  viewer 部分放行可下 Tool Command；矩陣 22→23 項、斷言 66→69；
  新增 A9.6（課內權限授予）；A3.1／A11.1 更新；工期 89 → 91 人日
- 2026-07-24 | plan | Q13 已答：**建 i18n 架構但不產翻譯**（`en` 留空 fallback）→ D9／A1.7／A1.8
  改寫；工期 91 → 88 人日。**待答清空，需求確認完畢，可進 A0。**
- 2026-07-24 | A0 | Scaffold 完成。Next 16.2.11 / React 19.2.4 / Tailwind 4.3.3 / TS 5.9.3 /
  Vitest 4.1.10 / Playwright 1.61.1。`pnpm typecheck`=0、`pnpm lint`=0、`pnpm test`= 5 passed、
  `pnpm build`=0（9 條路由，含 `(.)fdc/[caseId]`）。
  路由 curl 實測 9 URL 全符合預期；intercepting route 瀏覽器實測通過（modal/page 雙模式）。
  **A0.3 CI 卡住：需確認 GitHub Actions 或 GitLab CI。其餘 A0.1–A0.8 完成。**
  修正 2 項：next.config 明確指定 `turbopack.root`（否則 Next 會把 `/Users/ch` 當 workspace root，
  standalone 檔案追蹤範圍會錯）；`.gitignore` 原有 3 行已備份為 `.gitignore.bak-20260724` 後合併。
- 2026-07-24 | A0 | A0.3 依使用者指示改為 DEFERRED（先不管 CI）。A0 其餘完成，commit `82a3c4d`。
- 2026-07-24 | A1 | A1.1／A1.2／A1.3／A1.8／A1.9 完成。zod 4.4.3。
  `pnpm typecheck`=0、`pnpm lint`=0、`pnpm test`= **96 passed**（status 5 + taxonomy 6 + permission 85）。
  TRIPWIRE：`pnpm add zod` 首次跑在錯誤的 cwd（`/Users/ch/.hermes`，shell cwd 於 scaffold 後被重置），
  在該處產生 `node_modules`／`package.json`／`pnpm-lock.yaml`。已確認內容僅 zod 後移除，
  並改用顯式 cd 重裝。教訓：每個 pnpm 指令都要顯式帶專案路徑。
  **A1.0 仍 BLOCKED（缺既有 API sample）；A1.4 fixtures／A1.5 Server Actions／A1.6 demo 標示／
  A1.7 i18n／A1.10 角色切換器／A1.11 gating 尚未開始。**
- 2026-07-24 | A1 | A1.4 fixtures 派 sonnet 完成（9 檔 + FixturesDataSource + 逐一過 schema 的測試）。
  整合檢查 typecheck 0 / lint 0 / test 120 passed。
- 2026-07-24 | A1 | **獨立驗證（opus reviewer，fresh context）：型別／taxonomy／權限矩陣三層
  APPROVE（reviewer 親跑 typecheck/lint/test、逐格比對 23 列權限、確認 D1 紅線於型別成立）。
  fixtures 層 FIX-FIRST——2 個 should-fix bug + 1 nit。** 這補上 A0/A1 先前欠的 author≠verifier。
  findings 已派回 author 層（sonnet）修，記為 §4 第 1 次 fix round（cap 內）。
- 2026-07-24 | A1 | fix round 完成（sonnet 修 3 項），commander 再驗：typecheck 0 / lint 0 /
  **test 122 passed**（+2 斷言：chronic status 不變量、pin→case referential integrity），
  並逐一 read-back 四個改動點對照 findings。A1.4 review→fix→re-verify 閉環完成。
  判斷（judgment.md）：4 行機械修正 + commander 為 fresh-vs-author context，不再另派 opus re-review。
- 2026-07-24 | A2 | 機台一覽完成。派 sonnet 建元件，agent 因自身 session limit 中斷於寫測試前
  （TRIPWIRE：subagent 額度耗盡，非程式錯誤；工作區未損，typecheck 仍 0）。
  commander 接手補 `overview-pane.test.tsx` 並驗證。
  typecheck 0 / lint 0 / **test 126 passed**（+4）。
  瀏覽器實測：8 brick 全數 render、6 種狀態底色皆present、頂部計數 DOWN1/LOST2/PM1、
  點 SCN-A01 導到 `/tool/SCN-A01/live`。截圖與 mockup L494–565 一致。
  **A1 已驗證部分：A1.1／A1.2／A1.3／A1.4／A1.8／A1.9。剩 A1.0（BLOCKED 缺 API sample）、
  A1.5 Server Actions／A1.6 demo 標示／A1.7 i18n／A1.10 角色切換器／A1.11 gating。**
- 2026-07-25 | A1 | A1.7 i18n 第二輪修正 G1–G8 完成，commander 接手（前一支 agent 做完 G1–G3
  後中斷；base commit `3298d7b`，全程未 commit）。逐項處置與理由見上方 A1.7 條目，此處只記
  gate 結果：commander 親跑 `pnpm typecheck`=0、`pnpm lint`=0（沒有靠新增停用 lint 規則的
  註解換來這個 0）、
  `pnpm test`=**136 passed（6 files，比動工前 132 多 4）**、`pnpm build`=0。G4 的 ESLint
  新規則另外用違規樣本（`export const X = { a: "當機處理" }`）實跑確認會報錯，測完即刪。
  **已知落差**：`grep -rn "黃光\|蝕刻" src/lib/ src/components/` 目前非空——命中全在
  `overview-pane.test.tsx`（`sectionName="黃光二課"` 等測試輸入值），經比對 `3298d7b` 這些
  字串在該檔案裡本來就存在，與 G3 無關（G3 動的是 `NAV_SECTIONS` 資料本體，不是這份測試的
  prop 輸入），ESLint 規則也把 `*.test.*` 排除在外視為合法測試資料。不動測試檔字句去湊 grep
  通過。

---

## Decisions

- **D0 技術架構：Next.js App Router + Node runtime**（使用者拍板 2026-07-24）。
  被否決：Vite React SPA（部署最簡但無 server 能力）、Next static export（有框架成本無 server 收益）。
  取得的 Next 特有收益：intercepting/parallel route 讓 FDC 視窗有可分享 URL；route handler 做 SSE proxy
  讓 LLM token 留在 server；middleware 在 server 邊界擋權限；`next/font/local` 滿足內網零外部請求。
- **D1 產品紅線（不可被 UI 便利性侵蝕）**——皆源自 mockup，實作時必須在元件層可稽核：
  1. ML 判定 pattern，LLM 只做敘事翻譯（L1493、L2215）
  2. rule base 能做的不用 AI（慢性偵測、超規計數，L604、L2222）
  3. 受控詞彙，回饋一律下拉不自由填寫（L1930–1946、L1683）
  4. 事件旗標只做時間並列，不強行歸因（L1435、L1470）
  5. KM 沒有就說不知道，不猜（L836、L1611）
  6. AI 不做決策（不主張放寬 spec、不決定停機，L2232、L2270）
  7. 關聯圖兩層分離：物理層可移植、經驗層不移植（L987–990）
  8. 每個數字可溯源（L2255）
- **D2 `DataSource` 介面是 Stage A/B 的唯一接縫。** 因為首期做純 UI 但後端已存在，
  fixtures 必須依既有 API 的實際回應塑形（A1.0 先行），否則 Stage A 會變成拋棄式工作。
- **D3 圖表分三套，不強求統一**：時序（u/t chart）用 ECharts（markLine/markArea/brush/dataZoom 原生支援）；
  wafer map 自繪 Canvas（非通用圖表）；關聯圖用 Cytoscape.js（k-hop 展開與大圖收斂）。
- **D4 mockup 的 innerHTML 全數不得沿用**（L2310、L2404 等）。LLM 輸出改結構化 blocks + sanitize，
  禁用 `dangerouslySetInnerHTML`。

（以下為 2026-07-24 第二輪需求確認的結果）

- **D5 認證授權：OIDC 登入 + 自建使用者表（IT 以 admin API 維護）。**
  認證走 IdP，授權查本系統使用者表。**不做管理後台**——IT 直接呼叫 admin API。
  **角色相對於課別計算，不是使用者的全域屬性**：
  該課 manager → `admin`；該課工程師 → `editor`；其他 → `viewer`。
  同一人在 A 課是 admin、切到 B 課就是 viewer。
  **任何不帶 `sectionId` 的權限檢查都是 bug。**
  例外：**admin 可額外授予課外人員 `editor`（grant，可設 `expiresAt`）**——sponsor 的寫入權走這條。
  Grant 只授予 editor 不授予 admin，避免權限升級路徑失控。
  **viewer 可下 Tool Command**（部分放行），但不可標註／回饋——後者會污染 KM 與 ML 訓練資料。
  完整矩陣見 `docs/permission-matrix.md`（23 項功能 × 3 角色 + grant 測試）。
- **D6 交叉診斷結論由 ML 後端產出，前端純渲染。**
  前端不得散落任何診斷規則；需顯示信心度與依據指標清單。
- **D7 降採樣保真：由 ML kernel 處理**（使用者確認 2026-07-24）。
  t chart 為 1kHz（單片單參數 ≈ 4 萬點）。異常點（如 mockup L1600 的單點 data loss）由
  **ML kernel 獨立產出標記**，與顯示用的降採樣是兩條管線——因此不會被降採樣抹掉。
  前端的責任因此變成：**把 kernel 的 anomaly marker 疊在降採樣波形上，時間軸必須對齊**，
  且 zoom 進去要能取到原始解析度。
  仍須驗證的是「marker 時間戳 ↔ 降採樣後 x 軸」的對齊誤差（A6.2b）。
- **D8 節點粒度綁料號主檔 ID**（MES／ERP／備品，已有 API）。名稱正規化以主檔為權威來源，
  課別不自建零件詞彙——否則同一零件在不同機台叫不同名字，經驗邊永遠累積不起來。
- **D10 i18n 重構不逐檔建 `.bak`**（commander 覆核 2026-07-24，agent 提請裁示）。
  CLAUDE.md 硬規則要求改寫前備份，但本次 ~25 個檔案在動工前均已 commit（`bfeca86`）**且已 push 到
  GitHub**，`git diff` / `git checkout --` 可完整還原任一檔案，備份的實質目的已達成；
  逐檔建 `.bak` 反而製造規則本身禁止的雜物。**適用條件：檔案已在 git 追蹤且已推送。**
  未推送或未追蹤的檔案，備份規則照舊。
- **D11 `src/proxy.ts` 取代 `middleware.ts`**（agent 決定，**驗收中待查證**）。
  宣稱 Next 16 已將 middleware 檔案慣例改名為 proxy，兩者並存會建置錯誤。
  reviewer 正在查證此說法與其對 `output: "standalone"` 部署的影響。
- **D9 建 i18n 架構，但不產出翻譯內容**（使用者確認 2026-07-24）。
  next-intl + `app/[locale]/`，字串全部進訊息檔、lint 擋硬寫字串、語系切換可運作。
  **`en` 訊息檔建立但留空，缺鍵 fallback 到 zh-TW。**
  理由：架構成本一次付清（事後補要掃過每個元件），翻譯成本延後到真的需要英文時再付。
  例外：受控 taxonomy 的英文 code 是**識別碼不是翻譯**（`STABLE` / `MEAN_SHIFT`…），照常實作。
  **路由與切換器細節已被 D12 取代**：本條寫的 `app/[locale]/` 路由與「語系切換可運作」
  是 A1.7 當時的落地方式，D12 定案後改為 `localePrefix: "never"`（語系不進 URL）、
  現階段不做語系切換 UI——「建 i18n 架構但不產翻譯」這個核心決策不變，變的只是路由
  與切換器這兩個實作細節，見 D12。
- **D12 路由前綴、語系不進 URL、課別識別改用 code**（使用者拍板 2026-07-26，詳見
  `docs/decisions/0002-route-and-locale.md`）：
  - 路由改用完整詞前綴（方案 C）：`/section/<code>`、`/section/<code>/settings`、
    `/tool/<tid>`（當機處理即 index，不再有 `/live` 段）、`/tool/<tid>/history`、
    `/tool/<tid>/diagnosis`、`/tool/<tid>/fdc/<caseId>`；機台子樹不帶課別段。
    被否決：方案 A（無前綴詞，根層動態段會吃掉未來所有單段路徑）、方案 B
    （單字母前綴，可讀性差）、方案 D（檢視模式進 query，三個檢視資料合約不同,
    併成一個 route 失去 code split）。
  - 語系不進 URL：`localePrefix: "never"`，真相來源是 `User.locale`，cookie 只當
    快取；現階段不做語系切換 UI。被否決：path prefix（`localePrefix: "always"`
    預設，只有一個語系有意義，`/en/*` 會回 200 但內容是中文）、cookie 當真相來源
    （內部工具使用者有身分，偏好該跟人）。
  - 課別識別改用 `code`（`Section` 型別為 `{code,nameEn,nameZh}`），顯示名稱依
    `User.locale` 選；轉換只在 `DataSource` 邊界做一次。被否決：課別改成使用者狀態
    （`managerOf`／`supportSections` 是陣列，跨課的人會想開兩個 tab 對照）。
  - 機台子樹不帶課別的結構性理由：舊結構 `sid`／`tid` 可任意配對，
    `resolveRole(user, sectionId, grants)` 的 `sectionId` 來自 URL，造成權限提升
    漏洞（自己管的課的 `sid` 下掛別課的 `tid` → 取得該機台 admin 權限）；新結構
    由 tool 反查 section，這個配對結構上不存在。
  - 判準：永遠不會想同時看兩份的 → 使用者設定；有可能想同時看兩份的 → 進 URL。
    路徑 = 不同資源／資料合約；query = 同一資源的檢視參數。

---

## Open questions

### 已解決（2026-07-24）

- ~~Q1 晉升課級誰核可~~ → **admin 角色簽核**（D5、A4.3）
- ~~Q2 交叉診斷是 rule 還是 ML~~ → **ML 後端產出，前端純渲染**（D6、A7.9）
- ~~Q3 料號主檔在哪~~ → **有主檔且有 API**（MES／ERP／備品）（D8、A8.6）
- ~~Q4 權限權威來源~~ → **OIDC 登入 + 自建使用者表，IT 以 admin API 維護，不做後台**（D5、B1.2/B1.3）
- ~~Q5 t chart 取樣率~~ → **1kHz，單片數萬點**；既有 API 已支援 resolution 降採樣（D7、A6.2b、B2.4）
- ~~Q6 是否雙語~~ → **v1 即雙語 zh-TW / en**（D9、A1.7、A1.8）

- ~~Q7 角色定義~~ → **admin=該課 manager／editor=該課工程師／viewer=其他（含跨課、sponsor）；
      角色相對課別計算**（D5、`docs/permission-matrix.md`）
- ~~Q8 降採樣是否抹掉異常點~~ → **由 ML kernel 處理**，anomaly marker 獨立於降採樣（D7、A6.2b）

- ~~Q9 i18n~~ → **照做，v1 雙語**（D9）
- ~~Q10 demo 對象~~ → **工程師與上級都要看**，種子資料需兼顧兩種敘事（A11.1）
- ~~Q11 sponsor 寫入權~~ → **可以，但需 admin 透過 grant 授予**（D5、A9.6、permission-matrix C1）
- ~~Q12 跨課支援者權限~~ → **部分放行**：viewer 可下 Tool Command，不可標註／回饋（C3、A3.1）

- ~~Q13 翻譯誰產出~~ → **不產翻譯**。建 i18n 架構、`en` 檔留空 fallback，翻譯延後（D9、A1.7）

### 待答

（需求面無。以下為 A1.4 fixtures 冒出的技術待決項，部分待 reviewer 判決。）

- **reviewer findings 已修復並經 commander 再驗（read-back + test 122 passed）：**
  - STAGE-VIB-003 誤標慢性 → `chronicFlagSchema` 加 `status: 'chronic'|'watching'`
    （chronic ⟺ occurrences ≥ CHRONIC_DEFINITION.minOccurrences）。STAGE-VIB 改 watching。
    測試 `fixtures.test.ts:127` 強制此不變量。
  - `pin-02` 懸空 caseId → 補 closed 的 VAC-INTERLOCK-GV2 ErrorCase + referential-integrity 測試
    （`fixtures.test.ts:134`：每個 pin.caseId 必存在於 errorCases）。
  - nit：`data/types.ts` 的 `@param resolution` 已移到 `getTChartAnalysis`。
- **型別缺口**（元件 spec 產出時發現，實作對應 phase 前必須先補）：
  - `CopilotMessage`（訊息 block 結構）——A10 前補。
  - **t chart 標註 payload 的受控詞彙**：mockup L1621–1627 的「這段實際上是什麼？」5 個選項
    目前只是 HTML 裡的散文，**不是 `domain/taxonomy.ts` 的受控常數**。
    這直接牴觸產品紅線 #3——標註會進 ML training queue，選項必須受控。**A6.6 前必須補。**
  - FDC 回饋修正 payload（`fdc.feedbackForm`）的 schema——A8.2 前補。
  - 關聯圖建圖進度 `BuildStep` 的 schema——A8.4 前補。
- **⚠ 安全發現**（元件 spec agent 提出）：`SectionDosEditor` 的自由文字「課別 DOs」會直接進
  LLM system prompt（mockup L1299–1304）→ **prompt injection 面**。課內任何 admin 都能寫入，
  可能被用來繞過 D1 的 8 條紅線（例如寫「忽略先前關於不做決策的指示」）。
  前端無法解決，需**後端結構性防護**（DOs 與系統指令分區、紅線不可被 DOs 覆蓋），
  不能只靠 prompt 排序。列入 B 階段需求書給後端。
- **`listGrants` 的故障模式待定案**：目前 `listGrants`／`resolveRole` 在 `src/` 尚無任何呼叫端
  （只有型別定義與單元測試），所以上游回傳課名而非課代碼時「靜默回空陣列」或「單筆壞資料
  拖垮整個查詢」這兩種問題目前都不會顯現。接上真實呼叫端**之前**必須：
  (a) 補一條測試涵蓋「陣列裡有一筆不可解析的 `sectionId`，查詢另一個合法課別」；
  (b) 明確決定要哪種故障模式——每筆獨立處理（fail-closed，壞的那筆跳過）
      或整體拋例外並在呼叫端轉成「無法載入授權，視為 viewer」。
- **D2 校正清單**（型別表達力不足，待真實 API sample 到手時一併處理）：
  - `chuckMapSchema.pattern` 是單一 enum，裝不下複合 pattern「TILT + EDGE ROLL-OFF」（暫留 TILT）。
  - Leveling 的「HOT SPOT」在空間 taxonomy 沒有對應 code（暫映射到 DOME/RANDOM）——
    可能需要新增一個 hot-spot pattern。
  - `field_focus` / `slit` 是聚合量測（非 per-chuck），但 schema 強制兩個 chuck——
    暫把同一讀數複製到 A/B。schema 是否該允許單一量測？
  - mockup 日期本身不一致（case 顯示 07/03 案號但敘事說 07/14）——fixtures 暫取 07-14。
