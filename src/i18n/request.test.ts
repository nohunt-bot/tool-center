import { describe, expect, it, vi } from "vitest";

// getRequestConfig 本質上是 identity（`(fn) => fn`，見 next-intl 的型別定義：
// `export default function getRequestConfig(createRequestConfig): (params) => ...`）。
// 但 "next-intl/server" 在缺 "react-server" package export condition 的環境
// （Vitest/jsdom）下，每個匯出都是丟「not supported in Client Components」的
// stub（包含 getRequestConfig 本身——它回傳的函式才是真正的 thrower，呼叫
// getRequestConfig(fn) 不會立刻炸，但呼叫它回傳的那個函式會）。用 identity
// 頂替，讓 request.ts 的 default export 在測試裡能被真的呼叫到——這是跟
// overview-pane.test.tsx 對 getTranslations 用的同一招，只是換一個匯出。
vi.mock("next-intl/server", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl/server")>();
  return { ...original, getRequestConfig: (fn: unknown) => fn };
});

// 只 mock en.json 的內容，不改真正的檔案（使用者明確要求 en.json 不塞 sentinel
// 鍵）——這樣才能驗證「合成的 override 訊息物件」真的會被 request.ts 的
// 實際組態路徑（locale 判斷 + 動態 import + deepMerge）吃進去、蓋過 zh-TW，
// 而不是只測 deepMerge 這個純函式本身（上面幾個 it 已經測過那部分）。
vi.mock("../../messages/en.json", () => ({
  default: { shell: { appName: "Synthetic EN" } },
}));

const requestModule = await import("./request");
const { deepMerge } = requestModule;
const requestConfig = requestModule.default as (params: {
  requestLocale: Promise<string | undefined>;
}) => Promise<{ locale: string; messages: unknown }>;

/**
 * deepMerge 是 src/i18n/request.ts 缺鍵 fallback 機制的核心（zh-TW 當 base，
 * 其他 locale 疊上去），但先前完全沒有單元測試（reviewer FIX-FIRST F3）。
 * 這裡涵蓋：巢狀部分覆寫、陣列策略（整個取代，理由見 request.ts 的註解）、
 * string 對 object 的型別衝突、空 override。
 */
