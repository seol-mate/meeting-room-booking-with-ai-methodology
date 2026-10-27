import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as meetingRoomApi from "@/api/meeting-room";
import * as reservationApi from "@/api/reservation";
import { ApiError } from "@/lib/api-error";
import { rooms } from "@/test/fixtures";
import { routerMock } from "@/test/navigation";
import { renderScreen } from "@/test/render";
import { useToastStore } from "@/store/toast-store";
import NewReservationPage from "./page";

vi.mock("@/api/reservation");
vi.mock("@/api/meeting-room");

const reservations = vi.mocked(reservationApi);
const roomsApi = vi.mocked(meetingRoomApi);

const created = {
  reservationId: 5,
  meetingRoomId: 1,
  startAt: "2030-01-02T09:00",
  endAt: "2030-01-02T10:00",
  title: "회의",
  status: "RESERVED" as const,
  cancelledAt: null,
  meetingRoomName: "회의실 A",
};

async function fillForm(overrides: { room?: string; date?: string; start?: string; end?: string; title?: string } = {}) {
  await screen.findByTestId("field-room");
  fireEvent.change(screen.getByTestId("field-room"), { target: { value: overrides.room ?? "1" } });
  fireEvent.change(screen.getByTestId("field-date"), { target: { value: overrides.date ?? "2030-01-02" } });
  fireEvent.change(screen.getByTestId("field-start"), { target: { value: overrides.start ?? "09:00" } });
  fireEvent.change(screen.getByTestId("field-end"), { target: { value: overrides.end ?? "10:00" } });
  fireEvent.change(screen.getByTestId("field-title"), { target: { value: overrides.title ?? "회의" } });
}

