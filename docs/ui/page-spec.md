# Tool Center 頁面設計文件

Status: draft (2026-07-25)

來源：`docs/ui/component-spec.md`（元件庫定案文件，本檔**只使用**其中已定義的元件名稱，
不自創任何元件）、`urd/tool-center-gui.html`（2453 行，行號皆指向此檔）、
`docs/permission-matrix.md`（23 項 capability × 3 角色）、
`docs/tasks/20260724-tool-center-gui.md`（Decisions D1–D11、Plan Stage A 各步驟）、
`src/data/types.ts`（`DataSource` 介面）、`src/domain/*.ts`、`src/lib/permission.ts`、
`src/lib/status.ts`。

本文件是**頁面設計文件**，不含實作程式碼、不改動 `src/**`／`urd/**`／`component-spec.md`／
其他 `docs/**`。目的是讓 Stage A3–A10 的實作者能照著建，不必回頭讀 2453 行的 mockup。

「工程師正在改 `src/` 進行 i18n 重構」——本文件讀 `src/` 只為了確認既有實作現況
（頁面 1）與型別/Capability 的真實名稱，不假設 `src/` 目前的其他狀態是穩定的；
資料與行為的權威來源一律是 `docs/` 與 `urd/`。

七個畫面對應的 Stage：機台一覽（A2，已實作）、當機處理（A3）、病史分析（A4）、
深度診斷（A7+A8）、課別設定（A9）、FDC 分析視窗（A5+A6）、iDo Copilot 側欄（A10）。

---

## 1. 機台一覽（`/section/<code>`，A2，已實作）

mockup 行號區間：L494–567（`<div class="pane" id="pane-overview">` 至其對應
`</div>`，已用 `sed -n '490,570p'` 核對起訖）。

### 1.1 用途與使用情境

課別內任何角色（admin／editor／viewer）進入 Tool Center 的**預設落地頁**：一眼掃過全課
機台目前的狀態（UP/DOWN/OFF/WEQ/PM/LOST），決定要點進哪一台去處理當機或看歷史。
這一頁不做任何分析，只做「這課現在整體長什麼樣」的快速定向——這是為什麼它不需要
TwoColumnLayout 或側欄：內容單一且扁平。

### 1.2 版面結構

- 單欄，由上而下：
  1. 標題列：課別顯示名稱＋機台數＋（若 DOWN/LOST/PM 任一計數 > 0）以 `StatusDot` + 文字
     標出這幾個要特別注意的狀態計數。**顯示名稱依 `User.locale` 二選一**：
     `zh-TW` 顯示 `Section.nameZh`、`en` 顯示 `Section.nameEn`（如 `LITHO-02`）——
     這是**資料**的在地化，與 `messages/` 的 UI 文案在地化是兩套機制（見 §8 i18n）。
     識別（URL 段、權限鍵）一律用 `Section.code`，不是顯示名稱。
  2. Legend：`StatusDot` × 6（全部 `ToolStatus`），純文字對照，不可互動
  3. Brick grid：`Brick`（既有元件，import 名為 `Brick`，本文件依 component-spec §3.3
     的建議統一稱呼）以 auto-fill grid 排列，一格一台機台
  4. 底部說明：`Callout`（mockup `.note-banner`，component-spec 已明確把 `.note-banner`
     併入 `Callout` 的 mockup 出處）——「大格＝機台・小格＝chamber・…」

本頁使用的元件清單：

| 元件 | 用在哪個區塊 | 數量 |
|---|---|---|
| `StatusDot` | 標題列的重點計數、Legend | 列表（legend 固定 6 個；標題列依非零計數） |
| `Brick`（既有） | 機台格 | 列表（依 `tools.length`） |
| `Callout` | 底部說明 | 單一 |
| `EmptyState` | `tools` 為空時 | 單一（既有實作是內聯 `<div>`，見 §1.9 落差） |

### 1.3 資料需求

- `listTools(sectionId)` —— 唯一的資料來源，回傳 `ToolSummary[]`，畫面上的計數
  （DOWN/LOST/PM…）全部由這份陣列即時統計，不寫死任何數字。這裡的 `sectionId`
  語意是 `Section.code`（URL 段 `/section/<code>` 解出來的值），不是課名——
  先前把 `nameEn`（如 `LITHO-02`）當識別碼是錯的（見
  `docs/decisions/0002-route-and-locale.md`）。
- 標題列的課別顯示名稱需要 `Section.nameZh`/`nameEn` 其中一個（依
  `getCurrentUser().locale` 選）；名稱↔代碼的轉換只在 `DataSource` 邊界做一次，
  沿用既有 `listSections()`，本頁不需要新方法，也不自己做轉換。
- 無需 `getCurrentUser()` 判斷角色差異：本頁沒有任何依角色分支的內容
  （`view.panes` 是 `ALL`）；但仍需要 `getCurrentUser().locale` 來決定課別顯示名稱
  ——這不是權限分支，是資料在地化。Header/ControlBar 的課別選單才需要使用者的
  `supportSections`，但那屬於 shell 層不屬於本頁。
- 沒有需要平行取的多筆資料——`listTools`／`listSections` 互不依賴，可平行取。

### 1.4 狀態

- **loading**：目前實作沒有 loading skeleton（Server Component 直接等資料，無串流骨架）。
  規格上建議：`Brick` grid 位置顯示與 grid 同尺寸的灰階骨架方塊，避免版面跳動。
- **empty**：`tools.length === 0` 時顯示 `EmptyState`（既有實作是內聯 `<div>` 文案，
  見 §1.9 落差）。
- **error**：`listTools` 拋錯時，目前無統一處理（會是 Next.js 的預設錯誤頁）。
  規格上應該是頁面層級的錯誤態（task C2.1 尚未落地，記入 §8）。
- **無權限**：不適用——`view.panes` 是 `ALL`，任何能進入該課別（`canEnterSection`
  已通過）的角色都會看到完整內容，沒有部分隱藏的情境。

### 1.5 權限行為

| 角色 | 看到什麼 | 能做什麼 |
|---|---|---|
| admin | 完整 grid，所有機台狀態 | 點 `Brick` 導覽 |
| editor | 同 admin | 同 admin |
| viewer | 同 admin | 同 admin |

三個角色在本頁**完全沒有差異**——`view.panes` 是 `ALL`，本頁不含任何寫入操作。
這是七個畫面裡權限模型最簡單的一頁。

### 1.6 互動與導航

- 點擊（或鍵盤 Enter/Space）`Brick` → `router.push('/tool/{toolId}')`，
  進 URL（**路徑已隨 `docs/decisions/0002-route-and-locale.md` 改為方案 C：
  機台子樹不帶課別段，當機處理是 `/tool/{toolId}` 本身、不再有 `/live` 這一段**；
  既有實作驗證的是舊路徑 `/section/{sectionId}/tool/{toolId}/live`，R5／R6 落地後
  需重新以此節為準驗證）。
- 無其他互動；Legend 與計數皆不可點擊。
- 課別/語系切換屬於 shell 層（`Header`），不在本頁 spec 範圍。

### 1.7 產品紅線

不適用。本頁不呈現任何 ML／pattern 判定、不含「不知道」狀態、不含需要溯源的數字、
不含寫入操作——D1 八條紅線都不直接落在這一頁。唯一相關的是**設計原則 #1**（狀態色
單一來源）：`Brick`／`StatusDot` 一律呼叫 `statusToken()`/`statusClass()`，不得
自行寫死顏色——這條已由既有實作（`src/lib/status.ts`）保證，但它是設計原則不是
D1 編號項目，此處誠實區分。

### 1.8 實作驗收條件

1. `listTools()` 回傳的 `ToolSummary[]` 中各 `ToolStatus` 計數與畫面標題列/Legend
   顯示的數字逐一相符（可用 fixtures 斷言，既有測試已涵蓋 DOWN 1 / LOST 2 / PM 1）。
2. 點擊任一 `Brick` 後，瀏覽器網址列變為 `/tool/{tool.id}`（新路徑，見
   `docs/decisions/0002-route-and-locale.md`；舊路徑
   `/section/{sid}/tool/{tool.id}/live` 為 R5 前的既有實作現況，R5 落地後本條
   驗收以新路徑為準）。
3. 鍵盤 Tab 到某個 `Brick` 後按 Enter 或 Space，觸發與滑鼠點擊相同的導覽。
4. `tools` 為空陣列時顯示「{課別顯示名稱}（{code}）目前無機台資料」而不拋錯——
   顯示名稱依 locale 選 `nameZh`/`nameEn`，括號內的識別一律是 `code`。
5. 六種 `ToolStatus` 的底色兩兩不同（既有 `status.test.ts` 已涵蓋）。

### 1.9 與 spec 的落差（現況 vs 本規格）

- 目前實作**沒有使用 `Zone`** 包裹任何區塊（標題列/grid/底部說明是直接的 flex/grid
  排版），與其他六個畫面慣例不同——這不算錯誤（component-spec 也沒有強制本頁一定要
  `Zone`），但若之後要在標題列旁加「資料時效」之類的 hint，會需要一個容器,
  屆時可考慮引入 `Zone`。
- **loading／error 態尚未元件化**（task A2.4 的既有註記：「載入／錯誤態待 C2.1
  統一元件化」）——目前只有 empty 分支，且是內聯 JSX 而非 `EmptyState` 元件。
- Legend 與計數列目前用檔案內未匯出的區域函式 `StatusDot`（`overview-pane.tsx` 內），
  與 component-spec 建議的可匯出 `StatusDot` 元件同形狀但未抽出共用（component-spec
  §3.1 已記錄此項「既有，建議調整」）。
- 尚無角色切換（A1.10 demo 用途）對本頁的影響——因為本頁本來就對三角色一致，
  這件事本身不是缺口，但意味著 A1.10 落地後本頁應該是「三種角色視覺完全相同」
  的對照組，可以用來驗證角色切換器本身沒有意外影響到不相關的頁面。

---

## 2. 當機處理（`/tool/<tid>`，A3）

mockup 行號區間：L569–667（`<div class="pane" id="pane-live">` 至其對應
`</div>`，已用 `sed -n '565,670p'` 核對起訖；五個 `.zone` 開頭分別在
L572/579/609/639/656，已個別核對）。

### 2.1 用途與使用情境

機台跳 alarm、工程師（或跨課支援的 viewer）站在機台前的**當下處理現場**：留一句
「這台為什麼不動」的註解給接班的人、看最近的 error case 決定要不要開圖細看、
抓機台自己吐出來的檔案、快速丟一句問題給 Copilot。這頁的內容全部是「事實陳列」
（mockup 側欄標語「畫面放事實，分析靠問」的具體體現在下一頁，但本頁的
Tool Command／Error Case／檔案清單本身就是最原始的事實層）。

### 2.2 版面結構

- `TwoColumnLayout`：
  - **main**：
    1. `Zone`（標題「Tool Command」+ hint「人下的註解・這台現在為什麼不動」）
       - `ToolCommandRow` 列表（依 `listToolCommands` 結果）
       - `Button`（variant="ghost"，「+ 新增 Tool Command」，開啟尚待設計的表單，
         見 component-spec 該元件重用注意——表單本身不在本規格展開）
    2. `Zone`（標題「最近 Error Case」，`actions` slot 放 `ChronicBadge`
       當 `listChronicFlags` 結果非空時）
       - `ErrorCaseRow` 列表（依 `listErrorCases` 結果，`severity` 決定視覺）
       - `Callout`（mockup `.note-banner`，「慢性偵測＝rule base…・點徽章才問 Copilot」）
    3. `Zone`（標題「機台抓回檔案」+ hint「預設 24 小時內・勾選讓 iDo 參考」）
       - `ToolFileRow` 列表（依 `listToolFiles` 結果）
  - **side**：
    1. `Zone`（標題「機台屬性」）—— 純 `ToolAttributes` 的 key-value 顯示，
       **無對應 domain 元件**（見 Open issues），本規格建議在 `Zone` 內直接放
       `<dl>`，不要為了「湊元件」硬套 `Metric`（`Metric` 語意是「量測值＋可選
       alert tone」，`ToolAttributes` 是靜態機台屬性,兩者性質不同）。
    2. `Zone`（標題「快速提問」+ hint「問 Copilot」）
       - `AskChip` 列表（固定問句，`label`/`question` 分離，見 component-spec
         `AskChip` 的地雷提醒）

本頁使用的元件清單：

