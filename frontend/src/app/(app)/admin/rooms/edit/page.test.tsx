import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as meetingRoomApi from "@/api/meeting-room";
import { ApiError } from "@/lib/api-error";
import { rooms } from "@/test/fixtures";
import { routerMock, setSearch } from "@/test/navigation";
import { renderScreen } from "@/test/render";
import { useToastStore } from "@/store/toast-store";
import RoomEditPage from "./page";

vi.mock("@/api/meeting-room");

const api = vi.mocked(meetingRoomApi);

function fill(values: { name?: string; location?: string; capacity?: string; equipment?: string }) {
  const set = (id: string, v?: string) => v !== undefined && fireEvent.change(screen.getByTestId(id), { target: { value: v } });
  set("field-name", values.name);
  set("field-location", values.location);
  set("field-capacity", values.capacity);
  set("field-equipment", values.equipment);
}

describe("SCR-MTR-002 회의실 등록·변경", () => {
  // @trace REQ-F-007 | SCR-MTR-002 UX-SCR-MTR-002-01
  it("변경 대상을 불러오는 동안 로딩 상태를 보인다", () => {
    setSearch("id=1");
    api.getRoom.mockReturnValue(new Promise(() => {}));
    renderScreen(<RoomEditPage />);

    expect(screen.getByRole("status", { name: "불러오는 중입니다" })).toBeInTheDocument();
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-02
  it("주소에 id가 있으면 대상 회의실을 조회해 폼에 채우고 없으면 신규 폼이다", async () => {
    setSearch("id=1");
    api.getRoom.mockResolvedValue(rooms[0]);
    renderScreen(<RoomEditPage />);

    expect(await screen.findByDisplayValue("회의실 A")).toBeInTheDocument();
    expect(api.getRoom).toHaveBeenCalledWith(1);
    expect(screen.getByTestId("field-capacity")).toHaveValue(8);
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-02
  it("id가 없으면 빈 신규 폼을 보이고 조회하지 않는다", () => {
    renderScreen(<RoomEditPage />);

    expect(screen.getByTestId("field-name")).toHaveValue("");
    expect(api.getRoom).not.toHaveBeenCalled();
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-03
  it("네 항목의 입력이 폼에 반영된다", () => {
    renderScreen(<RoomEditPage />);
    fill({ name: "회의실 C", location: "별관", capacity: "6", equipment: "화이트보드" });

    expect(screen.getByTestId("field-name")).toHaveValue("회의실 C");
    expect(screen.getByTestId("field-location")).toHaveValue("별관");
    expect(screen.getByTestId("field-capacity")).toHaveValue(6);
    expect(screen.getByTestId("field-equipment")).toHaveValue("화이트보드");
  });

  // @trace REQ-F-007 | SCR-MTR-002 V-SCR-MTR-002-01, F-SCR-MTR-002-05, UX-SCR-MTR-002-02
  it("회의실명이 비어 있으면 안내를 보이고 호출하지 않는다", async () => {
    renderScreen(<RoomEditPage />);
    fill({ name: "   " });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("name-error")).toHaveTextContent("회의실명을 입력해 주세요.");
    expect(api.createRoom).not.toHaveBeenCalled();
  });

  // @trace REQ-F-007 | SCR-MTR-002 V-SCR-MTR-002-02
  it("길이 상한은 입력 길이 제한으로 막는다", () => {
    renderScreen(<RoomEditPage />);

    expect(screen.getByTestId("field-name")).toHaveAttribute("maxlength", "100");
    expect(screen.getByTestId("field-location")).toHaveAttribute("maxlength", "200");
    expect(screen.getByTestId("field-equipment")).toHaveAttribute("maxlength", "500");
  });

  // @trace REQ-F-007 | SCR-MTR-002 V-SCR-MTR-002-03
  it("수용 인원은 숫자 입력이고 정수가 아니면 저장하지 않는다", () => {
    renderScreen(<RoomEditPage />);
    fill({ name: "회의실 C", capacity: "2.5" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(screen.getByTestId("field-capacity")).toHaveAttribute("type", "number");
    expect(api.createRoom).not.toHaveBeenCalled();
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-04, F-SCR-MTR-002-06, UX-SCR-MTR-002-04
  it("신규 저장은 등록 API를 호출하고 성공하면 토스트 후 목록으로 이동한다", async () => {
    api.createRoom.mockResolvedValue(rooms[0]);
    renderScreen(<RoomEditPage />);
    fill({ name: "회의실 C", location: "", capacity: "6", equipment: "" });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() =>
      expect(api.createRoom).toHaveBeenCalledWith({ name: "회의실 C", location: null, capacity: 6, equipment: null }),
    );
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/admin/rooms"));
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain("회의실 정보가 저장되었습니다.");
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-04, UX-SCR-MTR-002-04
  it("변경 저장은 변경 API를 호출한다", async () => {
    setSearch("id=1");
    api.getRoom.mockResolvedValue(rooms[0]);
    api.updateRoom.mockResolvedValue(rooms[0]);
    renderScreen(<RoomEditPage />);
    await screen.findByDisplayValue("회의실 A");
    fill({ name: "회의실 A2" });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() =>
      expect(api.updateRoom).toHaveBeenCalledWith(1, {
        name: "회의실 A2",
        location: "본관 3층",
        capacity: 8,
        equipment: "모니터",
      }),
    );
  });

  // @trace REQ-F-007 | SCR-MTR-002 UX-SCR-MTR-002-03
  it("서버가 입력 오류(400)를 알리면 회의실명 아래에 안내한다", async () => {
    api.createRoom.mockRejectedValue(new ApiError(400, "ERR-4000", "회의실명을 입력해 주세요."));
    renderScreen(<RoomEditPage />);
    fill({ name: "회의실 C" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("name-error")).toHaveTextContent("회의실명을 입력해 주세요.");
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-07, UX-SCR-MTR-002-05
  it("저장에 실패하면 폼 위에 안내한다", async () => {
    api.createRoom.mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    renderScreen(<RoomEditPage />);
    fill({ name: "회의실 C" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("form-error")).toHaveTextContent("회의실 정보를 저장하지 못했습니다.");
  });

  // @trace REQ-F-007 | SCR-MTR-002 UX-SCR-MTR-002-06
  it("변경 대상이 없으면(404) 오류 화면을 보인다", async () => {
    setSearch("id=99");
    api.getRoom.mockRejectedValue(new ApiError(404, "ERR-4040", "존재하지 않는 회의실입니다."));
    renderScreen(<RoomEditPage />);

    expect(await screen.findByText("요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이전 화면" })).toBeInTheDocument();
  });

  // @trace REQ-F-007 | SCR-MTR-002 UX-SCR-MTR-002-08
  it("처리 중에는 [저장]이 비활성이다", async () => {
    api.createRoom.mockReturnValue(new Promise(() => {}));
    renderScreen(<RoomEditPage />);
    fill({ name: "회의실 C" });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(screen.getByTestId("submit-button")).toBeDisabled());
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-08
  it("[취소]는 목록 화면으로 연결된다", () => {
    renderScreen(<RoomEditPage />);

    expect(screen.getByRole("link", { name: "취소" })).toHaveAttribute("href", "/admin/rooms");
  });
});
