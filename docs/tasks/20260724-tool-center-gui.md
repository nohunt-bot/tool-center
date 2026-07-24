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
- [ ] A1.7 **i18n 骨架**：next-intl + `app/[locale]/` 路由 + 語系切換 + `en` 空訊息檔 fallback
      -> 切換語系不掉頁面狀態；lint 規則擋下硬寫中文字串；切到 en 全站 fallback 顯示 zh-TW 不報錯
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
- **D9 建 i18n 架構，但不產出翻譯內容**（使用者確認 2026-07-24）。
  next-intl + `app/[locale]/`，字串全部進訊息檔、lint 擋硬寫字串、語系切換可運作。
  **`en` 訊息檔建立但留空，缺鍵 fallback 到 zh-TW。**
  理由：架構成本一次付清（事後補要掃過每個元件），翻譯成本延後到真的需要英文時再付。
  例外：受控 taxonomy 的英文 code 是**識別碼不是翻譯**（`STABLE` / `MEAN_SHIFT`…），照常實作。

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
- **D2 校正清單**（型別表達力不足，待真實 API sample 到手時一併處理）：
  - `chuckMapSchema.pattern` 是單一 enum，裝不下複合 pattern「TILT + EDGE ROLL-OFF」（暫留 TILT）。
  - Leveling 的「HOT SPOT」在空間 taxonomy 沒有對應 code（暫映射到 DOME/RANDOM）——
    可能需要新增一個 hot-spot pattern。
  - `field_focus` / `slit` 是聚合量測（非 per-chuck），但 schema 強制兩個 chuck——
    暫把同一讀數複製到 A/B。schema 是否該允許單一量測？
  - mockup 日期本身不一致（case 顯示 07/03 案號但敘事說 07/14）——fixtures 暫取 07-14。