| 元件 | 用在哪個區塊 | 數量 |
|---|---|---|
| `TwoColumnLayout` | 整頁版面 | 單一 |
| `Zone` | 五個分區容器 | 5 |
| `ToolCommandRow` | Tool Command 列表 | 列表 |
| `Button`（variant=ghost） | 新增 Tool Command 入口 | 單一 |
| `ChronicBadge` | Error Case Zone 的 actions | 單一（`flags` 非空才 render） |
| `ErrorCaseRow` | Error Case 列表 | 列表 |
| `Callout` | Error Case zone 底部說明 | 單一 |
| `ToolFileRow` | 機台抓回檔案列表 | 列表 |
| `AskChip` | 快速提問 | 列表（固定 4 個） |
| `EmptyState` | 任一列表為空時 | 依情境 0–3 次 |
| `CapabilityGate` | 包裹 `file.toggleCopilotRef`（checkbox）與 `case.pack`
  （打包鈕）；`toolCommand.write` 是 `ALL`，**不加** gate | 2 |

### 2.3 資料需求

- `getTool(sectionId, toolId)` —— 取得 `Tool`（含 `attributes`／`status`／`chambers`），
  side 欄「機台屬性」與標題需要。**`sectionId` 不再從 URL 段取得**——本頁路由是
  `/tool/<tid>`，機台子樹不帶課別段（見
  `docs/decisions/0002-route-and-locale.md`），`sectionId`（語意是
  `Section.code`）改由 `toolId` 反查所屬課別取得；`getTool` 是否因此改為只吃
  `toolId` 單一參數屬 R1–R4 的實作細節，本規格不預先定死簽名，只確認「URL 不再
  提供 sectionId」這個介面事實。
- `listToolCommands(toolId)`
- `listErrorCases(toolId)`
- `listChronicFlags(toolId)`（rule base，零 LLM，D1 #2）
- `listToolFiles(toolId)`

以上 5 個呼叫**互不依賴**，皆只需要 `toolId`（`sectionId` 如仍需要則由
`toolId` 反查取得，不是頁面從 URL 直接拿），可以全部 `Promise.all`
平行取（不像深度診斷頁那樣需要先知道使用者選了哪個 tab 才能決定查什麼）。

### 2.4 狀態

- **loading**：五個 `Zone` 各自可獨立顯示 skeleton（不需要等最慢的那個 API 才顯示
  任何東西），因為五個查詢彼此獨立。
- **empty**：
  - `listToolCommands` 為空 → `EmptyState`「目前沒有 Tool Command」
  - `listErrorCases` 為空 → `EmptyState`「近期無 Error Case」
  - `listToolFiles` 為空 → `EmptyState`「尚無抓回檔案」
- **error**：任一查詢失敗 → 該 `Zone` 內顯示錯誤態（task C2.1 尚未統一元件化，
  暫時只能規格性描述「顯示錯誤訊息＋重試」，見 §8）。
- **無權限**：不適用於檢視層（`view.panes` 是 `ALL`）；寫入操作的「無權限」呈現見
  §2.5（是 disable，不是整頁擋下）。

### 2.5 權限行為

| 動作 | admin | editor | viewer | Capability |
|---|---|---|---|---|
| 檢視全部內容 | ✓ | ✓ | ✓ | `view.panes` |
| 新增／編輯 Tool Command | ✓ | ✓ | **✓** | `toolCommand.write`（`ALL`——C3 部分放行） |
| 檔案下載 | ✓ | ✓ | ✓ | `file.download` |
| 「iDo 參考」checkbox 切換 | ✓ | ✓ | 顯示但 disabled | `file.toggleCopilotRef` |
| 慢性徽章點擊問 Copilot | ✓ | ✓ | ✓ | `copilot.ask` |
| 驗屍打包案例 | ✓ | ✓ | 隱藏 | `case.pack` |

**viewer 是本頁唯一「部分放行」的角色**（permission-matrix C3）：可以下 Tool Command，
但不能勾選「iDo 參考」、不能打包案例。`ToolCommandRow` 旁的新增按鈕**不需要**
`CapabilityGate` 隱藏（component-spec 已明確提醒這是容易被誤加多餘權限檢查的地方）；
`ToolFileRow` 的 checkbox 與 `ErrorCaseRow` 的打包按鈕**需要** `CapabilityGate`。
「驗屍打包案例」viewer 是**隱藏**而非 disabled——依 §8 的隱藏/disable 原則,
打包案例是「產生新資產的動作」（新增一筆打包記錄）且與 viewer 完全無關,
不是「使用者需要知道仍然為真的既有事實」，故套用隱藏這條分支
（對照同段「iDo 參考」checkbox 才是 disable，因為使用者需要知道「有沒有被參考」
這個既有事實仍然為真）。

### 2.6 互動與導航

- `ErrorCaseRow` 的「📊 u chart」「📉 t chart」按鈕 → 導向
  `/tool/{tid}/fdc/{caseId}?chart=u|t`（新路徑，機台子樹不帶課別段；intercepting
  route 攔截器改在 `tool/[tid]/` 底下，見
  `docs/decisions/0002-route-and-locale.md`／R8），URL 改變，底層本頁維持掛載。
- `ErrorCaseRow`「手動判讀」按鈕、`ChronicBadge`、`AskChip` → 觸發開啟 Copilot
  Drawer 並帶入固定問句（`onAsk(question)`），**不改變 URL**（Copilot 開關是
  跨頁浮層的 ephemeral 狀態，見 §8）。
- 新增 Tool Command → 樂觀更新（task A3.1 要求），失敗回滾。
- 「iDo 參考」checkbox 切換 → 樂觀更新，且**這個布林值會實際影響 Copilot 的
  request payload**（task A3.5 的 E2E 驗收點）——`ToolFileRow` 只負責 UI 與觸發
  callback，把狀態送進真正 request payload 是頁面層 state 管理的責任。
- 「🔒 打包案例」→ 走 `case.pack` Server Action（Stage A 為假回應）。

### 2.7 產品紅線

- **D1 #2（rule base 能做的不用 AI）**：`ChronicBadge` 的 `flags` 必須直接來自
  `listChronicFlags()`（rule base：同 code 90 天 ≥3 次），**不接受**由 LLM 生成的
  字串描述慢性狀態——結構保證在於 `ChronicBadgeProps.flags: readonly ChronicFlag[]`
  這個型別本身不允許自由字串,而不是靠開發者自律。
- 本頁其餘內容（Tool Command／Error Case／檔案）都是既有事實記錄,不含 ML 判定,
  D1 #1／#5／#8 等與判讀相關的紅線不落在本頁（它們落在深度診斷與 FDC）。

### 2.8 實作驗收條件

1. `listChronicFlags()` 回傳的 `chronic` 狀態筆數與 `ChronicBadge` 顯示的數字一致
   （如「⚠ 2 個慢性問題」對應 2 筆 `status==='chronic'`，不含 `watching`）。
2. viewer 角色送出新 Tool Command 後清單即時更新（樂觀更新），且該角色看不到
   「iDo 參考」checkbox 的可勾選態（顯示但 disabled）。
3. 點擊 `ErrorCaseRow` 的「📊 u chart」後，網址變為
   `.../fdc/{caseId}?chart=u`，且 `[role=dialog]` 出現、底層 live pane 仍掛載。
4. 勾選某份檔案的「iDo 參考」後，發給 Copilot 的 request payload 內含該檔案
   （E2E，對應 task A3.5）。
5. 三個列表個別為空時各自顯示對應的 `EmptyState` 文案，不影響其他 `Zone`。
6. viewer 角色仍可點擊「⤓ 下載」（`file.download` 是 `ALL`）。

---

## 3. 病史分析（`/tool/<tid>/history`，A4）

mockup 行號區間：L669–705（`<div class="pane" id="pane-hist">` 至其對應
`</div>`，已用 `sed -n '665,710p'` 核對起訖）。

### 3.1 用途與使用情境

工程師或上級要看「這台機台過去被 Copilot 問出來、沉澱下來的結論」——這頁不產生新分析，
只陳列已經打包（pin）過的卡片，並讓有權限的人決定要不要把某張卡片從「個人 skill」
晉升為「課級 common」（全課都能看到的定案知識）。新分析的產生入口是側欄的
「問 Copilot」chips，問完後在 Copilot 側欄打包，卡片才會回流到這裡。

### 3.2 版面結構

- `TwoColumnLayout`：
  - **main**：
    1. `Zone`（標題「📌 已打包的分析」+ hint「Copilot 問答成果・寫進 Case Center・
       全課可見」）
       - `PinnedCard` 列表（依 `listPinnedCards` 結果，依 `createdAt` 新到舊，
         新打包的卡片捲動進視野並短暫 flash 高亮，task A4.4）
       - `Callout`（mockup `.add-btn` 於本頁其實是靜態說明文字而非可點擊表單入口，
         component-spec 把 `.note-banner`/`.set-note` 等說明框歸納進 `Callout`，
         本頁這句「📌 打包 Copilot 的回答 → 貼到這裡」屬於同一類——純指引,
         不觸發任何動作）
    2. （admin 專屬，mockup 未展示，見 §3.4／Open issues）晉升審核佇列——
       用 `ListRow`（`leading` 放卡片摘要文字或直接嵌入對應 `PinnedCard` 的
       簡化呈現、`trailing` 放 `VoteButtons`，`onUp`=核可、`onDown`=退件）
       逐一列出 `status==='pending'` 的卡片。**這是本規格的判斷**：
       component-spec 沒有為「審核佇列」定義專屬元件,`VoteButtons` 的
       up/down 語意（確認/否決成對操作）與「核可/退件」相符,故重用而非新創,
       但這不是 mockup 明示的用法,記入 Open issues 供 review。
  - **side**：
    1. `Zone`（標題「問 Copilot」+ hint「畫面放事實，分析靠問」）
       - `AskChip` 列表（7 個固定問句）
       - `Callout`（「問完按回答下方的 📌 打包成卡片，結論就會沉澱到左邊」）

本頁使用的元件清單：

| 元件 | 用在哪個區塊 | 數量 |
|---|---|---|
| `TwoColumnLayout` | 整頁版面 | 單一 |
| `Zone` | main／side 各 zone 容器 | 3（審核佇列獨立成一個 `Zone`） |
| `PinnedCard` | 已打包卡片列表 | 列表 |
| `Callout` | 打包指引、Copilot 提示 | 2 |
| `ListRow` + `VoteButtons` | admin 晉升審核佇列 | 列表（審核佇列是 admin 專屬的
  新資產產生流程,依 §8 原則應為隱藏——`Zone` 本身對 editor/viewer 整個不渲染,
  見 §3.5） |
| `AskChip` | 問 Copilot chips | 列表（固定 7 個） |
| `EmptyState` | 無打包卡片時 | 單一 |
| `CapabilityGate` | 包裹編輯標題／晉升觸發點 | 依卡片數量 |

### 3.3 資料需求

- `listPinnedCards(toolId)` —— 唯一需要的讀取方法,回傳 `PinnedCard[]`,
  前端依 `status` 篩出 `pending` 供 admin 審核佇列使用（同一份資料源,不需要
  額外的 `DataSource` 方法）。
- 無其他平行呼叫需求（只有一次查詢）。
- **Open issue**：卡片的「核可／退件」與「編輯標題」都是**寫入**動作,
  依 D2「`DataSource` 只覆蓋讀取」的既有設計,這些走 Server Action（A1.5）,
  不在 `DataSource` 介面內——這不是缺陷,但容易被誤讀成「資料需求漏了寫入方法」,
  在此明確澄清。

### 3.4 狀態

- **loading**：卡片列表 skeleton。
- **empty**：`listPinnedCards()` 回傳空陣列 → `EmptyState`「尚無打包分析」。
- **error**：查詢失敗 → 統一錯誤態（同 §8）。
- **無權限**：不適用於檢視（`view.panes` 是 `ALL`，所有角色都看得到卡片本體）；
  「無權限」的呈現落在個別互動上（見 §3.5），不是整頁層級。

### 3.5 權限行為

| 動作 | admin | editor | viewer | Capability |
|---|---|---|---|---|
| 檢視所有卡片 | ✓ | ✓ | ✓ | `view.panes` |
| 編輯卡片標題 | ✓（任何卡片） | **◐（僅本人）** | ✗ | `pin.editTitle`
  透過 `canEditPinTitle(role, isOwner)` |
| 晉升為課級 common | ✓ | ✗ | ✗ | `pin.promoteToCommon`（`ADMIN_ONLY`） |
| 晉升審核佇列（檢視/投票） | ✓ | ✗（整個 Zone 不渲染） | ✗（整個 Zone 不渲染） | `pin.promoteToCommon` |
| 打包 Copilot 回答到 case | ✓ | ✓ | ✗ | `pin.create`（本頁本身不觸發,
  由 Copilot 側欄的 `PinButton` 觸發後回流到本頁） |

