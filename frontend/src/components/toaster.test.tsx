import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/toaster";
import { useToastStore } from "@/store/toast-store";

// @trace — | PGM-CMM-002 (공통 알림 토스트 — 근거 요구사항 없음, 저장·취소 성공 안내 표시 공통 컴포넌트)
describe("Toaster", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("쌓인 알림을 모두 보인다", () => {
    render(<Toaster />);
    act(() => {
      useToastStore.getState().push("예약이 취소되었습니다.");
      useToastStore.getState().push("회의실 정보가 저장되었습니다.");
    });

    expect(screen.getByText("예약이 취소되었습니다.")).toBeInTheDocument();
    expect(screen.getByText("회의실 정보가 저장되었습니다.")).toBeInTheDocument();
  });

  it("4초가 지나면 알림이 사라진다", () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => useToastStore.getState().push("예약이 취소되었습니다."));

    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByText("예약이 취소되었습니다.")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("예약이 취소되었습니다.")).not.toBeInTheDocument();
  });

  it("dismiss는 지정한 알림만 지운다", () => {
    render(<Toaster />);
    act(() => {
      useToastStore.getState().push("첫째");
      useToastStore.getState().push("둘째");
    });
    const [first] = useToastStore.getState().toasts;

    act(() => useToastStore.getState().dismiss(first.id));

    expect(screen.queryByText("첫째")).not.toBeInTheDocument();
    expect(screen.getByText("둘째")).toBeInTheDocument();
  });
});
