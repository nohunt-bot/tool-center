# Tool Center 元件庫規格

Status: draft (2026-07-25)

來源：`urd/tool-center-gui.html`（2453 行，行號皆指向此檔）、`src/domain/**`、
`src/lib/status.ts`、`src/lib/permission.ts`、`docs/permission-matrix.md`、
`docs/tasks/20260724-tool-center-gui.md`（下稱「task 檔」，內含 D1–D9 決策與 Stage A 計畫）。

本文件是**設計文件**，不含任何實作程式碼、不改動 `src/**`。目的是把 mockup 拆成一套可重用的
元件詞彙，讓後續「頁面 spec」與各 Stage 的實作者引用同一套名字與 props 形狀，不必每頁各刻一套。

範圍涵蓋 mockup 全部七個畫面：機台一覽、當機處理、病史分析、深度診斷、課別設定、
FDC 分析視窗（u/t chart）、iDo Copilot 側欄。

---

## 1. 設計原則

以下原則直接影響元件 **API 形狀**（props 型別、是否需要 capability、是否要求特定子元件），
不是泛泛的品質宣言。

1. **狀態色只有一個來源**：任何呈現 `ToolStatus` 的元件（`StatusDot`、`ToolBrick`…）一律吃
   `ToolStatus` 值並呼叫 `statusToken()`/`statusClass()`，不得自行寫死顏色字串或 hex。
   這已是 `src/lib/status.ts` 的既有紀律，本文件延續而非新創。
2. **Pattern 由 ML 判定，元件不得離線推斷**（D1 #1）。`PatternTag`、`SegmentCard`、
   `DualChuckVerdict`、`WaferMap` 的 props 一律接受 domain 已定義的 pattern enum
   （`TimePattern`/`DistPattern`/`SpatialPattern`/`ChuckVerdict`），不得接受自由字串或在元件內
   用字串比對／統計「猜」出 pattern。
3. **「不知道」是一等狀態，不是錯誤態**（D1 #5）。任何呈現 ML／KM 判讀結果的元件，
   在對應資料為 `null`（如 `StepAnalysis.kmHit`、`SpatialAnalysis.flywheel`）時，
   **必須**渲染 `UnknownNote`，不得省略、不得由呼叫端自行決定要不要顯示——這是型別上
   `null` 分支的強制輸出，不是可選的 UI 潤飾。
4. **事實與推論必須在視覺上分離**（D1 #4）。`TimelineEvent`／`nearbyEvents` 一類「時間並列」
   的資訊，其呈現元件（`SegmentCard`、`UChartTimeline`）必須把它放在與 verdict／narrative
   不同的視覺區塊，且固定帶出「時間並列不代表因果」字樣，不可與敘事文字混排成同一段落。
5. **每個數字必須可溯源**（D1 #8）。任何顯示 ML／統計／案例衍生數值的元件，
   若沒有同時收到一個來源字串（給 `SourceLine` 用），就不構成合法的呼叫——
   `Metric`、`NarrativeSummary` 等純數值/敘事元件本身不含來源欄位，
   父層元件必須另外傳一個 `SourceLine`，這是組裝規則不是文案規則。
6. **受控詞彙不可自由輸入**（D1 #3）。`FeedbackForm`／`AnnotationForm` 的「分類」欄位一律是
   `<select>` 綁定 taxonomy 常數（`TIME_PATTERNS`／`DIST_PATTERNS`／`SPATIAL_PATTERNS` 等），
   props 型別不暴露自由字串作為分類值；自由文字只能出現在明確標示「補充說明」的獨立欄位。
7. **關聯圖兩層不得合併渲染**（D1 #7）。`RelationGraph`、`CandidateRow`、`PendingEdgeRow`
   的 props 必須保留 `GraphLayer`／`scope`（`this_tool`/`tool_group`）欄位並在視覺上區分
   （實線 vs 虛線、顏色），不得把 physical/experience 折疊成單一「相關度」數字。
8. **權限是結構性 gating，不是文案提示**。任何會 mutate 資料的元件都必須帶一個
   `Capability`（引用 `lib/permission.ts` 的 `Capability` 字面量）或由 `CapabilityGate`
   包裹決定要 render／disable 哪個分支；不能只靠是否顯示某段說明文字來「提醒」使用者沒權限。

---

## 2. 元件分層清單

### 2.1 Primitives（無 domain 知識，純視覺）

| 元件 | 一句話用途 | 出現頁面 | mockup 行號 |
|---|---|---|---|
| `Zone` | 帶標題／hint 的卡片容器 | 全部七個畫面 | L59–62（`.zone`），全檔重複如 L572/639/711/1239 |
| `StatusDot` | 狀態色小圓/方塊 | 機台一覽、legend | L16–17、L499–504 |
| `Tag` | 可點擊的圓角小標籤（快速提問） | 當機處理／病史分析／深度診斷側欄／Copilot | L133–136、L658–663 |
| `Badge` | 不可互動的彩色標籤（狀態/分類/信心） | 幾乎所有畫面 | 見下方各實例 |
| `Button` | 各種按鈕變體 | 全部 | 見下方各實例 |
| `Callout` | 有色說明橫幅（info/warning/success） | 課別設定／深度診斷／關聯圖／FDC | L1297、L986、L1452、L1162 |
| `Metric` | 一行等寬字體的量測值列表 | 深度診斷（chuck map） | L751、L770、L816、L860 |
| `EmptyState` | 無資料時的統一訊息 | 機台一覽（已實作）等 | 無直接 mockup 對應，見 §4 說明 |
| `SourceCitation` | 「來源　XXX」單行文字 | Copilot 訊息、打包卡片 | L165–166、L2300 |
| `CopyButton` | 複製純文字，含已複製狀態 | Copilot 訊息 | L170–173、L2316–2333 |

### 2.2 Composites（組合 primitives，弱/無 domain 知識）

| 元件 | 一句話用途 | 出現頁面 | mockup 行號 |
|---|---|---|---|
| `ListRow` | 圖示/圓點 + 主文 + 副文 + 右側操作的水平列 | 當機處理／課別設定／深度診斷等 | L573、L583、L611、L1308、L1347、L1040、L1133、L1094 |
| `TwoColumnLayout` | 主欄＋側欄的兩欄版面 | 當機處理／病史分析／深度診斷 | L56–58（`.detail`）、L570、L708 |
| `TabBar` | 底線樣式分頁 | FDC（u/t）、深度診斷（關聯圖三分頁） | L1384–1386、L978–981 |
| `SegmentedControl` | 等寬區塊式切換列 | 深度診斷（指標切換） | L714–721 |
| `Drawer` | 可開關的側滑面板外框 | Copilot 側欄 | L149–160、L1713–1762 |
| `Modal` | 置中對話框外框 | FDC 視窗（既有 `ModalShell`）、CASE ID 彈窗 | L1371–1380、L1698–1709 |
| `CompareBox` | 兩欄「標籤/數值」對照小卡 | FDC t chart 逐段對照 | L1571–1576、L1603–1607 |
| `FormField` | 標籤 + 表單控制項 + hint 的一行 | 標註表單／受控回饋表單 | L1619–1639、L1965–2015 |
| `VoteButtons` | 👍/👎 或 ✓/✗ 成對回饋按鈕 | 關聯圖候選／待確認邊 | L1048–1050、L1137–1139 |
| `CapabilityGate` | 依角色決定 render/disable 子節點 | 全部有寫入操作的畫面 | 無直接行號，源自 `permission-matrix.md` |

### 2.3 Domain 元件（綁 Tool Center 概念）

| 元件 | 一句話用途 | 出現頁面 | mockup 行號 |
|---|---|---|---|
| `ToolBrick`（既有） | 一格＝一台機台，含 chamber chips | 機台一覽 | L508–563 |
| `ToolCommandRow` | 人下的「這台為什麼不動」註解 | 當機處理 | L574–575 |
| `ErrorCaseRow` | 最近 error case 一列，含開圖/打包動作 | 當機處理 | L583–603 |
| `ChronicBadge` | 慢性問題徽章（rule base） | 當機處理 | L581、L604 |
| `ToolFileRow` | 機台抓回的檔案一列 | 當機處理 | L611–634 |
| `AskChip` | 點一下即問 Copilot 的預設問句 | 當機處理／病史分析／深度診斷側欄／Copilot | L658–663、L692–699、L1285–1289、L1726–1751 |
| `PinnedCard` | 已打包到 case 的分析卡片 | 病史分析 | L675–684 |
| `PatternTag` | 時序／分布／空間 pattern 標籤 | FDC、深度診斷 | L1258–1269、L1459 起 |
| `SpatialIndicatorTabs` | 五個空間指標 + 關聯圖的切換列 | 深度診斷 | L714–721 |
| `DualChuckVerdict` | 一致/分歧判定 + 排查方向 fork | 深度診斷 | L725–732、L850–852 |
| `SuspectList` | 嫌疑零件/SOP 節點列表 | 深度診斷 | L780–785、L921–925 |
| `FlywheelNote` | 命中歷史標註的知識飛輪卡 | 深度診斷、FDC t chart | L786–789、L1586–1590 |
| `UnknownNote` | KM 無紀錄「我不猜」卡 | 深度診斷、FDC t chart | L836–838、L1611–1613 |
| `CrossDiagnosisPanel` | 交叉診斷結論（ML 後端產出） | 深度診斷 | L1240–1248 |
| `CandidateRow` | 關聯圖查詢候選零件 | 深度診斷（關聯圖查詢） | L1040–1077 |
| `PendingEdgeRow` | 待確認的低信心邊 | 深度診斷（建圖） | L1133–1156 |
| `BuildStepRow` | Agent 建圖進度步驟 | 深度診斷（建圖） | L1094–1127 |
| `NarrativeSummary` | LLM 敘事總結（只讀 ML 輸出） | FDC u/t chart | L1492–1499、L1658–1668 |
| `BaselineVerdictCard` | Baseline shift 判定卡 | FDC u chart | L1440–1447 |
| `SegmentCard` | u chart 分段 pattern 卡 | FDC u chart | L1457–1489 |
| `StepAnalysisCard` | t chart 逐段 recipe 對照卡 | FDC t chart | L1563–1656 |
| `ChainTrail` | step → 零件 → SOP 追根鏈路 | FDC t chart | L1577–1585 |
| `AnnotationForm` | 標註未知現象（受控） | FDC t chart | L1617–1649 |
| `FdcFeedbackPanel` | 判讀回饋（👍👎 → 受控修正表單 → 打包） | FDC 視窗 | L1675–2032 |
| `CaseIdModal` | 打包到 Case Center 的 CASE ID 彈窗 | 病史分析、FDC、Copilot | L1698–1709 |
| `CopilotRail` | iDo 側欄容器 | Copilot | L1713–1762 |
| `AskMenu` | 例句選單（分組、可收合） | Copilot | L1722–1754 |
| `MessageBubble` | 使用者/Copilot 訊息泡泡 | Copilot | L1755–1757、L2295–2313 |
| `SourceLine` | 帶來源類型圖示的溯源行 | Copilot、深度診斷 | L2182–2271（`ANS` 內每則「來源　…」） |
| `PinButton` | 打包到 case 的按鈕（含已打包態） | Copilot、FDC | L2306、L2337–2349 |
| `McpToolRow` | 課別 MCP 工具引用勾選列 | 課別設定 | L1308–1339 |
| `ExpertTagRow` | 專家標籤列 | 課別設定 | L1347–1350 |
| `KmSourceRow` | KM Domain 來源列 | 課別設定 | L1354–1355 |
| `DomainSourceAddForm` | 新增 KM space URL | 課別設定 | L1356–1359 |
| `SectionDosEditor` | 課別 DOs 編輯 | 課別設定 | L1298–1304 |

### 2.4 視覺化元件（圖表類，實作成本高）

| 元件 | 一句話用途 | 出現頁面 | mockup 行號 | 技術 |
|---|---|---|---|---|
| `UChartTimeline` | 90 天時序圖：spec 線、baseline、分段背景、轉折點、事件旗標 | FDC u chart | L1392–1437 | ECharts（D3 決策） |
| `TChartWaveform` | 單片毫秒級波形：實際 vs 參考、異常標記 | FDC t chart | L1532–1556 | ECharts |
| `RecipeStepBar` | recipe step 依時長比例著色的色帶 | FDC t chart | L1520–1530 | 自繪（flex 或 Canvas） |
| `WaferMap` | wafer 層級空間分布：向量場／連續熱圖／hot spot 三變體 | 深度診斷 | L738–769（向量場）、L808–828（熱圖）、L856–871（hot spot） | 自繪 Canvas（D3 決策） |
| `SlitProfile` | slit 內像差分布折線 + spec 線 | 深度診斷 | L936–951 | 自繪 SVG/Canvas |
| `FieldFocusMap` | field 內分布疊圖（scan 方向漸層） | 深度診斷 | L901–912 | 自繪 SVG/Canvas |
| `RelationGraph` | 兩層關聯圖（物理實線／經驗虛線） | 深度診斷（關聯圖） | L993–1036 | Cytoscape.js（D3 決策） |
| `WeightBar` | 候選零件的權重橫條 | 深度診斷（關聯圖查詢） | L1045、L1058、L1071 | 自繪（CSS width） |

---

## 3. 元件規格

每個元件依「用途／props／變體/狀態／互動／權限／a11y／紅線／重用注意」八項撰寫。
Props 一律引用 `src/domain/**`、`src/lib/status.ts`、`src/lib/permission.ts` 既有型別。

### 3.1 Primitives

#### Zone

- **用途**：帶標題列（標題 + 可選 hint + 可選右側 actions）的卡片容器，是全站最基本的分區單位。
- **mockup 出處**：L59–62（`.zone`/`.zone-hd`/`.hint`），全檔重複出現（L572、639、656、672、690、
  711、1239、1253、1272、1283、1298…）。
- **Props**：
  ```ts
  type ZoneProps = {
    title: React.ReactNode;
    hint?: string;
    actions?: React.ReactNode; // 如慢性徽章、tab 切換
    children: React.ReactNode;
  };
  ```
- **變體/狀態**：default／無 hint／無 actions。載入中與錯誤態不由 `Zone` 自己處理，
  由呼叫端在 `children` 放 `EmptyState` 或 skeleton（`Zone` 不內建 loading，避免每個用法都得傳
  `isLoading`）。
- **互動行為**：無自身互動；純容器。
- **權限**：不適用（容器本身無 capability，內容的權限由內容元件各自處理）。
- **a11y**：`title` 應對應到一個 heading 層級（`h2`/`h3`，依頁面巢狀深度決定，由呼叫端決定
  layer，`Zone` 不寫死 tag）；`hint` 用 `aria-describedby` 關聯到標題，不要只靠顏色變淡表達次要性。
- **紅線**：不適用。
- **重用注意**：不要把「兩欄式 detail 版面」塞進 `Zone` 裡面做——那是 `TwoColumnLayout` 的職責，
  `Zone` 只管單一分區的外框。

#### StatusDot

- **用途**：機台/chamber 狀態的色塊圖示，用於 legend、統計列、任何需要「純顏色標示狀態」而非
  完整徽章的地方。
- **mockup 出處**：L16–17（`.st-*`）、L499–504（legend `<i class="lg">`）。
- **Props**：
  ```ts
  type StatusDotProps = { status: ToolStatus; size?: "sm" | "md" };
  // ToolStatus 來自 @/lib/status
  ```
- **變體/狀態**：六種 `ToolStatus` 值各一色；無 loading/error（純顯示）。
- **互動行為**：無（純視覺，不可點擊——需要點擊行為的是 `ToolBrick` 或 legend 外層，不是這個圓點本身）。
- **權限**：不適用。
- **a11y**：色塊本身需有 `aria-hidden="true"`，狀態文字（如「UP」）必須以文字节点與其並列
  （既有 `overview-pane.tsx` 的 legend 已如此做），不可只靠顏色傳達狀態——色盲使用者需要文字。
- **紅線**：不適用（顏色來源紀律屬於設計原則#1，非 D1 八條之一）。
- **重用注意**：`overview-pane.tsx` 目前有一個檔案內區域函式 `StatusDot`（非 export），
  與本規格同名同形狀。**既有，建議調整**：抽成 `src/components/ui/status-dot.tsx` 匯出，
  讓 `ToolBrick`／未來的 chamber 圖例／深度診斷都能直接 import，不必各自重寫。

#### Tag

- **用途**：可點擊的圓角小標籤，用於「快速提問」一類的預設問句觸發點。
- **mockup 出處**：L133–136（`.chip` CSS）；用法見 L658–663、L692–699、L1285–1289。
- **Props**：
  ```ts
  type TagProps = {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  };
  ```
- **變體/狀態**：default／hover（CSS-only）／disabled。無 loading（點擊後的等待態由呼叫端
  ——如 `CopilotRail`——自行處理訊息串流狀態，不是 `Tag` 的責任）。
- **互動行為**：點擊觸發 `onClick`；鍵盤 Enter/Space 觸發（需 `role="button"` + `tabIndex=0`
  若底層不是原生 `<button>`）。