`editor` 的「◐ 限本人」是本文件唯一一個需要 `canEditPinTitle()` 而非單純 `can()`
的權限判斷——`PinnedCard` 元件的 props 需要同時帶 `role` 與 `isOwner`。

### 3.6 互動與導航

- 側欄 `AskChip` 點擊 → 開啟 Copilot Drawer 並帶入問句（不改變本頁 URL）。
- Copilot 回答後點 `PinButton` → 開啟 `CaseIdModal`（`prefillCaseId` 依語境）→
  確認後導回本頁，新卡片捲動進視野並 flash 高亮（task A4.4，E2E）。
- 卡片標題 inline 編輯 → 點擊進入可編輯態，Enter 或 blur 儲存（樂觀更新）。
- admin 點擊卡片的「晉升」入口 → 觸發 `onPromoteToCommon`（`pin.promoteToCommon`）。
- admin 在審核佇列對 `pending` 卡片按核可/退件 → 樂觀更新，卡片的 `skill-lv`
  徽章隨之改變（task A4.3 的 E2E 驗收點：「admin 核可後卡片徽章改變」）。

### 3.7 產品紅線

- **D1 #8（每個數字可溯源）**：`PinnedCard.source` 是 domain 型別的必填欄位
  （`z.string().min(1)`），本頁**沒有**「無來源」的顯示分支——這不是靠 UI 判斷
  要不要顯示,而是型別上根本不允許 `source` 為空字串傳進來。

### 3.8 實作驗收條件

1. `listPinnedCards()` 回傳的每筆卡片 `source` 欄位皆非空字串（可用 zod
   schema `.parse()` 驗證，非本頁自行判斷）。
2. viewer 角色看到的卡片標題是純文字顯示，沒有可點擊進入編輯的視覺提示
   （無 hover/focus 的可編輯樣式，點擊標題無反應），但完整卡片內容
   （標題／內文／來源／作者時間）仍可見。
3. editor 角色只能編輯 `authorId === currentUser.id` 的卡片標題,對其他人的卡片
   `canEditPinTitle` 回傳 `false`。
4. admin 角色能看到「晉升為課級 common」的觸發點,editor/viewer 看不到。
5. 卡片列表為空時顯示 `EmptyState`，不崩潰、不顯示空白區塊。
6. 從 Copilot 打包一則新回答後，新卡片出現在列表最上方並有短暫視覺高亮
   （E2E，task A4.4）。

---

## 4. 深度診斷（`/tool/<tid>/diagnosis`，A7+A8）

mockup 行號區間：L707–1293（`<div class="pane" id="pane-diag">` 至其對應
`</div>`，已用 `sed -n '703,1295p'` 核對起訖；五個 dd-view 的 `.verdict`
分別在 L725(ov)/L796(fo)/L850(lv)/L895(fd)/L933(sl)，`.tseg` ML 判定卡分別在
L774/831/875/915/954，已個別核對）。

### 4.1 用途與使用情境

當機處理與病史分析都無法快速定位根因時，工程師進到這一頁做**結構化排查**：先用
Dual Chuck 對照把嫌疑範圍砍半（一致→共用系統／分歧→該 chuck 本身），再用五個
空間指標（Overlay FP／Focus FP／Leveling／Field Focus／Slit Aberration）逐一看
wafer/field/slit 層級的形狀 pattern，最後視需要開關聯圖找可能牽連的零件。
這是七個畫面裡結構最複雜、承載 D1 紅線最密集的一頁之一。

### 4.2 版面結構

- `TwoColumnLayout`：
  - **main**：
    1. `Zone`（標題「Scanner 空間指標」+ hint「肉眼先看 map・數值是輔證・ML 幫你
       認形狀」）
       - `SpatialIndicatorTabs`（六選一：五個 `SpatialIndicator` + `"graph"`）
       - **五個空間指標共用的前置區塊**（`"graph"` 分頁無）：`DualChuckVerdict`
         （依 `verdict.kind`：`consistent`/`divergent`/`not_applicable`）。
         `spatialAnalysisSchema.verdict`（`src/domain/spatial.ts:50`）是必填欄位,
         `not_applicable` 是 `CHUCK_VERDICTS` 的 enum 成員，不是「這個指標不渲染
         這塊」的訊號——mockup 五個 dd-view **全部**都有這塊：L725(ov)／L796(fo)／
         L850(lv)／L895(fd)／L933(sl)，不是只有 wafer level 三指標才有。
       - 依選中的指標渲染以下其中一組（`DualChuckVerdict` 已在上方共用區塊渲染,
         以下各組不重複畫）：
         - **overlay_fp / focus_fp / leveling**（wafer level）：兩個 chuck
           並排，各自：`WaferMap`（`variant` 依指標分別是
           `"vector"`/`"heatmap"`/`"hotspot"`）＋ `PatternTag`
           （`dimension="spatial"`）＋ `Metric`（`chuck.metrics`）；focus_fp／
           leveling 額外各有一行純文字判讀提示（mockup `.map-note`，非獨立元件,
           L829(fo)／L874(lv)；overlay_fp 沒有這一行）
           → 下方是一張「ML 判定」卡，承載 `mlStatement`（**本規格稱之為「深度診斷
           ML 判定卡」；component-spec.md 的 63 個元件名冊裡沒有為它定義元件名,
           只在 932 行的 `FlywheelNote` 紅線說明裡提過這個說法，本規格不自行
           命名，列入 §9 Open issues）**：卡頭用 `Badge` 承載 `tseg-tag`（如
           「✓ 命中歷史 case」／「KM 無紀錄」／「系統性偏差」，mockup
           L775/832/876/916/955）→ 卡身是 `mlStatement` 的診斷敘述文字 →
           卡內嵌（層級關係：卡 > `SuspectList` + `FlywheelNote`/`UnknownNote`,
           後兩者是包在卡裡面的，不是與卡並列的獨立區塊）`SuspectList` ＋
           （`flywheel` 是否為 `null` 二選一）`FlywheelNote` 或 `UnknownNote`
           → 若 `needsVendorSupport === true`，卡身末端（與 `SuspectList`／
           `FlywheelNote`/`UnknownNote` 同層，皆為 `.tseg-body` 的子節點，不是
           接在整張「ML 判定」卡後面、與卡並列的另一個區塊）渲染 `Callout`
           （tone="warning"，FSE 升級提示，固定含「不會建議你自己動光學系統」
           字樣；這是**五個空間指標共用**的條件渲染區塊,不是 wafer-level
           專屬——mockup 實際範例出現在 ddv-sl（slit）L965–970：依縮排層級判定,
           L964 `</div>` 收合 `.suspect`，L965 開啟這個 warning `Callout` 的
           外層 `<div>`，L970 `</div>` 收合，兩者皆巢狀於同一個 `.tseg-body`
           內；wafer-level 三個 view 完全沒有,見 M3／`needsVendorSupport`
           是 `spatialAnalysisSchema` 的通用欄位）
         - **field_focus**：`FieldFocusMap` ＋一行純文字判讀提示（mockup
           `.map-note` L914，非獨立元件）＋ `Metric` ＋ 同上結構的「ML 判定」卡
           （卡頭 `Badge` + `mlStatement` + 內嵌 `SuspectList` +
           `FlywheelNote`/`UnknownNote` 二選一 + 條件式 FSE `Callout`）
         - **slit**：`SlitProfile` ＋一行純文字判讀提示（mockup `.map-note`
           L953，非獨立元件）＋ `Metric` ＋ 同上結構的「ML 判定」卡（同 field_focus,
           本指標是 mockup 實際展示 FSE `Callout` 的分支）
         - **graph**：`TabBar`（三分頁：查詢／建圖／養肥）
           - 查詢：`Callout`（兩層圖說明）＋ `RelationGraph` ＋
             `CandidateRow` 列表（各自組裝 `WeightBar` ＋ `VoteButtons`）
           - 建圖：`Callout`（「Agent 是助產士」說明）＋ `BuildStepRow` 列表 ＋
             `PendingEdgeRow` 列表 ＋ `Button`（variant="ghost"，
             「+ 手動新增節點／連接」，`graph.addNode`）＋ `Callout`
             （建圖成本 vs 價值）
           - 養肥：`Callout`（經驗邊如何長出來）＋ `BuildStepRow` 列表
             （三種成長來源）＋ `ListRow`（本台/同型機邊數統計，見
             component-spec §4「反覆出現但不該做成元件」，此處只是組裝
             既有 `ListRow` 不是新元件）＋ `Callout`（護城河說明）

       **mockup 實況與本規格立場的落差，需誠實區分**：開檔逐一核對五個
       dd-view，只有 ddv-ov（`.flywheel` 在 L786）與 ddv-lv（`.flywheel` 在
       L885）畫出獨立的 `.flywheel` 區塊；ddv-fo 的「不知道」內容是寫在
       `.tseg-body` 的敘事散文裡（L837「但不知道你們這台的 BOWL 通常是什麼
       原因」），不是獨立區塊；ddv-fd（L894–931）與 ddv-sl（L932–973）兩者
       在 mockup 裡都沒有畫出這一塊（皆無 `.flywheel`，也無「不知道」字樣的
       敘事段落）。本規格依 D1 #5「不知道是一等狀態」＋ component-spec 的
       `FlywheelNote` 紅線說明＋`flywheel` 為 nullable 型別，統一要求五個
       指標渲染時都必須是 `FlywheelNote`/`UnknownNote` 二選一——這是**本規格
       刻意強化 mockup** 的地方，不是 mockup 本身就長這樣，實作者比對 mockup
       時不需要懷疑自己讀錯。
    2. `Zone`（標題「交叉診斷結論」+ hint「五個指標互相驗證」）
       - `CrossDiagnosisPanel`——除了 `lines[].indicators`（依據指標清單）之外,
         **必須同時顯示 `diagnosis.confidence`**（`crossDiagnosisSchema` 的整體
         信心度欄位，0–1，是整份交叉診斷共用一個值，不是逐行各自的信心度,
         見 M12／D6）；每一行 `lines[].scope`（`in_section`/`needs_fse`）需要
         有清楚的視覺與文字區分（不可只靠顏色/emoji，如「需 FSE」文字徽章,
         component-spec.md:973–975 已明列此 a11y 要求）。
  - **side**：
    1. `Zone`（標題「空間 Pattern 詞彙」+ hint「受控 taxonomy」）—— 靜態詞彙表,
       用 `PatternTag` 逐一窮舉渲染（`WAFER_PATTERNS`/`FIELD_PATTERNS`/
       `SLIT_PATTERNS`），無額外元件
    2. `Zone`（標題「Dual Chuck 診斷邏輯」）—— 純文字說明,不需要元件
       （component-spec §4 已明確排除獨立元件化這段內容）
    3. `Zone`（標題「問 Copilot」）—— `AskChip` 列表（3 個固定問句）

本頁使用的元件清單：

| 元件 | 用在哪個區塊 | 數量 |
|---|---|---|
| `TwoColumnLayout` | 整頁版面 | 單一 |
| `Zone` | 各分區容器 | 5 |
| `SpatialIndicatorTabs` | 指標切換 | 單一 |
| `DualChuckVerdict` | 五個空間指標共用前置區塊 | 1（五個空間指標皆有；`graph` 分頁無） |
| `WaferMap` | wafer-level 三指標，三種 variant | 每指標 2（Chuck A/B） |
| `FieldFocusMap` | field_focus 指標 | 0/1 |
| `SlitProfile` | slit 指標 | 0/1 |
| `PatternTag` | chuck pattern 顯示、側欄詞彙表 | 列表（含詞彙表窮舉） |
| `Metric` | 每個 chuck/field/slit 的量測值 | 依 chuck 數 |
| （深度診斷 ML 判定卡，尚無元件名，見 §9 Open issues） | 承載 `mlStatement`；卡頭
  `Badge`（`tseg-tag`）＋卡身敘述＋內嵌 `SuspectList`/`FlywheelNote`/`UnknownNote` | 依選中指標 1（`graph` 分頁無） |
| `Badge` | ML 判定卡卡頭（`tseg-tag`） | 每指標 1 |
| `SuspectList` | 每個指標的嫌疑清單（巢狀於「ML 判定」卡內） | 依選中指標 |
| `FlywheelNote` / `UnknownNote` | 依 `flywheel` 是否為 `null` 二選一（巢狀於「ML 判定」卡內） | 1（互斥） |
| `Callout` | FSE 升級提示（五指標共用條件區塊，`needsVendorSupport===true` 才渲染）、
  關聯圖各段說明 | 多個（依 tab／條件） |
