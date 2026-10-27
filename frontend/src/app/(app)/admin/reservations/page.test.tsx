import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as meetingRoomApi from "@/api/meeting-room";
import * as reservationApi from "@/api/reservation";
import { ApiError } from "@/lib/api-error";
import { adminItems, rooms } from "@/test/fixtures";
import { routerMock, setSearch } from "@/test/navigation";
import { renderScreen } from "@/test/render";
import { addDays, todayString } from "@/lib/time";
import { useToastStore } from "@/store/toast-store";
import AllReservationsPage from "./page";

vi.mock("@/api/reservation");
vi.mock("@/api/meeting-room");

const reservations = vi.mocked(reservationApi);
const roomsApi = vi.mocked(meetingRoomApi);

async function openCancelDialog(id: number) {
  fireEvent.click(await screen.findByTestId(`cancel-${id}`));
  return screen.findByRole("dialog");
}

describe("SCR-MTR-003 전체 예약 조회", () => {
  beforeEach(() => {
    roomsApi.listRooms.mockResolvedValue(rooms);
    roomsApi.listAdminReservations.mockResolvedValue(adminItems);
  });

  // @trace REQ-F-008 | SCR-MTR-003 UX-SCR-MTR-003-01
  it("조회하는 동안 로딩 상태를 보인다", () => {
    roomsApi.listAdminReservations.mockReturnValue(new Promise(() => {}));
    renderScreen(<AllReservationsPage />);

    expect(screen.getByRole("status", { name: "불러오는 중입니다" })).toBeInTheDocument();
  });

  // @trace REQ-F-008 | SCR-MTR-003 F-SCR-MTR-003-02
  it("기본 조건(오늘부터 7일, 전체 회의실)으로 조회하고 조건용 회의실 목록을 불러온다", async () => {
    renderScreen(<AllReservationsPage />);

    await waitFor(() =>
      expect(roomsApi.listAdminReservations).toHaveBeenCalledWith({
        from: todayString(),
        to: addDays(todayString(), 6),
        meetingRoomId: undefined,
      }),
    );
    expect(roomsApi.listRooms).toHaveBeenCalled();
    expect(await screen.findByTestId("field-room")).toHaveTextContent("전체");
  });

  // @trace REQ-F-008 | SCR-MTR-003 F-SCR-MTR-003-03
  it("[조회]를 누르면 조건을 주소에 반영한다", async () => {
    renderScreen(<AllReservationsPage />);
    await screen.findByTestId("row-31");
    fireEvent.change(screen.getByTestId("field-from"), { target: { value: "2030-01-01" } });
    fireEvent.change(screen.getByTestId("field-to"), { target: { value: "2030-01-10" } });
    fireEvent.change(screen.getByTestId("field-room"), { target: { value: "2" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(routerMock.replace).toHaveBeenCalledWith("/admin/reservations?from=2030-01-01&to=2030-01-10&room=2");
  });

  // @trace REQ-F-008 | SCR-MTR-003 V-SCR-MTR-003-01, F-SCR-MTR-003-04, UX-SCR-MTR-003-02
  it("시작일이 종료일보다 늦으면 기간 안내를 보이고 조건을 반영하지 않는다", async () => {
    renderScreen(<AllReservationsPage />);
    await screen.findByTestId("row-31");
    fireEvent.change(screen.getByTestId("field-from"), { target: { value: "2030-01-10" } });
    fireEvent.change(screen.getByTestId("field-to"), { target: { value: "2030-01-01" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("period-error")).toHaveTextContent("조회 기간의 시작일이 종료일보다 늦을 수 없습니다.");
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  // @trace REQ-F-008 | SCR-MTR-003 F-SCR-MTR-003-05
  it("시작 이후 예약의 [취소]는 비활성이다", async () => {
    renderScreen(<AllReservationsPage />);

    expect(await screen.findByTestId("cancel-31")).toBeEnabled();
    expect(screen.getByTestId("cancel-32")).toBeDisabled();
    expect(screen.getByTestId("row-31")).toHaveTextContent("박직원");
    expect(screen.getByTestId("row-31")).toHaveTextContent("미래 회의");
  });

  // @trace REQ-F-008 | SCR-MTR-003 F-SCR-MTR-003-10, UX-SCR-MTR-003-03
  it("조회 기간에 예약이 없으면 빈 안내를 보인다", async () => {
    roomsApi.listAdminReservations.mockResolvedValue([]);
    renderScreen(<AllReservationsPage />);

    expect(await screen.findByText("조회 기간에 예약이 없습니다.")).toBeInTheDocument();
  });

  // @trace REQ-F-008 | SCR-MTR-003 F-SCR-MTR-003-11, UX-SCR-MTR-003-04
  it("조회에 실패하면 오류 안내와 다시 시도를 보인다", async () => {
    roomsApi.listAdminReservations.mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    renderScreen(<AllReservationsPage />);

    expect(await screen.findByText("예약 목록을 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });

  // @trace REQ-F-006 | SCR-MTR-003 F-SCR-MTR-003-06, UX-SCR-MTR-003-05
  it("[취소]를 누르면 확인 대화상자를 먼저 보이고 호출하지 않는다", async () => {
    renderScreen(<AllReservationsPage />);
    const dialog = await openCancelDialog(31);

    expect(dialog).toHaveTextContent("이 예약을 취소하시겠습니까?");
    expect(reservations.cancelReservation).not.toHaveBeenCalled();
  });

  // @trace REQ-F-006 | SCR-MTR-003 F-SCR-MTR-003-07, F-SCR-MTR-003-08, UX-SCR-MTR-003-07
  it("확인하면 취소 API를 호출하고 토스트를 보이며 목록을 다시 불러온다", async () => {
    reservations.cancelReservation.mockResolvedValue({ reservationId: 31, status: "CANCELLED", cancelledAt: "2030-01-01T09:00" });
    renderScreen(<AllReservationsPage />);
    await openCancelDialog(31);
    fireEvent.click(screen.getByTestId("confirm-cancel"));

    await waitFor(() => expect(reservations.cancelReservation).toHaveBeenCalledWith(31));
    await waitFor(() => expect(roomsApi.listAdminReservations).toHaveBeenCalledTimes(2));
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain("예약이 취소되었습니다.");
  });

  // @trace REQ-F-006 | SCR-MTR-003 F-SCR-MTR-003-09, UX-SCR-MTR-003-06
  it("시작 이후 취소가 거부(422)되면 목록 위에 안내한다", async () => {
    reservations.cancelReservation.mockRejectedValue(new ApiError(422, "ERR-4220", "시작된 예약은 취소할 수 없습니다."));
    renderScreen(<AllReservationsPage />);
    await openCancelDialog(31);
    fireEvent.click(screen.getByTestId("confirm-cancel"));

    expect(await screen.findByTestId("form-error")).toHaveTextContent("시작된 예약은 취소할 수 없습니다.");
  });

  // @trace REQ-F-008 | SCR-MTR-003 F-SCR-MTR-003-02
  it("주소의 조건(from·to·room)으로 조회한다", async () => {
    setSearch("from=2030-01-01&to=2030-01-10&room=2");
    renderScreen(<AllReservationsPage />);

    await waitFor(() =>
      expect(roomsApi.listAdminReservations).toHaveBeenCalledWith({ from: "2030-01-01", to: "2030-01-10", meetingRoomId: 2 }),
    );
  });
});