- **權限**：不適用（`Tag` 本身不知道 capability；`AskChip` domain 元件負責把
  `copilot.ask` 的 gating 做在外層，`Tag` 只是視覺殼）。
- **a11y**：底層建議直接用 `<button>` 而非 `<span onClick>`，避免額外補 role/tabIndex。
- **紅線**：不適用。
- **重用注意**：不要跟 `Badge` 混用——`Tag` 一定可點擊，`Badge` 一定不可點擊。
  mockup 裡兩者 CSS 幾乎撞名（`.chip` vs 一堆 `.xxx-tag`），實作時故意分成兩個元件避免這個混淆延續下去。

#### Badge

- **用途**：不可互動的彩色標籤，表達狀態/分類/信心等離散值。
- **mockup 出處**：`.tcmd-tag`（L574）、`.tseg-tag`（L775/876/916/955/1596）、`.pat`（L1459 起）、
  `.sp-tag`（L737/756/807…）、`.conf-hi`/`.conf-lo`（L1098–1099）、`.skill-lv`（L676/681）、
  `.mcp-lock`/`.mcp-off-tag`（L1332/1338）、`.exp-tag`（L1347–1349）、`.cand-src`（L1043/1056/1069）、
  `.ml-badge`（L996/1395/1515）。
- **Props**：
  ```ts
  type BadgeProps = {
    children: React.ReactNode;
    tone: "neutral" | "teal" | "red" | "gold" | "blue" | "purple" | "pink" | "green";
  };
  ```
- **變體/狀態**：八種色調；無其他狀態（不可點擊就沒有 hover/disabled 的意義）。
- **互動行為**：無。若某個徽章看起來「可點」（如 `.sus-node.sop`、`.chain-node.sop`），
  那是 domain 元件（`SuspectList`/`ChainTrail`）在 `Badge` 外面自己包一層可點擊容器，
  不是 `Badge` 本身變得可點擊——保持「Badge 恆不可互動」這條界線很重要，見重用注意。
- **權限**：不適用。
- **a11y**：色調不得是唯一辨識依據，`children` 一律是文字（不可只放色塊）。
- **紅線**：不適用（個別 domain 用法如 `PatternTag` 會承載紅線，`Badge` 本身是中性殼）。
- **重用注意**：色調到底對應哪個語意（如 `red` 是「異常」還是「critical severity」還是
  「不可移除」）由呼叫端決定，`Badge` 不內建語意映射表——避免未來新增一種「紅色但意思不同」的用法時
  被迫改這個共用元件。

#### Button

- **用途**：全站按鈕的單一元件，用變體表達視覺差異，而非各自命名元件。
- **mockup 出處**：`.btn-sm`（L588）、`.btn-ai`（L588、602）、`.btn-off`（L1347–1349）、
  `.annot-ok`/`.annot-no`（L1646–1647）、`.fx-submit`/`.fx-cancel`（L2029–2031）、
  case-box `.ok`/`.cancel`（L1705–1707）、`.fb-btn`（L1677–1679）、`.pe-yes`/`.pe-no`
  （L1137–1139，但這兩個實際由 `VoteButtons` 消費，見該節）、`.fab`（L1711）。
- **Props**：
  ```ts
  type ButtonProps = {
    variant?: "default" | "primary" | "ai" | "destructive" | "ghost" | "fab";
    size?: "sm" | "md";
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
  };
  ```
- **變體/狀態**：六種 variant × disabled × loading。`loading` 是本規格新增（mockup 沒有，
  因為 mockup 全同步；Stage A/B 走真實 Server Action 需要這個狀態，見 task A1.5）。
- **互動行為**：點擊觸發 `onClick`；`loading=true` 時應阻擋重複點擊（idempotency，
  對應 task B3.3 的回饋 idempotency 要求）。
- **權限**：不適用（`Button` 本身不知道 capability；由 domain 元件決定要不要渲染/disable）。
- **a11y**：`loading` 狀態需 `aria-busy="true"`；`disabled` 需真的加 `disabled` 屬性，
  不能只是視覺變灰但仍可點擊。
- **紅線**：不適用。
- **重用注意**：不要為 `pe-yes`/`pe-no`、`fb-y`/`fb-n` 這類「成對顏色相反的小按鈕」
  另開元件——那是 `VoteButtons` 的職責，`Button` 只提供單一按鈕的視覺變體。

#### Callout

- **用途**：有色說明橫幅，統一 mockup 裡一堆功能相同但 class 名不同的「提示框」。
- **mockup 出處**：`.set-note`（L1297）、`.drill`（L986、1506）、`.tax-note`（L1452、1983）、
  `.grow`（L1162、1225）、`.src-hint`（L1340、1360）、`.note-banner`（L565、604）、
  `.fx-hint`（多處）。**本規格是新增的抽象**（mockup 沒有這個字面 class 名，是從八種視覺相近的
  說明框歸納出來的）。
- **Props**：
  ```ts
  type CalloutProps = {
    tone: "info" | "warning" | "success" | "neutral";
    children: React.ReactNode;
  };
  ```
- **變體/狀態**：四種 tone；無 loading/error（純靜態說明）。
- **互動行為**：無。
- **權限**：不適用。
- **a11y**：若用於警告性內容，容器可加 `role="note"`；不需要 `role="alert"`
  （這些都是穩定顯示的說明文字，不是即時通知）。
- **紅線**：`Callout(tone="warning")` 常被 `UnknownNote`／FSE 升級提示（L965–970）借用來承載
  D1 #5／#6，但 `Callout` 本身是中性容器，紅線的結構保證在 `UnknownNote` 那一層，不在這裡。
- **重用注意**：這是本文件唯一「先歸納後定義」的 primitive，跟其餘照抄 mockup class 的元件不同——
  若之後發現某個說明框其實需要獨立行為（例如可關閉），不要硬塞回 `Callout`，另開元件。

#### Metric

- **用途**：一行等寬字體的量測值列表（如 `|M| 1.8nm` `3σ 2.4nm` `殘差隨機`）。
- **mockup 出處**：`.metric`（L394–395），用法見 L751、770、816、826、860、871、912、951。
- **Props**：
  ```ts
  type MetricProps = {
    items: ReadonlyArray<{ label: string; value: string }>;
    tone?: "default" | "alert";
  };
  // 形狀對齊 ChuckMap.metrics（@/domain/spatial）
  ```
- **變體/狀態**：default／alert（紅字，對應異常 chuck）。
- **互動行為**：無。
- **權限**：不適用。
- **a11y**：純文字列表，用 `<dl>` 或以 `aria-label` 標明這是量測值而非一般段落。
- **紅線**：**不獨立承載 D1 #8**——`Metric` 沒有來源欄位，數字能不能溯源由父層是否
  同時渲染 `SourceLine` 決定（見設計原則 #5）。
- **重用注意**：不要把「來源」塞進 `Metric` 的 `items` 里蒙混過關（如塞一個
  `{label:"來源", value:"ML kernel"}`）——來源必須走 `SourceLine`，`Metric` 只管量測值,
  混在一起會讓「這個元件有沒有來源」的稽核失去意義。

#### EmptyState

- **用途**：清單/區塊無資料時的統一訊息呈現。
- **mockup 出處**：mockup 本身沒有空狀態畫面（demo 資料恆存在），但既有
  `src/components/overview/overview-pane.tsx` L21–29 已經手刻了一個空狀態分支
  （「{sectionName}（{sectionId}）目前無機台資料。」）。
- **Props**：
  ```ts
  type EmptyStateProps = { message: string; icon?: React.ReactNode };
  ```
- **變體/狀態**：default；不含 error（`EmptyState` ≠ `ErrorState`，兩者語意不同——
  空資料是正常狀態，錯誤是異常狀態，task C2.1「錯誤／空／載入／無權限態系統化」明確把它們列為分開的狀態）。
- **互動行為**：無（若需要「新增第一筆」CTA，由呼叫端在 `children`/額外 slot 加，
  本規格先不預設，避免每個空狀態都被迫塞一個不一定需要的按鈕）。
- **權限**：不適用。
- **a11y**：容器加 `role="status"`，讓 `aria-live` 使用者知道清單已載入完成但是空的
  （與「還在載入中」要能區分）。
- **紅線**：不適用。
- **重用注意**：**既有，建議調整**——`overview-pane.tsx` 目前是內聯 JSX 而非獨立元件，
  等 `EmptyState` 落地後應回頭替換，讓病史分析（無打包卡片）、當機處理（無 error case）等
  畫面共用同一個空狀態外觀，而不是各自寫一段 `<div>`。

#### SourceCitation

- **用途**：「來源　XXX」單行文字，是 `SourceLine`（domain 層）的視覺基礎。
- **mockup 出處**：`.cite`（L165–166），用法見 L2300、L678、L683 等 `pinned-meta` 內的「來源」文字。
- **Props**：
  ```ts
  type SourceCitationProps = { label: string };
  ```
- **變體/狀態**：僅 default（純文字，無 loading/error）。
- **互動行為**：無。
- **權限**：不適用。
- **a11y**：純文字，確保與上方內容有足夠的行高與對比度區隔（mockup 用較淡的 `--ink3`，
  需檢查是否達 WCAG AA——見重用注意）。
- **紅線**：是 D1 #8 的最小顯示單位，但本身不強制「一定有值」——強制性由呼叫端保證
  （domain 元件的 props 型別要求 `source: string` 為必填而非 optional）。
- **重用注意**：mockup 的 `--ink3`（`#9ca3af`）用在小字上，對比度接近 WCAG AA 邊界，
  正式實作時需量測；不要因為「這只是次要文字」就放寬對比度要求——來源溯源是產品紅線，
  文字要看得清楚才有意義。

#### CopyButton

- **用途**：把一段回覆的純文字（去 HTML）複製到剪貼簿，含已複製視覺回饋。
- **mockup 出處**：`.copy-btn`（L170–173），行為見 `copyReply()`（L2316–2333）。
- **Props**：
  ```ts
  type CopyButtonProps = { getText: () => string };
  ```
- **變體/狀態**：idle／copied（1.5 秒後自動回 idle，比照 mockup `setTimeout(...,1500)`）。
- **互動行為**：點擊複製並切換到 `copied` 視覺（文字變「✓ 已複製」），1.5 秒後還原。
- **權限**：不適用（複製本地文字不是寫入操作，任何角色皆可）。
- **a11y**：狀態切換需 `aria-live="polite"` 宣告「已複製」，純顏色/文字變化對螢幕閱讀器不可見。
- **紅線**：不適用。
- **重用注意**：`getText` 用 callback 而非直接傳字串，是因為訊息內容可能含結構化 blocks
  （task D4：禁用 `dangerouslySetInnerHTML`），複製時需要把 blocks 轉成純文字的邏輯應該在
  `MessageBubble` 決定「怎麼轉」，`CopyButton` 只負責「什麼時候觸發、觸發後長什麼樣」。

### 3.2 Composites

#### ListRow

- **用途**：「圖示/圓點 + 主要內容 + 次要內容 + 右側操作」的水平列版面，是全站出現頻率最高的 layout pattern。
- **mockup 出處**：`.tcmd`（L573）、`.evt`（L583）、`.file`（L611）、`.mcp-row`（L1308）、
  `.exp-row`（L1347）、`.cand`（L1040）、`.pending-edge`（L1133）、`.build-step`（L1094）。
- **Props**：
  ```ts
  type ListRowProps = {
    leading?: React.ReactNode; // 圖示、StatusDot、編號圓圈…
    primary: React.ReactNode;
    secondary?: React.ReactNode;
    trailing?: React.ReactNode; // 按鈕、Badge、checkbox…
    tone?: "default" | "muted" | "dashed"; // dashed 對應 pending-edge 的虛線待確認樣式
  };
  ```
- **變體/狀態**：三種 tone；`muted`（如已結案的 error case，mockup L598 `opacity:.65`）。
- **互動行為**：`ListRow` 本身不綁點擊——整列是否可點擊由呼叫端決定（多數情況只有
  `trailing` 裡的按鈕可點，避免誤觸）。
- **權限**：不適用（由使用它的 domain 元件決定 `trailing` 要不要塞會寫入的按鈕）。
- **a11y**：若 `trailing` 含多個按鈕，需注意 tab 順序與可辨識的 `aria-label`（許多 mockup 按鈕
  只有 emoji，如「🔒 打包案例」，正式版需要文字/aria-label 而不能只靠 emoji）。
- **紅線**：不適用。
- **重用注意**：這是「反覆出現但不該過度統一」的邊界案例——`.cand` 與 `.pending-edge`
  雖然視覺像 `ListRow`，但各自有明顯不同的 `trailing`（權重條+👍👎 vs ✓/✗），
  **不要**為了共用而把 `WeightBar`／`VoteButtons` 塞進 `ListRow` 的固定 slot，
  維持 `trailing` 是自由 `ReactNode` 就好，讓 domain 元件自己組裝。

#### TwoColumnLayout

- **用途**：主欄（滾動內容）＋固定寬度側欄的兩欄版面，`< 1000px` 時側欄隱藏。
- **mockup 出處**：`.detail`（L56–58），用於當機處理（L570）、病史分析（L708 附近的
  `pane-hist` `.detail`）、深度診斷（L708）。
- **Props**：
  ```ts
  type TwoColumnLayoutProps = { main: React.ReactNode; side: React.ReactNode };
  ```
- **變體/狀態**：桌面（雙欄）／窄螢幕（單欄，側欄隱藏，對應 mockup L208 的 media query）。
  無 loading/error（版面元件不管內容狀態）。
- **互動行為**：無。
- **權限**：不適用。
- **a11y**：窄螢幕隱藏側欄時，其內容（機台屬性、問 Copilot chips）必須仍可經由其他途徑
  （如 Copilot FAB）到達，不能變成「只有寬螢幕才看得到的功能」。
- **紅線**：不適用。
- **重用注意**：三個畫面共用同一個 layout，但 `side` 內容完全不同——不要因為
  「反正都是側欄」就抽出一個「預設側欄內容」，`side` 保持空白 slot。

#### TabBar

- **用途**：底線樣式的分頁切換（少量分頁，2–3 個）。
- **mockup 出處**：`.tc-tabs`（L1384–1386，u/t chart 兩分頁）、`.gr-tabs`
  （L978–981，查詢/建圖/養肥三分頁）。
- **Props**：
  ```ts
  type TabBarProps<T extends string> = {
    tabs: ReadonlyArray<{ key: T; label: string }>;
    active: T;
    onChange: (key: T) => void;
  };
  ```
- **變體/狀態**：active／inactive；無 disabled（mockup 沒有分頁被鎖的情境）。
- **互動行為**：點擊切換；鍵盤左右鍵在分頁間移動（標準 tab pattern）。
- **權限**：不適用（分頁切換是讀取操作）。
- **a11y**：需 `role="tablist"` + 各分頁 `role="tab"` + 對應內容 `role="tabpanel"`，
  並用 `aria-selected` 標示目前分頁——mockup 原版只用 CSS class 切換，正式實作要補這層語意。
- **紅線**：不適用。
- **重用注意**：與 `SegmentedControl` 的差異是視覺（底線 vs 實心區塊）與資料量
  （2–3 個純文字分頁 vs 6 個含副標題的區塊）——不要合併成一個元件硬用 variant 區分,
  兩者的互動語意（tab vs segmented choice）在設計系統慣例上本來就分開。

#### SegmentedControl

- **用途**：等寬區塊式切換列，每個選項可帶一行小號副標題。
- **mockup 出處**：`.dd-seg`（L714–721，深度診斷的六個指標切換：Overlay FP / Focus FP /
  Leveling / Field Focus / Slit Aberration / 關聯圖）。
- **Props**：
  ```ts
  type SegmentedControlProps<T extends string> = {
    segments: ReadonlyArray<{ key: T; label: string; caption?: string }>;
    active: T;
    onChange: (key: T) => void;
  };
  ```
- **變體/狀態**：active（深色實心）／inactive。
- **互動行為**：點擊切換；建議支援方向鍵在區塊間移動。
- **權限**：不適用。
- **a11y**：`role="tablist"` 亦適用（語意上與 `TabBar` 相同，只是視覺不同），
  `caption` 需與 `label` 一起被螢幕閱讀器讀出（不能只讀主標籤漏掉副標題所帶的關鍵資訊，
  如「wafer level」/「hot spot」這類決定內容型態的字）。
- **紅線**：不適用。
- **重用注意**：`SpatialIndicatorTabs`（domain）是這個 composite 的具體用法，
  見該節關於「關聯圖」這個選項並非 `SpatialIndicator` enum 成員的處理方式。

#### Drawer

- **用途**：從畫面邊緣滑入的面板外框（開/關、標頭、內容區）。
- **mockup 出處**：`.rail`（L149–160 CSS，L1713–1762 用法：iDo Copilot 側欄）。
- **Props**：
  ```ts
  type DrawerProps = {
    open: boolean;
    onClose: () => void;
    header: React.ReactNode;
    children: React.ReactNode;
  };
  ```
