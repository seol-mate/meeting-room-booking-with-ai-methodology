import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seed, type MockData } from "@/mock/data";

/**
 * mock 서버 상태 — 데이터와 로그인 세션을 브라우저 sessionStorage에 보관한다(탭을 닫으면 초기화).
 * 전체 화면 코드베이스 통합(5-IM-11) 프로토타입 전용이며 API 결선(5-IM-14)에서 src/mock 전체와 함께 걷어낸다.
 */
type MockDbState = MockData & {
  /** 로그인한 사용자의 reserverId — 서버 세션에 해당한다 */
  sessionUserId: number | null;
  reset: () => void;
};

export const useMockDb = create<MockDbState>()(
  persist(
    (set) => ({
      ...seed(),
      sessionUserId: null,
      reset: () => set({ ...seed(), sessionUserId: null }),
    }),
    {
      name: "mock-db",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        users: state.users,
        rooms: state.rooms,
        reservations: state.reservations,
        sessionUserId: state.sessionUserId,
      }),
    },
  ),
);
