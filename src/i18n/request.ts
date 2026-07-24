import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
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
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
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

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const messages =
    locale === "zh-TW"
      ? zhTW
      : deepMerge(zhTW, ((await import(`../../messages/${locale}.json`)) as { default: object })
          .default as Record<string, unknown>);

  return { locale, messages };
});
