import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as meetingRoomApi from "@/api/meeting-room";
import * as reservationApi from "@/api/reservation";
import { ApiError } from "@/lib/api-error";
import { rooms, statusItems } from "@/test/fixtures";
import { routerMock, setSearch } from "@/test/navigation";
import { renderScreen } from "@/test/render";
import StatusPage from "./page";

vi.mock("@/api/reservation");
vi.mock("@/api/meeting-room");

const reservations = vi.mocked(reservationApi);
const roomsApi = vi.mocked(meetingRoomApi);

describe("SCR-RSV-003 예약 현황 조회", () => {
  beforeEach(() => {
    setSearch("date=2030-01-02");
    roomsApi.listRooms.mockResolvedValue(rooms);
    reservations.listReservationStatus.mockResolvedValue(statusItems);
  });

  // @trace REQ-F-002 | SCR-RSV-003 UX-SCR-RSV-003-01
  it("조회하는 동안 로딩 상태를 보인다", () => {
    roomsApi.listRooms.mockReturnValue(new Promise(() => {}));
    renderScreen(<StatusPage />);

    expect(screen.getByRole("status", { name: "불러오는 중입니다" })).toBeInTheDocument();
  });

  // @trace REQ-F-002 | SCR-RSV-003 F-SCR-RSV-003-02
  it("주소의 날짜로 회의실 목록과 예약 현황을 조회한다", async () => {
    renderScreen(<StatusPage />);

    await waitFor(() =>
      expect(reservations.listReservationStatus).toHaveBeenCalledWith({ date: "2030-01-02", meetingRoomId: undefined }),
    );
    expect(roomsApi.listRooms).toHaveBeenCalled();
  });

  // @trace REQ-F-002 | SCR-RSV-003 F-SCR-RSV-003-03
  it("날짜를 바꾸면 주소의 date를 바꿔 다시 조회하게 한다", async () => {
    renderScreen(<StatusPage />);
    const input = await screen.findByLabelText("날짜");
    fireEvent.change(input, { target: { value: "2030-01-05" } });

    expect(routerMock.replace).toHaveBeenCalledWith("/status?date=2030-01-05");
  });

  // @trace REQ-F-002 | SCR-RSV-003 F-SCR-RSV-003-04
  it("예약된 칸에 예약자와 제목을 보이고 제목이 없으면 예약됨만 보인다", async () => {
    renderScreen(<StatusPage />);

    const withTitle = await screen.findByTestId("cell-1-09:30");
    expect(withTitle).toHaveTextContent("예약됨 · 박직원 · 주간 회의");
    expect(screen.getByTestId("cell-2-14:00")).toHaveTextContent("예약됨 · 김관리");
    expect(screen.getByTestId("cell-2-14:00")).not.toHaveTextContent("주간 회의");
  });

  // @trace REQ-F-002 | SCR-RSV-003 UX-SCR-RSV-003-03
  it("예약이 없는 날짜는 모든 칸을 비어 있음으로 보인다", async () => {
    reservations.listReservationStatus.mockResolvedValue([]);
    renderScreen(<StatusPage />);

    const cell = await screen.findByTestId("cell-1-09:00");
    expect(cell).toHaveTextContent("비어 있음");
    expect(within(screen.getByTestId("status-table")).queryByText(/예약됨/)).not.toBeInTheDocument();
  });

  // @trace REQ-F-002 | SCR-RSV-003 F-SCR-RSV-003-05, UX-SCR-RSV-003-02
  it("회의실이 하나도 없으면 빈 안내를 보인다", async () => {
    roomsApi.listRooms.mockResolvedValue([]);
    renderScreen(<StatusPage />);

    expect(await screen.findByText("등록된 회의실이 없습니다.")).toBeInTheDocument();
  });

  // @trace REQ-F-002 | SCR-RSV-003 F-SCR-RSV-003-06, UX-SCR-RSV-003-04
  it("조회에 실패하면 오류 안내와 다시 시도를 보인다", async () => {
    reservations.listReservationStatus.mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    renderScreen(<StatusPage />);

    expect(await screen.findByText("예약 현황을 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이전 화면" })).toBeInTheDocument();
  });

  // @trace REQ-F-002 | SCR-RSV-003 F-SCR-RSV-003-07
  it("[예약하기]는 예약 화면으로 연결된다", async () => {
    renderScreen(<StatusPage />);

    expect(await screen.findByRole("link", { name: "예약하기" })).toHaveAttribute("href", "/reservations/new");
  });
});
