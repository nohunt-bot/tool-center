# 0001 — 前端技術選型

Status: accepted (2026-07-24)
Context: `urd/tool-center-gui.html` 單檔 mockup → 正式 Tool Center 前端

## 決策

**Next.js 16 (App Router) + React 19 + TypeScript strict，Node runtime 部署。**

## 背景

Tool Center 是 Fab 內網的設備 AI 助理：重互動的工作站型 UI、登入後才可見、
零 SEO 需求、資料來自既有的 FDC／SPC／MES／KM／Case DB／MCP gateway。

## 考慮過的選項

### A. Vite + React SPA（原始推薦，未採用）

- ＋ 產物是純靜態檔，內網 nginx 直接放，無 Node runtime 依賴，IT 過審最容易
- ＋ 無 SSR 心智負擔
- － 無 server 能力：LLM token 只能放瀏覽器或另開 gateway；權限只能前端 gating
- － FDC 分析視窗要自己做 URL 狀態管理

### B. Next.js App Router + Node runtime（**採用**）

- ＋ **Intercepting + Parallel Routes**：FDC 分析視窗有自己的 URL，
  從頁面點開是覆蓋層、直接開連結是完整頁面——直接滿足「晨會貼連結給同事」
- ＋ **Route Handler SSE**：Copilot streaming，LLM token 留在 server
- ＋ **Middleware**：課別權限在 server 邊界擋掉，不只是前端 `disabled`
- ＋ **Server Actions + `useOptimistic`**：打包／標註／回饋的樂觀更新不用手刻
- ＋ `next/font/local`：內網零外部資源請求
- － 需要常駐 Node runtime（`output: 'standalone'` + Docker）
- － server/client 邊界的心智成本

### C. Next.js static export（未採用）

付了框架複雜度卻拿不到 server 能力，是三者中最差的組合。

## 決策理由

選 B 的關鍵是**這個 app 需要 server 能力**：LLM token 不能進瀏覽器、權限必須在 server 強制、
FDC 視窗需要可分享的 URL。A 要達到同樣效果得另開一個 gateway 服務，等於把 B 的東西拆成兩個部署單元。

## 版本與 runtime

- Next **16.2.11**（Node engine `>=20.9.0`）、React 19、TypeScript 5 strict
- 本機開發：Node 20.20.0（現有環境，符合要求）
- **部署 image：Node 22 LTS**。Node 20 的 LTS maintenance 已於 2026-04 結束，
  內網部署不應跑 EOL runtime。

## 配套選型

| 層 | 選擇 | 理由 |
|---|---|---|
| 路由 | Next App Router | mode／機台／FDC 視窗／locale 全部進 URL |
| Server state | TanStack Query | client 端輪詢（alarm／status 30s）；初始資料走 RSC |
| Client state | Zustand | rail 開關、選中 chuck／segment、回饋草稿 |
| Styling | Tailwind v4 + CSS variables | mockup L8–12 已是 design token，直接映射 |
| 元件基礎 | shadcn/ui (Radix) | Dialog／Select／Tabs 的 focus trap 與鍵盤操作 |
| 時序圖（u/t chart） | ECharts | markLine／markArea／brush／dataZoom 原生支援，canvas 效能 |
| Wafer map | 自繪 Canvas | 向量場／熱圖／hot spot 非通用圖表 |
| 關聯圖 | Cytoscape.js (fcose) | k-hop 展開、大圖收斂 |
| 表單 | react-hook-form + zod | zod schema 即受控 taxonomy 的單一真相來源 |
| i18n | next-intl | 架構做滿，`en` 訊息檔留空 fallback（見 task D9） |
| 測試 | Vitest + RTL + Playwright | — |
| Mock | fixtures 層（MSW 僅用於測試） | Stage A/B 的接縫是 `DataSource` 介面，不是 HTTP 攔截 |

## 後果

- 交付物從「一包靜態檔」變成「一個容器」，部署複雜度上升，需與 IT 確認內網容器平台。
- `src/data/DataSource` 介面成為 Stage A（fixtures）→ Stage B（既有 API）的唯一接縫，
  這條線斷了，Stage A 就是拋棄式工作。
