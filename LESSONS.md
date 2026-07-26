# LESSONS.md

累積跨任務的教訓。每則記「發生什麼、為什麼、正確作法是什麼」，不記事件流水帳。

## A1.7 i18n 第三輪（H1–H9）

### 1. 加 lint 規則時，驗收樣本必須覆蓋全部既有形態，不是只覆蓋新增形態

第二輪（G4）在 `eslint.config.mjs` 加了一個新的 `no-restricted-syntax` 選擇器
（`Property > Literal[...]`，攔 `export const X = { a: "中文" }` 這種常數文案表），
放進一個 `files: ["src/lib/**", "src/components/**"]` 的新 config 物件。但這個
`files` 集合跟前一個 config 物件（`files: ["src/**"]`，放原本 5 條 JSX 硬寫中文
選擇器）有重疊，而 ESLint flat config 的語意是：同一個 rule key
（`no-restricted-syntax`）在兩個有重疊 `files` 的物件裡各自設一次陣列時，後面
那個物件的陣列會**整組取代**前面那個，不是合併、也不是串接。結果是
`src/components/**`／`src/lib/**` 底下，**原有的 5 條 JSX 選擇器全被蓋掉**，
只剩新加的第 6 條 Property 選擇器生效——而 `pnpm lint` 全程維持 exit 0，
四道驗收 gate 全綠，完全沒有訊號提示這件事發生了。
（事發當時是 5 條全被蓋掉；H1 修復後把選擇器抽成共用常數陣列，若後續有其他
agent 為精簡而刪除冗餘 selector（5 條變 4 條），這裡描述的是**事發當時**的
狀態，不回頭改寫歷史。）

根因不是程式碼寫錯，是**驗收方法的盲點**：前一位作者只針對新加的 Property
規則本身寫了違規樣本（`export const X = { a: "當機處理" }`）確認 eslint 會報錯，
確認完就宣告這一項修完，從頭到尾沒有另外驗證「這個改動有沒有影響到同一批
`files` 底下原本就存在的其他規則」。

**正確作法**：任何一次「新增／修改 lint 規則」的改動，驗收樣本必須覆蓋
**該規則所在 config 物件的 `files` 範圍內、所有目前有效的既有規則形態**，
不能只覆蓋這次新增／修改的那一種形態。具體到 flat config：一旦要在 `files`
有重疊的兩個物件之間動同一個 rule key，就要先假設「後面會整組取代前面」，
主動去抽共用常數或合併陣列，而不是分別在兩個物件裡各寫一份字面陣列，
然後只測新的那份。

### 2. 當驗收條件與文件散文碰撞時，改條件不改文件

第二輪任務檔（`docs/tasks/20260724-tool-center-gui.md`）的驗收條件之一是
`git diff | grep -i "eslint-disable"` 應該沒有輸出（用來確認沒有新增
`eslint-disable` 規避 lint）。但任務文件自己的散文裡，原本可能會寫出
「沒有新增 eslint-disable」這種帶有 `eslint-disable` 字面字串的句子，這句話
本身就會被同一條 grep 命中，造成 false positive。前一位作者的處理方式是
把**文件散文**改寫成「沒有靠新增停用 lint 規則的註解換來這個 0」，刻意迴避
`eslint-disable` 這個字面字串，讓 grep 通過——見
`docs/tasks/20260724-tool-center-gui.md` 第二輪、第三輪 A1.7 條目裡「沒有靠
新增停用 lint 規則的註解」這句用詞。

這次的淨結果沒有造成實質錯誤（真的沒有新增 `eslint-disable`），但做法本身是
錯的：**驗收條件本來就該只掃程式碼，不該連文件散文一起掃**——`grep -i
"eslint-disable"` 沒有限定路徑，任務文件裡合法地討論／記錄「這次沒有用
eslint-disable」時，字面字串本來就會出現在文件裡，這是文件的正常內容，不是
需要迴避的東西。用「改寫文件迴避 grep」而不是「收斂 grep 的掃描範圍」來解決
這個衝突，副作用是把 `eslint-disable` 這個關鍵字從可搜尋的任務記錄裡抹掉了，
未來要用關鍵字回溯這段歷史（例如稽核「這個專案有沒有用過 eslint-disable」）
會因為關鍵字被刻意迴避而搜不到。

**正確作法**：驗收條件本身要收斂範圍，例如改成
`git diff -- src/ eslint.config.mjs | grep -i eslint-disable`（只掃程式碼，
不掃 `docs/`），而不是反過來要求文件散文避開某個字面字串。條件跟文件散文
衝突時，優先假設是條件本身的掃描範圍設計得不夠精準，先檢查能不能收斂條件；
只有在條件範圍已經合理、文件內容確實不該出現該字串（例如文件裡真的貼了一段
待移除的程式碼片段）時，才去動文件。

## 課別身分改用課代碼（R1–R5）與相關驗收

### 1. 驗收條件要錨定到「被證明的對象」，不是文字出現與否

`grep -rln "use client" src/` 這種寫法把「檔案第一行有 directive」與「這個字串出現在檔案任何位置
（含註解、字串常量、測試描述）」混為一談。後果是雙向都會錯：多寫一句提到這個詞的註解會多算一個
client 元件；反過來把某個檔案真的拿掉 directive 也不會被抓到。
本任務鏈**三次**撞上這個坑（三次都是 agent 為了讓條件通過而改寫註解措辭，三次都有揭露、
三次判定可接受，但問題其實在條件寫法）。
錨定寫法：
```
for f in $(find src -name "*.tsx" -not -name "*.test.tsx"); do
  head -1 "$f" | grep -qx '"use client";' && echo "$f"
done
```

### 2. 查洩漏要窮舉型別欄位，不要挑「看起來敏感」的

`"use client"` 的元件 import 了 data-layer 模組，把整份機台屬性 fixture 打進瀏覽器 bundle
（內部 IP、PE/EE 姓名、vendor、TAP/TCS 版本）。四道 gate 全綠、`grep "use client"` 無變化，
**沒有任何訊號**——因為它是「只看那一行 import 看不出來」的類型，只能在 build 產物上驗。
修完驗證時，作者挑了「看起來最敏感」的幾個欄位去 grep；reviewer 回頭窮舉
`ToolAttributes` 的 12 個欄位，補查 `sponsor`／`vendor` 才確認乾淨。
結果安全是**幸運，不是窮舉保證**。
規則：(1) client 元件一律不 import data layer，資料由 Server Component 以 prop 傳入；
(2) 驗洩漏要在 build 產物上 grep，且**必須有對照組**（確認 grep 抓得到一個該命中的字串），
否則「全部無命中」可能只是路徑打錯；(3) 要查的欄位清單從型別定義窮舉，不要憑感覺挑。

### 3. 改故障模式前先算爆炸半徑

`listGrants` 原本 `filter(g => g.sectionId === code)`，上游若回課名會**靜默回空陣列**
（權限無聲降級）。改成對每筆套會 `throw` 的正規化函式後，故障從「靜默」變「可見」——
但因為 `.filter()` 對**每一筆**無差別呼叫，**任何一筆**壞資料都會讓 `listGrants(任何課別)` 整個拋例外。
爆炸半徑從「單筆查詢靜默失敗」放大成「全域授權查詢不可用」。
這是換了一種故障模式，不是單純改善。改故障模式時要同時問：新的失敗會影響多大範圍？