describe("SCR-RSV-004 회의실 예약", () => {
  beforeEach(() => {
    roomsApi.listRooms.mockResolvedValue(rooms);
  });

  // @trace REQ-F-003 | SCR-RSV-004 UX-SCR-RSV-004-01
  it("회의실 목록을 불러오는 동안 로딩 상태를 보인다", () => {
    roomsApi.listRooms.mockReturnValue(new Promise(() => {}));
    renderScreen(<NewReservationPage />);

    expect(screen.getByRole("status", { name: "불러오는 중입니다" })).toBeInTheDocument();
  });

  // @trace REQ-F-003 | SCR-RSV-004 F-SCR-RSV-004-02
  it("마운트 시 회의실 선택 목록을 조회해 선택지로 보인다", async () => {
    renderScreen(<NewReservationPage />);

    const select = await screen.findByTestId("field-room");
    expect(roomsApi.listRooms).toHaveBeenCalled();
    expect(select).toHaveTextContent("회의실 A (본관 3층, 8명)");
    expect(select).toHaveTextContent("회의실 B");
  });

  // @trace REQ-F-003 | SCR-RSV-004 UX-SCR-RSV-004-02
  it("회의실이 하나도 없으면 폼 대신 안내를 보인다", async () => {
    roomsApi.listRooms.mockResolvedValue([]);
    renderScreen(<NewReservationPage />);

    expect(await screen.findByText("등록된 회의실이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByTestId("field-room")).not.toBeInTheDocument();
  });

  // @trace REQ-F-003 | SCR-RSV-004 F-SCR-RSV-004-03
  it("시작·종료 선택지는 00:00부터 23:30까지 30분 단위이고 입력이 폼에 반영된다", async () => {
    renderScreen(<NewReservationPage />);
    await fillForm({ title: "주간 회의" });

    const start = screen.getByTestId("field-start") as HTMLSelectElement;
    expect(start.options).toHaveLength(48);
    expect(start.options[0].value).toBe("00:00");
    expect(start.options[47].value).toBe("23:30");
    expect(screen.getByTestId("field-title")).toHaveValue("주간 회의");
  });

  // @trace REQ-F-003 | SCR-RSV-004 V-SCR-RSV-004-02
  it("회의실을 고르지 않으면 [예약]이 비활성이다", async () => {
    renderScreen(<NewReservationPage />);
    await screen.findByTestId("field-room");

    expect(screen.getByTestId("submit-button")).toBeDisabled();
  });

  // @trace REQ-F-003 | SCR-RSV-004 V-SCR-RSV-004-01, F-SCR-RSV-004-05, UX-SCR-RSV-004-03
  it("종료가 시작보다 늦지 않으면 시간 규칙 안내를 보이고 호출하지 않는다", async () => {
    renderScreen(<NewReservationPage />);
    await fillForm({ start: "10:00", end: "09:30" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("end-error")).toHaveTextContent(
      "예약은 30분 단위로 최소 30분, 최대 4시간까지 가능합니다.",
    );
    expect(reservations.createReservation).not.toHaveBeenCalled();
  });

  // @trace REQ-F-003 | SCR-RSV-004 V-SCR-RSV-004-01
  it("4시간을 넘는 예약은 시간 규칙 안내를 보인다", async () => {
    renderScreen(<NewReservationPage />);
    await fillForm({ start: "09:00", end: "13:30" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("end-error")).toBeInTheDocument();
    expect(reservations.createReservation).not.toHaveBeenCalled();
  });

  // @trace REQ-F-003, REQ-F-004 | SCR-RSV-004 F-SCR-RSV-004-04
  it("검증을 통과하면 예약 API를 본인 명의 없이 호출한다", async () => {
    reservations.createReservation.mockResolvedValue(created);
    renderScreen(<NewReservationPage />);
    await fillForm();
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() =>
      expect(reservations.createReservation).toHaveBeenCalledWith({
        meetingRoomId: 1,
        startAt: "2030-01-02T09:00",
        endAt: "2030-01-02T10:00",
        title: "회의",
      }),
    );
  });

  // @trace REQ-F-003 | SCR-RSV-004 F-SCR-RSV-004-07, UX-SCR-RSV-004-06
  it("예약에 성공하면 토스트를 보이고 내 예약 화면으로 이동한다", async () => {
    reservations.createReservation.mockResolvedValue(created);
    renderScreen(<NewReservationPage />);
    await fillForm();
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/my-reservations"));
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain("예약이 등록되었습니다.");
  });

  // @trace REQ-F-004 | SCR-RSV-004 F-SCR-RSV-004-06, UX-SCR-RSV-004-05
  it("겹침(409)이면 종료 시각 아래에 이미 예약됨을 안내한다", async () => {
    reservations.createReservation.mockRejectedValue(new ApiError(409, "ERR-4090", "이미 예약된 시간입니다."));
    renderScreen(<NewReservationPage />);
    await fillForm();
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("end-error")).toHaveTextContent("이미 예약된 시간입니다.");
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  // @trace REQ-F-003 | SCR-RSV-004 UX-SCR-RSV-004-04
  it("서버가 시간 규칙 위반(422)을 알리면 같은 자리에 안내한다", async () => {
    reservations.createReservation.mockRejectedValue(new ApiError(422, "ERR-4220", "서버 문구"));
    renderScreen(<NewReservationPage />);
    await fillForm();
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("end-error")).toHaveTextContent(
      "예약은 30분 단위로 최소 30분, 최대 4시간까지 가능합니다.",
    );
  });

  // @trace REQ-F-003 | SCR-RSV-004 F-SCR-RSV-004-08, UX-SCR-RSV-004-07
  it("저장에 실패하면 폼 위에 안내한다", async () => {
    reservations.createReservation.mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    renderScreen(<NewReservationPage />);
    await fillForm();
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("form-error")).toHaveTextContent("예약을 등록하지 못했습니다.");
  });

  // @trace REQ-F-003 | SCR-RSV-004 UX-SCR-RSV-004-08
  it("처리 중에는 [예약]이 비활성이다", async () => {
    reservations.createReservation.mockReturnValue(new Promise(() => {}));
    renderScreen(<NewReservationPage />);
    await fillForm();
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(screen.getByTestId("submit-button")).toBeDisabled());
  });

  // @trace REQ-F-003 | SCR-RSV-004 F-SCR-RSV-004-09
  it("[취소]는 예약 현황으로 연결된다", async () => {
    renderScreen(<NewReservationPage />);

    expect(await screen.findByRole("link", { name: "취소" })).toHaveAttribute("href", "/status");
  });
});

