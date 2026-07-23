# 權限矩陣

Status: draft (2026-07-24) — 依 2026-07-24 需求確認產出，待 review

## 核心模型

**角色是相對於課別計算出來的，不是使用者的全域屬性。**

```ts
type Role = 'admin' | 'editor' | 'viewer'

function resolveRole(user: User, sectionId: SectionId, grants: Grant[]): Role {
  if (user.managerOf.includes(sectionId)) return 'admin'   // 該課別的 manager
  if (user.sectionId === sectionId)       return 'editor'  // 該課別的工程師
  if (hasActiveGrant(grants, user.id, sectionId, 'editor')) return 'editor'  // admin 授予
  return 'viewer'                                          // 其他
}
```

多數人的角色由課別推導，**但 admin 可以額外授予課外人員 editor 權限**（sponsor、支援工程師、
PE 等）。授權是課別自治的行為，在課別設定頁操作（#23），不是 IT 的全域使用者管理。

```ts
type Grant = {
  userId: UserId
  sectionId: SectionId
  role: 'editor'          // 目前只授予 editor；需要 admin 權限請 IT 改 managerOf
  grantedBy: UserId       // 稽核用
  grantedAt: Date
  expiresAt: Date | null  // null = 長期；支援情境可設時效
}
```

同一位使用者在 LITHO-02 是 admin，切到 ETCH-01 就是 viewer。所有權限判定都必須帶
`sectionId`，**任何不帶 section 的權限檢查都是 bug**。

### 能不能進入該課別（先於角色判定）

`user.supportSections` 控制跨課進入權。沒有支援權限 → 課別選單該項 disabled，
server 端直接 403（mockup L463–466 的行為，但要在 server 強制，不能只有前端 disabled）。

進入後角色一律 `viewer`。

---

## 矩陣

✓ 可以　✗ 不可以　◐ 限本人

| # | 功能 | admin | editor | viewer | 來源 |
|---|---|:---:|:---:|:---:|---|
| **檢視** |
| 1 | 機台一覽／當機處理／病史分析／深度診斷 | ✓ | ✓ | ✓ | — |
| 2 | 機台抓回檔案 下載 | ✓ | ✓ | ✓ | L615 |
| 3 | Copilot 提問 | ✓ | ✓ | ✓ | 唯讀不代表不能問 |
| **當機處理** |
| 4 | 新增／編輯 Tool Command | ✓ | ✓ | **✓** | L576、部分放行（見下） |
| 5 | 「iDo 參考」勾選（影響 Copilot 行為） | ✓ | ✓ | ✗ | L616 |
| 6 | 驗屍打包案例 | ✓ | ✓ | ✗ | L602 |
| **病史分析** |
| 7 | 打包 Copilot 回答到 case | ✓ | ✓ | ✗ | L2306 |
| 8 | 編輯卡片標題 | ✓ | ◐ | ✗ | L2405 |
| 9 | **晉升為「課級 common」** | ✓ | ✗ | ✗ | L681 |
| **FDC 分析** |
| 10 | 👍👎 判讀回饋 | ✓ | ✓ | ✗ | L1677 |
| 11 | 受控回饋表單（轉折點／pattern／baseline／總結） | ✓ | ✓ | ✗ | L1684 |
| 12 | t chart 逐段標註（寫入 KM，全課可見） | ✓ | ✓ | ✗ | L1646 |
| **關聯圖** |
| 13 | 候選零件 👍👎 與修正 | ✓ | ✓ | ✗ | L1048 |
| 14 | 待確認低信心邊 確認／刪除 | ✓ | ✓ | ✗ | L1137 |
| 15 | 手動新增節點／邊 | ✓ | ✓ | ✗ | L1158 |
| **課別設定** |
| 16 | 進入設定頁 | ✓ | 唯讀 | 唯讀 | L467 |
| 17 | 編輯課別 DOs（進 system prompt） | ✓ | ✗ | ✗ | L1299 |
| 18 | MCP 工具引用勾選 | ✓ | ✗ | ✗ | L1307 |
| 19 | IT 鎖定的 MCP 項目 | ✗ | ✗ | ✗ | L1334 IT 全域，課別不可改 |
| 20 | 專家標籤 新增／移除 | ✓ | ✗ | ✗ | ⚠ 見變更 C1 |
| 21 | KM Domain 來源 新增 | ✓ | ✓ | ✗ | L1353 |
| 22 | KM Domain 來源 移除 | ✓ | ✗ | ✗ | ⚠ 見變更 C1 |
| 23 | **授予／撤銷課內 editor 權限** | ✓ | ✗ | ✗ | Q11 grant 機制 |

---

## 與 mockup 的變更（已拍板 2026-07-24）

- **C1 — mockup 寫「Sponsor 維護」的兩項改由該課 admin。**
  L1346「專家標籤 · Sponsor 維護」、L1353「Sponsor 可移除 KM 來源」。
  Sponsor 若需要寫入權，走 **grant 機制**（#23）由 admin 授予 editor——但 editor 仍不能改
  #20 專家標籤與 #22 KM 移除，那兩項是 admin-only。
  若 sponsor 真的需要那兩項，請 IT 把他加進該課 `managerOf`（等於給 admin），
  不透過 grant——**grant 只授予 editor，不授予 admin**，避免權限升級路徑失控。

- **C2 — 「課內工程師可接 KM 來源」保留給 editor（#21），移除權收回 admin（#22）。**
  接來源低風險可逆，移除會影響全課 Copilot 回答品質。

- **C3 — viewer 可下 Tool Command（#4）。「部分放行」已拍板。**
  跨課支援的工程師是 viewer，但當機現場必須能下「wait particle result」這類註解。
  放行界線：**Tool Command 可以，標註／回饋不行。**
  兩類寫入性質不同——Tool Command 是人下的註解，有作者欄位、可追溯、錯了好改；
  標註與回饋會進 KM 與 ML training queue，讓不熟該台機的人寫入，飛輪會學到雜訊。
  支援者若需要完整寫入權，由該課 admin 用 grant 授予（可設 `expiresAt`）。

---

## 實作要求

- `resolveRole()` 是唯一的角色判定入口，**前後端共用同一份邏輯與矩陣表**。
- 矩陣以資料結構表達（`Record<Capability, Role[]>`），不得散落在元件的 if-else 裡。
- 每一列都要有對應的測試：三種角色 × 23 項功能 = 69 個斷言，全部跑過才算通過。
- Grant 需額外測試：授予後升 editor、撤銷後降回 viewer、`expiresAt` 過期後自動失效。
- 前端 gating 只是 UX；**每一個寫入端點都必須在 server 端重驗**（Next middleware + Server Action 內層）。
