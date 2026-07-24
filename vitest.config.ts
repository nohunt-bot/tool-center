import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // e2e/ 由 Playwright 跑，不要被 Vitest 收進來
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    server: {
      deps: {
        // next-intl／use-intl 是純 ESM 套件，預設會被 Vitest 當成外部依賴、
        // 交給 Node 原生 ESM resolver 處理；但它們內部用不帶副檔名的方式
        // import "next/navigation"，Node 原生 resolver 找不到（next 沒有 exports
        // map、也沒有 "type":"module"）。inline 讓 Vite 自己的 resolver（能猜副檔名）
        // 來處理這兩個套件，才能在 jsdom 測試環境下正常運作。
        inline: [/next-intl/, /use-intl/],
      },
    },
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      exclude: ["**/*.config.*", "**/*.d.ts", ".next/**", "e2e/**"],
    },
  },
});
