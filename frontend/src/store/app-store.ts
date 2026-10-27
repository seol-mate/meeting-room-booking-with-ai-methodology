import { create } from "zustand";

/** 화면 간 공유 UI 상태 (클라이언트 상태). 서버 데이터는 React Query가 맡는다. */
type AppState = {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  navOpen: false,
  setNavOpen: (open) => set({ navOpen: open }),
}));
