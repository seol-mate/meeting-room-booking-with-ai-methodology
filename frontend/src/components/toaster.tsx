"use client";

import { useToastStore } from "@/store/toast-store";

/** 저장·취소 성공 같은 짧은 안내를 화면 위쪽에 보여 준다 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
