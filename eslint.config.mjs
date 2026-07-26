import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// CJK 字元範圍（含繁體中文常用區，等同 [一-鿿]）；訊息用 next-intl 的 t()，UI 文案不得寫死中文。
// H5 修復：原本只含 一-鿿，涵蓋不到全形標點（（）「」、。等，落在
// U+3000-303F 與 U+FF00-FFEF 這兩個區塊）。全形標點跟中文字一樣是 locale-specific
// （en 用半形括號／標點），照樣算是「會漏進 en locale 的中文文案」，理當被這條規則攔到，
// 所以額外加上這兩個區塊，等同 [一-鿿　-〿＀-￯]。
const CJK_RANGE = "\\u4e00-\\u9fff\\u3000-\\u303f\\uff00-\\uffef";

// H1 修復：flat config 語意——同一個 rule key（no-restricted-syntax）若在兩個
// `files` 有重疊的 config 物件裡各自出現一次，後面那個物件的陣列會「整組取代」
// 前面那個，不會合併／串接。原本兩個 block 各自寫一份字面陣列，導致
// src/lib/**、src/components/** 底下只剩第二個 block 的 1 條 Property 選擇器
// 生效，原本 5 條 JSX 選擇器在這兩個目錄下被靜靜地停用（pnpm lint 仍 exit 0，
// 完全沒有訊號）。修法：把選擇器抽成共用常數陣列，兩個 block 都從這裡組出
// 完整的陣列，選擇器來源只有一份，不會再因為「兩份字面陣列」而互相蓋掉。
const JSX_SELECTORS = [
  {
    selector: `JSXText[value=/[${CJK_RANGE}]/]`,
    message: "JSX 文字禁止硬寫中文，請把字串放進 messages/zh-TW.json 並用 next-intl 的 t() 取用。",
  },
  {
    // 用後代選擇器（不是直接子節點 `>`）：三元運算子等表達式裡的字串常值，
    // 其 AST 上的父節點是 ConditionalExpression 而不是 JSXExpressionContainer，
    // 用 `>` 會漏放；這正是 reviewer 抓到的漏洞之一。
    selector: `JSXExpressionContainer Literal[value=/[${CJK_RANGE}]/]`,
    message:
      "JSX 表達式中禁止硬寫中文字串常值，請把字串放進 messages/zh-TW.json 並用 next-intl 的 t() 取用。",
  },
  {
    selector: `JSXAttribute > Literal[value=/[${CJK_RANGE}]/]`,
    message:
      "JSX 屬性禁止硬寫中文字串常值，請把字串放進 messages/zh-TW.json 並用 next-intl 的 t() 取用。",
  },
  {
    // i18n refactor 常見的漏網形式：JSX 表達式裡用 template literal 組字串
    // （例如 `${x} 台`），Literal 選擇器抓不到 TemplateElement。
    selector: `JSXExpressionContainer TemplateLiteral > TemplateElement[value.raw=/[${CJK_RANGE}]/]`,
    message:
      "JSX 表達式中禁止用 template literal 硬寫中文，請把字串放進 messages/zh-TW.json 並用 next-intl 的 t() 取用。",
  },
  {
    // 同上，但發生在 JSX 屬性裡（例如 title={`第 ${n} 筆`}）。
    selector: `JSXAttribute TemplateLiteral > TemplateElement[value.raw=/[${CJK_RANGE}]/]`,
    message:
      "JSX 屬性中禁止用 template literal 硬寫中文，請把字串放進 messages/zh-TW.json 並用 next-intl 的 t() 取用。",
  },
];

// 擋常數文案表——F2 手動刪掉的 TOOL_MODE_LABEL 那種
// `export const X = { key: "中文" }` 形態，JSX_SELECTORS 都攔不到（它們不長在
// JSX 裡）。只管 src/lib/** 與 src/components/**：src/data/**、src/domain/**
// 是資料／受控詞彙，中文字面值合法；*.test.* 是測試斷言／夾具，也合法。
const PROPERTY_SELECTOR = {
  selector: `Property > Literal[value=/[${CJK_RANGE}]/]`,
  message:
    "src/lib/ 與 src/components/ 的物件屬性禁止硬寫中文字面值（常見於文案表，如 { live: \"當機處理\" }），請把字串放進 messages/zh-TW.json 並用 next-intl 的 t() 取用。",
};

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
      "no-restricted-syntax": ["error", ...JSX_SELECTORS],
    },
  },
  {
    // src/lib/**、src/components/** 額外疊上 PROPERTY_SELECTOR：這個 files 集合
    // 跟上一個 block 有重疊，所以陣列要把 JSX_SELECTORS 也一起帶著展開，
    // 不能只放 PROPERTY_SELECTOR（那就是 H1 本身的 bug）。
    files: ["src/lib/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    ignores: ["src/data/**", "src/domain/**", "**/*.test.*"],
    rules: {
      "no-restricted-syntax": ["error", ...JSX_SELECTORS, PROPERTY_SELECTOR],
    },
  },
]);

export default eslintConfig;