- **變體/狀態**：open／closed（CSS transform 過渡，非 unmount，保留輸入狀態）。
- **互動行為**：ESC 關閉；點擊背景不關閉（mockup 的 rail 不是 overlay dialog，
  背景仍可互動——這與 `Modal` 的行為刻意不同，見 `Modal` 重用注意）。
- **權限**：不適用。
- **a11y**：開啟時應把焦點移入 `header` 的關閉按鈕（比照既有 `ModalShell` 的 `closeRef` 做法），
  但**不要**做完整 focus trap（task A10.1 已明訂：Stage A 先做開關+ESC，完整 focus trap
  留給之後統一導入 Radix/shadcn Dialog 原語處理，避免現在自刻的 trap 之後要拆掉）。
- **紅線**：不適用。
- **重用注意**：目前只有 Copilot 一個用法，是「暫不過度抽象」的邊界案例——如果之後只有這一個
  使用場景，維持專用的 `CopilotRail` 直接引用 `Drawer` 即可，不需要為了「畫面上還有其他側滑面板」
  預先設計不存在的彈性 props。

#### Modal

- **用途**：置中對話框外框，含背景遮罩、點背景關閉、ESC 關閉。
- **mockup 出處**：`.fdc-overlay`/`.fdc-card`（L1371–1380，FDC 分析視窗）、
  `.case-modal`/`.case-box`（L1698–1709，CASE ID 打包彈窗）。
- **既有實作**：`src/components/fdc/modal-shell.tsx`（`ModalShell`）已經是這個 composite
  在 FDC 場景下的具體實作——固定 900px 寬、深色標頭（`#0f1f3d`）、`router.back()` 關閉
  （intercepting route 模式）。
- **Props**（既有簽名）：
  ```ts
  function ModalShell({ children }: { children: React.ReactNode }): JSX.Element;
  ```
- **變體/狀態**：目前只有一種尺寸/樣式（FDC 用）。**既有，建議調整**：`case-modal`
  （L1698–1709）是明顯更小（320px）、淺色標頭的對話框，視覺與 `ModalShell` 不同，
  但語意上都是「Modal」——建議把 `ModalShell` 擴充一個 `size?: "lg" | "sm"` 與
  `tone?: "dark" | "light"` prop，讓 `CaseIdModal` 直接複用同一個外框元件與同一套
  ESC/背景關閉/focus 邏輯，而不是另外刻一個 modal shell（那樣會有兩份需要維護的
  ESC-關閉/焦點管理程式碼）。
- **互動行為**：ESC 關閉、點擊背景關閉（`event.target === event.currentTarget` 判斷，
  既有實作已這樣做）。
- **權限**：不適用（是否能開啟這個 modal 由觸發它的按鈕的 capability 決定，
  modal 本身不重複判斷——但 `CaseIdModal` 的內容送出動作需要再檢查一次 `pin.create`，
  防止「按鈕被隱藏了但 modal 還是能被直接觸發」的邊界情況）。
- **a11y**：既有實作已有 `role="dialog"` `aria-modal="true"` 與開啟時 focus 到關閉鈕，符合基本要求。
- **紅線**：不適用。
- **重用注意**：`CaseIdModal`（domain）目前 mockup 是獨立實作（`case-modal`），
  **不要**讓它繞過 `ModalShell` 另刻一套關閉邏輯——否則未來兩處的 ESC/焦點行為會逐漸長歪。

#### CompareBox

- **用途**：「標籤 + 等寬字體數值」的小卡，常見成對比較（RECIPE 目標 vs 實際）。
- **mockup 出處**：`.cmp-box`（L1571–1576「RECIPE 目標」vs L1573–1575「實際」；
  L1603–1607「RECIPE 此段動作」vs「異常型態」）。
- **Props**：
  ```ts
  type CompareBoxProps = { label: string; value: string; tone?: "default" | "alert" | "warn" };
  ```
- **變體/狀態**：三種 tone（default 灰框／alert 紅框給偏移的實際值／warn 橙框給異常型態）。
- **互動行為**：無。
- **權限**：不適用。
- **a11y**：兩個 `CompareBox` 並排時，建議用 `<dl>` 或明確的「A vs B」語意包裹，
  讓螢幕閱讀器能理解這是一組對照而非兩個無關的卡片。
- **紅線**：**間接承載 D1 #8**——`StepAnalysisCard` 使用一對 `CompareBox` 時，
  两个 value 都必须是 `StepAnalysis.recipeTarget`/`actual` 的直接呈现，不得由 LLM 重新生成数字。
- **重用注意**：只有兩個使用場景（都在 `StepAnalysisCard` 內），暫不需要支援 3 欄以上——
  真的出現三方比較時再擴充，不要現在預留 `boxes: {label,value}[]` 這種通用陣列 API。

#### FormField

- **用途**：「標籤 + 表單控制項 + 可選 hint」的一行，統一標註表單/受控回饋表單的欄位外觀。
- **mockup 出處**：`.annot-row`/`.annot-lbl`（L1619–1639）、`.fx-row`/`.fx-lbl`/`.fx-hint`
  （L1965–2015）。
- **Props**：
  ```ts
  type FormFieldProps = { label: string; hint?: string; children: React.ReactNode };
  ```
- **變體/狀態**：僅 default；required 由 `children`（`<select>`/`<textarea>`）自己標示，
  `FormField` 不重複驗證邏輯。
- **互動行為**：無（純版面，children 才有互動）。
- **權限**：不適用。
- **a11y**：`label` 必須用 `<label htmlFor>` 正確關聯到 `children` 裡的表單控制項
  （mockup 原版 `.annot-lbl`/`.fx-lbl` 是 `<span>`，正式實作要修正為語意化 label）。
- **紅線**：**承載 D1 #3 的結構前提**——`FormField` 本身不限制 `children`，
  但 `AnnotationForm`/`FeedbackForm` 使用它時，分類欄位一律傳入受控 `<select>`，
  不會有 `FormField` 包 `<input type=text>` 出現在「分類」語意的欄位上。
- **重用注意**：不要把「受控詞彙下拉」的邏輯做進 `FormField` 裡——那是
  `AnnotationForm`/`FeedbackForm` 的責任，`FormField` 只管排版。

#### VoteButtons

- **用途**：成對的 👍/👎 或 ✓/✗ 回饋按鈕，含送出後的視覺結果。
- **mockup 出處**：`.pe-yes`/`.pe-no`（L1137–1139，`peFix()` L1834–1847）、
  `.fb-y`/`.fb-n`（L1048–1050，`grFb()` L1782–1817）。
- **Props**：
  ```ts
  type VoteButtonsProps = {
    onUp: () => void;
    onDown: () => void;
    disabled?: boolean;
    state?: "idle" | "up" | "down"; // 送出後鎖定顯示結果，對應 mockup 送出後按鈕消失換成文字
  };
  ```
- **變體/狀態**：`idle`／`up`（綠字「✓ 權重 +1」或「✓ 已確認」）／`down`（觸發修正流程或
  紅字「✗ 已刪除」）；`disabled` 給無權限角色。
- **互動行為**：點擊其一後鎖定為該狀態，不可反悔改點另一個（比照 mockup：按鈕被替換成純文字，
  不是維持可切換的 toggle）。
- **權限**：`graph.vote`（候選零件 👍👎）／`graph.confirmPendingEdge`（待確認邊 ✓/✗）——
  皆為 `WRITE`（admin/editor），viewer 應整組 `disabled`。
- **a11y**：送出後的文字結果需 `aria-live="polite"`，因為按鈕會被替換掉，螢幕閱讀器需要被
  告知發生了什麼（而不是按鈕突然消失）。
- **紅線**：不適用（回饋本身支撐飛輪，但 `VoteButtons` 只是輸入機制，不做判斷）。
- **重用注意**：`down` 分支在 `CandidateRow` 語境下還會展開一個受控下拉修正表單
  （mockup `grFb` 的 else 分支），這個「展開表單」的行為屬於 `CandidateRow`，
  不要塞進 `VoteButtons` 本身——`VoteButtons` 只負責兩個按鈕與最終鎖定狀態，
  展開什麼內容是呼叫端透過 `onDown` 回呼自行決定。

#### CapabilityGate

- **用途**：依角色/能力決定要 render、disable 還是隱藏子節點，把權限判斷收斂到單一進入點，
  避免每個 domain 元件各自 `if (role === 'admin')`。
- **mockup 出處**：無直接對應（mockup 是靜態原型，沒有角色切換）；源自
  `docs/permission-matrix.md` 與 `src/lib/permission.ts` 的 `can()`。
- **Props**：
  ```ts
  import type { Capability } from "@/lib/permission";
  import type { Role } from "@/domain/user";

  type CapabilityGateProps = {
    capability: Capability;
    role: Role;
    fallback?: "hide" | "disable" | React.ReactNode;
    children: React.ReactNode;
  };
  ```
- **變體/狀態**：allowed（正常渲染 `children`）／`fallback="hide"`（不渲染任何東西）／
  `fallback="disable"`（渲染 `children` 但需要 `children` 本身支援 disabled 視覺——
  這要求呼叫端小心選用，見重用注意）／`fallback=<ReactNode>`（渲染替代內容，
  如「唯讀」文字）。
- **互動行為**：無（純條件渲染）。
- **權限**：這個元件本身**就是**權限機制，呼叫 `can(role, capability)`（`@/lib/permission`）。
- **a11y**：`fallback="disable"` 時，若子節點是互動元件，必須真的傳遞 `disabled` 下去
  （見重用注意的限制），不能只是視覺灰階但仍可操作。
- **紅線**：**是設計原則 #8 的具體實作**——任何寫入型 domain 元件的 spec 中「權限」欄位
  寫的 capability，最終都應該透過這個元件或直接呼叫 `can()` 來 gate，不是自己重新發明判斷式。
- **重用注意**：`fallback="disable"` **只在 `children` 是單一已知支援 `disabled` prop 的元素時能用**
  （如 `<Button disabled>`）；如果 `children` 是複合結構（如整個 `AnnotationForm`），
  用 `"disable"` 會需要把 disabled 一路穿透下去，容易漏——這種情況建議用
  `fallback="hide"` 或明確的替代內容，而不是硬用 `"disable"`。

### 3.3 Domain 元件

#### ToolBrick（既有）

- **用途**：機台一覽的一格，含 chamber chips 與 7 日統計。
- **mockup 出處**：L508–563。
- **既有實作**：`src/components/overview/brick.tsx`（`Brick`），已完整實作且有測試覆蓋
  （task A2.1）。
- **Props**（R5/R6 之後的簽名——**本規格這一波已修改**，見下方重用注意）：
  ```ts
  function Brick({ tool }: { tool: ToolSummary }): JSX.Element;
  ```
- **變體/狀態**：六種 `ToolStatus` 底色 × 有/無 `mtbiHours` × 有/無 `note`
  （`statLine()` 已處理三種文案分支，見既有程式碼註解）。
- **互動行為**：點擊或鍵盤 Enter/Space 導到 `/tool/{tool.id}`（R5：機台子樹不帶
  課別段，不再是 `/section/{sectionId}/tool/{tool.id}/live`；課別代碼在
  `tool/[tid]/layout.tsx` 由 `getToolSection(tid)` 反查，`Brick` 導覽時
  不需要也不再傳遞 `sectionId`）。
- **權限**：`view.panes`（ALL）——進入一覽頁本身不需額外 capability。
- **a11y**：既有實作已有 `role="button"` `tabIndex=0` 與 Enter/Space handler。
- **紅線**：不適用（純導覽，無寫入、無 pattern 判定）。
- **重用注意**：本規格上一輪寫的「不修改這個元件的 props/行為」已經**不是事實**——
  R5/R6（`docs/decisions/0002-route-and-locale.md`，機台子樹路徑重構）把
  `sectionId` prop 整個移除、導覽目標從 `/section/{sectionId}/tool/{tool.id}/live`
  改成 `/tool/{tool.id}`，這裡同步更新成目前的實際簽名與行為，不再假裝沒改過。
  命名仍延續前一版的結論：頁面 spec 統一稱它為 `Brick`（既有名），本文件表格用
  `ToolBrick` 只是為了在「Domain 元件」分類裡保持一致的命名風格，實際 import
  仍是 `Brick`，不要另外發明 `ToolBrick` 這個新名字造成兩套稱呼並存的混淆。

#### ToolCommandRow

- **用途**：顯示一則「人下的、這台為什麼不動」的註解。
- **mockup 出處**：L574–575。
- **Props**：
  ```ts
  type ToolCommandRowProps = { command: ToolCommand };
  // ToolCommand 來自 @/domain/case
  ```
- **變體/狀態**：依 `tag`（`WAIT`/`HOLD`/`PM`/`TEST`）四種 `Badge` 色；`etaHours` 為
  `null` 時不顯示「預計 Nhr」（對應 mockup 第二則 tcmd 沒有 ETA，見 L575）。
- **互動行為**：純顯示；新增一則走旁邊的 `AddButton`（`Button variant="ghost"` +
  一個尚待 A3.1 設計的表單，不在本規格內展開，因為那是表單 flow 而非這一列本身）。
- **權限**：讀取 `view.panes`（ALL）；新增操作為 `toolCommand.write`——
  **注意這是 `ALL` 角色皆可**（permission-matrix C3「部分放行」，viewer 也能下 Tool Command）,
  所以 `ToolCommandRow` 旁的新增按鈕**不需要** `CapabilityGate` 隱藏,
  是少數「顯示但仍全角色可寫」的例外，容易被誤加多餘的權限檢查。
- **a11y**：`tag` 的顏色差異需搭配文字（Badge 已保證）；`author`/`at` 需與正文有可辨識的視覺層次。
- **紅線**：不適用。
- **重用注意**：不要把「新增 Tool Command」的表單邏輯塞進 `ToolCommandRow`——
  這個元件只顯示既有一則，新增是另一個之後才設計的表單元件。

#### ErrorCaseRow

- **用途**：顯示一則最近 error case，含嚴重度色點、標題、狀態、開圖/打包操作。
- **mockup 出處**：L583–603。
- **Props**：
  ```ts
  type ErrorCaseRowProps = {
    errorCase: ErrorCase; // @/domain/case
    onOpenChart?: (chart: "u" | "t") => void;
    onAsk?: (question: string) => void;
    onPackage?: () => void; // 驗屍打包
  };
  ```
- **變體/狀態**：依 `severity`（`critical`/`warning`/`closed`）決定 dot 顏色與是否降低透明度
  （mockup L598 已結案的案例 `opacity:.65`）；`caseNumber`/`assignee`/`rootCause` 皆可為
  `null`——結案前 `rootCause` 必為 `null`，顯示為「處理中（{assignee}）」；結案後顯示
  「根因：{rootCause}」。
- **互動行為**：`📊 u chart`/`📉 t chart` 觸發 `onOpenChart`；「手動判讀」觸發 `onAsk`
  （帶固定問句，如 mockup L596 的「log 珍寶分析」）；「🔒 打包案例」觸發 `onPackage`。
- **權限**：開圖按鈕算 `view.panes`（ALL，只是導覽）；「🔒 打包案例」需要 `case.pack`
  （WRITE，viewer 應 disable 或隱藏該按鈕）。
- **a11y**：`evt-dot` 需 `aria-hidden`，嚴重度文字（如「處理中」）本身要能被讀出。
- **紅線**：不適用（本身不判斷，只是呈現既有 `ErrorCase` 資料 + 觸發動作）。
- **重用注意**：`onAsk` 帶的固定問句字串目前是 mockup 寫死的中文（如「log 珍寶分析」）——
  Stage A1.7 要求全站無硬寫字串跑 i18n，這些「一鍵問句」的字串需要進訊息檔，
  `ErrorCaseRow` 的 props 不應該自己塞死中文，應該由呼叫端傳入已經過 i18n 的 `label`
  （見 `AskChip` 的 `label`/`question` 分離設計）。

#### ChronicBadge

- **用途**：慢性問題徽章，點擊觸發「慢性問題偵測」提問。
- **mockup 出處**：`.chip-chronic`（L581），rule base 定義見 L604 與
  `CHRONIC_DEFINITION`（`@/domain/taxonomy`）。
- **Props**：
  ```ts
  type ChronicBadgeProps = { flags: readonly ChronicFlag[]; onAsk: () => void };
  // ChronicFlag 來自 @/domain/case
  ```
- **變體/狀態**：`flags` 為空陣列時不渲染（父層負責條件渲染，`ChronicBadge` 不處理「沒有慢性問題」
  的空狀態文案——那不是徽章的語意，是「沒有徽章」）；`status="chronic"` vs `"watching"`
  可能需要不同顏色深淺（`chronic` 更醒目），但 mockup 只展示了 `chronic` 一種視覺,
  `watching` 的視覺留待實作時定案（不在本規格臆測顏色值）。
- **互動行為**：點擊觸發 `onAsk`（固定問「慢性問題偵測」）。
- **權限**：`copilot.ask`（ALL）。
- **a11y**：需 `aria-label` 說明「N 個慢性問題，點擊詢問 Copilot」，emoji ⚠ 需
  `aria-hidden`。