| `CrossDiagnosisPanel` | 交叉診斷結論（含 `confidence` 與 `scope` 兩種視覺區分需求） | 單一 |
| `TabBar` | 關聯圖三分頁 | 單一 |
| `RelationGraph` | 關聯圖查詢視覺化 | 單一（graph.query tab） |
| `CandidateRow` | 候選零件列表 | 列表 |
| `WeightBar` | 候選零件權重 | 依 `CandidateRow` 數量 |
| `VoteButtons` | 候選零件回饋、待確認邊確認/刪除 | 依列表數量 |
| `BuildStepRow` | 建圖進度、養肥成長來源 | 列表 |
| `PendingEdgeRow` | 待確認邊 | 列表 |
| `Button`（variant=ghost） | 手動新增節點/連接 | 單一 |
| `ListRow` | 養肥視圖的邊數統計 | 2（本台/同型） |
| `AskChip` | 側欄快速提問 | 列表（固定 3 個） |
| `EmptyState` | 嫌疑清單/交叉診斷結論為空時 | 依情境 |
| `CapabilityGate` | 包裹 `graph.vote`／`graph.confirmPendingEdge`／`graph.addNode` | 依寫入點數量 |

### 4.3 資料需求

- `getCrossDiagnosis(toolId)` —— 頁面載入即可平行取（不依賴使用者選了哪個指標）。
- `getSpatialAnalysis(toolId, indicator)` —— 依目前 `SpatialIndicatorTabs` 選中的
  指標取值；初始載入取預設指標（如 `"overlay_fp"`），切換 tab 時重新取。
  可與 `getCrossDiagnosis` 平行（兩者互不依賴）。
- `queryGraph(toolId, symptom)` —— 僅在切到 `"graph"` 且為「查詢」子分頁時觸發。
  **`symptom` 的來源是本規格的判斷而非明文定義**：mockup 展示的查詢
  （「chamber pressure 異常 → 可能是哪個零件？」）沒有對應的輸入框，
  推測是自動代入目前處理中 case 的 `alarmCode`/`title`。本規格建議沿用此假設,
  但明確記入 Open issues——若之後要支援使用者自由輸入症狀查詢,需要額外的
  輸入元件（component-spec 沒有定義,不可迳自新創）。
- 五個 `SpatialIndicator` 個別的資料**不建議一次全取**（效能考量,尤其 `WaferMap`
  渲染成本高），採「切到哪個 tab 才 fetch 那個」的策略。

### 4.4 狀態

- **loading**：`WaferMap`/`RelationGraph` 渲染成本高，切換指標/分頁時該區塊
  應顯示 skeleton，不需要整頁 loading。
- **empty**：
  - `CrossDiagnosis.lines` 為空陣列 → `EmptyState`（component-spec 已明確：
    「空陣列時應顯示 `EmptyState` 而非什麼都不畫」）。
  - `SpatialAnalysis.suspects` 為空陣列 → 建議同樣顯示 `EmptyState`
    （component-spec 沒有為 `SuspectList` 明文規定此分支，本規格延伸既有
    「空清單一律 `EmptyState`」慣例，非臆造新規則）。
- **error**：任一指標查詢失敗 → 該 `Zone` 內錯誤態（同 §8）。
- **無權限**：不適用於檢視（`view.panes` 是 `ALL`）；寫入操作是個別按鈕層級的權限呈現,
  見 §4.5（投票/確認是 disable，手動新增節點/邊是隱藏，兩者依 §8 的隱藏/disable
  原則分開處理，非同一種做法）。

### 4.5 權限行為

| 動作 | admin | editor | viewer | Capability |
|---|---|---|---|---|
| 檢視 wafer map／verdict／suspects／交叉診斷 | ✓ | ✓ | ✓ | `view.panes` |
| SOP 節點點擊觸發提問 | ✓ | ✓ | ✓ | `copilot.ask` |
| 候選零件 👍👎 與修正 | ✓ | ✓ | 顯示但 disabled | `graph.vote` |
| 待確認低信心邊 確認／刪除 | ✓ | ✓ | 顯示但 disabled | `graph.confirmPendingEdge` |
| 手動新增節點／邊 | ✓ | ✓ | 隱藏 | `graph.addNode` |

viewer 在本頁的模式與當機處理一致：**候選零件本身仍可見**（`CandidateRow` 不隱藏），
只有 `VoteButtons` 那組互動被 disable——permission-matrix #13 是「回饋」不可，
不是「看不到候選」。「手動新增節點／邊」則是**隱藏**（`Button`「+ 手動新增節點／連接」
對 viewer 不渲染）：依 §8 的隱藏/disable 原則，新增節點/邊是「產生新資產的動作」,
與既有候選/邊是否仍然為真無關，viewer 完全用不到，故隱藏而非 disable。

### 4.6 互動與導航

- `SpatialIndicatorTabs` 切換 → 建議反映在 URL query（如 `?indicator=overlay_fp`），
  使 reload/分享連結能還原到同一個指標（task A7.1「指標切換列＋URL 同步」）。
- 關聯圖 `TabBar`（查詢/建圖/養肥）切換 → 同樣建議進 URL query
  （如 `&graphView=query`），理由與上同。
- 👍 候選零件 → 樂觀更新（`WeightBar` 寬度增加）；👎 → 展開受控修正下拉,
  選定後樂觀更新新邊（task A8.3 E2E）。
- 待確認邊確認/刪除 → 樂觀更新 + `aria-live` 通知。
- SOP 節點（`SuspectList` 系）點擊 → 觸發 Copilot 提問,
  **不改變 URL**。
- FSE 升級提示旁的「匯出佐證資料」（task A7.11 提及但無對應元件/capability,
  見 Open issues）。

### 4.7 產品紅線

本頁是七個畫面中承載 D1 紅線密度最高的頁面之一：

- **D1 #1（ML 判定 pattern，元件不得離線推斷）**：`ChuckMap.pattern`／
  `DualChuckVerdict.verdict`／`CrossDiagnosis` 全部型別化強制——`WaferMap`／
  `PatternTag`／`DualChuckVerdict` 的 props 只接受 domain enum,元件簽名上
  杜絕「元件自己算出一個 pattern」的可能。
- **D1 #5（「不知道」是一等狀態）**：`SpatialAnalysis.flywheel` 為 `null` 時
  **必須**渲染 `UnknownNote`，不得省略——版面結構保證：`FlywheelNote`/
  `UnknownNote` 是互斥且成對的渲染分支，父層（本頁）不能兩者都不渲染。
- **D1 #3（受控詞彙）**：`CandidateRow` 的 👎 修正下拉（mockup `grFb()`
  L1782–1802，UI 文案「那實際上是什麼？（受控下拉——新的邊會從這裡長出來）」）
  是受控選項，不接受自由字串——`onCorrect` 只能帶入既有節點 ID，這一條 D1 #3
  的落地目前只在 §6.7（FDC 頁）被認領過，本頁（深度診斷關聯圖）同樣適用,
  在此補上。
- **D1 #6（AI 不做決策）**：`needsVendorSupport === true` 時的 `Callout`
  固定含「不會建議你自己動光學系統」——版面結構保證這個 `Callout` 必須與
  `SuspectList` 同框出現，不能被隱藏或替換成更委婉的說法。
- **D1 #7（關聯圖兩層不得合併渲染）**：`RelationGraph`／`CandidateRow` 的
  `layer`/`source` 欄位必須視覺上區分（實線藍=物理／虛線 teal=經驗），
  版面上兩者不共用同一種線型或同一個「相關度」數字。
- **D1 #8（每個數字可溯源）**：`FlywheelNote.author`/`at` 必須顯示；
  `CrossDiagnosisPanel` 的 `lines[].indicators` 依據清單必須顯示,不能只給結論。
- **D6（交叉診斷 ML 後端產出，前端純渲染）**：`CrossDiagnosisPanel` 的 props
  只接受已彙整好的 `CrossDiagnosis`，本頁**不得**自己用多個 `SpatialAnalysis`
  現場算出交叉診斷結論——這是本頁 code review 的重點檢查項（task A7.9）。
  D6 原文（`docs/tasks/20260724-tool-center-gui.md:362-363`）同時要求
  「需顯示信心度與依據指標清單」：`diagnosis.confidence` 必須顯示，不能只呈現
  `lines[].indicators`；`lines[].scope`（`in_section`/`needs_fse`）必須有清楚
  的視覺與文字區分，不可只靠顏色/emoji（component-spec.md:973–975 已明列此
  a11y 要求）。

### 4.8 實作驗收條件

1. 六個 `SegmentedControl` 選項全部可切換，切換後 URL 反映目前選中的指標
   （reload 後仍停留在同一個指標）。
2. `verdict.kind === 'divergent'` 時，fork 的「分歧」敘述視覺上被標為目前判定,
   「一致」敘述明確標示「非本次判定」（不只靠 `opacity`）。
3. 任一指標的 `flywheel === null` 時必定渲染 `UnknownNote`，絕不會
   `FlywheelNote`/`UnknownNote` 兩者都不渲染（code review 檢查點）。
4. **五個空間指標中任一指標**（不限 wafer-level）只要 `needsVendorSupport === true`,
   FSE 升級 `Callout` 必定與該指標的 `suspects` 清單同框出現（mockup 實際範例是
   slit 指標，L965–970）。
5. viewer 角色看候選零件的 👍👎 為 disabled，但候選清單本身完整可見。
6. `CrossDiagnosis.lines` 為空陣列時顯示 `EmptyState` 而非空白或崩潰。
7. `CrossDiagnosisPanel` 必須顯示 `diagnosis.confidence`（呈現方式不拘，百分比或
   文字分級皆可，但不能整個省略這個欄位——對應 D6「需顯示信心度」的要求）。
8. `lines[].scope === 'needs_fse'` 的行與 `scope === 'in_section'` 的行有明確可
   辨識的視覺與文字區分（如「需 FSE」文字徽章），不能只靠顏色或 emoji 區分
   （component-spec.md:973–975 的 a11y 要求）。

---

## 5. 課別設定（`/section/<code>/settings`，A9）

mockup 行號區間：L1295–1367（`<div class="pane" id="pane-settings">` 至其對應
`</div>`）。依縮排層級判定：L1295 `<div class="pane" id="pane-settings">`
（2 空格縮排）開啟，L1296 `<div class="settings">`（4 空格縮排）在其內開啟；
L1366 `</div>`（4 空格）先收合內層 `.settings`，L1367 `</div>`（2 空格）
才收合外層 `.pane`；L1369 `</div>`（0 空格）收合的是 L492
`<div class="result">`（0 空格）這個更外層的容器，不屬本頁範圍。

### 5.1 用途與使用情境

課別 admin 管理「這個課」的資產與工具引用：課別 DOs（進 system prompt 的規則）、
MCP 工具白名單勾選、專家標籤、KM domain 來源、以及授予/撤銷課外人員的臨時
editor 權限。editor／viewer 進入本頁是**唯讀檢視**（permission-matrix #16：
「進入設定頁：admin ✓／editor 唯讀／viewer 唯讀」）。

**語系設定不在本頁**。本頁管的是**課別資產**——admin 專屬寫入、editor/viewer
唯讀，這個權限模型的前提是「這是課的東西，不是個人的東西」。語系
（`User.locale`）是**個人偏好**，不是課別資產：它是使用者範圍而非課別範圍
（見 `docs/decisions/0002-route-and-locale.md`），每個角色（admin／editor／
viewer）都要能改自己的語系，不受本頁的唯讀限制約束——因此語系切換介面
不應該放進課別設定頁，該長在哪裡（Header 下拉／獨立 `/me` 頁）尚未定案，
見 §9 Open issues。

### 5.2 版面結構

- 單欄（不是 `TwoColumnLayout`——mockup `.settings` 本身是縱向堆疊的 `Zone` 群）：
  1. `Callout`（tone="info"，mockup `.set-note`：「IT 全域設定…仍在 IT 後台。
     此處管『課』的資產與工具引用」）
  2. `Zone`（標題「課別 DOs」+ hint「進 Agent system prompt」）
     - `SectionDosEditor`
  3. `Zone`（標題「MCP 工具引用」+ hint「勾選這個課別允許 iDo 動用的工具」）
     - `McpToolRow` 列表（一般列／預設關列／IT 鎖定列三種）
     - `Callout`（tone="info"，`.src-hint`：「只列出 IT 全域白名單已放行的工具…」）
  4. `Zone`（標題「專家標籤」+ hint「待答問題依標籤通知」）
     - `ExpertTagRow` 列表
     - `Button`（variant="ghost"，「+ 新增專家標籤」）
  5. `Zone`（標題「Domain 來源管理」+ hint「登錄 KM space 作為 domain 來源」）
     - `KmSourceRow` 列表
     - `DomainSourceAddForm`
     - `Callout`（tone="info"，`.src-hint`：「登錄的是連結，不是把檔案搬進來」）
  6. **（新增，mockup 無對應，task A9.6 要求）** `Zone`（標題「課內權限授予」）
     - `ListRow`（`leading`=使用者名稱、`secondary`=`role`/`expiresAt`、
       `trailing`=撤銷 `Button`）列出 `listGrants(sectionId)` 結果
     - 新增 grant 的表單：`FormField`（使用者選擇＋效期）＋ `Button`
       （見 Open issues：缺少使用者查詢的 `DataSource` 方法與專屬 domain 元件，
       本規格用既有 composite 組裝，不新創元件）

