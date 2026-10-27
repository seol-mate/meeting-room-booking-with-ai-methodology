import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as reservationApi from "@/api/reservation";
import { ApiError } from "@/lib/api-error";
import { myItems } from "@/test/fixtures";
import { renderScreen } from "@/test/render";
import { useToastStore } from "@/store/toast-store";
import MyReservationsPage from "./page";

vi.mock("@/api/reservation");

const api = vi.mocked(reservationApi);

async function openCancelDialog(id: number) {
  fireEvent.click(await screen.findByTestId(`cancel-${id}`));
  return screen.findByRole("dialog");
}

describe("SCR-RSV-005 내 예약", () => {
  beforeEach(() => {
    api.listMyReservations.mockResolvedValue(myItems);
  });

  // @trace REQ-F-005 | SCR-RSV-005 UX-SCR-RSV-005-01
  it("조회하는 동안 로딩 상태를 보인다", () => {
    api.listMyReservations.mockReturnValue(new Promise(() => {}));
    renderScreen(<MyReservationsPage />);

    expect(screen.getByRole("status", { name: "불러오는 중입니다" })).toBeInTheDocument();
  });

  // @trace REQ-F-005 | SCR-RSV-005 F-SCR-RSV-005-02
  it("마운트 시 내 예약 목록을 조회한다", async () => {
    renderScreen(<MyReservationsPage />);

    expect(await screen.findByTestId("row-21")).toHaveTextContent("미래 회의");
    expect(api.listMyReservations).toHaveBeenCalledTimes(1);
  });

  // @trace REQ-F-005 | SCR-RSV-005 F-SCR-RSV-005-03
  it("시작이 지난 예약은 [취소]가 비활성이고 취소한 예약은 상태와 취소 일시를 보인다", async () => {
    renderScreen(<MyReservationsPage />);

    expect(await screen.findByTestId("cancel-21")).toBeEnabled();
    expect(screen.getByTestId("cancel-22")).toBeDisabled();
    expect(screen.queryByTestId("cancel-23")).not.toBeInTheDocument();
    expect(screen.getByTestId("row-23")).toHaveTextContent("취소됨");
    expect(screen.getByTestId("row-23")).toHaveTextContent("2030-01-01 08:30 취소");
  });

  // @trace REQ-F-005 | SCR-RSV-005 F-SCR-RSV-005-09, UX-SCR-RSV-005-02
  it("예약 내역이 없으면 빈 안내를 보인다", async () => {
    api.listMyReservations.mockResolvedValue([]);
    renderScreen(<MyReservationsPage />);

    expect(await screen.findByText("예약 내역이 없습니다.")).toBeInTheDocument();
  });

  // @trace REQ-F-005 | SCR-RSV-005 UX-SCR-RSV-005-08
  it("목록 조회에 실패하면 오류 화면과 다시 시도를 보인다", async () => {
    api.listMyReservations.mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    renderScreen(<MyReservationsPage />);

    expect(await screen.findByText("요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });

  // @trace REQ-F-005 | SCR-RSV-005 F-SCR-RSV-005-04, UX-SCR-RSV-005-03
  it("[취소]를 누르면 확인 대화상자를 먼저 보이고 호출하지 않는다", async () => {
    renderScreen(<MyReservationsPage />);
    const dialog = await openCancelDialog(21);

    expect(dialog).toHaveTextContent("이 예약을 취소하시겠습니까?");
    expect(api.cancelReservation).not.toHaveBeenCalled();
  });

  // @trace REQ-F-005 | SCR-RSV-005 F-SCR-RSV-005-05, F-SCR-RSV-005-06, UX-SCR-RSV-005-07
  it("대화상자를 확인하면 취소 API를 호출하고 토스트를 보이며 목록을 다시 불러온다", async () => {
    api.cancelReservation.mockResolvedValue({ reservationId: 21, status: "CANCELLED", cancelledAt: "2030-01-01T09:00" });
    renderScreen(<MyReservationsPage />);
    await openCancelDialog(21);
    fireEvent.click(screen.getByTestId("confirm-cancel"));

    await waitFor(() => expect(api.cancelReservation).toHaveBeenCalledWith(21));
    await waitFor(() => expect(api.listMyReservations).toHaveBeenCalledTimes(2));
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain("예약이 취소되었습니다.");
  });

  // @trace REQ-F-005 | SCR-RSV-005 F-SCR-RSV-005-07, UX-SCR-RSV-005-04
  it("시작 이후 취소가 거부(422)되면 목록 위에 안내한다", async () => {
    api.cancelReservation.mockRejectedValue(new ApiError(422, "ERR-4220", "시작된 예약은 취소할 수 없습니다."));
    renderScreen(<MyReservationsPage />);
    await openCancelDialog(21);
    fireEvent.click(screen.getByTestId("confirm-cancel"));

    expect(await screen.findByTestId("form-error")).toHaveTextContent("시작된 예약은 취소할 수 없습니다.");
  });

  // @trace REQ-F-005 | SCR-RSV-005 F-SCR-RSV-005-08, UX-SCR-RSV-005-06
  it("취소에 실패하면 목록 위에 안내한다", async () => {
    api.cancelReservation.mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    renderScreen(<MyReservationsPage />);
    await openCancelDialog(21);
    fireEvent.click(screen.getByTestId("confirm-cancel"));

    expect(await screen.findByTestId("form-error")).toHaveTextContent("예약을 취소하지 못했습니다.");
  });
});
