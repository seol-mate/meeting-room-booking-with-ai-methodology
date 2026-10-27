import { describe, expect, it } from "vitest";
import { useAppStore } from "./app-store";

// @trace — | skeleton
describe("app-store (골격 테스트)", () => {
  it("navOpen 기본값은 false이고 setNavOpen으로 바뀐다", () => {
    expect(useAppStore.getState().navOpen).toBe(false);
    useAppStore.getState().setNavOpen(true);
    expect(useAppStore.getState().navOpen).toBe(true);
  });
});
