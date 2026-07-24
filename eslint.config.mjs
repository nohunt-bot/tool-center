import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// CJK 字元範圍（含繁體中文常用區）；訊息用 next-intl 的 t()，UI 文案不得寫死中文。
const CJK_RANGE = "\\u4e00-\\u9fff";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // 擋 JSX 中新的硬寫中文字串——UI 文案一律走 messages/zh-TW.json + t()。
    // 例外：src/domain/**、src/data/** 是受控詞彙／資料內容，*.test.* 是測試斷言，
    // urd/** 是舊 mockup，都不是 UI 文案，不受這條規則限制。
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/domain/**", "src/data/**", "**/*.test.*", "urd/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXText[value=/[${CJK_RANGE}]/]`,
          message: "JSX 文字禁止硬寫中文，請把字串放進 messages/zh-TW.json 並用 next-intl 的 t() 取用。",
        },
        {
          selector: `JSXExpressionContainer > Literal[value=/[${CJK_RANGE}]/]`,
          message:
            "JSX 表達式中禁止硬寫中文字串常值，請把字串放進 messages/zh-TW.json 並用 next-intl 的 t() 取用。",
        },
        {
          selector: `JSXAttribute > Literal[value=/[${CJK_RANGE}]/]`,
          message:
            "JSX 屬性禁止硬寫中文字串常值，請把字串放進 messages/zh-TW.json 並用 next-intl 的 t() 取用。",
        },
      ],
    },
  },
]);

export default eslintConfig;
