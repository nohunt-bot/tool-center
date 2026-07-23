import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tool Center",
  description: "Fab1 · 設備 AI 助理",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW">
      {/*
        字型：沿用 mockup L14 的系統字型堆疊（Microsoft JhengHei / Calibri）。
        內網無外部連線，因此不用 next/font/google；系統字型也不需要 next/font/local
        （沒有字型檔要打包）。日後若要自帶字型檔，改用 next/font/local。
      */}
      <body
        className="flex h-screen flex-col overflow-hidden text-[13px]"
        style={{ fontFamily: '"Microsoft JhengHei", Calibri, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
