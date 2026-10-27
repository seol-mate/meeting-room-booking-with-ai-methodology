import { screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as meetingRoomApi from "@/api/meeting-room";
import * as reservationApi from "@/api/reservation";
import AdminLayout from "@/app/(app)/admin/layout";
import AdminReservationsPage from "@/app/(app)/admin/reservations/page";
import RoomEditPage from "@/app/(app)/admin/rooms/edit/page";
import RoomsPage from "@/app/(app)/admin/rooms/page";
import MyReservationsPage from "@/app/(app)/my-reservations/page";
import NewReservationPage from "@/app/(app)/reservations/new/page";
import StatusPage from "@/app/(app)/status/page";
import { AuthGate } from "@/components/layout/auth-gate";
import { ApiError } from "@/lib/api-error";
import { manager, rooms, staff } from "@/test/fixtures";
import { routerMock } from "@/test/navigation";
import { renderScreen } from "@/test/render";

vi.mock("@/api/reservation");
vi.mock("@/api/meeting-room");

const reservations = vi.mocked(reservationApi);
const roomsApi = vi.mocked(meetingRoomApi);

const notLoggedIn = () => reservations.me.mockRejectedValue(new ApiError(401, "ERR-4010", "로그인이 필요합니다."));

function expectLoginRedirect(page: ReactElement) {
  notLoggedIn();
  renderScreen(<AuthGate>{page}</AuthGate>);
  return waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/login?reason=required"));
}

async function expectForbidden(page: ReactElement) {
  reservations.me.mockResolvedValue(staff);
  renderScreen(
    <AuthGate>
      <AdminLayout>{page}</AdminLayout>
    </AuthGate>,
  );
  expect(await screen.findByText("이 화면에 접근할 권한이 없습니다")).toBeInTheDocument();
}

describe("로그인 가드(AuthGate) — 로그인 후 화면 진입", () => {
  beforeEach(() => {
    roomsApi.listRooms.mockResolvedValue(rooms);
  });

  // @trace REQ-F-002, REQ-NF-001 | SCR-RSV-003 F-SCR-RSV-003-01
  it("예약 현황은 미로그인이면 로그인 화면으로 보내고 본문을 그리지 않는다", async () => {
    await expectLoginRedirect(<StatusPage />);

    expect(reservations.listReservationStatus).not.toHaveBeenCalled();
  });

  // @trace REQ-F-003 | SCR-RSV-004 F-SCR-RSV-004-01
  it("회의실 예약은 미로그인이면 로그인 화면으로 보낸다", async () => {
    await expectLoginRedirect(<NewReservationPage />);

    expect(screen.queryByTestId("field-room")).not.toBeInTheDocument();
  });

  // @trace REQ-F-005 | SCR-RSV-005 F-SCR-RSV-005-01
  it("내 예약은 미로그인이면 로그인 화면으로 보내고 목록을 요청하지 않는다", async () => {
    await expectLoginRedirect(<MyReservationsPage />);

    expect(reservations.listMyReservations).not.toHaveBeenCalled();
  });

  // @trace REQ-F-007 | SCR-MTR-001 F-SCR-MTR-001-01
  it("회의실 목록은 미로그인이면 로그인 화면으로, 일반 사용자에게는 권한 거부 화면을 보인다", async () => {
    await expectLoginRedirect(<RoomsPage />);
    expect(roomsApi.listRooms).not.toHaveBeenCalled();
  });

  // @trace REQ-F-007 | SCR-MTR-001 F-SCR-MTR-001-01
  it("회의실 목록은 일반 사용자에게 권한 거부 화면을 보인다", async () => {
    await expectForbidden(<RoomsPage />);

    expect(roomsApi.listRooms).not.toHaveBeenCalled();
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-01
  it("회의실 등록·변경은 미로그인이면 로그인 화면으로 보낸다", async () => {
    await expectLoginRedirect(<RoomEditPage />);
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-01
  it("회의실 등록·변경은 일반 사용자에게 권한 거부 화면을 보인다", async () => {
    await expectForbidden(<RoomEditPage />);

    expect(screen.queryByTestId("field-name")).not.toBeInTheDocument();
  });

  // @trace REQ-F-008 | SCR-MTR-003 F-SCR-MTR-003-01
  it("전체 예약 조회는 미로그인이면 로그인 화면으로 보낸다", async () => {
    await expectLoginRedirect(<AdminReservationsPage />);
  });

  // @trace REQ-F-008 | SCR-MTR-003 F-SCR-MTR-003-01
  it("전체 예약 조회는 일반 사용자에게 권한 거부 화면을 보이고 조회하지 않는다", async () => {
    await expectForbidden(<AdminReservationsPage />);

    expect(roomsApi.listAdminReservations).not.toHaveBeenCalled();
  });

  // @trace REQ-F-007 | SCR-MTR-001 F-SCR-MTR-001-01
  it("회의실 관리 담당자는 관리 화면에 들어갈 수 있다", async () => {
    reservations.me.mockResolvedValue(manager);
    renderScreen(
      <AuthGate>
        <AdminLayout>
          <RoomsPage />
        </AdminLayout>
      </AuthGate>,
    );

    expect(await screen.findByTestId("room-row-1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체 예약" })).toBeInTheDocument();
  });

  // @trace REQ-F-002, REQ-NF-001 | SCR-RSV-003 F-SCR-RSV-003-01
  it("일반 사용자에게는 관리 메뉴를 보이지 않는다", async () => {
    reservations.me.mockResolvedValue(staff);
    reservations.listReservationStatus.mockResolvedValue([]);
    renderScreen(
      <AuthGate>
        <StatusPage />
      </AuthGate>,
    );

    expect(await screen.findByRole("link", { name: "내 예약" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "회의실 관리" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
  });
});
