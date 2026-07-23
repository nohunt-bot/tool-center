"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Intercepting route 的覆蓋層外框。
 * 關閉 = router.back()，讓 URL 回到底下那一頁——這樣上一頁／下一頁都符合直覺。
 *
 * A0 只做到 ESC 關閉與點背景關閉；完整的 focus trap 由 A10.1 統一處理
 * （shadcn/Radix Dialog），這裡不自行實作以免之後要拆掉。
 */
export function ModalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        router.back();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(15,23,42,.5)] p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          router.back();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[92vh] w-[900px] max-w-[96vw] flex-col overflow-hidden rounded-[14px] bg-white"
      >
        <div className="flex items-center gap-[10px] bg-[#0f1f3d] px-[18px] py-3 text-white">
          <span className="text-[18px]">🔬</span>
          <div className="text-[14px] font-bold">FDC 分析</div>
          <button
            ref={closeRef}
            type="button"
            className="ml-auto cursor-pointer text-[16px] text-[#94a3b8]"
            onClick={() => router.back()}
            aria-label="關閉"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[18px] py-4">{children}</div>
      </div>
    </div>
  );
}
