import type { SectionSettings } from "@/domain/settings";

/** 課別設定：黃光二課 LITHO-02（mockup L1298–1364） */
export const sectionSettingsFixture: SectionSettings = {
  sectionId: "LITHO-02",
  dos:
    "- 引用 SOP 編號回答\n" +
    "- 不確定時優先建議找 PE\n" +
    "- 數值要附單位與容忍度\n" +
    "- 不要建議跳過 SOP step\n" +
    "- 曝光參數變更一律提醒需 PE 簽核",
  mcpTools: [
    {
      name: "case-query",
      description: "歷史案例庫查詢。相似案例、換件紀錄、根因閉環——domain 差異化核心，建議常開。",
      enabled: true,
      lockedByIt: false,
    },
    {
      name: "fdc-query",
      description: "FDC / ML kernel 判讀。波形 pattern、baseline 比對、斜率外推。",
      enabled: true,
      lockedByIt: false,
    },
    {
      name: "stats-query",
      description: "統計比對。MTBI、同型機比對、PM 效果、時間規律。",
      enabled: true,
      lockedByIt: false,
    },
    {
      name: "log-digest / log-read",
      description:
        "log 蒸餾與查閱。Drain3 pattern 蒸餾 + tail/grep（300 行硬上限）。原始 log 不進 RAG。",
      enabled: true,
      lockedByIt: false,
    },
    {
      name: "graph-query",
      description:
        "維修關聯圖推理。三層診斷第 3 層，前兩層有答案時通常不啟動。本課預設關閉，需要再開。",
      enabled: false,
      lockedByIt: false,
    },
    {
      name: "global-sop",
      description: "全域 SOP 對照。IT 全域白名單強制開啟，課別不可關閉。",
      enabled: true,
      lockedByIt: true,
    },
  ],
  expertTags: [
    { userId: "u-li", name: "老李", tags: ["MFC·氣體", "真空"] },
    { userId: "u-chen", name: "陳工", tags: ["Focus·Stage"] },
    { userId: "u-lin", name: "林EE", tags: ["Track·塗佈顯影"] },
  ],
  kmSources: [
    {
      id: "km-01",
      name: "Litho2 設備 KM Space",
      url: "https://km.fab.corp/space/litho2-equipment",
      addedBy: "陳工",
      addedAt: new Date("2026-07-02T00:00:00+08:00"),
      connected: true,
    },
    {
      id: "km-02",
      name: "ASML XT-1900i 原廠文件 Space",
      url: "https://km.fab.corp/space/asml-xt1900-vendor",
      addedBy: "林EE",
      addedAt: new Date("2026-06-28T00:00:00+08:00"),
      connected: true,
    },
  ],
};