- **紅線**：**承載 D1 #2**（rule base 能做的不用 AI）——`flags` 的計數/狀態必須直接來自
  `DataSource.listChronicFlags()`（rule base 判定結果），`ChronicBadge` 的 props **不接受**
  一個由 LLM 生成的字串來描述慢性狀態，只接受結構化的 `ChronicFlag[]`，
  這樣「慢性判定是否經過 LLM」在型別層面就無法造假。
- **重用注意**：點擊後開啟的是 Copilot 對話，不是直接展開內嵌說明——不要為了「省一次點擊」
  把慢性問題的詳細敘述直接塞進徽章的 tooltip，那樣會繞過 Copilot 的來源標註機制。

#### ToolFileRow

- **用途**：顯示一份機台抓回的檔案，含下載與「iDo 參考」勾選。
- **mockup 出處**：L611–634。
- **Props**：
  ```ts
  type ToolFileRowProps = {
    file: ToolFile; // @/domain/case
    onToggleReference: (checked: boolean) => void;
    onDownload: () => void;
  };
  ```
- **變體/狀態**：`referencedByCopilot` true/false（勾選態，決定文字是否變 teal 加粗，
  對應 mockup `.file-ref.on`）。
- **互動行為**：checkbox 切換觸發 `onToggleReference`；下載連結觸發 `onDownload`。
- **權限**：`file.download`（ALL）；`file.toggleCopilotRef`（WRITE，viewer 應該把 checkbox
  設為 `disabled` 但仍顯示目前勾選狀態——viewer 需要看到「這份檔案有沒有被 Copilot 參考」
  這個事實，只是不能改)。
- **a11y**：checkbox 需要正確的 `<label>` 關聯（mockup 原版 `.file-ref` 是包住 checkbox 的
  可點 label，語意正確，延續即可）。
- **紅線**：不適用。
- **重用注意**：`referencedByCopilot` 這個布林值會實際影響 Copilot 的 context payload
  （task A3.5 要求「E2E 驗勾選狀態真的進 Copilot request payload」）——`ToolFileRow`
  只負責 UI 呈現與觸發 callback，把勾選狀態送進真正的 request payload是上層 state
  管理的責任，不要誤以為這個元件自己管理了「有效參考清單」。

#### AskChip

- **用途**：點一下就用固定問句問 Copilot 的入口，統一四個出現位置（當機處理／病史分析側欄／
  深度診斷側欄／Copilot 例句選單）的行為，尤其是「CASE ID 自動預填」這條規則。
- **mockup 出處**：L658–663、L692–699、L1285–1289、L1726–1751；
  CASE ID 預填規則見 `ALARM_CTX_Q`（L2275–2279）與 `ask()`（L2280–2292）。
- **Props**：
  ```ts
  type AskChipProps = {
    label: string; // 顯示文字，如「根因推測」
    question: string; // 送給 Copilot 的實際問句
    onAsk: (question: string) => void;
  };
  ```
- **變體/狀態**：僅 default（無 loading/disabled——提問永遠可以問，`copilot.ask` 是 ALL）。
- **互動行為**：點擊呼叫 `onAsk(question)`。**CASE ID 是否自動預填不是這個元件決定的**——
  那是呼叫端（哪個頁面在用）根據目前 case 語境決定要不要傳入已知的 caseId，
  `AskChip` 只負責觸發提問這個動作。
- **權限**：`copilot.ask`（ALL）。
- **a11y**：底層是 `<button>`，`label` 即為可讀文字，不需要額外 `aria-label`。
- **紅線**：不適用。
- **重用注意**：`label` 與 `question` 刻意分開（如 mockup 顯示「跟同型機比，我這台特別爛嗎？」
  但實際問句是「這台跟同型機比起來如何」）——**不要合併成一個字串**，
  否則 i18n（task A1.7）時翻譯顯示文字會連帶改到送給後端的問句 key，破壞 `ANS`/後端的
  問句比對邏輯。這是本規格特別要提醒的地雷,因為 mockup 的原始實作就是兩者分離
  （`onclick="ask('這台跟同型機比起來如何')"` vs 顯示文字），移植時容易被「反正都是字串」
  的直覺誤導成單一 prop。

#### PinnedCard

- **用途**：已打包到 case 的分析卡片，病史分析頁的核心內容。
- **mockup 出處**：L675–684；標題可編輯見 L2405（`contenteditable`）。
- **Props**：
  ```ts
  type PinnedCardProps = {
    card: PinnedCard; // @/domain/case
    role: Role; // @/domain/user
    isOwner: boolean;
    onEditTitle?: (nextTitle: string) => void;
    onPromoteToCommon?: () => void;
  };
  ```
- **變體/狀態**：`status`（`private`/`pending`/`common`）決定 `skill-lv` Badge 顏色；
  剛打包時短暫顯示 `pin-new` 徽章（mockup 沒有明確消失時機，建議與其他「剛完成」提示
  一致地用幾秒後淡出，具體時間留給實作，不在此規格定值）。
- **互動行為**：標題可 inline 編輯（點擊進入可編輯態，Enter 或 blur 儲存）；
  `admin` 角色可看到「晉升為課級 common」的操作（task A4.3 的審核流程另有獨立 UI，
  不在 `PinnedCard` 本身，這裡只放觸發入口）。
- **權限**：`pin.editTitle`——用 `canEditPinTitle(role, isOwner)`（`@/lib/permission`）
  而非單純 `can()`，因為 editor 只能改自己的（permission-matrix #8 的「◐ 限本人」）；
  `pin.promoteToCommon` 為 `ADMIN_ONLY`。
- **a11y**：inline 編輯的標題需要在進入編輯態時有清楚的焦點與 `aria-label="編輯標題"`；
  純顯示態時標題仍應是可被讀出的 heading，不要整個變成一個看起來像純文字的
  `contenteditable` div（mockup 原版如此，正式實作建議至少加 `role="textbox"`）。
- **紅線**：**承載 D1 #8**——`card.source` 是必填欄位（型別已保證），`PinnedCard` 沒有
  「無來源」的顯示分支，因為 domain 型別根本不允許 `source` 為空。
- **重用注意**：`skill-lv`（個人 skill／課級 common）與 `status`（`private`/`pending`/`common`）
  是同一個欄位的兩種說法——mockup 只在畫面上寫「個人 skill」/「課級 common」兩種文字，
  但型別是三態（多了 `pending`）,實作時記得 `pending` 狀態的視覺（審核中）不能被漏掉,
  即使 mockup 沒有畫出來。

#### PatternTag

- **用途**：呈現時序／分布／空間三種受控 pattern 之一，統一 mockup 裡 `.pat`/`.sp-tag` 兩組
  外觀不同但語意相同的標籤。
- **mockup 出處**：時序/分布見 `.dual-tag`（L1459、1466、1475、1484）；空間見
  `.sp-tag`（詞�v表 L1258–1269，用法 L737/756/807/819/855/863/900/938）。
- **Props**：
  ```ts
  import type { TimePattern, DistPattern } from "@/domain/taxonomy";
  import type { SpatialPattern } from "@/domain/taxonomy";

  type PatternTagProps =
    | { dimension: "time"; value: TimePattern }
    | { dimension: "dist"; value: DistPattern }
    | { dimension: "spatial"; value: SpatialPattern };
  ```
- **變體/狀態**：每個 `dimension` 各自窮舉其 enum 值（時序 6 種／分布 5 種／空間 10 種），
  顏色映射直接查 `TIME_PATTERN_LABEL`/`DIST_PATTERN_LABEL`/`SPATIAL_PATTERN_LABEL`
  取中文說明作為 tooltip，不需要另外維護一份文字。
- **互動行為**：無（純顯示；mockup 側欄的「空間 Pattern 詞彙表」是靜態列表,
  用 `PatternTag` 逐一渲染窮舉值即可,不需要額外互動）。
- **權限**：不適用（純顯示 ML 判定結果）。
- **a11y**：顏色 + 文字雙重編碼（enum 值本身就是文字，已經滿足「不只靠顏色」）。
- **紅線**：**是 D1 #1 的核心結構保證**——`value` 的型別是 domain enum,
  不是 `string`,元件簽名上就杜絕了「LLM 生成一個 pattern 名稱塞進來」的可能性;
  同時 `dimension` 這個 discriminant 保證時序與分布不會被誤標到同一個標籤裡
  （呼應 taxonomy.ts 的「正交維度」註解與 D1 #3 的受控詞彙精神）。
- **重用注意**：`sp-tag` 在 mockup 裡同時被拿來畫「詞彙表展示」（純列舉）與
  「實際判定結果」（如 Chuck A 的 `RANDOM`）兩種用途——兩者用同一個元件是對的
  （反正都是「顯示一個 pattern 值」），不需要為了「這是教學用途 vs 這是判定結果」
  切出兩個元件。

#### SpatialIndicatorTabs

- **用途**：深度診斷頁六選一的指標切換列（五個空間指標 + 關聯圖）。
- **mockup 出處**：L714–721。
- **Props**：
  ```ts
  import type { SpatialIndicator } from "@/domain/spatial";

  type SpatialIndicatorTabsProps = {
    active: SpatialIndicator | "graph";
    onChange: (key: SpatialIndicator | "graph") => void;
  };
  ```
- **變體/狀態**：六個固定選項；無 loading（切換是純前端狀態，資料由子畫面各自 fetch）。
- **互動行為**：點擊切換，驅動 `SegmentedControl`。
- **權限**：`view.panes`（ALL）。
- **a11y**：延續 `SegmentedControl` 的 tablist 語意。
- **紅線**：不適用。
- **重用注意**：**"graph" 不是 `SpatialIndicator` 的成員**（`domain/spatial.ts` 的
  `SPATIAL_INDICATORS` 只有 5 個值，關聯圖是另一個獨立功能被塞進同一列 UI）——
  這個元件的 `"graph"` 字面值是 UI 層的聯合類型擴充，**不要**因為想讓型別「更乾淨」
  就去改 `SPATIAL_INDICATORS` 加進第 6 個假的空間指標,那會污染 domain taxonomy
  的正確性（關聯圖不是空間分布指標）。

#### DualChuckVerdict

- **用途**：呈現「一致/分歧」判定與對應的排查方向 fork。
- **mockup 出處**：L725–732（分歧範例）、L796–802（一致範例）。
- **Props**：
  ```ts
  type DualChuckVerdictProps = { verdict: ChuckVerdict }; // @/domain/spatial
  ```
- **變體/狀態**：`kind`（`consistent`/`divergent`/`not_applicable`）——mockup 只展示前兩種,
  `not_applicable` 是型別裡存在但 mockup 未演示的狀態，顯示文案留待實作時與 PE 確認,
  本規格不臆測。
- **互動行為**：無（純顯示判定結果；fork 的兩條敘述何者高亮由 `verdict.kind` 決定,
  不是使用者可切換的）。
- **權限**：`view.panes`（ALL）。
- **a11y**：兩條 fork 敘述中「非目前判定」的那條在 mockup 用 `opacity:.4` +
  刪除線（`.fork-arm.off`），需確保這不是唯一辨識方式——建議額外加
  `aria-current="false"`/文字前綴「（非本次判定）」。
- **紅線**：**承載 D1 #1**——`verdict.kind` 型別上只能是 ML/規則產出的三個值之一,
  元件無法自行「判斷」一致或分歧,只能渲染已經判定好的結果。
- **重用注意**：`implication` 欄位（這個判定把嫌疑範圍縮到哪裡）是必填字串,
  代表**每次呼叫都必須帶著解釋**,不存在「只顯示 一致/分歧 但不解釋為什麼重要」的用法——
  這呼應 mockup 裡每個 verdict 都附一段「這一刀切下去…」的說明。

#### SuspectList

- **用途**：顯示嫌疑零件與可點擊的 SOP 節點。
- **mockup 出處**：L780–785、L839–843、L880–884、L921–925、L959–963。
- **Props**：
  ```ts
  type SuspectListProps = {
    suspects: readonly Suspect[]; // @/domain/spatial
    onSopClick: (refId: string) => void;
  };
  ```
- **變體/狀態**：`kind`（`part`/`sop`/`hypothesis`）決定是否可點擊（僅 `sop` 可點,
  對應 mockup 只有 `.sus-node.sop` 有 `cursor:pointer` 與 onclick）。
- **互動行為**：`kind==='sop'` 的節點點擊觸發 `onSopClick(refId)`（進而觸發 Copilot 提問,
  見 mockup L784 `onclick="ask('找相似歷史案例')"`）。
- **權限**：SOP 節點點擊等同觸發提問，需 `copilot.ask`（ALL，無額外限制）。
- **a11y**：可點擊的 SOP 節點需是 `<button>` 而非純 `<span onClick>`；不可點擊的
  `part`/`hypothesis` 節點不應有任何互動語意（不加 `role="button"`）。
- **紅線**：不適用（嫌疑清單是 ML/domain 判定結果的呈現，非決策——AI 沒有在這裡「主張」
  哪個零件一定是根因，只是列出嫌疑,呼應 D1 #6 但這個元件本身不是保證這條紅線的關鍵結構,
  關鍵結構在於 `Suspect[]` 不含「信心分數排序建議動手術」這類措辭,是 domain 型別層級的克制)。
- **重用注意**：`hypothesis` 這個 `kind`（如「兩 chuck 共同劣化？」這種疑問句式的假設,
  L842）在視覺上應該與確定的 `part` 有所區別（如用問號/斜體），不要三種 `kind`
  都用同一種視覺呈現——那會讓「這是已知嫌疑」與「這只是待驗證的猜測」混在一起,
  違反設計原則 #4 的精神（事實與推論分離）。

#### FlywheelNote

- **用途**：呈現「命中歷史標註」的知識飛輪卡——強調這是工程師寫的知識，不是模型推理的。
- **mockup 出處**：L786–789（深度診斷）、L885–889、L1586–1590（FDC t chart）。
- **Props**：
  ```ts
  import type { SpatialAnalysis } from "@/domain/spatial";
  import type { KmHit } from "@/domain/fdc";

  type FlywheelNoteProps =
    | { source: "spatial"; note: NonNullable<SpatialAnalysis["flywheel"]> }
    | { source: "tchart"; note: KmHit };
  ```
- **變體/狀態**：兩種 `source`（欄位形狀略有不同：`KmHit` 多了 `caseId`/`outcome`）；
  交叉驗證變體（mockup L885–888 提到「與 Overlay FP 的判定一致」）目前沒有獨立欄位承載,
  是敘事文字的一部分,不在本規格拆出結構化 prop（見 Open issues）。
- **互動行為**：無（純顯示；若要跳轉到引用的 case，屬於未來加強，mockup 沒有可點擊行為)。
- **權限**：`view.panes`（ALL）。
- **a11y**：固定用「🔄」開頭的視覺提示應搭配文字（如 `aria-label="知識飛輪命中"`),
  不要只靠 emoji。
- **紅線**：**承載 D1 #1 與 #5 的正面案例**——`FlywheelNote` 的存在本身就是「有紀錄」分支,
  與 `UnknownNote`（無紀錄分支）互斥且成對，父層元件（`StepAnalysisCard`／深度診斷的
  ML 判定卡）必須依 `kmHit`/`flywheel` 是否為 `null` 二選一渲染，不能兩個都不渲染
  （那樣就是把「不知道」悄悄藏起來，違反 D1 #5）。
- **重用注意**：`note.author`/`note.at` 必須顯示（mockup 每處都寫「老李 3/22 標註過」），
  這是「這是你們寫的，不是我推理的」訊息能成立的關鍵——**不要**為了排版精簡而省略作者/時間。

#### UnknownNote

- **用途**：呈現「KM 沒有紀錄，我不猜」——`FlywheelNote` 的互斥對照。
- **mockup 出處**：L836–838（BOWL pattern 無紀錄）、L1611–1613（S4 單點 loss 無紀錄）。
- **Props**：
  ```ts
  type UnknownNoteProps = { hint?: string }; // 可選補充「不知道的具體是什麼」，如「是感測器問題還是真實壓力擾動」
  ```
- **變體/狀態**：僅 default；不含「即將知道」的樂觀變體（避免暗示 AI 快要學會了，
  這件事的發生與否完全取決於工程師是否標註，元件不該替使用者做心理預期管理）。
- **互動行為**：無（旁邊若有標註表單，是 `AnnotationForm` 的職責，不是 `UnknownNote` 本身；
  mockup 裡兩者確實相鄰但不是同一個元件）。
- **權限**：`view.panes`（ALL，純顯示不需寫入權）。
- **a11y**：純文字說明，需確保不是唯一用顏色（灰階）表達「這是不確定狀態」——
  文字本身已經說明「我不知道」，符合此原則。
- **紅線**：**是 D1 #5 的具體實作**——這個元件的唯一使命就是讓「不知道」在 UI 上長得
  和「有答案」一樣正式、一樣占版面，而不是被壓縮成一行小灰字或乾脆不顯示。
