import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
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
  const { locale } = await params;

  // 不支援的 locale 直接 404（B1.3 之後由 proxy 一併擋下無效路徑）。
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
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
