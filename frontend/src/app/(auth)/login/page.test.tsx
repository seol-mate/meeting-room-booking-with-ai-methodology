import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as reservationApi from "@/api/reservation";
import { ApiError } from "@/lib/api-error";
import { staff } from "@/test/fixtures";
import { routerMock, setSearch } from "@/test/navigation";
import { renderScreen } from "@/test/render";
import LoginPage from "./page";

vi.mock("@/api/reservation");

const api = vi.mocked(reservationApi);

function fill(loginId: string, password: string) {
  fireEvent.change(screen.getByTestId("field-loginId"), { target: { value: loginId } });
  fireEvent.change(screen.getByTestId("field-password"), { target: { value: password } });
}

describe("SCR-RSV-001 로그인", () => {
  beforeEach(() => {
    api.me.mockRejectedValue(new ApiError(401, "ERR-4010", "로그인이 필요합니다."));
  });

  // @trace REQ-F-001 | SCR-RSV-001 UX-SCR-RSV-001-01
  it("로그인 상태를 확인하는 동안 로딩 상태를 보인다", () => {
    api.me.mockReturnValue(new Promise(() => {}));
    renderScreen(<LoginPage />);

    expect(screen.getByRole("status", { name: "불러오는 중입니다" })).toBeInTheDocument();
  });

  // @trace REQ-F-001 | SCR-RSV-001 F-SCR-RSV-001-01
  it("이미 로그인한 사용자는 예약 현황으로 이동한다", async () => {
    api.me.mockResolvedValue(staff);
    renderScreen(<LoginPage />);

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/status"));
  });

  // @trace REQ-F-001 | SCR-RSV-001 F-SCR-RSV-001-02, F-SCR-RSV-001-03
  it("입력값이 폼에 반영되고 비밀번호는 마스킹된다", async () => {
    renderScreen(<LoginPage />);
    await screen.findByTestId("field-loginId");
    fill("staff", "pw-1");

    expect(screen.getByTestId("field-loginId")).toHaveValue("staff");
    expect(screen.getByTestId("field-password")).toHaveValue("pw-1");
    expect(screen.getByTestId("field-password")).toHaveAttribute("type", "password");
  });

  // @trace REQ-F-001 | SCR-RSV-001 V-SCR-RSV-001-01, UX-SCR-RSV-001-02
  it("로그인 ID가 비면 안내 문구를 보이고 호출하지 않는다", async () => {
    renderScreen(<LoginPage />);
    await screen.findByTestId("field-loginId");
    fill("   ", "pw-1");
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByText("로그인 ID를 입력해 주세요.")).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  // @trace REQ-F-001 | SCR-RSV-001 V-SCR-RSV-001-02, UX-SCR-RSV-001-02
  it("비밀번호가 비면 안내 문구를 보이고 호출하지 않는다", async () => {
    renderScreen(<LoginPage />);
    await screen.findByTestId("field-loginId");
    fill("staff", "");
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByText("비밀번호를 입력해 주세요.")).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  // @trace REQ-F-001 | SCR-RSV-001 F-SCR-RSV-001-04
  it("검증을 통과하면 로그인 API를 호출하고 성공하면 예약 현황으로 이동한다", async () => {
    api.login.mockResolvedValue(staff);
    renderScreen(<LoginPage />);
    await screen.findByTestId("field-loginId");
    fill("staff", "pw-1");
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/status"));
    expect(api.login).toHaveBeenCalledWith({ loginId: "staff", password: "pw-1" });
  });

  // @trace REQ-F-001 | SCR-RSV-001 F-SCR-RSV-001-05, UX-SCR-RSV-001-03
  it("로그인 정보가 틀리면 폼 위에 안내하고 입력을 유지한다", async () => {
    api.login.mockRejectedValue(new ApiError(400, "ERR-4000", "로그인 정보가 올바르지 않습니다."));
    renderScreen(<LoginPage />);
    await screen.findByTestId("field-loginId");
    fill("staff", "wrong");
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("form-error")).toHaveTextContent("로그인 정보가 올바르지 않습니다.");
    expect(screen.getByTestId("field-loginId")).toHaveValue("staff");
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  // @trace REQ-F-001 | SCR-RSV-001 F-SCR-RSV-001-06, UX-SCR-RSV-001-04
  it("로그인이 필요해서 이동해 온 경우 안내를 보인다", async () => {
    setSearch("reason=required");
    renderScreen(<LoginPage />);

    expect(await screen.findByTestId("notice")).toHaveTextContent("로그인이 필요합니다.");
  });

  // @trace REQ-F-001 | SCR-RSV-001 UX-SCR-RSV-001-05
  it("서버 오류도 폼 위 안내로 보인다", async () => {
    api.login.mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    renderScreen(<LoginPage />);
    await screen.findByTestId("field-loginId");
    fill("staff", "pw-1");
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("form-error")).toHaveTextContent("로그인 정보가 올바르지 않습니다.");
  });

  // @trace REQ-F-001 | SCR-RSV-001 UX-SCR-RSV-001-06
  it("처리 중에는 [로그인]이 비활성이다", async () => {
    api.login.mockReturnValue(new Promise(() => {}));
    renderScreen(<LoginPage />);
    await screen.findByTestId("field-loginId");
    fill("staff", "pw-1");
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(screen.getByTestId("submit-button")).toBeDisabled());
  });

  // @trace REQ-F-001 | SCR-RSV-001 F-SCR-RSV-001-07
  it("[계정 가입]은 가입 화면으로 연결된다", async () => {
    renderScreen(<LoginPage />);

    expect(await screen.findByRole("link", { name: "계정 가입" })).toHaveAttribute("href", "/join");
  });
});

// @trace REQ-NF-001 | SCR-RSV-001 F-SCR-RSV-001-01
describe("SCR-RSV-001 비기능 — 로그인 가드", () => {
  it("로그인 상태가 아니면 로그인 폼을 그대로 보인다", async () => {
    api.me.mockRejectedValue(new ApiError(401, "ERR-4010", "로그인이 필요합니다."));
    renderScreen(<LoginPage />);

    expect(await screen.findByTestId("submit-button")).toBeInTheDocument();
  });
});