- **重用注意**：不要把 `UnknownNote` 跟 `EmptyState` 搞混——`EmptyState` 是「這個清單沒資料」
  （資料層級的空），`UnknownNote` 是「這個特定現象 KM 沒有解釋」（語意層級的未知，
  資料本身不是空的，`StepAnalysis` 這筆記錄仍然存在，只是 `kmHit` 欄位是 `null`）。

#### CrossDiagnosisPanel

- **用途**：呈現 ML 後端產出的交叉診斷結論（多指標交叉驗證出的問題線）。
- **mockup 出處**：L1240–1248。
- **Props**：
  ```ts
  type CrossDiagnosisPanelProps = { diagnosis: CrossDiagnosis }; // @/domain/spatial
  ```
- **變體/狀態**：`lines` 陣列長度可能為 0（雖然 mockup 展示恆有兩條，型別上允許空陣列,
  空陣列時應顯示 `EmptyState` 而非什麼都不畫）；`scope`（`in_section`/`needs_fse`）
  決定該行是否要搭配 FSE 升級提示樣式。
- **互動行為**：無（純顯示；`confidence` 數值如何呈現——百分比或文字分級——留待視覺設計,
  本規格只保證資料來源是 `diagnosis.confidence`）。
- **權限**：`view.panes`（ALL）。
- **a11y**：`scope="needs_fse"` 的行需要與 `scope="in_section"` 有清楚的視覺與文字區分
  （mockup 用 🔴/🟡 emoji 加顏色文字，正式實作需要 emoji 之外的文字標示，
  如「需 FSE」徽章）。
- **紅線**：**承載 D6（task 決策，非 D1 編號但同等強制）**——「前端不得有任何彙整規則」。
  這個元件的 props 只接受已經彙整好的 `CrossDiagnosis`，**沒有** `indicators: SpatialAnalysis[]`
  這種讓元件自己「算出」結論的介面——型別上就杜絕前端二次判斷的可能性
  （呼應 task A7.9「前端零判斷邏輯」的驗收方式：code review 確認無規則散落）。
- **重用注意**：`lines[].indicators`（依據哪些指標）必須顯示為可稽核的清單
  （如 mockup「Overlay TILT + Leveling hot spot 交叉驗證」），不要只顯示結論文字
  而省略依據——依據清單本身就是這個元件對 D1 #8 的貢獻。

#### CandidateRow

- **用途**：關聯圖查詢結果的一個候選零件，含排名、來源、權重條、回饋按鈕。
- **mockup 出處**：L1040–1077。
- **Props**：
  ```ts
  type CandidateRowProps = {
    rank: number;
    candidate: Candidate; // @/domain/graph
    onVote: (vote: "up" | "down") => void;
    onCorrect?: (correctNodeId: string) => void; // 👎 後的受控修正
  };
  ```
- **變體/狀態**：`source`（`physical`/`experience`/`both`）決定 `Badge` 色與排序邏輯的
  視覺說明；`down` 投票後展開受控下拉（見 `VoteButtons` 的重用注意）。
- **互動行為**：👍 觸發 `onVote("up")`（樂觀更新權重條增加）；👎 觸發 `onVote("down")`
  並展開修正下拉，選定後觸發 `onCorrect`。
- **權限**：`graph.vote`（WRITE，viewer 應整組 `VoteButtons` disabled，但候選零件本身
  仍應可見——permission-matrix #13 是「回饋」不可，不是「看不到候選」）。
- **a11y**：`rank` 數字需搭配文字（如「第 1 名」），不要只顯示視覺上的排名圓圈顏色。
- **紅線**：**承載 D1 #7**——`candidate.source` 的三態必須在視覺上區分（mockup 用
  「物理 + 經驗」/「物理」/「經驗」三種 `Badge` 文字），且 `rationale` 必須說明是
  「本台 N 次」還是「同型機 N 次」還是「純物理連接」——**不得**把這些折疊成一個
  「相關度 87%」式的單一數字,那樣兩層分離的資訊就在 UI 層被抹掉了。
- **重用注意**：`weight` 驅動 `WeightBar`（見視覺化元件），`CandidateRow` 自己不畫權重條,
  組合 `WeightBar` 子元件——避免權重條的繪製邏輯在 `CandidateRow` 與其他可能用到權重的地方
  （目前沒有其他地方用，但保持職責分離仍值得）重複。

#### PendingEdgeRow

- **用途**：顯示一條待確認的低信心關聯圖邊，供人確認/刪除。
- **mockup 出處**：L1133–1156。
- **Props**：
  ```ts
  type PendingEdgeRowProps = {
    edge: GraphEdge; // @/domain/graph，confidence='low' && confirmed=false
    fromLabel: string;
    toLabel: string;
    reason: string; // 「文件說『串接』，但沒說方向」這類推測依據
    onConfirm: () => void;
    onReject: () => void;
  };
  ```
- **變體/狀態**：`pending`（預設）／`confirmed`（綠框，變實線）／`rejected`
  （灰階+刪除線），對應 `peFix()` 的兩個分支（L1834–1847）。
- **互動行為**：`ListRow(tone="dashed")` + `VoteButtons`（confirm=up, reject=down）組合。
- **權限**：`graph.confirmPendingEdge`（WRITE）。
- **a11y**：確認/刪除後的狀態文字需 `aria-live`（同 `VoteButtons`）。
- **紅線**：**承載 D1 #7**——這個元件的存在本身體現「建圖時 Agent 產出的邊分高低信心,
  低信心的必須待人確認才能從虛線變實線」，`edge.confidence`/`edge.confirmed` 兩個欄位
  缺一都無法正確渲染此元件（型別要求同時存在）。
- **重用注意**：`fromLabel`/`toLabel` 為什麼不直接從 `edge.from`/`edge.to`（節點 ID）取得，
  而要另外傳入——因為 `GraphEdge` 只存 ID，標籤需要查 `GraphNode` 表,
  这个查表邏輯屬於呼叫端（拿到完整 `GraphQueryResult` 或建圖頁的節點清單的那一層）,
  `PendingEdgeRow` 不應該自己吃整個節點陣列去做查找。

#### BuildStepRow

- **用途**：顯示 Agent 建圖過程的一個步驟（已完成/待確認 + 信心分佈）。
- **mockup 出處**：L1094–1127（解析文件/料號正規化/recipe 反推/待人補完）、
  L1177–1204（養肥流程的三個成長來源說明，視覺上是同一個元件的另一組資料）。
- **Props**：
  ```ts
  type BuildStepRowProps = {
    index: number;
    status: "done" | "pending";
    description: React.ReactNode; // 見 Open issues：無對應 domain 型別，暫用 ReactNode 承載敘述文字
    confidenceCounts?: { high: number; low: number };
  };
  ```
- **變體/狀態**：`done`（綠色編號圓圈 ✓）／`pending`（橙色編號圓圈，顯示步驟序號數字）。
- **互動行為**：無（純顯示進度；mockup 沒有點擊行為）。
- **權限**：`view.panes`（ALL，顯示建圖進度不需寫入權；下方的「手動新增節點/連接」
  另外走 `graph.addNode`，不是這個元件本身的權限）。
- **a11y**：編號圓圈的顏色差異需搭配可讀文字（「已完成」/「待你補完」），不要只用顏色。
- **紅線**：不適用（沒有直接對應 D1 條目；但精神上呼應「Agent 是助產士不是產婆」——
  這是 mockup 的產品理念而非 D1 列舉的八條紅線之一，故誠實標「不適用」而非硬套）。
- **重用注意**：見 §Open issues——`description`/`confidenceCounts` 目前沒有 domain schema
  可引用，是本規格中少數「暫時只能用 `ReactNode`/自由物件」的元件，之後 domain 型別補上
  `BuildStep` schema 後應該回頭把 `description` 換成結構化欄位（如
  `{ action: string; sourceDoc?: string; extractedCount: number }`），而不是繼續放
  自由 `ReactNode`。

#### NarrativeSummary

- **用途**：呈現 LLM 對 ML 輸出的自然語言總結，固定標示「只讀 ML 輸出」。
- **mockup 出處**：`.summary`（L1492–1499，u chart）、L1658–1668（t chart）。
- **Props**：
  ```ts
  type NarrativeSummaryProps = { narrative: string }; // UChartAnalysis.narrative / TChartAnalysis.narrative
  ```
- **變體/狀態**：僅 default；`narrative` 不可為空字串（型別 `z.string().min(1)` 已保證）。
- **互動行為**：無。
- **權限**：`view.panes`（ALL）。
- **a11y**：固定的免責文字（「LLM 只讀 ML 輸出做敘事，不自己判定 pattern」）需要是
  可被讀出的文字而非純裝飾性小字。
- **紅線**：**是 D1 #1 的顯示端保證之一**——這個元件**固定渲染**免責聲明，
  呼叫端無法傳 prop 關閉它（props 裡沒有 `hideDisclaimer` 這種欄位），
  確保任何地方用到 `NarrativeSummary` 都帶著同一句「這是敘事,不是判定」的提醒。
- **重用注意**：**不獨立保證 D1 #8**（見設計原則 #5）——`narrative` 是一段自由文字,
  它引用的具體數字（如「+5.7nm」）理論上應該都能在同一頁面的 `SegmentCard`/
  `BaselineVerdictCard` 裡找到結構化來源，但 `NarrativeSummary` 本身不做這個交叉核對,
  這是內容產生端（後端 prompt 設計）的責任,不是這個 UI 元件能結構性保證的事。

#### BaselineVerdictCard

- **用途**：呈現 Baseline shift 判定（是否偏移、偏移量、σ 倍數）。
- **mockup 出處**：`.baseline`（L1440–1447）。
- **Props**：
  ```ts
  type BaselineVerdictCardProps = { baseline: BaselineVerdict }; // @/domain/fdc
  ```
- **變體/狀態**：`shifted` true（紅框警示）／false（樣式待定——mockup 只展示
  `shifted=true` 一種，`false` 的視覺本規格不臆測顏色，留給實作時與設計對齊，
  但至少不應該用紅框，語意上偏移=false 不該長得像警告）。
- **互動行為**：無。
- **權限**：`view.panes`（ALL）。
- **a11y**：`baseline`/`current` 兩組 mean/sigma/windowLabel 建議用 `<dl>` 結構呈現,
  而非純段落文字（mockup 是文字段落，正式實作可以加強語意結構)。
- **紅線**：**承載 D1 #1 與 #8**——`deltaValue`/`sigmaMultiple` 都是 ML 計算好的數值,
  元件不做任何運算（不會拿 `current.mean - baseline.mean` 自己算,那樣萬一 ML 的計算方式
  之後改變,前端會算出不一致的數字）,一律直接顯示 `baseline.deltaValue`/`sigmaMultiple`。
- **重用注意**：`windowLabel`（如「前 30 天」）是字串而非結構化的天數範圍——
  這是既有型別的設計（保留單位字串以免前端誤算，同樣的模式也用在 `ChuckMap.metrics`），
  延續此規則，不要在這個元件裡把 `windowLabel` 解析成數字再重新格式化。

#### SegmentCard

- **用途**：呈現 u chart 一個分段的雙維度 pattern 判定與鄰近事件。
- **mockup 出處**：`.seg`（L1457–1489）。
- **Props**：
  ```ts
  type SegmentCardProps = { segment: Segment; isBaselineWindow?: boolean }; // @/domain/fdc
  ```
- **變體/狀態**：`isBaselineWindow` 標示此段是否作為 baseline（mockup 第一段特別註明
  「此段作為 baseline」）；`stats.slopePerDay`/`r2`/`peaks` 依 `timePattern`/`distPattern`
  是否為 `TRENDING`/`MULTI_PEAK` 才有值（`null` 時對應欄位不顯示）。
- **互動行為**：無自身互動（點擊分段跳轉圖表高亮是 `UChartTimeline` 與此卡片的聯動,
  互動狀態管理在頁面層，`SegmentCard` 只是被動接收 `segment` 資料渲染)。
- **權限**：`view.panes`（ALL）。
- **a11y**：`nearbyEvents` 需要有別於統計數字的視覺分組（見設計原則 #4），
  並固定帶出「時間並列，不代表因果——由你判斷」字樣（mockup 每處鄰近事件都有這句,
  這不是可省略的裝飾文字）。
- **紅線**：**承載 D1 #1（pattern 來自 `segment.timePattern`/`distPattern`，
  透過 `PatternTag` 呈現，元件不推斷）與 #4（`nearbyEvents` 結構性地與 stats 分開陳列）**。
- **重用注意**：mockup 的分段背景色（綠/紅/藍/橙）在 `UChartTimeline` 圖表上與
  `SegmentCard` 之間應該共用同一份「pattern → 顏色」映射,但這個映射目前沒有明確規則
  （觀察到的顏色似乎混合了時序與分布兩個維度的視覺線索，不是單一欄位決定）——
  **這是需要在頁面 spec 或視覺設計階段另外定案的映射表**，`SegmentCard` 本身不內建這份映射,
  避免兩個元件各自猜測、顏色對不上。

#### StepAnalysisCard

- **用途**：t chart 逐段 recipe 對照卡，是 t chart 分析最核心的元件（含 chain/flywheel/unknown 三選一）。
- **mockup 出處**：`.tseg`（L1563–1656，含 S2 命中歷史 case 與 S4 未知現象兩種完整範例）。
- **Props**：
  ```ts
  type StepAnalysisCardProps = {
    step: RecipeStep; // @/domain/fdc
    analysis: StepAnalysis; // @/domain/fdc
    onSopClick: (id: string) => void;
    onAnnotate?: () => void; // 開啟 AnnotationForm；null kmHit 且有權限時才提供
  };
  ```
- **變體/狀態**：`verdict`（`ok`/`deviation`/`data_loss`/`unknown`）決定卡片色調
  （綠框正常／紅框偏移／橙框 data loss）；`analysis.kmHit` 為 `null` 時渲染 `UnknownNote`
  （並視權限顯示 `AnnotationForm` 入口），非 `null` 時渲染 `FlywheelNote`；
  `recipeTarget`/`actual` 皆為 `null` 時（如「正常」的 S1/S3/S5，mockup L1653–1656）
  不渲染 `CompareBox` 對照,只顯示簡短說明。
- **互動行為**：`chain` 陣列渲染 `ChainTrail`，其中 `kind='sop'` 節點觸發 `onSopClick`；
  `kmHit===null` 且使用者有 `tchart.annotate` 權限時顯示「標註」入口觸發 `onAnnotate`。
- **權限**：讀取 `view.panes`（ALL）；標註入口 `tchart.annotate`（WRITE，viewer 看不到
  標註表單但仍看得到 `UnknownNote` 本身——「我不知道」這件事對所有角色都該誠實顯示,
  只有「你要不要教我」這個寫入動作才分權限）。
- **a11y**：`verdict` 的色調需搭配文字 Badge（`tseg-tag`），對照本規格 `Badge` 元件。
- **紅線**：**同時承載 D1 #1（verdict/kmHit 皆為既定資料，非前端推斷）、#5
  （kmHit null 必渲染 UnknownNote）、#8（recipeTarget/actual 兩個數字透過 CompareBox
  直接呈現，不重新計算）**——是本文件裡承載最多條紅線的單一元件，實作與 code review
  時應優先檢查這個元件有沒有被便利性侵蝕（如為了畫面好看而把 `UnknownNote` 拿掉）。
- **重用注意**：不要把 `AnnotationForm` 直接內嵌在這個元件的必然輸出裡——
  `onAnnotate` 是一個開啟表單的 callback（可能開啟 modal 或展開內嵌區塊，
  由頁面層決定呈現方式），`StepAnalysisCard` 不擁有 `AnnotationForm` 的顯示狀態,
  避免這張卡片的 state 越滾越大。

#### ChainTrail

- **用途**：呈現 step → 零件 → 零件 → SOP 的追根鏈路，SOP 節點可點擊。
- **mockup 出處**：`.chain`（L1577–1585）。
- **Props**：
  ```ts
  type ChainTrailProps = {
    chain: readonly ChainNode[]; // @/domain/fdc
    onSopClick: (id: string) => void;
  };
  ```
- **變體/狀態**：`kind`（`step`/`part`/`sop`）決定節點樣式；只有 `sop` 可點擊
  （對應 mockup `.chain-node.sop { cursor:pointer }`）。
- **互動行為**：`sop` 節點點擊觸發 `onSopClick`。
- **權限**：`copilot.ask`（點擊 SOP 節點觸發提問，ALL）。
- **a11y**：節點間的 `→` 箭頭純裝飾（`aria-hidden`），鏈路本身建議用有序列表
  （`<ol>`）而非一串 `<span>`，讓螢幕閱讀器能理解這是有方向性的序列。
- **紅線**：不適用（純呈現既有鏈路，不做推斷）。
- **重用注意**：與 `SuspectList` 的 `sop` 節點視覺相近（都是可點的 teal 徽章觸發提問），
  但資料形狀不同（`ChainNode` 是有序鏈路的一環，`Suspect` 是平行的嫌疑清單），
  **暫不合併**——雖然看起來像同一個「可點的 SOP 徽章」,但一個帶方向性語意、
  一個不帶,合併會讓 `ChainTrail` 的順序保證變得模糊。

