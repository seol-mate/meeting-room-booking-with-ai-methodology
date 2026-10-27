import { vi } from "vitest";

/** next/navigation 대역 — 모든 테스트가 같은 라우터·주소 상태를 본다 (vitest.setup.ts에서 연결) */
export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export const searchState = { value: new URLSearchParams() };

export function setSearch(query: string) {
  searchState.value = new URLSearchParams(query);
}

export function resetNavigation() {
  for (const fn of Object.values(routerMock)) fn.mockReset();
  setSearch("");
}
