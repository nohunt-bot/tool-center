/**
 * 機台／chamber 狀態的單一真相來源。
 *
 * 來源：urd/tool-center-gui.html L16–17（.st-* class）、L497–505（legend）。
 *
 * 產品要求：大格（機台）與小格（chamber）的底色可以不同，但**色義一致**——
 * 同一個狀態在任何地方都是同一個顏色（mockup L565）。
 * 因此任何元件都不得自行寫死狀態色碼，一律從這裡取。
 */

export const TOOL_STATUSES = ["UP", "DOWN", "OFF", "WEQ", "PM", "LOST"] as const;

export type ToolStatus = (typeof TOOL_STATUSES)[number];

type StatusToken = {
  /** 底色的 Tailwind class（對應 globals.css 的 @theme 變數） */
  readonly bg: string;
  /** 該底色上可讀的前景色 class */
  readonly fg: string;
};

const STATUS_TOKENS: Readonly<Record<ToolStatus, StatusToken>> = {
  UP: { bg: "bg-st-up", fg: "text-st-up-fg" },
  DOWN: { bg: "bg-st-down", fg: "text-st-down-fg" },
  OFF: { bg: "bg-st-off", fg: "text-st-off-fg" },
  WEQ: { bg: "bg-st-weq", fg: "text-st-weq-fg" },
  PM: { bg: "bg-st-pm", fg: "text-st-pm-fg" },
  LOST: { bg: "bg-st-lost", fg: "text-st-lost-fg" },
};

export function statusToken(status: ToolStatus): StatusToken {
  return STATUS_TOKENS[status];
}

/** 底色 + 前景色的組合 class，給 brick 與 chamber chip 共用 */
export function statusClass(status: ToolStatus): string {
  const token = STATUS_TOKENS[status];
  return `${token.bg} ${token.fg}`;
}

export function isToolStatus(value: unknown): value is ToolStatus {
  return typeof value === "string" && (TOOL_STATUSES as readonly string[]).includes(value);
}
