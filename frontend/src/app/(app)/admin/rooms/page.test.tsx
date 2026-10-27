import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as meetingRoomApi from "@/api/meeting-room";
import { ApiError } from "@/lib/api-error";
import { rooms } from "@/test/fixtures";
import { renderScreen } from "@/test/render";
import RoomsPage from "./page";

vi.mock("@/api/meeting-room");

const api = vi.mocked(meetingRoomApi);

describe("SCR-MTR-001 회의실 목록", () => {
  beforeEach(() => {
    api.listRooms.mockResolvedValue(rooms);
  });

  // @trace REQ-F-007 | SCR-MTR-001 UX-SCR-MTR-001-01
  it("조회하는 동안 로딩 상태를 보인다", () => {
    api.listRooms.mockReturnValue(new Promise(() => {}));
    renderScreen(<RoomsPage />);

    expect(screen.getByRole("status", { name: "불러오는 중입니다" })).toBeInTheDocument();
  });

  // @trace REQ-F-007 | SCR-MTR-001 F-SCR-MTR-001-02
  it("마운트 시 회의실 목록을 조회해 위치·수용 인원·장비를 보인다", async () => {
    renderScreen(<RoomsPage />);

    expect(await screen.findByTestId("room-row-1")).toHaveTextContent("본관 3층");
    expect(screen.getByTestId("room-row-1")).toHaveTextContent("8명");
    expect(screen.getByTestId("room-row-2")).toHaveTextContent("-");
    expect(api.listRooms).toHaveBeenCalledTimes(1);
  });

  // @trace REQ-F-007 | SCR-MTR-001 F-SCR-MTR-001-03
  it("[신규 등록]은 등록 화면으로 연결된다", async () => {
    renderScreen(<RoomsPage />);
    await screen.findByTestId("room-row-1");

    expect(screen.getByRole("link", { name: "신규 등록" })).toHaveAttribute("href", "/admin/rooms/edit");
  });

  // @trace REQ-F-007 | SCR-MTR-001 F-SCR-MTR-001-04
  it("행별 [수정]은 대상 식별자를 주소로 넘겨 변경 화면으로 연결된다", async () => {
    renderScreen(<RoomsPage />);

    expect(await screen.findByTestId("edit-1")).toHaveAttribute("href", "/admin/rooms/edit?id=1");
  });

  // @trace REQ-F-007 | SCR-MTR-001 F-SCR-MTR-001-05, UX-SCR-MTR-001-02
  it("회의실이 없으면 빈 안내와 [신규 등록]을 보인다", async () => {
    api.listRooms.mockResolvedValue([]);
    renderScreen(<RoomsPage />);

    expect(await screen.findByText("등록된 회의실이 없습니다. 신규 등록해 주세요.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "신규 등록" }).length).toBeGreaterThan(0);
  });

  // @trace REQ-F-007 | SCR-MTR-001 UX-SCR-MTR-001-03
  it("조회에 실패하면 오류 화면과 다시 시도를 보인다", async () => {
    api.listRooms.mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    renderScreen(<RoomsPage />);

    expect(await screen.findByText("요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });
});