#### AnnotationForm

- **用途**：工程師標註一個未知現象（受控下拉 + 懷疑零件 + 補充說明）。
- **mockup 出處**：`.annot`（L1617–1649）。
- **Props**：
  ```ts
  type AnnotationFormProps = {
    stepId: string;
    /** Open issue：domain/fdc.ts 尚無標註 payload 的 schema，暫用下列形狀，
     *  待型別補上後應改為引用該型別而非重新定義。 */
    onSubmit: (payload: {
      what: string; // 受控詞彙，來源見下方「重用注意」
      suspectPartId: string | null;
      note: string;
    }) => void;
    onSkip: () => void;
  };
  ```
- **變體/狀態**：`what` 下拉的選項在 mockup 是寫死的 5 個中文選項（L1622–1626），
  不是 `domain/taxonomy.ts` 現有的任何一組 enum——這組「現象分類」詞彙本身就是
  待補的受控詞彙表（見 Open issues）。
- **互動行為**：「✓ 確認並存入 KM」觸發 `onSubmit`；「先跳過」觸發 `onSkip`
  （對應 mockup `annotSkip()`，明確顯示「這個現象會留在未知狀態」的提示）。
- **權限**：`tchart.annotate`（WRITE）。
- **a11y**：三個 `FormField` 分別對應下拉/下拉/文字框，皆需正確 label 關聯。
- **紅線**：**承載 D1 #3**——「現象分類」欄位是受控 `<select>`,不是自由輸入;
  「補充說明」欄位允許自由文字，但型別上與分類欄位分開（`note` vs `what`），
  不會被誤用成分類依據。
- **重用注意**：見 Open issues——`suspectPartId` 目前只能用字串 ID 帶過,
  沒有辦法引用 `GraphNode` 型別做強型別檢查（因為 `AnnotationForm` 的懷疑零件下拉
  資料來源與關聯圖的 `GraphNode` 是否為同一份主檔尚未確認，見 D8 決策——
  節點粒度綁料號主檔 ID，`AnnotationForm` 的懷疑零件選單理論上也該綁同一份主檔,
  但目前沒有型別能保證兩處引用同一個 ID 空間）。

#### FdcFeedbackPanel

- **用途**：FDC 判讀的完整回饋流程——👍👎 → （👎 時）四種問題分類 → 受控修正表單 → 打包成卡片。
- **mockup 出處**：`.fb-bar`/`.fb-panel`/`.fx-form`（L1675–2032，`fdcGood()`/`fdcBad()`/
  `fxOpen()`/`fxSubmit()` 一系列函式）。
- **Props**：
  ```ts
  type FdcFeedbackPanelProps = {
    onVoteGood: () => void;
    /** Open issue：四種修正分類（turn/pattern/baseline/summary）目前沒有 domain schema，
     *  payload 形狀暫由呼叫端自訂，待型別補上。 */
    onSubmitCorrection: (kind: "turn" | "pattern" | "baseline" | "summary", payload: unknown) => void;
    onPackage: () => void;
  };
  ```
- **變體/狀態**：`idle`（顯示 fb-bar）→ `goodConfirmed`（👍 後鎖定顯示「已記錄」）
  或 `optionsOpen`（👎 後展開四選一）→ `formOpen(kind)`（選定分類後的受控表單）→
  `submitted`（顯示「已標記」+ 訓練佇列說明）。這是本規格**唯一把 mockup 三個 CSS class
  合併成一個元件**的案例——理由見重用注意。
- **互動行為**：對應上述狀態機的每個轉換；`formOpen` 內的下拉選項直接使用
  `TAXONOMY`（時序/分布，`pattern` 分類時）或（`baseline`/`turn`/`summary` 分類時）
  mockup 寫死的中文選項——後者同樣是待補的受控詞彙（見 Open issues）。
- **權限**：`fdc.feedbackVote`（👍👎，WRITE）；`fdc.feedbackForm`（修正表單送出，WRITE）；
  「📌 打包成卡片」走 `pin.create`（WRITE），三者都是同一組角色（admin/editor），
  但型別上仍是三個獨立 capability，不可合併判斷（避免之後三者權限拆開時要重寫）。
- **a11y**：狀態機切換時的訊息（如「✓ 已記錄」）需要 `aria-live="polite"`。
- **紅線**：**承載 D1 #3**（`pattern` 分類的修正走受控 taxonomy 下拉）；
  整體機制承載「回饋餵回訓練佇列」的產品精神（非 D1 編號項目，但 task 檔多處強調
  「受控詞彙表確保所有人標的是同一件事——ML 才學得會」，故此為誠實標註,
  非硬套一個不存在的紅線編號）。
- **重用注意**：把 fb-bar/fb-panel/fx-form 合併成一個元件是刻意的簡化決定——
  這三段 UI 在 mockup 裡永遠依序出現、永遠只服務同一個回饋流程,從未被拆開單獨使用過,
  拆成三個元件只會製造三份需要互相知道彼此狀態的 props（如 fb-panel 需要知道
  fx-form 開了沒），合併後狀態機內聚在一個元件裡管理更清楚。**如果之後某個畫面只需要
  三段中的一段（如只要打包按鈕，不要回饋流程）**，那時候再拆出更小的
  `PackageButton`（其實就是複用 `PinButton`），不要現在為了「理論上可能拆」而拆。

#### CaseIdModal

- **用途**：打包到 Case Center 的 CASE ID 輸入彈窗，含依語境自動預填。
- **mockup 出處**：L1698–1709；預填邏輯見 `pin()`（L2337–2349）、`pinFDC()`（L2091–2099）、
  `ALARM_CTX_Q`（L2275–2279）。
- **Props**：
  ```ts
  type CaseIdModalProps = {
    open: boolean;
    prefillCaseId?: string; // 有 case 語境時自動帶入；一般 chat 為空
    onConfirm: (caseId: string) => void;
    onCancel: () => void;
  };
  ```
- **變體/狀態**：`prefillCaseId` 有值／無值（決定是否顯示「已依目前處理中的 case 自動帶入，
  可修改」提示文字，mockup L2346）。
- **互動行為**：Enter 送出（`caseConfirm`）、Esc 取消（`caseCancel`，mockup
  L2443–2446 已綁定鍵盤事件）；開啟時自動 focus + select 輸入框內容
  （mockup L2098、L2348 皆有 `setTimeout(...).focus();.select()`）。
- **權限**：`pin.create`（WRITE）——這個 modal 只應該從已經做過 `pin.create` gating 的
  按鈕（`PinButton`／`FdcFeedbackPanel` 的打包按鈕）觸發，modal 本身在送出時
  也應該再檢查一次（縱深防禦，呼應 permission-matrix「前端 gating 只是 UX；
  每一個寫入端點都必須在 server 端重驗」）。
- **a11y**：延續 `Modal` composite 的 dialog 語意；輸入框需要 `<label>`
  （mockup 只有 `placeholder`，正式實作需補上可見或視覺隱藏的 label）。
- **紅線**：不適用（打包動作本身不是紅線，紅線在 `PinnedCard.source` 必填這件事上,
  已在該元件說明）。
- **重用注意**：見 `Modal` composite 的重用注意——這個對話框應該複用 `ModalShell`
  的擴充版本,而不是獨立實作一套 ESC/背景關閉/focus 邏輯。

#### CopilotRail

- **用途**：iDo Copilot 側欄容器：標頭（含 context 標籤）、例句選單、訊息串、輸入列。
- **mockup 出處**：L1713–1762。
- **Props**：
  ```ts
  type CopilotRailProps = {
    open: boolean;
    contextLabel: string; // 如「context：SCN-A01 · doc:litho2」
    /** Open issue：CopilotMessage 型別留待 A10 定案（task 檔已明確標註延後原因：
     *  訊息 block 結構與 streaming 形狀綁在一起）。此處暫以 unknown 佔位。 */
    messages: readonly unknown[];
    onSend: (text: string) => void;
    onClose: () => void;
  };
  ```
- **變體/狀態**：`open`/`closed`（驅動 `Drawer`）；訊息串為空時顯示 mockup 固定的歡迎詞
  （L1756，「👋 我是 iDo。上面是常用問法，點一下就問。也可以直接打字。」）。
- **互動行為**：輸入框 Enter 送出（`onSend`）；關閉時 FAB 重新出現（`Drawer` 已處理
  開關聯動,`CopilotRail` 只需知道 `open` 狀態)。
- **權限**：`copilot.ask`（ALL）——沒有角色會被擋在 Copilot 之外,唯讀角色一樣能問問題,
  只是不能把回答打包（那是 `PinButton`/`pin.create` 的事）。
- **a11y**：延續 `Drawer` 的 a11y 要求；輸入框需要清楚的 `<label>`
  或 `aria-label="問這台機台的任何問題"`。
- **紅線**：不適用於容器本身（訊息內容的紅線由 `MessageBubble`/`NarrativeSummary` 承載）。
- **重用注意**：`contextLabel` 的格式（「context：{機台} · doc:{課別}」）目前是
  mockup 寫死的字串拼接（L2146），i18n 化時要注意這是一個帶變數的訊息模板,
  不是純靜態字串,訊息檔的 key 設計需要支援插值。

#### AskMenu

- **用途**：Copilot 側欄的例句選單（三分組、可收合）。
- **mockup 出處**：L1722–1754；收合行為見 `showAskMenu()`（L2167–2170）與
  `ask()` 內的隱藏邏輯（L2282–2285）。
- **Props**：
  ```ts
  type AskMenuProps = {
    groups: ReadonlyArray<{
      label: string;
      chips: ReadonlyArray<{ label: string; question: string }>;
    }>;
    collapsed: boolean;
    onToggle: () => void;
    onAsk: (question: string) => void;
  };
  ```
- **變體/狀態**：`expanded`（預設，首次開啟顯示）／`collapsed`（問過一次問題後自動收合,
  顯示「💡 顯示常用問法」切換列，對應 mockup L1754）。
- **互動行為**：每個 chip 是一個 `AskChip`；收合列點擊觸發 `onToggle`。
- **權限**：`copilot.ask`（ALL）。
- **a11y**：收合/展開需要 `aria-expanded` 標示於切換列。
- **紅線**：不適用。
- **重用注意**：`groups` 的三個分組（病史分析／FDC 圖形分析／深度診斷）目前對應到
  mockup 三個固定的問句清單——這份清單本身是產品內容而非型別，`AskMenu` 只負責渲染,
  不要把這份固定清單寫死在元件內部,應該由頁面層傳入（未來要調整問句清單時,
  改的是資料不是元件）。

#### MessageBubble

- **用途**：呈現一則使用者或 Copilot 的訊息，含來源引用與動作列（複製/打包）。
- **mockup 出處**：`.msg-u`/`.msg-b`（L1755–1757 容器；`push()` L2295–2313 決定內容組成）。
- **Props**：
  ```ts
  /** Open issue：CopilotMessage 型別留待 A10；暫以此形狀替代，需在 A10 回頭校正。 */
  type MessageBubbleProps = {
    role: "user" | "assistant";
    content: React.ReactNode; // Stage A 起改結構化 blocks + sanitize（task D4），不用 dangerouslySetInnerHTML
    source?: string; // 有值才渲染 SourceCitation/SourceLine
    onCopy?: () => void;
    onPin?: () => void; // 僅 assistant 訊息才有
  };
  ```
- **變體/狀態**：`role="user"`（右側深色泡泡）／`role="assistant"`（左側淺色泡泡,
  可能帶 `source`/複製/打包動作）；`onPin` 未提供時不顯示打包按鈕
  （對應 mockup 只有帶 `title` 的回覆才有 `pin-btn`，L2301）。
- **互動行為**：複製觸發 `onCopy`（實際邏輯在 `CopyButton`）；打包觸發 `onPin`
  （開啟 `CaseIdModal`）。
- **權限**：`onCopy` 無權限限制；`onPin` 需 `pin.create`（WRITE，viewer 不顯示打包按鈕）。
- **a11y**：使用者/助理訊息需要用 `aria-label` 或視覺上明確的角色標示
  （不只靠左右對齊與顏色深淺——螢幕閱讀器線性讀取時分不出誰說的話）。
- **紅線**：**間接承載 D1 #8**——`source` 有值才渲染引用，但**型別上 `source` 是 optional**,
  這代表這個元件**不強制**每則助理訊息都有來源,強制性必須在填入 `content` 的那一層
  （後端/Server Action）保證,`MessageBubble` 只是誠實反映「有沒有收到來源」,
  不去偽造一個看起來有來源的空字串。
- **重用注意**：見 Open issues——`content: React.ReactNode` 是本規格對「結構化 blocks」
  最模糊的一處讓步,因為 `CopilotMessage` 型別（含 text/來源引用/數據表/動作列的
  block 結構，task A10.3 已預告）尚未定案,一旦定案,這裡應該改成
  `content: readonly MessageBlock[]` 而非自由 `ReactNode`,否則 XSS sanitize
  （task A10.3 的驗收要求）無法在型別層面被檢查。

#### SourceLine

- **用途**：帶來源類型圖示的溯源行，是 `SourceCitation` primitive 的 domain 化版本。
- **mockup 出處**：`ANS` 物件內每則答案的第二個陣列元素（如「來源　ML kernel：時序分類 +
  baseline 比對」，L2196–2197、L2224–2225 等，橫跨 L2182–2271）。
- **Props**：
  ```ts
  type SourceLineProps = {
    source: string;
    kind?: "rule" | "ml" | "llm" | "km" | "mixed"; // 決定圖示，不影響文字內容
  };
  ```
- **變體/狀態**：五種 `kind`（可選，未提供時純文字無圖示，等同直接使用 `SourceCitation`）。
- **互動行為**：無。
- **權限**：不適用。
- **a11y**：`kind` 對應的圖示需 `aria-hidden`，文字本身已足夠傳達來源。
- **紅線**：**是 D1 #8 的具體呈現機制**——`source` 為必填字串,任何使用 `SourceLine`
  的地方都不能傳空字串（型別可用 `z.string().min(1)` 風格的執行期檢查,
  但這裡是 React props,建議在對應的 domain 型別如 `PinnedCard.source` 上
  已經有 `min(1)` 保證,`SourceLine` 只需忠實渲染)。
- **重用注意**：與 `SourceCitation`（primitive）的差異只在於 `kind` 這個可選的
  圖示提示——**不要**把 `kind` 的判斷邏輯（如「這是 rule base 還是 ML」）做成
  自動推斷（如用字串包含 "rule base" 就判斷 `kind="rule"`）,那樣來源類型的正確性
  會依賴文案措辭,文案一改圖示就錯。`kind` 應該由呼叫端明確傳入,不是從 `source`
  字串解析出來。

#### PinButton

- **用途**：觸發打包到 case 流程的按鈕，含已打包後的鎖定狀態。
- **mockup 出處**：`.pin-btn`（L167–168 CSS，L2306 用法），已打包態見 `doPin()`
  末段（L2421–2428）。
- **Props**：
  ```ts
  type PinButtonProps = {
    disabled?: boolean; // 無權限時
    pinnedToCaseId?: string; // 有值代表已打包，顯示「✓ 已打包 → {caseId}」並鎖定
    onClick: () => void; // 開啟 CaseIdModal
  };
  ```
- **變體/狀態**：`idle`／`pinned`（鎖定，`disabled=true`，樣式變淡，對應 mockup
  L2425–2427 的 `btn.disabled = true; opacity:.55`）。
- **互動行為**：點擊觸發 `onClick`（由呼叫端開啟 `CaseIdModal`）；一旦 `pinnedToCaseId`
  有值就不可再點（mockup 明確做成不可逆——同一則回答只能打包一次）。
- **權限**：`pin.create`（WRITE，viewer 應整顆按鈕 `disabled` 或直接不渲染）。
- **a11y**：`pinned` 狀態文字變化需 `aria-live`（同其他「送出後鎖定」的按鈕模式，
  呼應 `VoteButtons`）。
- **紅線**：不適用（觸發打包的機制本身不是紅線，`PinnedCard.source` 必填才是）。
- **重用注意**：`MessageBubble` 與 `FdcFeedbackPanel` 都用這顆按鈕——兩處觸發後開啟的
  `CaseIdModal` 預填規則不同（一般 chat 訊息看 `copilotCaseId` 語境是否為空,
  FDC 固定預填目前 case），這個預填邏輯**不屬於 `PinButton`**，`PinButton` 只管
  「按下去」與「按過了就鎖住」兩件事，預填規則是呼叫端傳給 `CaseIdModal` 的
  `prefillCaseId` 決定的。

#### McpToolRow

- **用途**：課別設定頁的一列 MCP 工具引用勾選。
- **mockup 出處**：L1308–1339（含一般列、預設關列、IT 鎖定列三種）。
- **Props**：
  ```ts
  type McpToolRowProps = { tool: McpTool; onToggle: (enabled: boolean) => void }; // @/domain/settings
  ```
- **變體/狀態**：`lockedByIt` true（顯示「🔒 IT 鎖定」`Badge`，checkbox 恆 `disabled+checked`）／
  false 且 `enabled=false`（顯示「預設關」`Badge`）／false 且 `enabled=true`（一般勾選態）。
