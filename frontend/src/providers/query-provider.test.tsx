import { useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import { QueryProvider } from "./query-provider";

function Probe({ id, queryKey, queryFn }: { id: string; queryKey: string[]; queryFn: () => Promise<string> }) {
  const query = useQuery({ queryKey, queryFn });
  return <p data-testid={id}>{query.status}</p>;
}

const unauthorized = () => new ApiError(401, "ERR-4010", "로그인이 필요합니다.");

// @trace REQ-NF-001 | SCR-RSV-003 F-SCR-RSV-003-01
describe("QueryProvider — 세션 만료와 재시도 정책", () => {
  it("로그인 상태 외 요청이 401을 받으면 로그인 상태(me)를 다시 확인하게 한다", async () => {
    const me = vi.fn().mockResolvedValue("ok");
    const failing = vi.fn().mockRejectedValue(unauthorized());
    render(
      <QueryProvider>
        <Probe id="me" queryKey={["me"]} queryFn={me} />
        <Probe id="reservations" queryKey={["reservations"]} queryFn={failing} />
      </QueryProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("reservations")).toHaveTextContent("error"));
    await waitFor(() => expect(me).toHaveBeenCalledTimes(2));
  });

  it("로그인 상태 조회(me) 자체의 401은 다시 확인을 일으키지 않는다", async () => {
    const me = vi.fn().mockRejectedValue(unauthorized());
    render(
      <QueryProvider>
        <Probe id="me" queryKey={["me"]} queryFn={me} />
      </QueryProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("me")).toHaveTextContent("error"));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(me).toHaveBeenCalledTimes(1);
  });

  it("4xx 응답은 다시 시도하지 않는다", async () => {
    const failing = vi.fn().mockRejectedValue(new ApiError(409, "ERR-4090", "이미 예약된 시간입니다."));
    render(
      <QueryProvider>
        <Probe id="conflict" queryKey={["conflict"]} queryFn={failing} />
      </QueryProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("conflict")).toHaveTextContent("error"));
    expect(failing).toHaveBeenCalledTimes(1);
  });

  it("5xx 응답은 한 번 더 시도한다", async () => {
    const failing = vi.fn().mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    render(
      <QueryProvider>
        <Probe id="server-error" queryKey={["server-error"]} queryFn={failing} />
      </QueryProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("server-error")).toHaveTextContent("error"), { timeout: 4000 });
    expect(failing).toHaveBeenCalledTimes(2);
  });
});
