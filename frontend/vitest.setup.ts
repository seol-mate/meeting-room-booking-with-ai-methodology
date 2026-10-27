import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { useToastStore } from "@/store/toast-store";
import { resetNavigation } from "@/test/navigation";

vi.mock("next/navigation", async () => {
  const { routerMock, searchState } = await import("@/test/navigation");
  return {
    useRouter: () => routerMock,
    useSearchParams: () => searchState.value,
    usePathname: () => "/status",
  };
});

beforeEach(() => {
  resetNavigation();
  useToastStore.setState({ toasts: [] });
});

afterEach(() => {
  cleanup();
});
