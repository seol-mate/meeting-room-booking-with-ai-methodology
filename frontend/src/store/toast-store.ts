import { create } from "zustand";

/** 화면 위쪽에 잠깐 보이는 알림(토스트) 상태 — 저장·취소 성공 안내에 쓴다 (클라이언트 상태) */
type Toast = { id: number; message: string };

type ToastState = {
  toasts: Toast[];
  push: (message: string) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message }] });
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));