本頁使用的元件清單：

| 元件 | 用在哪個區塊 | 數量 |
|---|---|---|
| `Callout` | 頂部 IT 全域說明、MCP/KM 來源的補充說明 | 3 |
| `Zone` | 五個分區容器 | 5 |
| `SectionDosEditor` | 課別 DOs 編輯 | 單一 |
| `McpToolRow` | MCP 工具引用列表 | 列表 |
| `ExpertTagRow` | 專家標籤列表 | 列表 |
| `Button`（variant=ghost） | 新增專家標籤 | 單一 |
| `KmSourceRow` | KM 來源列表 | 列表 |
| `DomainSourceAddForm` | 新增 KM 來源 | 單一 |
| `ListRow` | 課內權限授予列表 | 列表 |
| `FormField` | 新增 KM 來源輸入、新增 grant 輸入 | 2 |
| `EmptyState` | 專家標籤/KM 來源/grant 列表為空時 | 依情境 |
| `CapabilityGate` | 包裹所有非 `ALL` 的操作 | 依操作點數量 |

### 5.3 資料需求

- `getSectionSettings(sectionId)` —— 回傳 `SectionSettings`（含 `dos`／`mcpTools`／
  `expertTags`／`kmSources`），本頁四個 `Zone`（DOs／MCP／專家標籤／KM 來源）
  共用這一次查詢。這裡的 `sectionId` 語意是 `Section.code`（URL 段
  `/section/<code>/settings` 解出來的值），不是課名（見
  `docs/decisions/0002-route-and-locale.md`）。
- `listGrants(sectionId)` —— 課內權限授予列表需要，與 `getSectionSettings`
  互不依賴，可平行取。
- 頁面標題/breadcrumb 顯示課別名稱時，與 §1 同一套規則：依
  `getCurrentUser().locale` 選 `Section.nameZh`/`nameEn`，識別（URL 段、
  `grant.sectionId` 等權限鍵）一律用 `code`；轉換只在 `DataSource` 邊界做一次
  （`listSections()`），本頁不自己轉換。
- **Open issue**：新增 grant 需要「選擇要授權給誰」，但 `DataSource` 只有
  `getCurrentUser()`，**沒有**任何「列出/搜尋使用者」的方法——這是本頁最明確的
  介面缺口，回饋到 §9 的 Open issues。

### 5.4 狀態

- **loading**：四個既有 `Zone` 可用 skeleton；grant 列表獨立 skeleton。
- **empty**：
  - `mcpTools` 理論上不會空（IT 白名單至少有一項），但若空則 `EmptyState`。
  - `expertTags` 為空 → `EmptyState`「尚無專家標籤」。
  - `kmSources` 為空 → `EmptyState`「尚無 Domain 來源」。
  - `listGrants` 為空 → `EmptyState`「目前沒有課外人員被授予權限」。
- **error**：查詢失敗 → 統一錯誤態（同 §8）。
- **無權限**：本頁的「無權限」呈現方式**不是隱藏整頁**，而是
  `docs/permission-matrix.md` 第 16 列（「進入設定頁｜✓｜唯讀｜唯讀｜L467」,
  來源是 mockup L467 的 `⚙ 課別設定` 進入鈕，L467 本身只是開啟本頁的按鈕,
  並未定義唯讀模式的視覺）定義的「唯讀」模式——editor/viewer 能看到完整頁面
  內容，但幾乎所有控制項是 disabled（`settings.view` 是 `ALL`，其餘幾乎都是
  `ADMIN_ONLY`）。**唯一例外是 `grant.manage`**：§5.2 第 6 項「課內權限授予」
  `Zone` 對 editor/viewer 整個不渲染，而非渲染出來但 disabled，見 §5.5 的
  隱藏/disable 推導。

### 5.5 權限行為

| 動作 | admin | editor | viewer | Capability |
|---|---|---|---|---|
| 進入設定頁（唯讀檢視） | ✓（可編輯） | ✓（唯讀） | ✓（唯讀） | `settings.view` |
| 編輯課別 DOs | ✓ | ✗ | ✗ | `settings.editDos` |
| MCP 工具引用勾選 | ✓ | ✗ | ✗ | `settings.toggleMcp` |
| IT 鎖定的 MCP 項目 | ✗（連 admin 都不行） | ✗ | ✗ | `settings.toggleLockedMcp`（`NOBODY`） |
| 專家標籤 新增／移除 | ✓ | ✗ | ✗ | `settings.expertTags` |
| KM Domain 來源 新增 | ✓ | ✓ | ✗ | `kmSource.add` |
| KM Domain 來源 移除 | ✓ | ✗ | ✗ | `kmSource.remove` |
| 授予／撤銷課內 editor 權限 | ✓ | ✗（整個 `Zone` 不渲染） | ✗（整個 `Zone` 不渲染） | `grant.manage` |

本頁是唯一同時出現 `ALL`（`settings.view`，三角色皆可進入）與 `NOBODY`
（`settings.toggleLockedMcp`，連 admin 都不行）與 `WRITE`（`kmSource.add`，
admin+editor）與 `ADMIN_ONLY`（其餘五項）**四種**角色範圍的畫面——`McpToolRow`
的 `lockedByIt` 分支**不可**與一般 `ADMIN_ONLY` 項目共用 disable 判斷邏輯
（component-spec 已提醒這是容易貼錯 capability 的地方）。

依 §8 的隱藏/disable 原則：`settings.editDos`／`settings.toggleMcp`／
`settings.expertTags`／`kmSource.remove` 這四項對 editor/viewer 都是 **disable**
（控制項顯示但不可互動）——使用者需要知道「課別 DOs 目前寫了什麼」「哪些 MCP
工具已勾選」「目前有哪些專家標籤」「KM 來源目前接了哪些」這些既有事實仍然為真,
只是不能改。**`grant.manage` 是例外**：課內權限授予是「產生新資產」的動作
（授予一筆新的臨時 editor 權限），而且與 editor/viewer 完全無關——他們不會
被拿來管理別人的權限，依 §8 原則應該**隱藏**，不是 disable。因此 editor/viewer
進入本頁時，§5.2 第 6 項「課內權限授予」整個 `Zone` 不渲染，而不是渲染出來但
控制項 disabled；§5.4「無權限」小節「看到完整頁面內容」的描述以此為唯一例外,
§5.8 #1 的驗收條件已同步標註。

### 5.6 互動與導航

- DOs textarea 編輯＋儲存（admin only；editor/viewer 看到 disabled textarea,
  仍能讀到目前內容）。
- MCP checkbox 切換（admin only；`lockedByIt=true` 的列連 admin 都不綁定
  onChange）。
- 專家標籤移除／新增（admin only）。
- KM 來源新增（admin+editor）／移除（admin only）——**這兩個動作故意不共用
  同一個 capability 檢查**（permission-matrix C2：接來源低風險可逆，移除
  影響全課品質）。
- Grant 新增／撤銷（admin only，可設 `expiresAt`）。
- 「← 返回」按鈕 → 導回機台一覽或先前頁面。

### 5.7 產品紅線

本頁不直接承載 D1 的八條數值/pattern 類紅線（沒有 ML 判定內容），但它是
**permission-matrix C1–C3 變更與 D5 grant 模型的 UI 具象化位置**——任何在這頁的
權限判斷寫錯（如把 `kmSource.remove` 誤判成 `WRITE` 而非 `ADMIN_ONLY`），
都直接破壞 D5 的角色模型，此頁的權限正確性等同於整個系統權限模型是否成立。

### 5.8 實作驗收條件

1. editor/viewer 進入時，`settings.editDos`／`settings.toggleMcp`／
   `settings.expertTags`／`kmSource.remove` 對應的控制項全部 disabled（與
   `lib/permission.test.ts` 的 69 項矩陣斷言一致）；`grant.manage` 是例外——
   editor/viewer 看到的是整個「課內權限授予」`Zone` 不渲染，而非 disabled
   控制項（見 §5.5 的隱藏/disable 推導）。
2. `lockedByIt === true` 的 MCP 列，即使角色是 admin，checkbox 仍 disabled 且
   顯示「🔒 IT 鎖定」——不與一般 `ADMIN_ONLY` 項目共用判斷來源。
3. editor 角色可以新增 KM 來源，但移除按鈕顯示為 disabled（不可點擊）——依 §8
   原則：KM 來源是否已登錄是使用者需要知道仍然為真的既有事實，故 disable
   而非隱藏，與本節 #1 一致。
4. 三種角色各跑一次 E2E，驗證唯讀/可編輯範圍正確（task A9.5）。
5. Grant 新增後該使用者升 `editor`、撤銷後降回 `viewer`、`expiresAt` 過期後
   自動失效——三案例各一 E2E（task A9.6）。

---

## 6. FDC 分析視窗（u chart + t chart）（`/tool/<tid>/fdc/<caseId>`，modal + page 雙模式，A5+A6）

mockup 行號區間：L1371–1709（`<div class="fdc-overlay" id="fdcOverlay">` 至
L1695 收合，加上共用的 `<div class="case-modal" id="caseModal">`
L1698–1709，已用 `sed -n '1368,1712p'` 核對起訖；`CaseIdModal` 由本頁
`FdcFeedbackPanel` 的打包動作觸發，故納入本頁區間）。

### 6.1 用途與使用情境

工程師從當機處理的 `ErrorCaseRow` 或 Copilot 的 `AskChip` 打開特定 alarm case 的
FDC 判讀：先看 u chart（90 天 by wafer 統計）找轉折點與趨勢，判斷是否為
baseline shift；若要往下追，切到 t chart（單片毫秒級波形）找異常發生在製程的
哪一秒，配合 recipe 語意追根鏈路到零件/SOP，並可標註未知現象或對判讀本身
給回饋。**同一個 URL 有兩種呈現**（既有 A0.8 骨架）：從 pane 點開 → intercepting
route 覆蓋在當前 pane 上；直接開連結／reload → 完整頁面。

### 6.2 版面結構

- 外框依模式二擇一：
  - modal 模式：`Modal`（既有 `ModalShell`）包裹
  - page 模式：同一份內容,無 `Modal` 外框（同 `FdcAnalysis` 元件的兩種 `variant`）
- 內容（兩種模式共用）：
  1. Header：icon + `caseId` + `toolId`/`parameter`/`windowDays` 副標題 +
     （僅 modal 模式）關閉鈕
  2. `TabBar`（2 tabs：📊 u chart／📉 t chart，URL query `?chart=u|t`）
  3. **u chart 分頁**：
     - `UChartTimeline`（含轉折點/分段背景/事件旗標，`ml-badge` 顯示
       「🤖 ML 切割 N 個轉折點」；圖表下方緊接著的 `.seg-legend`——pattern 色塊
       圖例＋「🔴 轉折點（ML 偵測）・🔧📐⚙ 事件旗標（時間並列，不強行歸因）」
       字樣，mockup L1430–1437——是 `UChartTimeline` 本身渲染的一部分,不是獨立
       元件；這句「時間並列，不強行歸因」是 D1 #4 在 u chart 的落地文字,
       與 §6.7 D1 #4 引用的 `SegmentCard.nearbyEvents` 是同一條紅線在圖表層與
       卡片層各自的體現）
     - `BaselineVerdictCard`
     - `Callout`（tone="info"，mockup `.tax-note`：雙維度說明）
     - `SegmentCard` 列表（每段一張，`isBaselineWindow` 標示第一段）
     - `NarrativeSummary`
  4. **t chart 分頁**：
     - `Callout`（tone="info"，mockup `.drill`：「為什麼要看 t chart」）
     - `RecipeStepBar`（點擊跳段）
     - `TChartWaveform`（實際 vs 參考疊圖 + `anomalies` 疊合）
     - `StepAnalysisCard` 列表（每個 step 一張，內含 `CompareBox`／`ChainTrail`／
       `FlywheelNote` 或 `UnknownNote` 二選一／有權限時的 `AnnotationForm` 入口）
     - `NarrativeSummary`
  5. `FdcFeedbackPanel`（👍👎 → 四分類 → 受控修正表單 → 打包，打包動作**直接**
     觸發 `CaseIdModal`——**不**從 `FdcFeedbackPanel` 拆出獨立的 `PinButton`/
     `PackageButton`，component-spec.md:1258–1261 明文要求現階段不要拆,
     此處刻意不重用 `PinButton`，避免實作者誤以為要抽元件）
  6. `CaseIdModal`（由 `FdcFeedbackPanel` 的打包動作觸發，`prefillCaseId`=
     目前 `caseId`）

