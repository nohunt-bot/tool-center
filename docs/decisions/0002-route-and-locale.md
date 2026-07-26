# 0002 — 路由前綴、語系不進 URL、課別識別改用 code

- Date: 2026-07-26
- Task: `docs/tasks/20260724-tool-center-gui.md`（R1–R10）
- Status: accepted

## Context

三件事同時卡住 route 目錄搬遷與 R1–R10 的落地，必須先定案才能動工：
1. 舊路由 `/[locale]/section/[sid]/tool/[tid]/...` 把 locale／課別／機台三段
   全部疊在同一條路徑上，`sectionId` 在權限判斷（`resolveRole(user, sectionId, grants)`）
   裡來自 URL，而 `sid` 與 `tid` 可任意配對——在自己管的課的 `sid` 下掛別課的
   `tid`，會取得該機台的 admin 權限，是結構性的權限提升漏洞。
2. i18n 骨架已用 next-intl 的預設 `localePrefix: "always"` 落地，但目前只有
   zh-TW 一個語系有內容（`messages/en.json` 是 `{}`），需要決定 locale 是否
   繼續進 URL。
3. 課別先前用 `nameEn`（如 `LITHO-02`）當識別碼與權限鍵，但 `nameEn` 其實是
   英文課名不是唯一識別碼，課別實際有三個欄位：`code`（唯一識別）／`nameEn`／`nameZh`。

## Decision

- **路由改用完整詞前綴（方案 C）**：`/section/<code>`、
  `/section/<code>/settings`、`/tool/<tid>`（當機處理，即 `/tool/<tid>` 本身，
  不再有 `/live` 段）、`/tool/<tid>/history`、`/tool/<tid>/diagnosis`、
  `/tool/<tid>/fdc/<caseId>`。機台子樹不帶課別段——section 由 tool 反查，
  舊漏洞在新結構下不存在（`sid`/`tid` 任意配對這件事結構上消失）。
  `?chart=u|t`、`?indicator=<spatialIndicator>` 維持 query 不變。
- **語系不進 URL**：`localePrefix: "never"`。真相來源是 `User.locale`；
  cookie 只當快取，不是權威來源。現階段不做語系切換 UI。
- **課別識別改用 `code`**：`Section` 型別為 `{code, nameEn, nameZh}`，
  `code` 是唯一識別、用於 URL 與權限鍵；顯示哪個名稱由 `User.locale` 決定
  （`zh-TW`→`nameZh`、`en`→`nameEn`）。名稱↔代碼的轉換只在 `DataSource`
  邊界做一次，往內（元件／頁面／Server Action）一律只有 `code`；`nameEn`
  預設為純顯示欄位，不允許用名稱查詢（唯一性未確認）。對照表沿用既有
  `listSections()`，不需要新方法。語系是使用者範圍、不是課別範圍，不進
  permission matrix 的 capability 清單。

## Alternatives rejected

- **方案 A（無前綴詞，`/LITHO-02`、`/SCN-A01`）** — 路由層無法區分課別與機台
  （兩者都是根層動態段），且根層動態段會吃掉未來所有單段路徑，任何新的
  頂層頁面都會先撞進這個動態段的匹配範圍。
- **方案 B（單字母前綴 `/s/`、`/t/`）** — 可行但可讀性差，URL 本身不表意。
- **方案 D（檢視模式進 query，如 `?v=history`）** — 當機處理／病史分析／深度診斷
  三個檢視的資料需求完全不同（`listToolCommands`+`listErrorCases`+`listToolFiles`
  vs `listPinnedCards` vs `getCrossDiagnosis`+`getSpatialAnalysis`），併成一個
  route 會失去各自的 code split。
- **語系用 path prefix（`/zh-TW/...`，next-intl `localePrefix: "always"` 預設）** —
  只有一個語系有意義，代價照付（每條路徑多一段、每個連結產生點都要處理
  locale 前綴）好處沒有；且 `/en/*` 會回 200 但內容其實是中文（`en.json` 是
  `{}`，deepMerge fallback 到 zh-TW），對外呈現一個「支援英文」的假象。
- **語系存 cookie 而非使用者記錄** — 內部工具的使用者有身分（OIDC 登入），
  偏好理當跟著人（跨裝置、換瀏覽器都要維持），不該綁在單一瀏覽器的 cookie。
- **課別改成使用者狀態（URL 不帶 `code`）** — `managerOf`／`supportSections`
  都是陣列，一個人可能同時支援多課；跨課的人會想開兩個 tab 對照不同課別，
  全域狀態（單一「目前課別」）會讓兩個 tab 互相蓋掉對方的狀態。

## 判準（值得留成通則）

- **使用者範圍 vs URL 範圍**：永遠不會想同時看兩份的 → 使用者設定；
  有可能想同時看兩份的 → 進 URL。語系屬前者（沒人會想同時看中英文兩個分頁
  對照），課別與機台屬後者（跨課支援、比對兩台機器都是真實情境）。
- **路徑 vs query 的判準**：路徑 = 不同資源或不同資料合約；query = 同一資源的
  檢視參數。`sectionId`／`toolId`／`caseId`／檢視模式（`live`/`history`/`diagnosis`）
  各自對應不同的 `DataSource` 呼叫與資料形狀，故進路徑；`chart=u|t`／
  `indicator=<spatialIndicator>` 是同一個 FDC／深度診斷頁面切換呈現角度，
  資料合約不變，故進 query。
  **此判準取代 `docs/ui/page-spec.md` §8 原本「可分享、需要 reload 後還原的
  狀態才進 URL」那條**——原判準只回答「進不進 URL」，無法進一步區分路徑段
  與 query 參數，而 locale／sectionId／toolId／caseId／檢視模式／chart／
  indicator 這四類全部「可分享、reload 後還原」，原判準對它們給出同一個
  答案，等於沒有判準。

## Consequences

- 機台子樹不再帶課別段，`resolveRole` 之類的權限判斷不能再從 URL 拿
  `sectionId`——必須由 `toolId` 反查所屬課別，這是 R1–R4 的核心改動。
- 課別顯示名稱的雙語切換與 UI 文案的 i18n（`messages/`）是兩套機制，實作與
  review 時要分開檢查，不能混為一談。
- Revisit when：若未來真的要支援多語系介面（不只是資料在地化），需要重新
  評估 `localePrefix: "never"` 是否仍然成立——屆時「只有一個語系有意義」
  的前提已經不存在。
