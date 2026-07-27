import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shell" });
  return {
    title: t("appName"),
    description: t("tagline"),
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;

  // 不支援的 locale 直接 404（B1.3 之後由 proxy 一併擋下無效路徑）。
  // 這裡驗證的是 URL 動態段本身合不合法（是不是 routing.locales 之一），
  // 跟下面「畫面實際用哪個 locale」是兩回事，見下方 htmlLang 的說明。
  if (!hasLocale(routing.locales, routeLocale)) {
    notFound();
  }

  // P3 修復：`[locale]` 這個路由動態段的值來自 proxy.ts 的 middleware
  // 依 cookie `NEXT_LOCALE` / `Accept-Language` 協商出來的結果（見
  // routing.ts 的說明），跟 `request.ts` 的 `getRequestConfig()`——也就是
  // 實際決定畫面訊息用哪個 locale 的地方——是兩條不同的判斷路徑：
  // `getRequestConfig()` 改以 `User.locale` 為真相來源（R7），但 middleware
  // 的路由 rewrite 邏輯沒有跟著改，兩者因此會分岔（例如 cookie 存了
  // `NEXT_LOCALE=en`、但登入者 `User.locale` 是 `zh-TW`：畫面內容走
  // `request.ts` 顯示中文，`<html lang>` 若拿 `routeLocale`（也就是這裡的
  // `params.locale`）卻會標成 `en`——中文內容被標成英文語系，螢幕閱讀器
  // 用英文語音念中文）。
  //
  // `getLocale()`（next-intl/server）在 RSC 內呼叫時，會走
  // `getRequestConfig()`（即 `request.ts`）解出來的 locale，因此這裡改用
  // `getLocale()` 而不是 `routeLocale`，讓 `<html lang>` 跟畫面訊息內容用的
  // 是同一個 locale 來源（`User.locale`），不會再分岔。
  const htmlLang = await getLocale();

  return (
    <html lang={htmlLang}>
      {/*
        字型：沿用 mockup L14 的系統字型堆疊（Microsoft JhengHei / Calibri）。
        內網無外部連線，因此不用 next/font/google；系統字型也不需要 next/font/local
        （沒有字型檔要打包）。日後若要自帶字型檔，改用 next/font/local。
      */}
      <body
        className="flex h-screen flex-col overflow-hidden text-[13px]"
        style={{ fontFamily: '"Microsoft JhengHei", Calibri, sans-serif' }}
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