本頁使用的元件清單：

| 元件 | 用在哪個區塊 | 數量 |
|---|---|---|
| `Modal`（`ModalShell`） | modal 模式外框 | 單一（page 模式不用） |
| `TabBar` | u/t chart 切換 | 單一 |
| `UChartTimeline` | u chart 圖表 | 單一 |
| `BaselineVerdictCard` | baseline 判定 | 單一 |
| `Callout` | 雙維度說明、t chart 引言 | 2 |
| `SegmentCard` | u chart 分段判定 | 列表 |
| `NarrativeSummary` | u/t 各自的 LLM 總結 | 2 |
| `RecipeStepBar` | recipe step 色帶 | 單一 |
| `TChartWaveform` | t chart 波形 | 單一 |
| `StepAnalysisCard` | 逐段 recipe 對照 | 列表 |
| `CompareBox` | 每張 `StepAnalysisCard` 內的目標/實際對照 | 依有值的 step 數 |
| `ChainTrail` | 追根鏈路 | 依 `chain` 非空的 step 數 |
| `FlywheelNote` / `UnknownNote` | 依 `kmHit` 是否為 `null` 二選一 | 每 step 1（互斥） |
| `AnnotationForm` | `kmHit===null` 且有權限時 | 依情境 |
| `FdcFeedbackPanel` | 判讀回饋流程 | 單一 |
| `CaseIdModal` | 打包成卡片 | 單一 |
| `EmptyState` | 理論上不適用（見 §6.4） | — |
| `CapabilityGate` | 包裹回饋/標註/打包按鈕 | 依按鈕數量 |

### 6.3 資料需求

- `getUChartAnalysis(toolId, caseId)` —— u chart 分頁一次取全。
- `getTChartAnalysis(toolId, caseId, { waferId?, resolution? })` —— t chart 分頁。
  **Open issue**：`waferId` 的來源沒有對應 UI——mockup 直接顯示
  「Wafer #A0714-023」，暗示是「目前 case 關聯的 OOC wafer」由後端/預設邏輯決定,
  本規格沒有定義使用者切換到其他 wafer 的介面（component-spec 也未涵蓋）。
  `resolution` 依 zoom 狀態變化，zoom 進去要重新取原始解析度（task D7/A6.2b）。
- 兩個分頁的查詢**互不依賴**，可平行預取（使用者可能直接切到 t chart），
  但 `getTChartAnalysis` 的 `resolution` 首次載入用預設值，zoom 後才重新呼叫。

### 6.4 狀態

- **loading**：整個 `FdcAnalysis` body 顯示 skeleton（既有 `FdcAnalysis` 元件目前
  是純佔位文字，尚待 A5/A6 填入實際內容與 loading 態）。
- **empty**：不適用——本視窗只在有明確 `caseId` 時才會開啟，理論上分析結果
  必然存在（除非查詢失敗，那是 error 態不是 empty 態）。
- **error**：`getUChartAnalysis`/`getTChartAnalysis` 失敗 → 整個 modal/page body
  顯示統一錯誤態（同 §8），不應該讓使用者看到半個圖表。
- **無權限**：不適用於檢視（`view.panes` 是 `ALL`）；回饋/標註/打包是個別按鈕
  層級的權限，見 §6.5。

### 6.5 權限行為

| 動作 | admin | editor | viewer | Capability |
|---|---|---|---|---|
| 檢視 u/t chart 全部內容 | ✓ | ✓ | ✓ | `view.panes` |
| 👍👎 判讀回饋 | ✓ | ✓ | ✗ | `fdc.feedbackVote` |
| 受控修正表單 | ✓ | ✓ | ✗ | `fdc.feedbackForm` |
| t chart 逐段標註 | ✓ | ✓ | ✗（看得到 `UnknownNote`，看不到標註入口） | `tchart.annotate` |
| 打包成卡片 | ✓ | ✓ | ✗ | `pin.create` |

viewer 角色在本頁**看得到完整判讀內容**（包含「我不知道」的 `UnknownNote`），
唯一被擋的是四個寫入動作——「不知道」這件事對所有角色都必須誠實顯示,
只有「你要不要教我」的寫入才分權限（呼應 `StepAnalysisCard` 的規格說明）。

### 6.6 互動與導航

- `TabBar` 切換 u/t → URL query 更新（`?chart=u` / `?chart=t`）。
- 點 u chart 轉折點/分段背景 → 對應 `SegmentCard` 高亮（雙向聯動，task A5.6），
  不改變 URL。
- 圖上框選 baseline 區間（task A5.7）→ 框選結果進回饋 payload，不是 URL 狀態。
- 點 recipe step 色塊 → 對應 `StepAnalysisCard` 捲動並高亮。
- 點 `ChainTrail` 的 SOP 節點 → 觸發 Copilot 提問（不進 URL）。
- `FdcFeedbackPanel` 狀態機：`idle` → `goodConfirmed`/`optionsOpen` →
  `formOpen(kind)` → `submitted`，純頁面內部 state，不進 URL。
- 「📌 打包成卡片」→ `CaseIdModal`（`prefillCaseId` = 目前 `caseId`）→ 確認後
  導向病史分析頁並高亮新卡片。
- ESC / 點擊背景（僅 modal 模式）→ `router.back()`，URL 回到底層 pane。

### 6.7 產品紅線

本頁與深度診斷並列 D1 紅線密度最高的畫面：

- **D1 #1**：`Segment`/`StepAnalysis` 的 `verdict`/`timePattern`/`distPattern`/
  `kmHit` 皆為既定資料,元件（`SegmentCard`/`PatternTag`/`StepAnalysisCard`）
  不推斷。
- **D1 #3（受控詞彙）**：目標是全部受控，但目前只有一半落地——
  `FdcFeedbackPanel` 修正表單的 `pattern` 分類下拉已可用 `domain/taxonomy.ts`
  的 `TAXONOMY`（時序/分布）受控詞彙；但 `AnnotationForm` 的「現象分類」下拉
  （mockup L1622–1626 的五個中文選項）**尚無對應的 taxonomy code**，
  component-spec.md:1877–1880 已記錄這是待補的受控詞彙表（建議 `ANNOTATION_KINDS`）,
  這是 **A6 標註功能落地前的 blocker**，不是本頁已解決的項目——見 §9 Open issues。
- **D1 #4（事件與敘事分離）**：`SegmentCard` 的 `nearbyEvents` 與統計/敘事在
  視覺上分開陳列,並固定帶出「時間並列，不代表因果——由你判斷」字樣,
  不可與敘事文字混排。
- **D1 #5（不知道是一等狀態）**：`StepAnalysis.kmHit === null` 的每個 step
  **必須**渲染 `UnknownNote`（並視權限顯示標註入口），不得省略。
- **D1 #8（可溯源）**：`BaselineVerdictCard`／`CompareBox` 的所有數字直接顯示
  domain 欄位（`deltaValue`/`sigmaMultiple`/`recipeTarget`/`actual`），
  元件不重新計算；`NarrativeSummary` 固定渲染「LLM 只讀 ML 輸出做敘事」
  的免責文字,呼叫端無法關閉。
- **D7（降採樣保真）**：`TChartWaveform` 疊合的 `anomalies` 是獨立於降採樣的
  ML kernel 產出，zoom 後時間軸對齊誤差需 < 1 個顯示像素（task A6.2b 驗收標準）。

### 6.8 實作驗收條件

1. 同一 URL 兩種呈現：從 live pane 點開 → `[role=dialog]` 存在且底層 pane
   仍掛載；reload 同一 URL → 無 dialog、完整頁面（沿用既有 A0.8 驗證方式）。
2. u chart 的 `segments.length` 與 `changepoints.length + 1` 相符
   （N 個轉折點切出 N+1 段）。
3. `StepAnalysis.kmHit === null` 的每一筆都渲染 `UnknownNote`，絕不會兩者
   （`FlywheelNote`/`UnknownNote`）都不渲染（code review 檢查點）。
4. viewer 角色看不到 👍👎 回饋按鈕的可互動態（disabled），但完整判讀內容
   （含 `UnknownNote`）仍可見。
5. zoom t chart 後，`anomalies` 標記位置與波形時間軸對齊誤差 < 1 個顯示像素
   （task A6.2b 明訂的量測方式）。
6. 標註送出後三下游（Case Center／KM／ML training queue）分項狀態顯示,
   刻意讓其中一個失敗時 UI 不會一律顯示成功（task A6.7）。

---

## 7. iDo Copilot 側欄（無獨立路由，跨頁面浮層，A10）

mockup 行號區間：L1711–1762（`<button class="fab" id="fab">` 至
`<div class="rail" id="rail">` 收合，已用 `sed -n '1708,1765p'` 核對起訖——
**修正**：本規格 fix-first 前一版曾寫 L1711–1800，但 L1763 之後已是
`<script>` 區塊，不屬於這個畫面的標記，此處以 sed 核對後的實際邊界為準）。

### 7.1 用途與使用情境

任何頁面（七個畫面之一）都能開啟的浮層助手：使用者用自然語言問問題，得到
含來源引用的回答，可複製、可打包成 case 卡片。這是「畫面放事實，分析靠問」
這句產品理念的具體實現——前六個畫面陳列既有資料,真正的分析與追問都經由這個
側欄完成。

### 7.2 版面結構

- `Drawer`（`open`/`closed`）：
  - header：`CopilotRail` 的標頭（logo + title + `contextLabel` + 關閉鈕）
  - `AskMenu`（3 組：📈 病史分析／📉 FDC 圖形分析／🔬 深度診斷，每組數個
    `AskChip`；問過一次後自動收合，顯示「💡 顯示常用問法」切換列）
  - 訊息串：`MessageBubble` 列表（`role="user"`/`"assistant"`；assistant
    訊息可能含 `SourceLine`／`CopyButton`／`PinButton`）
  - 輸入列：文字輸入框 + 送出 `Button`
- `Button`（variant="fab"）：不在 `Drawer` 內，是觸發開啟的浮動按鈕（`id="fab"`）

`CaseIdModal` 由 `MessageBubble` 的 `PinButton` 觸發，渲染時機與本 Drawer 的
開關狀態無關（可能疊在任何底層頁面之上）。

本頁使用的元件清單：

| 元件 | 用在哪個區塊 | 數量 |
|---|---|---|
| `Drawer` | 側欄外框 | 單一 |
| `CopilotRail` | 側欄容器（標頭/例句/訊息/輸入） | 單一 |
| `AskMenu` | 例句選單 | 單一 |
| `AskChip` | 例句選單內每個 chip | 列表（3 組共 20 個固定問句：📈 病史分析
  L1726–1732 共 7 個、📉 FDC 圖形分析 L1736–1741 共 6 個、🔬 深度診斷
  L1745–1751 共 7 個，7+6+7=20；原稿 21 為誤記） |
| `MessageBubble` | 每則訊息 | 列表 |
| `SourceLine` | assistant 訊息的來源引用 | 依訊息數 |
| `CopyButton` | assistant 訊息的複製 | 依訊息數 |
| `PinButton` | assistant 訊息的打包觸發 | 依訊息數（僅帶 `title` 的回覆才有） |
| `CaseIdModal` | 打包流程 | 單一（由 `PinButton` 觸發時渲染） |
| `Button`（variant="fab"） | 開啟入口 | 單一 |

### 7.3 資料需求

Copilot 沒有對應的 `DataSource` 讀取方法——**這是刻意的**：`DataSource` 涵蓋
「查詢既有資料」，而 Copilot 的問答/串流是另一條路徑（Server Action + SSE，
task A10.4），型別留待 A10 定案（component-spec 已列為 Open issue：
`CopilotMessage` 型別缺失）。本頁（側欄）沒有可平行取的多筆讀取需求。

### 7.4 狀態

- **loading**：訊息串流中的呈現——**component-spec 沒有為此定義專屬元件**
  （`MessageBubble` 沒有 loading/streaming variant），記入 Open issues。
- **empty**：訊息串為空時顯示固定歡迎詞（「👋 我是 iDo。上面是常用問法…」），
  這是 `CopilotRail` props 定義的預設行為，**不是** `EmptyState` 元件
  （歡迎詞是引導文案，不是「無資料」的中性陳述）。