- **互動行為**：checkbox 切換觸發 `onToggle`（`lockedByIt=true` 時不綁定,
  因為連 `admin` 都不能改——見權限）。
- **權限**：`settings.toggleMcp`（ADMIN_ONLY，editor/viewer 應 disabled 但仍顯示目前狀態）；
  `lockedByIt=true` 的列額外受 `settings.toggleLockedMcp`（`NOBODY`，恆 disabled,
  這是「課別層任何人都不能改」的唯一一個 `NOBODY` capability，元件需要正確反映
  「連 admin 都不行」而不是誤用 `ADMIN_ONLY` 的邏輯讓 admin 誤以為能點)。
- **a11y**：checkbox 需正確 `<label>` 關聯到 `tool.name`；鎖定狀態需要在 checkbox
  本身之外也有文字說明（不是只靠 `disabled` 樣式,使用者需要知道「為什麼」不能改）。
- **紅線**：不適用（不是 D1 八條之一，但呼應 permission-matrix 的「兩道閘」精神——
  IT 全域白名單決定能不能用,這裡決定要不要用，`lockedByIt` 欄位就是那第一道閘的
  結構化呈現）。
- **重用注意**：**這是唯一一個 `WRITE` 角色（editor）完全不能碰的設定項**
  （對照 permission-matrix，#18 MCP 工具引用勾選是 `ADMIN_ONLY`，editor 也不行）——
  容易跟 `KmSourceRow` 的新增操作（editor 可以）搞混,實作時要小心不要複製貼上
  權限判斷時貼錯 capability 名稱。

#### ExpertTagRow

- **用途**：課別設定頁的專家標籤一列。
- **mockup 出處**：L1347–1350。
- **Props**：
  ```ts
  type ExpertTagRowProps = { expert: ExpertTag; onRemove: () => void }; // @/domain/settings
  ```
- **變體/狀態**：僅 default（`tags` 陣列可能只有一個或多個，用 `Badge` 逐一渲染）。
- **互動行為**：「移除」按鈕觸發 `onRemove`。
- **權限**：`settings.expertTags`（ADMIN_ONLY——permission-matrix C1 已明訂
  這項從 mockup 寫的「Sponsor 維護」改為 admin-only，editor 透過 grant 也不能碰這項）。
- **a11y**：「移除」按鈕需要 `aria-label="移除 {expert.name} 的專家標籤"`，
  不能只顯示「移除」兩個字（一列列相同文字的按鈕對螢幕閱讀器使用者不易分辨）。
- **紅線**：不適用。
- **重用注意**：`tags` 是自由字串陣列（`z.string().min(1)` 而非受控 enum）——
  這與 D1 #3「受控詞彙」看似矛盾，但專家標籤是「人員專長分類」不是「ML 訓練用的
  現象分類」，兩者性質不同，不需要套用受控詞彙的紀律；不要因為看到「都是標籤」
  就誤以為這裡也該做成下拉選單。

#### KmSourceRow

- **用途**：課別設定頁的 KM Domain 來源一列。
- **mockup 出處**：L1354–1355（沿用 `.file` 視覺樣式，但資料與動作不同於 `ToolFileRow`）。
- **Props**：
  ```ts
  type KmSourceRowProps = { source: KmSource; onRemove: () => void }; // @/domain/settings
  ```
- **變體/狀態**：`connected` true（顯示「● 已接」）／false（理論上型別允許,
  但 mockup 沒有展示斷線態的視覺,實作時需另外定案,不在本規格臆測）。
- **互動行為**：「移除」按鈕觸發 `onRemove`。
- **權限**：`kmSource.remove`（ADMIN_ONLY——同樣是 permission-matrix C1 的變更項,
  mockup 原寫「Sponsor 可移除」，實際改為 admin-only）。
- **a11y**：同 `ExpertTagRow`，「移除」需要可辨識的 `aria-label`。
- **紅線**：不適用。
- **重用注意**：與 `ToolFileRow` 視覺相同（都用 `.file` class）但資料型別（`KmSource`
  vs `ToolFile`）與動作（移除 vs 下載+勾選）完全不同——**故意不合併**成一個
  「檔案列」通用元件，只共用底層的 `ListRow` composite 排版，這是「看起來像同一個
  元件但其實該分開」的具體案例，見 §4。

#### DomainSourceAddForm

- **用途**：新增 KM space URL 作為 domain 來源。
- **mockup 出處**：`.src-add`（L1356–1359），行為見 `addDomainSource()`（L2364–2380）。
- **Props**：
  ```ts
  type DomainSourceAddFormProps = { onAdd: (url: string) => void };
  ```
- **變體/狀態**：僅 default；mockup 沒有展示 URL 格式驗證失敗的視覺
  （`kmSourceSchema.url` 是 `z.string().url()`，前端應該在送出前驗證，
  失敗態的具體文案本規格不臆測）。
- **互動行為**：Enter 或點擊按鈕觸發 `onAdd`（mockup L2447–2449 已綁定 Enter）。
- **權限**：`kmSource.add`（WRITE，admin/editor 皆可——這是 permission-matrix C2
  刻意保留給 editor 的低風險操作，與 `KmSourceRow` 的移除權限不同,
  兩者容易被誤用同一個 capability 檢查,要小心區分)。
- **a11y**：輸入框需要 `<label>`（mockup 只有 `placeholder`，同 `CaseIdModal` 的問題）。
- **紅線**：不適用。
- **重用注意**：新增（`kmSource.add`，WRITE）與移除（`kmSource.remove`，ADMIN_ONLY）
  刻意是兩個不同 capability 且不同角色範圍——這是 permission-matrix C2 的明確設計
  （「接來源低風險可逆，移除會影響全課 Copilot 回答品質」），`DomainSourceAddForm`
  與 `KmSourceRow` 的移除按鈕**不應該共用同一個權限檢查**。

#### SectionDosEditor

- **用途**：編輯課別 DOs（進 Agent system prompt 的規則文字）。
- **mockup 出處**：L1298–1304（`<textarea>`）。
- **Props**：
  ```ts
  type SectionDosEditorProps = { dos: string; onSave: (next: string) => void }; // SectionSettings.dos
  ```
- **變體/狀態**：唯讀（`editor`/`viewer`，顯示但 `disabled`）／可編輯（`admin`）；
  未儲存變更的視覺提示（如「有未儲存的變更」）mockup 沒有展示，本規格不臆測儲存時機
  （即時 vs 需按鈕確認，留給 A9.1 實作時定案，該任務項也提到「版本紀錄與稽核」,
  代表儲存不是簡單覆蓋,可能需要額外的送出確認 UI,不在此規格展開)。
- **互動行為**：文字編輯 + 儲存（觸發時機留待實作）。
- **權限**：`settings.editDos`（ADMIN_ONLY）。
- **a11y**：`<textarea>` 需要 `<label>`（沿用 `Zone` 的標題即可，或額外
  `aria-labelledby` 關聯到 `Zone` 的 title）。
- **紅線**：**間接關聯多條紅線**——課別 DOs 的內容（如 mockup 範例「不確定時優先建議找 PE」）
  正是把 D1 的產品紅線轉譯成 system prompt 規則的地方，但 `SectionDosEditor` 這個
  UI 元件本身只是文字編輯器，不對內容做語意檢查（不會去驗證使用者填的 DOs
  有沒有違反紅線）——這件事誠實標「不適用」，因為紅線的結構性保證應該在其他
  元件（如 `PatternTag`/`UnknownNote`）的型別層面，而不是靠課別 DOs 這段自由文字
  去約束 LLM。
- **重用注意**：這段文字最終進 LLM system prompt——理論上存在 prompt injection
  的疑慮（課別 admin 寫的 DOs 是否可能被工程師用來覆蓋系統層的安全規則？），
  這超出本文件範圍（UI 元件規格），但值得記進 Open issues 提醒後端/prompt 設計
  留意。

### 3.4 視覺化元件

#### UChartTimeline

- **用途**：90 天時序圖，含 spec 線、baseline 線、分段背景、轉折點、事件旗標。
- **mockup 出處**：L1392–1437。
- **Props**：
  ```ts
  type UChartTimelineProps = {
    analysis: UChartAnalysis; // @/domain/fdc
    onSelectSegment?: (segmentId: string) => void;
    onSelectChangepoint?: (atDay: number) => void;
  };
  ```
- **變體/狀態**：`loading`（資料抓取中，顯示 skeleton）／`default`；無 `error` 專屬視覺
  （沿用頁面層級的錯誤處理，task C2.1 統一處理，不在此圖表元件內重複實作）。
- **互動行為**：點擊轉折點/分段背景觸發對應 `onSelect*`，驅動 `SegmentCard` 高亮
  （task A5.6「點轉折點/分段 → 圖表與卡片互相高亮」，雙向聯動,
  `UChartTimeline` 也應該能接收「目前高亮哪個 segment」的 prop 反向高亮,
  本規格為求簡潔只列出事件觸發方向，反向高亮的 prop 由實作時視 ECharts 整合方式決定）。
- **權限**：`view.panes`（ALL）。
- **a11y**：圖表類元件天生對螢幕閱讀器不友善——至少需要提供一個文字摘要
  （可直接複用 `analysis.narrative`，即 `NarrativeSummary` 已經是這張圖的無障礙替代文字來源
  之一）；互動元素（轉折點）需可鍵盤觸達（ECharts 原生鍵盤支援有限，
  需要額外評估，記入 Open issues）。
- **紅線**：**承載 D1 #1（分段背景色與轉折點皆來自 `analysis.segments`/`changepoints`，
  非前端計算）、#4（`events` 事件旗標與資料線視覺分層，見 mockup 旗標畫在圖表下緣
  獨立區域，不與資料線重疊)**。
- **重用注意**：效能要求見 task A5.2（downsample + canvas，1 萬點 60fps）——
  `analysis.points` 已經是「已依 resolution 降採樣」的陣列（型別註解已說明），
  `UChartTimeline` 不需要自己做降採樣，只需要正確渲染已降採樣的資料。

#### TChartWaveform

- **用途**：單片毫秒級波形，含實際 vs 參考疊圖與異常標記。
- **mockup 出處**：L1532–1556。
- **Props**：
  ```ts
  type TChartWaveformProps = {
    analysis: TChartAnalysis; // @/domain/fdc
    activeStepId?: string; // 與 RecipeStepBar 聯動高亮
    onSelectStep: (stepId: string) => void;
  };
  ```
- **變體/狀態**：`loading`／`default`；`activeStepId` 決定哪個時間區段的背景色加深
  （對應點擊 recipe step 跳轉，mockup `tcSeg()` L1868）。
- **互動行為**：點擊波形上的時間點可反推最近的 recipe step 並觸發 `onSelectStep`
  （mockup 是反向——從色帶點擊跳轉到波形區塊，見 `RecipeStepBar`；波形本身是否也能
  反向點擊由實作時決定，mockup 未展示波形直接可點）。
- **權限**：`view.panes`（ALL）。
- **a11y**：同 `UChartTimeline`，需要文字摘要替代（`analysis.narrative`）。
- **紅線**：**承載 D1 #8（D7 決策的延伸）**——`analysis.anomalies` 是 ML kernel
  獨立產出的標記（與 `samples` 的降採樣是兩條管線，task D7），`TChartWaveform`
  的職責是把兩者在時間軸上正確疊合，**不得**因為降採樣而讓 `anomalies` 消失或錯位
  （task A6.2b 明訂的驗收標準：「時間軸對齊誤差 < 1 個顯示像素」）。
- **重用注意**：`reference`（同 recipe 正常片參考波形）與 `samples`（實際）必須用
  不同線型（mockup 用虛線 vs 實線）而非只用不同顏色——色盲使用者需要線型差異
  （呼應 task C4.1 色盲友善要求）。

#### RecipeStepBar

- **用途**：recipe step 依時長比例著色的色帶，點擊可跳轉對應段落分析。
- **mockup 出處**：L1520–1530。
- **Props**：
  ```ts
  type RecipeStepBarProps = {
    steps: readonly RecipeStep[]; // @/domain/fdc
    activeStepId?: string;
    onSelect: (stepId: string) => void;
  };
  ```
- **變體/狀態**：`verdict`（`ok`/`deviation`/`data_loss`/`unknown`）決定色塊顏色；
  `deviation`/`data_loss` 的色塊有 pulse 動畫（mockup `.rcp-step.bad`，
  L322–324 的 `pulse-bad` keyframes）提示「這裡有問題」。
- **互動行為**：點擊色塊觸發 `onSelect(stepId)`，驅動下方 `StepAnalysisCard` 捲動並高亮
  （mockup `tcSeg()`）。
- **權限**：`view.panes`（ALL）。
- **a11y**：色塊需要 `<button>` 語意（可鍵盤 tab 到每個 step 並 Enter 觸發）；
  pulse 動畫對於前庭功能敏感的使用者可能造成不適，建議尊重
  `prefers-reduced-motion`（mockup 沒有處理，這是本規格新增的要求，
  呼應 task C4.1 的 a11y 驗收範圍）。
- **紅線**：不適用（純視覺呈現既有 `verdict`，不做判斷）。
- **重用注意**：色塊寬度 = `(toSec - fromSec) / durationSec`，比例計算應該由元件內部做,
  不要要求呼叫端預先算好百分比——這是這個元件存在的價值（否則呼叫端直接用
  CSS `flex` 寫死比例，跟 mockup 現在的寫法一樣不可重用）。

#### WaferMap

- **用途**：wafer 層級空間分布圖，三種變體對應三種資料型態。
- **mockup 出處**：向量場 L738–750（Chuck A 正常）/759–769（Chuck B 異常）；
  連續熱圖 L808–828（Focus FP 的 BOWL 漸層）；hot spot 標記 L856–871（Leveling）。
- **Props**：
  ```ts
  type WaferMapProps =
    | { variant: "vector"; map: ChuckMap } // @/domain/spatial
    | { variant: "heatmap"; map: ChuckMap }
    | { variant: "hotspot"; map: ChuckMap };
  ```
- **變體/狀態**：三個 `variant` 各自對應不同的底層繪製方式（見下方技術欄）；
  `map.abnormal` 決定外框顏色（紅框異常 vs 灰框正常）。
- **互動行為**：無自身互動（純視覺呈現；mockup 沒有展示 hover 顯示數值等互動,
  若未來需要,屬於加強功能不在本規格範圍）。
- **權限**：`view.panes`（ALL）。
- **a11y**：這是本規格 a11y 最弱的一類元件——色彩編碼的空間分布本質上難以文字化,
  **最低要求**是 `map.metrics`（已結構化的量測值）必須透過旁邊的 `Metric` 元件
  同時顯示，讓看不到圖的使用者至少能讀到「|M| 5.4nm、3σ 6.8nm、邊緣 8.2nm」這類
  數字結論；色盲友善 colormap 是 task A7.4 的明確要求（連續熱圖尤其需要,
  向量場用線段角度較不受色盲影響、hot spot 需要形狀+顏色雙重編碼)。
- **紅線**：**承載 D1 #1**——`map.pattern` 型別是 `SpatialPattern` enum,
  元件不自行判斷形狀是 BOWL 還是 TILT,只負責把已判定的 pattern 對應的視覺
  （漸層/向量/熱點）畫出來。
- **重用注意**：見 Open issues——`chuckMapSchema.pattern` 目前是單一 enum,
  裝不下 mockup 展示的複合 pattern「TILT + EDGE ROLL-OFF」（L756），
  這是 task 檔已知的 D2 校正清單項目,本元件的 `variant="vector"` 實作時
  會先遇到這個限制,不是本規格新發現的問題，只是在此重申其對這個元件的直接影響。

#### SlitProfile

- **用途**：slit 內像差分布折線圖，含 spec 線與超規標記。
- **mockup 出處**：L936–951。
- **Props**：
  ```ts
  type SlitProfileProps = { analysis: SpatialAnalysis }; // indicator === "slit"
  ```
- **變體/狀態**：正常／局部超規（右側/左側惡化，對應 `metrics` 裡哪個位置的值超過
  spec，mockup 用文字顏色標紅「右 +5.8nm（超規）」）。
- **互動行為**：無。
- **權限**：`view.panes`（ALL）。
- **a11y**：折線圖同樣需要文字化的 `metrics` 陪同顯示（同 `WaferMap`）。
- **紅線**：不適用（純視覺呈現 `analysis.chucks[].metrics`，判定文字在
  `analysis.mlStatement`，本圖表不重複判斷）。
- **重用注意**：見 Open issues——slit 是聚合量測（不分 chuck），但
  `spatialAnalysisSchema.chucks` 仍強制是陣列，`SlitProfile` 目前只能取
  `analysis.chucks[0]` 或忽略後續元素，這個資料形狀上的彆扭是已知缺口
  （task D2 校正清單），不在本規格自行解決（不應該為了遷就畫面自己發明
  一個跳過 schema 的資料存取方式）。

#### FieldFocusMap