describe("deepMerge", () => {
  it("巢狀物件：override 只蓋到有寫的鍵，其餘保留 base 的值", () => {
    const base = {
      shell: { appName: "Tool Center", tagline: "Fab1 · 設備 AI 助理" },
      overview: { header: "{sectionName} · {count} 台" },
    };
    const override = {
      shell: { appName: "Tool Center EN" },
    };

    expect(deepMerge(base, override)).toEqual({
      shell: { appName: "Tool Center EN", tagline: "Fab1 · 設備 AI 助理" },
      overview: { header: "{sectionName} · {count} 台" },
    });
  });

  it("陣列：override 的陣列整個取代 base 的陣列，不逐項合併", () => {
    const base = { list: { items: ["a", "b", "c"] } };
    const override = { list: { items: ["x"] } };

    expect(deepMerge(base, override)).toEqual({ list: { items: ["x"] } });
  });

  it("型別衝突：base 是 object、override 是 string 時，override 整個蓋過去", () => {
    const base = { node: { nested: "value" } };
    const override = { node: "just a string now" };

    expect(deepMerge(base, override)).toEqual({ node: "just a string now" });
  });

  it("型別衝突（反過來）：base 是 string、override 是 object 時，override 整個蓋過去", () => {
    const base = { node: "just a string" };
    const override = { node: { nested: "value" } };

    expect(deepMerge(base, override)).toEqual({ node: { nested: "value" } });
  });

  it("空 override：回傳內容與 base 相等（deep equal），且不是同一個物件參照", () => {
    const base = { shell: { appName: "Tool Center" } };
    const result = deepMerge(base, {});

    expect(result).toEqual(base);
    expect(result).not.toBe(base);
  });

  it("__proto__ key：不觸發 Object.prototype 的 setter，不污染 result 的原型", () => {
    // 一定要用 JSON.parse 產生這個 key——物件字面值寫 `{ __proto__: {...} }`
    // 是「設定這個物件的原型」的語法糖，走的是完全不同的語意，不會把
    // "__proto__" 放進 override 自身的 own keys，測不到這裡要擋的東西。
    // JSON.parse 產生的 "__proto__" 才是一個貨真價實的 own enumerable key，
    // Object.keys(override) 才會列出它、for..of 才會走進 result[key] = ... 這一步。
    const base: Record<string, unknown> = { shell: { appName: "Tool Center" } };
    const override = JSON.parse('{"__proto__":{"polluted":1}}') as Record<string, unknown>;

    const result = deepMerge(base, override);

    expect(result).toEqual(base);
    // 沒擋掉 __proto__ 的版本：result["__proto__"] = { polluted: 1 } 會觸發
    // Object.prototype 的 __proto__ setter，把 result 自己的 [[Prototype]]
    // 換成 { polluted: 1}——這條會抓到那個變化（原型仍是 Object.prototype）。
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    // 原型被換掉之後，result.polluted 會透過原型鏈解析成 1；擋掉 key 之後
    // 兩者都不成立，這裡直接斷言解析不到。
    expect((result as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("H4：\"constructor\" 當一般文案鍵時，override 要蓋過 base，不能被當成危險 key 跳過", () => {
    // 舊版把 "__proto__"／"constructor"／"prototype" 三個 key 一律跳過，
    // 但 "constructor" 用一般物件字面值寫（不是 JSON.parse 產生的 own key
    // 特例）就只是個普通 own key，`result[key] = value` 對它是一般屬性賦值，
    // 不會有任何原型污染效果。修法後只特判 "__proto__"，所以這裡的 override
    // 應該正常蓋過 base，不該被靜靜丟掉。
    const base = { constructor: "中文" };
    const override = { constructor: "EN" };

    const result = deepMerge(base, override);

    expect(result.constructor).toBe("EN");
  });

  it("H4：\"prototype\" 當一般文案鍵時，override 也要蓋過 base", () => {
    const base = { prototype: "中文" };
    const override = { prototype: "EN" };

    const result = deepMerge(base, override);

    expect(result.prototype).toBe("EN");
  });
});

/**
 * G8 已知限制的其中一項原本要記成「做不到」：`messages/en.json` 是 `{}`，
 * 「en.json 填了鍵 → 頁面真的變英文」在此之前沒有任何測試證明過，
 * 只驗過 deepMerge 這個純函式、沒驗過 request.ts 的 default export 實際
 * 有沒有把它接對（locale 判斷 → 動態 import 對應 locale 檔 → deepMerge）。
 * 這裡改用合成的 messages 物件（mock `../../messages/en.json` 的內容，
 * 不是塞進真正的檔案）走那條實際路徑，證明覆寫真的生效——不用等翻譯內容
 * 到位就能驗證這條組態路徑本身是對的。
 */
describe("request.ts 的 default export（實際組態路徑）", () => {
  it("locale=en：override 的鍵蓋過 zh-TW，沒 override 的鍵仍 fallback 回 zh-TW", async () => {
    const result = await requestConfig({ requestLocale: Promise.resolve("en") });
    expect(result.locale).toBe("en");

    const messages = result.messages as { shell: { appName: string; tagline: string } };
    expect(messages.shell.appName).toBe("Synthetic EN");
    expect(messages.shell.tagline).toBe("Fab1 · 設備 AI 助理");
  });

  it("locale=zh-TW：直接回傳 zh-TW 訊息，不經過 deepMerge／動態 import", async () => {
    const result = await requestConfig({ requestLocale: Promise.resolve("zh-TW") });
    expect(result.locale).toBe("zh-TW");
    const messages = result.messages as { shell: { appName: string } };
    expect(messages.shell.appName).toBe("Tool Center");
  });

  it("未知 locale：hasLocale 判斷為否，fallback 回預設 locale zh-TW", async () => {
    const result = await requestConfig({ requestLocale: Promise.resolve("fr") });
    expect(result.locale).toBe("zh-TW");
  });
});