- **error**：中斷／逾時／串流錯誤（task A10.4 提及）——**component-spec 沒有
  定義專屬的錯誤訊息呈現**，記入 Open issues；暫定沿用 `MessageBubble`
  但目前型別沒有 error variant。
- **無權限**：不適用於提問本身（`copilot.ask` 是 `ALL`）；`onPin` 的顯示/隱藏
  依 `pin.create` 權限（見 §7.5）。

### 7.5 權限行為

| 動作 | admin | editor | viewer | Capability |
|---|---|---|---|---|
| 提問（任何內容） | ✓ | ✓ | ✓ | `copilot.ask` |
| 複製回覆 | ✓ | ✓ | ✓ | 不涉及 capability |
| 打包到 case | ✓ | ✓ | ✗（`MessageBubble` 不渲染 `PinButton`） | `pin.create` |

viewer 角色的 assistant 訊息**完全看不到打包按鈕**（`onPin` 未提供），
而不是顯示 disabled 的按鈕——因為打包是「產生新的可見資產」而非「切換
既有資料的狀態」，隱藏比 disable 更符合語意（對照 `ToolFileRow` 的
checkbox 是 disable 而非隱藏，因為使用者需要知道「有沒有被參考」這個事實）。

**明講權限判斷寫在哪裡**：「`onPin` 未提供」不代表這裡跳過了權限檢查、
自己重新發明判斷式——`CopilotRail`／`MessageBubble` 的呼叫端**仍然要呼叫
`can(role, 'pin.create')`**（`@/lib/permission`），只是這次呼叫的結果不是拿去
包一層 `CapabilityGate`，而是拿去決定要不要把 `onPin` 這個 prop 傳給
`MessageBubble`（`can(...) ? onPin : undefined`）。這與 §8「權限 gating 的
統一做法」一節「一律透過 `CapabilityGate`…或直接呼叫 `can(role, capability)`,
不得在頁面/元件內重新發明 `if (role === 'admin')` 判斷式」並不衝突——`can()`
本身就是那個唯一權限判斷入口，只是本頁把它的結果消費成「prop 傳不傳」而不是
「要不要 gate」，本頁不使用 `CapabilityGate` 元件（見 §9 矩陣）。

### 7.6 互動與導航

- FAB 點擊 → 開啟 `Drawer`（`open=true`）。
- ESC／關閉鈕 → `onClose`。
- `AskChip` 點擊 → `onAsk(question)` 送出並自動收合 `AskMenu`（問過一次後）。
- 輸入框 Enter → 送出。
- `CopyButton` 點擊 → 複製純文字，1.5 秒視覺回饋後還原。
- `PinButton` 點擊 → 開啟 `CaseIdModal`（`prefillCaseId` 依語境：一般聊天為空，
  由 case 語境開啟 Copilot 時自動帶入）→ 確認 → 導向病史分析頁並高亮新卡片。
- **Copilot 的開關狀態與 `contextLabel`／訊息串不進 URL**——這是跨頁浮層的
  ephemeral UI 狀態，reload 會重置為關閉（與 FDC 視窗刻意不同，見 §8）。
- 從 FDC 視窗內的 `AskChip`「📉 開 t chart：這片為什麼 OOC？」點擊 →
  同時觸發開啟 t chart（改變 URL）與關閉 Copilot（不改變 URL 的那部分）——
  這是本頁與 FDC 視窗唯一的直接互動橋接點。

### 7.7 產品紅線

- **D1 #6（AI 不做決策）**：assistant 回答內容不得包含「建議放寬 spec」／
  「決定停機」這類語句——這是**內容規則**，UI 結構對此的保證很薄弱
  （`MessageBubble` 無法在型別層面擋掉措辭），主要依賴後端 prompt/D1 紅線,
  誠實記錄此落差而非假裝 UI 能完全保證。
- **D1 #8（可溯源）**：`MessageBubble.source` 是 **optional**——結構上本頁
  **不強制**每則 assistant 訊息都有來源，強制性必須在填入 `content` 的
  那一層（後端/Server Action）保證，`MessageBubble` 只是誠實反映「有沒有
  收到來源」。
- **D4（禁用 innerHTML，結構化 blocks + sanitize）**：`MessageBubble.content`
  目前是 `React.ReactNode` 佔位（`CopilotMessage` 型別待 A10 定案），
  正式版必須改為 `readonly MessageBlock[]` 並 sanitize，不得沿用 mockup 的
  `innerHTML` 模式。

### 7.8 實作驗收條件

1. FAB 在七個畫面中任一頁點擊都能開啟同一個 `CopilotRail`（非各頁各自
   實作一份）。
2. 惡意字串（如 `<script>alert(1)</script>`）貼入輸入框送出後,在
   `MessageBubble` 中不會被執行（XSS 測試，task A10.3）。
3. viewer 角色的 assistant 訊息旁不出現 `PinButton`。
4. `CopyButton` 點擊後 1.5 秒內顯示「已複製」再自動還原。
5. 關閉 Copilot 再重新打開，先前對話串仍保留（`Drawer` 用 CSS transform
   而非 unmount，需驗證確實沒有 unmount 導致狀態遺失）。
6. 從 FDC 視窗的「📉 開 t chart」`AskChip` 點擊後，`openFDC('t')` 與
   `closeCopilot()` 兩個副作用皆發生（URL 改變 + Drawer 關閉）。

---

## 8. 跨頁面共通規則

**導航模型（什麼進 URL）**——本節依
`docs/decisions/0002-route-and-locale.md` 全面改寫，取代舊版判準：

- 進 URL：`sectionId`（即 `Section.code`，僅出現在 `/section/<code>` 與
  `/section/<code>/settings`，機台子樹不帶這一段）、`toolId`、檢視模式
  （`history`/`diagnosis`；當機處理是 `/tool/<tid>` 本身，不是獨立的檢視模式段）、
  FDC `caseId` + `chart`（u/t）、深度診斷的 `indicator` 與關聯圖子分頁
  （建議 query string，本文件在 §4.6 首次提出此建議，task 檔本身只說
  「URL 同步」未給出精確 query key，屬於本規格的補充判斷）。
- **不進 URL**：**語系**（`User.locale`——`localePrefix: "never"`，真相來源是
  使用者設定，cookie 只當快取；理由見下方判準與
  `docs/decisions/0002-route-and-locale.md`）、Copilot 的開關狀態與訊息串
  （跨頁浮層，ephemeral，reload 重置為關閉）、`FdcFeedbackPanel` 的狀態機、
  Role 切換器（demo 用，A1.10——**特別注意**不應該做成 URL query，否則分享
  連結會意外把自己的角色帶給別人，應該用 cookie/localStorage 之類的本機狀態）。
- **判準（取代本節舊版「可分享、需要 reload 後還原的狀態才進 URL」）**：
  舊判準只能回答「進不進 URL」，對 locale／`sectionId`／`toolId`／`caseId`／
  檢視模式／`chart`／`indicator` 這些「可分享、reload 後還原」的狀態給出
  同一個答案，無法進一步分辨哪些該進路徑段、哪些該進 query。改用兩條判準：
  1. **使用者範圍 vs URL 範圍**：永遠不會想同時看兩份的 → 使用者設定
     （語系屬此類——沒人會想同時開中英文兩個分頁對照）；
     有可能想同時看兩份的 → 進 URL（課別與機台屬此類——跨課支援、比對兩台
     機器都是真實情境，`managerOf`／`supportSections` 本身就是陣列）。
  2. **路徑 vs query**：路徑 = 不同資源或不同資料合約（`sectionId`／
     `toolId`／`caseId`／檢視模式，各自對應不同的 `DataSource` 呼叫）；
     query = 同一資源的檢視參數（`chart`／`indicator`，資料合約不變，只是
     切換呈現角度）。

**資料時效標示（as-of 時間戳，task C2.2）**：

七個畫面目前都沒有落地任何「這份資料是幾點抓的」標示，component-spec 也沒有
為此定義專屬元件——本規格建議**不需要新元件**，用既有 `Zone` 的 `hint` slot
承載（如 hint 從「人下的註解・這台現在為什麼不動」擴充為附帶「・更新於 14:32」），
但這只是建議做法，尚未在任何一節列為強制驗收條件，記入 §9 Open issues。

**i18n（task A1.7/D9，語系決策見 `docs/decisions/0002-route-and-locale.md`）**：

- 所有畫面文字（包含本文件列出的每個固定問句、Callout 說明文字、Empty/Error
  文案）一律進訊息檔，不得硬寫在元件或頁面裡。
- **例外**：受控 taxonomy 的英文 code（`STABLE`/`MEAN_SHIFT`/`BOWL`…）是識別碼
  不是翻譯，照常保留原文；`AskChip` 的 `question`（送給後端的實際問句 key）
  同樣不應該被 i18n 的翻譯流程改動到——只有 `label`（顯示文字）需要翻譯，
  這是 component-spec 已明確提醒的地雷（`AskChip` 重用注意）。
- **語系不進 URL**：`localePrefix: "never"`，URL 完全不帶語系段。真相來源是
  `User.locale`；cookie 只當快取，不是權威來源。現階段不做語系切換 UI
  （`messages/en.json` 是 `{}`，只有一個語系有內容，切換器沒有實際意義）。
- **資料在地化與 UI 文案在地化是兩套機制，不要混為一談**：
  - **UI 文案在地化**：畫面上的固定文字（按鈕標籤、Callout 說明、空狀態文案）
    走 `messages/` + `next-intl` 的 `t()`，缺鍵 fallback 到 zh-TW。
  - **資料在地化**：課別的雙語名稱（`Section.nameZh`/`nameEn`）是**資料本身
    帶的欄位**，不是訊息檔的鍵——顯示哪個名稱依 `User.locale` 直接從 `Section`
    物件選（`zh-TW`→`nameZh`、`en`→`nameEn`），不經過 `t()`。§1.2/§1.3、
    §5.1/§5.3 已依此改寫。兩套機制服務不同的字串（UI 框架文字 vs 業務資料），
    未來若要新增其他有雙語欄位的資料（不只是課別），應該延續「資料帶欄位、
    由呼叫端依 locale 選」這個模式,不要試圖塞進 `messages/`。

**權限 gating 的統一做法**：

- 一律透過 `CapabilityGate`（引用 `lib/permission.ts` 的 `can()`）或直接呼叫
  `can(role, capability)`，不得在頁面/元件內重新發明 `if (role === 'admin')`
  判斷式。
- 「隱藏」vs「disable」的選擇原則：使用者需要知道**某個事實仍然為真**
  （如檔案是否已被 Copilot 參考、MCP 工具目前是否啟用）時用 disable；
  純粹是「產生新資產的動作」且與該角色完全無關時用隱藏（如 viewer 看不到
  `PinButton`）。這個原則在 §2.5／§4.5／§5.5／§7.5 都各自落地過，此處統一收斂成
  一條規則供其餘頁面／未涵蓋情境依循。
- 前端 gating 只是 UX；每個寫入端點都必須在 Server Action/server 邊界重驗
  （permission-matrix「實作要求」已明訂），本文件的每節「權限行為」只描述
  前端呈現,不代表後端可以省略。

**錯誤處理的統一做法**：

- `loading`／`error` 態目前**沒有**任何統一元件（`EmptyState` 已存在但
  loading skeleton 與 error 呈現都還沒有對應的 primitive/composite，
  task C2.1「錯誤／空／載入／無權限態系統化為共用元件」尚未執行）。
  七節內文中對 loading/error 的描述都是**規格性建議**而非引用具體元件,
  這是本文件最大的一致性缺口,記入 §9 Open issues,建議 C2.1 落地時
  優先設計「哪些頁面需要 skeleton 骨架、哪些只需要文字」，回頭補進
  component-spec。
- 「無權限」的呈現**不是**統一的錯誤頁跳轉——七個畫面裡除了跨課
  `canEnterSection` 失敗（403，發生在能不能進入課別，早於本文件七個畫面
  的任何一個）之外，「無權限」永遠是頁面內局部的 disable/隱藏，不會讓
  使用者看到一個空白的「無權限」頁面。

---

## 9. 頁面 × 元件 涵蓋矩陣

「頁面」欄位縮寫：P1 機台一覽／P2 當機處理／P3 病史分析／P4 深度診斷／
P5 課別設定／P6 FDC 分析視窗／P7 Copilot 側欄。