- **用途**：field 內 focus 分布疊圖（沿 scan 方向的漸層）。
- **mockup 出處**：L901–912。
- **Props**：
  ```ts
  type FieldFocusMapProps = { analysis: SpatialAnalysis }; // indicator === "field_focus"
  ```
- **變體/狀態**：正常／`REPEATING` 系統性偏差（mockup 展示的唯一範例是系統性偏差,
  正常態的視覺本規格不臆測）。
- **互動行為**：無。
- **權限**：`view.panes`（ALL）。
- **a11y**：同 `SlitProfile`，需搭配文字化 `metrics`。
- **紅線**：不適用（同 `SlitProfile`，純視覺呈現）。
- **重用注意**：與 `SlitProfile` 面臨同一個 Open issue（聚合量測 vs per-chuck schema），
  兩者可能適合共用同一個底層繪製邏輯（都是「沿一個軸的漸層/折線 + spec 線」），
  但**暫不合併成一個元件**——slit 是折線（分布沿 slit 位置），field_focus 是
  2D 漸層（沿 scan 方向的矩形疊圖），視覺呈現方式不同,合併只會讓 props
  長出一堆互斥的 optional 欄位。

#### RelationGraph

- **用途**：兩層關聯圖渲染（物理實線／經驗虛線，粗細=權重）。
- **mockup 出處**：L993–1036。
- **Props**：
  ```ts
  type RelationGraphProps = { result: GraphQueryResult; highlightNodeId?: string }; // @/domain/graph
  ```
- **變體/狀態**：`loading`／`default`；節點依 `kind`（`part`/`symptom`/`sop`）不同形狀/顏色。
- **互動行為**：點擊節點可能觸發外部的「以此節點為起點重新查詢」（mockup 沒有展示這個互動,
  目前是靜態展示一次查詢結果；若未來要支援點圖重新查詢，需要額外的
  `onNodeClick` prop，本規格先不預先加上不確定會用到的介面）。
- **權限**：`view.panes`（ALL，查詢結果本身是讀取；圖上的回饋走 `CandidateRow`
  的 `graph.vote`，不是 `RelationGraph` 這個渲染元件的權限）。
- **a11y**：Cytoscape 渲染的圖天生對螢幕閱讀器不友善，**最低要求**是
  `result.candidates`（已經結構化的候選清單，透過 `CandidateRow` 逐一渲染）
  必須作為圖的文字替代呈現一起存在，不能只有圖沒有清單（mockup 本來就是圖+清單並存,
  延續這個雙重呈現而非只做圖）。
- **紅線**：**是 D1 #7 的核心視覺實作**——實線/虛線、顏色（藍=物理/teal=經驗）、
  邊的粗細（=`edge.weight`，只有經驗邊才有）皆由 `edge.layer` 直接決定,
  元件不得把兩層邊用同一種線型繪製,那樣使用者無法分辨「物理連著」與
  「歷史一起壞過」。
- **重用注意**：`k-hop` 限制與大圖效能（task A8.8，500 節點渲染量測）是實作議題,
  不影響本規格的 props 形狀——`RelationGraph` 的 props 本身不需要知道「限制幾層」,
  那是呼叫 `queryGraph()` 時的查詢參數，不是渲染元件的職責。

#### WeightBar

- **用途**：候選零件的權重橫條。
- **mockup 出處**：`.weight-bar`/`.weight-fill`（L447–448 CSS），用法 L1045、1058、1071。
- **Props**：
  ```ts
  type WeightBarProps = { value: number; tone?: "default" | "muted" }; // value: 0–1，對應 Candidate.weight
  ```
- **變體/狀態**：`muted`（灰色，對應 👎 後權重下降且來源純物理的候選，mockup L1071
  `background:#94a3b8`）。
- **互動行為**：無（純顯示；👎 後的即時變窄動畫屬於呼叫端的樂觀更新邏輯,
  `WeightBar` 只是照 `value` 畫出對應寬度）。
- **權限**：不適用。
- **a11y**：需要 `role="progressbar"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax`,
  單純的視覺色塊寬度對螢幕閱讀器不可見。
- **紅線**：不適用（是 `CandidateRow` 承載 D1 #7，`WeightBar` 只是其中一個視覺子元件）。
- **重用注意**：這是本規格中最小的元件之一——曾考慮乾脆不獨立成元件、直接寫進
  `CandidateRow` 內部，但因為它有明確獨立的 a11y 需求（`progressbar` role）與
  數值 clamp 邏輯（`Math.min(100, ...)`/`Math.max(5, ...)`，見 mockup
  `grFb()` L1788–1791/1813–1816），獨立成元件仍值得，不算過度抽象化。

---

## 4. 反覆出現但不該做成元件的東西

- **ChamberChip（機台一覽小格內的 chamber 狀態標籤）**：只在 `ToolBrick` 內部出現一次語境
  （L513/520/527…），沒有第二個使用場景。抽出獨立元件只會多一層無意義的 props 傳遞
  （`chamber: Chamber` → 幾乎原封不動轉呈現），維持內聯在 `ToolBrick`（既有 `brick.tsx`
  已如此實作）即可。

- **`.ingested`/`.connected`/`iDo 參考 on` 這類「一小段有色文字 + on/off 判斷」**：
  這些只是文字顏色隨布林值切換，用 `Badge` 的既有 variant 或簡單的條件 class 就能表達,
  不需要各自命名一個元件（如 `IngestedLabel`/`ConnectedLabel`）——多一個元件名字
  不會讓這段邏輯更容易維護，只會讓人多記一個名字。

- **`pe-yes`/`pe-no`、`fb-y`/`fb-n`、`grFb()` 的 👍👎**：都已收斂進 `VoteButtons` composite,
  不需要再各自命名（如 `PendingEdgeVoteButtons`/`CandidateVoteButtons`）——
  它們的差異只在觸發後展開的內容（是否有修正下拉），那屬於各自 domain 元件
  （`PendingEdgeRow`/`CandidateRow`）組裝 `VoteButtons` 的責任，不是 `VoteButtons` 要分裂出變體。

- **`Sparkline`／`.pm-strip`／`.ingested`（CSS class 層級）**：`urd/tool-center-gui.html`
  的 `<style>` 區塊定義了 `.spark`/`.spark-grid`/`.spark-val`（L84–90）與 `.pm-strip`
  （L91–93），但**全檔 2453 行從未在 `<body>` 實際渲染這兩組 class**（grep 確認：
  只在 CSS 定義處出現，`<body>` 內零使用）。沒有具體渲染位置就沒有 mockup 行號可依循，
  本規格因此**不產生** `Sparkline` 的完整 spec——若之後病史分析側欄真的要加小趨勢圖,
  屆時應該重新走一次「先看清楚要放哪裡、長什麼樣」再立案，不要現在憑空補一個
  沒人 review 過的 props 介面。這點也記入 §5 Open issues。

- **深度診斷側欄的「空間 Pattern 詞彙表」與「Dual Chuck 診斷邏輯」說明文字**
  （L1255–1282）：這是一次性、單一頁面的靜態說明內容（詞彙表本身用 `PatternTag`
  逐一渲染即可，邏輯說明是純文案），沒有第二個使用場景，不值得為它包一個
  `SpatialTaxonomyLegend`/`DualChuckExplainer` 元件——那只是把文案包一層 props,
  沒有帶來重用或一致性收益，之後這段文案要改，直接改頁面內容就好。

- **各種顏色分支的小按鈕（`annot-ok`/`annot-no`、`fx-submit`/`fx-cancel`、
  `case-box` 的 `ok`/`cancel`）**：都是 `Button` primitive 的 variant 差異
  （primary/ghost），不需要各自的元件名字——如果每一組「確認/取消」按鈕都命名一次,
  這份文件會多出十幾個只有文字不同的「元件」。

- **「養肥」分頁的「本台 N 條邊／同型 M 條邊」兩行摘要**（L1210–1224）：
  視覺上沿用 `ListRow`，資料是把 `GraphEdge[]` 依 `scope` 分組計數——這個計數邏輯
  本身很簡單（`edges.filter(e => e.scope === 'this_tool').length`），不值得為它
  命名一個 `GraphScopeSummary` domain 元件，直接在頁面組裝 `ListRow` 呈現即可。

---

## 5. 建議的實作順序

依「被依賴程度」排序；標示 **▶ 阻塞** 的項目表示：不先做這個，後面列的 Stage 會卡住
（實作者現在還沒有可以用的元件詞彙）。

1. **Primitives 全部**（`Zone`／`StatusDot`／`Tag`／`Badge`／`Button`／`Callout`／
   `Metric`／`EmptyState`／`SourceCitation`／`CopyButton`）—— **▶ 阻塞所有後續 Stage**。
   這一層完全沒有 domain 知識，可以在確定 domain 型別（A1.1，已完成）之後、
   不等任何一頁定案就先做。順手把既有 `overview-pane.tsx` 內聯的 `StatusDot`
   抽出來對齊本規格（見 §3.1 重用注意）。

2. **Composites**（`ListRow`／`TwoColumnLayout`／`TabBar`／`SegmentedControl`／
   `CompareBox`／`FormField`／`VoteButtons`／`CapabilityGate`）—— **▶ 阻塞 A3 之後所有 Stage**。
   `Drawer` 與 `Modal` 例外：`Modal` 直接沿用既有 `ModalShell`（建議先做 §3.2 提到的
   `size`/`tone` 擴充），`Drawer` 只有 Copilot 一個用法，可以等到 A10 前夕再做,
   不必提前。

3. **Copilot 家族的三個「提前依賴」元件**：`AskChip`、`PinButton`、`CaseIdModal`。
   **這三個雖然表格分類在 Copilot 相關，但被 A3（當機處理）/A4（病史分析）/
   A5-A6（FDC）提前引用**（快速提問 chips、打包到 case 的 modal）——
   **▶ 阻塞 A3/A4/A5/A6**。如果照 Stage 編號直覺以為它們該等到 A10 才做,
   會讓前面四個 Stage 卡住或被迫各自土法煉鋼再回頭重構。`CopilotRail` 本體、
   `AskMenu`、`MessageBubble`、`SourceLine` 才是真正可以等到 A10 的部分。

4. **`PatternTag`／`ChronicBadge`**——被 A3（慢性徽章）、A5/A6（FDC 分段/標註）、
   A7（深度診斷）三個 Stage 共用 —— **▶ 阻塞 A3 之後的 Stage**，應與第 2 批一起做。

5. **A3 當機處理專屬**：`ToolCommandRow`、`ErrorCaseRow`、`ToolFileRow`。

6. **A4 病史分析專屬**：`PinnedCard`。

7. **A5/A6 FDC 專屬（本文件中複雜度最高的一批，含最多 D1 紅線）**：
   `NarrativeSummary`、`BaselineVerdictCard`、`SegmentCard`、`RecipeStepBar`、
   `StepAnalysisCard`、`ChainTrail`、`AnnotationForm`、`FdcFeedbackPanel`、
   `UChartTimeline`、`TChartWaveform`。建議順序：先做非圖表的卡片類
   （`SegmentCard`/`BaselineVerdictCard`/`StepAnalysisCard` 等,可以用假資料
   先把型別與紅線的結構性保證跑通），圖表類（`UChartTimeline`/`TChartWaveform`）
   放最後，因為它們的效能與互動聯動最花時間（task A5.1–A5.7、A6.1–A6.2b）。

8. **A7 深度診斷專屬**：`SpatialIndicatorTabs`、`DualChuckVerdict`、`SuspectList`、
   `FlywheelNote`、`UnknownNote`、`CrossDiagnosisPanel`、`WaferMap`（三變體）、
   `SlitProfile`、`FieldFocusMap`。`FlywheelNote`/`UnknownNote` 建議提前
   （其實它們也被 A6 的 t chart 用到，見上方第 7 點已經包含在內——這裡是提醒
   A7 不需要重做，只需要引用同一組元件）。

9. **A8 關聯圖專屬**：`CandidateRow`、`PendingEdgeRow`、`BuildStepRow`、`RelationGraph`、
   `WeightBar`。`BuildStepRow` 因缺 domain 型別（見 Open issues），建議先跟後端/
   task 負責人確認型別形狀再動工，避免用暫定的 `ReactNode` props 寫完後大改。

10. **A9 課別設定專屬**：`McpToolRow`、`ExpertTagRow`、`KmSourceRow`、
    `DomainSourceAddForm`、`SectionDosEditor`。這批彼此依賴度低，可平行進行,
    也可以跟 A3–A8 平行做（不依賴其他 Stage 的元件）。

11. **A10 Copilot 專屬（第 3 點已提前做掉的部分除外）**：`CopilotRail`、`AskMenu`、
    `MessageBubble`、`SourceLine`。這批應該是全部畫面 spec 完成後最後收尾的部分,
    因為 `MessageBubble` 的 `content` props 形狀高度依賴尚未定案的 `CopilotMessage`
    型別（見 Open issues），過早鎖定容易被迫大改。

---

## Open issues

（依對型別設計的影響程度排序；每項標明缺什麼、卡住哪個元件。）

- **`CopilotMessage` 型別缺失**（task 檔已明確標註延後到 A10）。`MessageBubble`／
  `AskMenu`／`CopilotRail` 目前只能用暫定形狀（`role`/`content: ReactNode`/`source?`）
  頂著，A10 定案「結構化 blocks + sanitize」（text／來源引用／數據表／動作列）後,
  這三個元件的 props 都需要回頭校正，`content` 應該從 `ReactNode` 改成
  `readonly MessageBlock[]` 之類的結構化型別，否則 XSS sanitize 無法在型別層面被檢查。

- **FDC 回饋 payload 無 domain schema**。`fdc.feedbackVote`／`fdc.feedbackForm` 兩個
  capability 在 `permission.ts` 已存在，但 `domain/fdc.ts` 沒有對應的「回饋內容」型別
  （四種問題分類：轉折點/pattern/baseline/總結，各自的正確答案欄位）。
  `FdcFeedbackPanel` 目前 `onSubmitCorrection` 的 `payload` 只能是 `unknown`。

- **t chart 標註 payload 無 domain schema**。`tchart.annotate` capability 已存在,
  但沒有一個「使用者標註」型別（現象分類、懷疑零件、補充說明三欄）可供 zod 驗證。
  `AnnotationForm` 的 `onSubmit` payload 是本規格暫定的形狀,非引用既有型別。
  另外，「現象分類」下拉的五個選項（mockup L1622–1626：感測器 data loss／通訊丟包／
  真實壓力擾動／recipe step 邊界對錯／其他）目前是 mockup 寫死的中文,
  尚未進入 `domain/taxonomy.ts` 的受控詞彙表——若這組分類要跟 FDC 回饋表單的分類
  一樣受控管理，建議補一組 `ANNOTATION_KINDS` 常數。

- **建圖步驟（BuildStep）無 domain schema**。`domain/graph.ts` 沒有描述「Agent 解析進度」
  的型別（來源文件、抽出條數、信心分佈、已完成/待人補完狀態）。`BuildStepRow` 的
  `description`/`confidenceCounts` 目前只能用自由 `ReactNode`/物件頂著，
  無法做 zod 驗證，也無法被 `DataSource` 型別化地回傳。

- **`chuckMapSchema.pattern` 是單一 enum，裝不下複合 pattern**（如 mockup L756
  「TILT + EDGE ROLL-OFF」）。此為 task 檔 D2 校正清單已知項目,本文件的
  `WaferMap`／`DualChuckVerdict` 沿用同一限制,待真實 API sample 到手後一併校正。

- **Leveling 的 hot spot 在空間 taxonomy 沒有對應 code**（同上，task 檔已知缺口）。
  `WaferMap(variant="hotspot")` 目前無法透過 `PatternTag` 標示「這是 hot spot」,
  只能靠 `map.metrics` 裡的座標/數值呈現,缺一個結構化的 pattern 值。

- **`field_focus`／`slit` 是聚合量測，但 schema 仍強制兩個 chuck**（同上，task 檔已知缺口）。
  `FieldFocusMap`／`SlitProfile` 的 props 目前遷就 schema 傳一份 `SpatialAnalysis`
  但實際只會用到 `chucks[0]`，需要在型別上澄清「是否該允許單一量測」而不是強制陣列。

- **Sparkline 相關 CSS 為死碼**。`.spark`／`.spark-grid`／`.spark-val`／`.pm-strip`／
  `.ingested` 在 `<style>` 定義但整份 mockup 從未渲染（見 §4）。若這是被砍掉的舊功能
  殘留還是尚未畫出來的未來功能,建議跟 mockup 作者確認,免得後續頁面 spec 誤以為
  這是「已設計但本文件漏掉」的元件。

- **課別 DOs 的內容安全性**（`SectionDosEditor`）。課別 admin 填寫的自由文字會直接進
  Agent system prompt，理論上存在被工程師用來覆蓋系統層規則（如 D1 紅線）的
  prompt injection 疑慮。這超出 UI 元件規格範圍，但建議後端/prompt 設計階段
  將 D1 紅線做成不受課別 DOs 影響的系統層規則，而非僅靠 system prompt 疊加順序。
