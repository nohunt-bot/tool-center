import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { fixturesDataSource } from "@/data/fixtures";
import { routing } from "./routing";
import zhTW from "../../messages/zh-TW.json";

/**
 * 缺鍵 fallback 到 zh-TW（使用者決定：架構做滿、en 訊息檔留空，翻譯留到真的需要時再補）。
 *
 * 做法：一律以 zh-TW 當基底，locale 自己的訊息物件遞迴蓋在上面。
 * en.json 現在是 {}，蓋出來的結果等於 zh-TW——不會有缺鍵、t() 不會丟例外、
 * console 也不會有 next-intl 的 MISSING_MESSAGE 警告。之後要補英文，
 * 只要在 en.json 填對應的鍵，deepMerge 會自動讓「有翻的用英文、沒翻的用中文」逐鍵成立。
 */
/**
 * 陣列策略：整個取代，不逐項合併／串接（見下方 isPlainObject 判斷——陣列一律
 * 落到 else 分支，直接 result[key] = overrideValue）。
 *
 * 理由：messages 檔目前沒有陣列型別的內容（訊息鍵值不是 string 就是巢狀 object），
 * 陣列只可能是「以後有人手滑放進去」的例外狀況。這種情況下「整個取代」比「逐項合併」
 * 更符合直覺——override 出現陣列就是要蓋掉 base，逐項合併反而會讓 base 的舊資料
 * 殘留在合併結果裡，靜靜地製造出使用者沒預期的「半中半英」陣列。
 * type 衝突（例如 base 是 object、override 是 string，或反過來）也走同一條路徑，
 * 一律以 override 整個蓋過 base——deepMerge 只在雙方都是 plain object 時才遞迴，
 * 其餘情況都是「override 說了算」。
 *
 * 匯出（export）只是為了讓 deepMerge 能被單元測試直接呼叫，不影響執行期行為。
 */
export function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  // H4 修復：只有 "__proto__" 在物件字面值／屬性賦值語法裡有特殊的「設定原型」
  // 語意（`result[key] = ...` 若 key 是 "__proto__" 字串，會觸發
  // Object.prototype 的 __proto__ setter，換掉 result 的原型）。
  // "constructor"／"prototype" 只是普通的 own key，`result[key] = ...`
  // 對它們就是一般屬性賦值，不會有任何原型污染效果——舊版把這兩個也當危險
  // key 一併跳過，後果是：如果訊息檔真的用 "constructor" 或 "prototype"
  // 當作一般文案鍵（例如 `{ constructor: "中文" }`），override 對它的覆寫
  // 會被 silently 丟掉（deepMerge({constructor: "中文"}, {constructor: "EN"})
  // 會回傳中文而不是 "EN"，override 悄悄失效）。修法：只特判 "__proto__"。
  //
  // 這裡刻意「不」改用 `Object.create(null)` 當 result 的 base：雖然那樣可以讓
  // "__proto__" 賦值天生就不是 accessor（沒有 Object.prototype 可觸發），
  // 但既有測試（見 request.test.ts「__proto__ key」那個 it）明確斷言
  // `Object.getPrototypeOf(result)` 要等於 `Object.prototype`——也就是「合併
  // 結果仍是一個普通物件，原型沒被動過手腳」，換成 `Object.create(null)`
  // 會讓這個斷言變成「原型是 null」而炸掉，等於用另一種方式改變了合約。
  // 取捨：改用 `result[key] = value` 前先擋掉 "__proto__" 這個 key 字串本身，
  // 跟 `Object.defineProperty(result, key, { value, enumerable: true,
  // ... })` 效果相同（both 都是「這個 key 不會被特殊解讀成 setter」），
  // 但不用額外重寫每個 key 的屬性描述子，程式碼維持原本的直接賦值寫法，
  // 也維持既有測試對「result 是普通物件」的假設。
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    if (key === "__proto__") continue;
    const baseValue = base[key];
    const overrideValue = override[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * R7（`docs/decisions/0002-route-and-locale.md`）：`localePrefix: "never"`
 * 之後 URL 不帶語系段，next-intl 原本靠 `requestLocale`（從 cookie
 * `NEXT_LOCALE` 或 `Accept-Language` 協商出來的值）決定 locale 的機制不再
 * 是權威——這裡改成問「目前登入者」的語系（`User.locale`），cookie 至多
 * 只能當這個瀏覽器上次看到的語系快取，不能拿來決定畫面語系（那樣等於繞一圈
 * 回到 URL/瀏覽器狀態當真相來源，R7 明確要拔除的就是這件事）。
 *
 * 現階段沒有真實的「目前登入者」API，直接呼叫 `fixturesDataSource.getCurrentUser()`。
 * Stage B 接真實 API 時，這裡改成呼叫真正的使用者資料端點取代
 * `fixturesDataSource.getCurrentUser()`——回傳形狀一樣是帶 `locale` 欄位的
 * `User`，這個函式本身的邏輯（`hasLocale` 防呆＋deepMerge 訊息合併）不用改。
 *
 * P4(a) 成本備忘（現在不實作，Stage A fixtures 呼叫零成本，先留紀錄）：
 * `getRequestConfig()` 每個 request 都會重跑一次（含每次 RSC navigation，
 * 不只是整頁重新整理）——Stage A 這裡是同步查記憶體 fixture，沒有實際成本，
 * 但 Stage B 換成真實 API 後，`getCurrentUser()` 會變成一次真正的網路往返，
 * 每次導覽多打一次使用者 API 是不可接受的（一次 SPA 內的分頁切換不該疊加
 * 出等同於整頁重新整理的延遲）。屆時必須在這裡（或更上層）加上請求層級的
 * 快取／memoization（例如 React `cache()`，讓同一個 request 內的多次呼叫
 * 共用一次結果；跨 request 的快取策略——TTL、失效時機——需要另外設計，
 * 不是這裡幾行就能決定的）。
 *
 * P4(b) 失敗降級（**這裡現在就做**）：`getCurrentUser()`
 * 若直接 throw 且沒人接住，`getRequestConfig()` 會跟著整個 throw，
 * next-intl 沒有這個 request 的 locale/messages 可用，等於整站沒有畫面
 * （單一使用者資料源失敗，卻讓所有人都看不到任何頁面，是不成比例的單點
 * 故障半徑）。這裡用 try/catch 接住任何失敗，降級到 `routing.defaultLocale`
 * （而不是導向某個特定使用者的語系猜測）——寧可用預設語系把頁面撐起來，
 * 也不要讓一次使用者資料查詢失敗拖垮整站。
 */
export default getRequestConfig(async () => {
  let userLocale: string = routing.defaultLocale;
  try {
    const user = await fixturesDataSource.getCurrentUser();
    userLocale = user.locale;
  } catch {
    // 降級：拿不到目前登入者（Stage B 之後可能是逾時／5xx／網路中斷）時，
    // 用預設語系撐住畫面，不讓整站因為這一次查詢失敗而完全沒有輸出。
    userLocale = routing.defaultLocale;
  }
  const locale = hasLocale(routing.locales, userLocale) ? userLocale : routing.defaultLocale;

  const messages =
    locale === "zh-TW"
      ? zhTW
      : deepMerge(zhTW, ((await import(`../../messages/${locale}.json`)) as { default: object })
          .default as Record<string, unknown>);

  return { locale, messages };
});