| 元件 | 分層 | 使用頁面 |
|---|---|---|
| `Zone` | Primitive | P2, P3, P4, P5 |
| `StatusDot` | Primitive | P1 |
| `Tag`（經由 `AskChip` 組成） | Primitive | P2, P3, P4, P7 |
| `Badge`（經由 `ToolCommandRow`/`PinnedCard`/`CandidateRow`/`McpToolRow`/`ExpertTagRow`/`StepAnalysisCard`/深度診斷 ML 判定卡（見 Open issues）等組成） | Primitive | P2, P3, P4, P5, P6 |
| `Button`（P3 經由 `VoteButtons` 組成；P6 另經由 `FdcFeedbackPanel`／`AnnotationForm`／`CaseIdModal` 等組成） | Primitive | P2, P3, P4, P5, P6, P7 |
| `Callout` | Primitive | P1, P2, P3, P4, P5, P6 |
| `Metric` | Primitive | P4 |
| `EmptyState` | Primitive | P1, P2, P3, P4, P5 |
| `SourceCitation`（經由 `PinnedCard` 組成） | Primitive | P3 |
| `CopyButton` | Primitive | P7 |
| `ListRow`（經由 `ToolCommandRow`/`ErrorCaseRow`/`ToolFileRow`/`CandidateRow`/`PendingEdgeRow`/`BuildStepRow`/`McpToolRow`/`ExpertTagRow`/`KmSourceRow` 等組成，亦直接用於 P3/P4/P5 的新增區塊） | Composite | P2, P3, P4, P5 |
| `TwoColumnLayout` | Composite | P2, P3, P4 |
| `TabBar` | Composite | P4, P6 |
| `SegmentedControl`（經由 `SpatialIndicatorTabs` 組成） | Composite | P4 |
| `Drawer` | Composite | P7 |
| `Modal`（`ModalShell`，亦為 `CaseIdModal` 基礎） | Composite | P6, P7 |
| `CompareBox` | Composite | P6 |
| `FormField`（P6 經由 `AnnotationForm`／`FdcFeedbackPanel` 組成） | Composite | P5, P6 |
| `VoteButtons` | Composite | P3, P4 |
| `CapabilityGate`（P7 不使用此元件——`PinButton` 的顯示/隱藏改呼叫 `can()`
  直接決定 prop 傳不傳，見 §7.5／M15） | Composite | P2, P3, P4, P5, P6 |
| `Brick`（既有，表格列名沿用 component-spec 的 `ToolBrick`） | Domain | P1 |
| `ToolCommandRow` | Domain | P2 |
| `ErrorCaseRow` | Domain | P2 |
| `ChronicBadge` | Domain | P2 |
| `ToolFileRow` | Domain | P2 |
| `AskChip` | Domain | P2, P3, P4, P7 |
| `PinnedCard` | Domain | P3 |
| `PatternTag`（P6 經由 `SegmentCard` 組成） | Domain | P4, P6 |
| `SpatialIndicatorTabs` | Domain | P4 |
| `DualChuckVerdict` | Domain | P4 |
| `SuspectList` | Domain | P4 |
| `FlywheelNote` | Domain | P4, P6 |
| `UnknownNote` | Domain | P4, P6 |
| `CrossDiagnosisPanel` | Domain | P4 |
| `CandidateRow` | Domain | P4 |
| `PendingEdgeRow` | Domain | P4 |
| `BuildStepRow` | Domain | P4 |
| `NarrativeSummary` | Domain | P6 |
| `BaselineVerdictCard` | Domain | P6 |
| `SegmentCard` | Domain | P6 |
| `StepAnalysisCard` | Domain | P6 |
| `ChainTrail` | Domain | P6 |
| `AnnotationForm` | Domain | P6 |
| `FdcFeedbackPanel` | Domain | P6 |
| `CaseIdModal` | Domain | P6, P7 |
| `CopilotRail` | Domain | P7 |
| `AskMenu` | Domain | P7 |
| `MessageBubble` | Domain | P7 |
| `SourceLine` | Domain | P7 |
| `PinButton`（P6 不獨立抽出，`FdcFeedbackPanel` 的打包動作直接觸發 `CaseIdModal`,
  不重用 `PinButton`，見 component-spec.md:1258–1261／§6.2） | Domain | P7 |
| `McpToolRow` | Domain | P5 |
| `ExpertTagRow` | Domain | P5 |
| `KmSourceRow` | Domain | P5 |
| `DomainSourceAddForm` | Domain | P5 |
| `SectionDosEditor` | Domain | P5 |
| `UChartTimeline` | 視覺化 | P6 |
| `TChartWaveform` | 視覺化 | P6 |
| `RecipeStepBar` | 視覺化 | P6 |
| `WaferMap` | 視覺化 | P4 |
| `SlitProfile` | 視覺化 | P4 |
| `FieldFocusMap` | 視覺化 | P4 |
| `RelationGraph` | 視覺化 | P4 |
| `WeightBar` | 視覺化 | P4 |

**涵蓋結論**：component-spec.md 定義的 63 個元件，本規格的七個畫面**全部都用到了**——
沒有「元件庫過度設計、沒人用」的孤兒元件。這本身是一個值得記錄的正面結果
（元件庫的顆粒度與七個畫面的實際需求對得上），但有兩個地方要誠實補充：

1. 多個 primitive（`Tag`／`Badge`／`SourceCitation`／`ListRow`／`SegmentedControl`）
   **只透過上層 composite/domain 元件間接被使用**，沒有任何頁面直接裸用它們——
   這是分層元件庫的預期行為（primitive 存在的目的就是被組合），不是缺口。
2. `VoteButtons` 在 P3（病史分析的晉升審核佇列）的用法是**本規格的判斷**而非
   mockup 明示——mockup 完全沒有畫出審核佇列這個 UI，component-spec 也沒有為此
   定義專屬元件，本規格選擇重用 `VoteButtons`（up=核可/down=退件）而非新創,
   這個決定需要在實作前跟 PM/設計再確認一次語意是否成立（尤其「退件」是否
   應該像 `CandidateRow` 的「👎」一樣展開一個修正下拉，或單純是二元否決）。

**依賴標註**：上面「63 個元件全部都用到了」這個結論，**依賴 P3 那個本規格發明出來
的 admin 晉升審核佇列**（§3.2 第 2 項、本節上方第 2 點——皆已誠實標註為非 mockup
明示的判斷）——`VoteButtons` 在 P3 的唯一用途就是這個審核佇列。若 PM 否決這個
佇列的設計（見上面第 2 點與 §9 Open issues「晉升審核流程中間態觸發者未定義」）,
`VoteButtons` 在本文件裡就會退回只剩 P4（關聯圖候選/待確認邊）一個使用頁面,
上面矩陣的 `VoteButtons` 列與這裡的「全部都用到了」結論都需要跟著改寫。

**Open issues（依對頁面/介面設計的影響排序）**：

- **P4 深度診斷 — 「深度診斷 ML 判定卡」無對應元件名**：mockup 五個 dd-view
  皆有一張承載 `mlStatement` 的卡（`.tseg`，卡頭 `tseg-tag`／卡身敘述／內嵌
  `SuspectList`＋`FlywheelNote`/`UnknownNote`），但 component-spec.md 的 63
  個元件名冊裡沒有為它定義名字，只在 932 行的 `FlywheelNote` 紅線說明裡提過
  「深度診斷的 ML 判定卡」這個說法。**A7 實作前需要 component-spec 補定義這個
  元件（含 props 形狀），本規格不自行命名。**
- **P6 FDC — `AnnotationForm` 的「現象分類」缺 `ANNOTATION_KINDS` 受控詞彙**：
  mockup L1622–1626 的五個中文選項（感測器 data loss／通訊丟包／真實壓力擾動／
  recipe step 邊界對錯／其他）目前是寫死的中文，尚未進入 `domain/taxonomy.ts`。
  這與 `FdcFeedbackPanel` 的 `pattern` 分類已可用 `TAXONOMY` 不同——後者已受控,
  前者沒有。**這是卡住 A6 標註功能落地的 blocker**，需要先在 `domain/taxonomy.ts`
  補一組 `ANNOTATION_KINDS` 常數（component-spec.md:1877–1880 已記錄此缺口）,
  不是本文件能自行決定的事。
- **P4 深度診斷 — 關聯圖查詢的 `symptom` 輸入無對應 UI**：`queryGraph(toolId, symptom)`
  的 `symptom` 參數來源不明確，mockup 沒有輸入框，本規格假設自動代入目前 case
  的 `alarmCode`；若未來要支援自由輸入查詢，需要新的輸入元件（不可迳自新創）。
- **P4 深度診斷 — FSE「匯出佐證資料」無對應 capability／`DataSource` 方法**：
  task A7.11 提及「佐證資料匯出（slit 趨勢＋影響 lot 清單）」，但 `permission.ts`
  的 `CAPABILITIES` 與 `DataSource` 介面都沒有對應項目。
- **P3 病史分析 — 晉升審核流程（`private → pending → common`）的中間態觸發者
  未定義**：`permission.ts` 只有 `pin.promoteToCommon`（`ADMIN_ONLY`）一個
  capability，不清楚 `pending` 狀態由誰／如何觸發（editor 送出請求？系統規則？），
  本規格用 `VoteButtons` 拼出的審核佇列因此只是暫定方案。
- **P5 課別設定 — 課內權限授予（grant）缺「列出可授權使用者」的 `DataSource`
  方法**：`grant.manage` 需要選擇要授權給誰，但 `DataSource` 只有
  `getCurrentUser()`，沒有 `listUsers()`／`searchUsers()` 之類的方法；本頁
  這整個 `Zone`（§5.2 第 6 項）也完全沒有 mockup 依據，是 task A9.6 新增需求。
  **受影響對象已限縮**：因 `grant.manage` 這個 `Zone` 對 editor/viewer 整個不
  渲染（§5.5 的隱藏/disable 推導），這個缺口只影響 admin 這一種角色看到的畫面
  ——不需要為 editor/viewer 也設計「列出可授權使用者」的呈現方式。
- **P6 FDC — t chart 的 `waferId` 選擇機制未定義**：`getTChartAnalysis` 需要
  `waferId`，但沒有 UI 讓使用者切換到「這個 case 的其他片」；本規格假設預設值
  是後端指定的 OOC wafer。
- **P2 當機處理 — 機台屬性側欄無對應 domain 元件**：`ToolAttributes` 的
  key-value 顯示，component-spec 沒有為此定義元件（`Metric` 語意是量測值不是
  靜態屬性），本規格建議直接在 `Zone` 內放 `<dl>`，不臆造新元件。
- **P7 Copilot — 串流 loading／中斷／逾時／錯誤態無對應元件**：`MessageBubble`
  沒有 streaming/error variant，task A10.4 提及但 component-spec 未涵蓋。
- **全七頁 — loading／error 態系統性缺元件**（task C2.1 尚未執行）：目前只有
  `EmptyState` 存在，本文件每節的「狀態」小節對 loading/error 只能規格性描述,
  無法引用具體元件名稱。
- **全七頁 — 資料時效（as-of 時間戳，task C2.2）未落地**：建議用 `Zone.hint`
  承載，但目前沒有任何一頁把這件事列為驗收條件，是系統性的延後項目。
- **殼層 — `FdcAnalysis`（§6.2 P6 外框）、`Header`（§1.6／§1.3 提及的 shell 層）、
  `ControlBar`（§1.3 提及的 shell 層）是既有真實元件，但都不在 component-spec
  的 63 個名冊內**：本文件引用它們是描述既有現況（如 `FdcAnalysis` 的
  modal/page 雙 variant、`Header` 的課別選單、`ControlBar` 的檢視模式切換）,
  不是新創元件，不受「元件名封閉性」規則約束。建議 component-spec 補收這三個
  shell 層元件，或明確聲明 shell 層不在 63 個名冊的範圍內，避免下一輪 review
  誤以為這是本文件自創的元件名。
- **殼層 — 個人偏好介面無對應元件**：語系（`User.locale`）決定為使用者個人
  偏好、每個角色都要能改自己的（§5.1、`docs/decisions/0002-route-and-locale.md`），
  但 component-spec.md 的 63 個元件名冊裡沒有這個東西，依「元件名封閉性」鐵律
  不自行命名。形態待決定：Header 下拉選單，或獨立的 `/me` 頁面（也連帶決定
  這是不是需要新路由）。**A10 之前若要落地語系切換 UI，需要先補這個元件到
  component-spec。**
- 以下延續自 `component-spec.md` 既有 Open issues，且直接影響本文件對應頁面的
  完整度，一併記錄：`CopilotMessage` 型別缺失（P7）、FDC 回饋 payload 無 schema
  （P6）、t chart 標註 payload 無 schema（P6）、`BuildStep` 無 schema（P4）、
  `chuckMapSchema.pattern` 裝不下複合 pattern（P4）、Leveling hot spot 無對應
  taxonomy code（P4）、`field_focus`/`slit` 聚合量測但 schema 強制 chuck 陣列（P4）。
