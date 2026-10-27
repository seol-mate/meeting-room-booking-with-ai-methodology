import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as reservationApi from "@/api/reservation";
import { ApiError } from "@/lib/api-error";
import { staff } from "@/test/fixtures";
import { routerMock } from "@/test/navigation";
import { renderScreen } from "@/test/render";
import JoinPage from "./page";

vi.mock("@/api/reservation");

const api = vi.mocked(reservationApi);

function fill(values: { loginId?: string; name?: string; password?: string }) {
  if (values.loginId !== undefined)
    fireEvent.change(screen.getByTestId("field-loginId"), { target: { value: values.loginId } });
  if (values.name !== undefined)
    fireEvent.change(screen.getByTestId("field-name"), { target: { value: values.name } });
  if (values.password !== undefined)
    fireEvent.change(screen.getByTestId("field-password"), { target: { value: values.password } });
}

describe("SCR-RSV-002 계정 가입", () => {
  // @trace REQ-F-001 | SCR-RSV-002 F-SCR-RSV-002-01
  it("로그인 없이 가입 폼이 바로 보인다", () => {
    renderScreen(<JoinPage />);

    expect(screen.getByTestId("field-loginId")).toBeInTheDocument();
    expect(api.me).not.toHaveBeenCalled();
  });

  // @trace REQ-F-001 | SCR-RSV-002 F-SCR-RSV-002-03
  it("이름·비밀번호 입력이 폼에 반영되고 비밀번호는 마스킹된다", () => {
    renderScreen(<JoinPage />);
    fill({ name: "신입", password: "pw" });

    expect(screen.getByTestId("field-name")).toHaveValue("신입");
    expect(screen.getByTestId("field-password")).toHaveAttribute("type", "password");
  });

  // @trace REQ-F-001 | SCR-RSV-002 F-SCR-RSV-002-02
  it("로그인 ID 입력을 마치면 사용 가능 여부를 확인하고 사용 중이면 안내한다", async () => {
    api.loginIdAvailability.mockResolvedValue({ available: false });
    renderScreen(<JoinPage />);
    fill({ loginId: "staff" });
    fireEvent.blur(screen.getByTestId("field-loginId"));

    expect(await screen.findByText("이미 사용 중인 로그인 ID입니다.")).toBeInTheDocument();
    expect(api.loginIdAvailability).toHaveBeenCalledWith("staff");
  });

  // @trace REQ-F-001 | SCR-RSV-002 V-SCR-RSV-002-01, UX-SCR-RSV-002-01
  it("로그인 ID가 비면 필수 안내를 보이고 호출하지 않는다", async () => {
    renderScreen(<JoinPage />);
    fill({ loginId: " ", name: "신입", password: "pw" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("loginId-error")).toHaveTextContent("필수 항목을 입력해 주세요.");
    expect(api.signup).not.toHaveBeenCalled();
  });

  // @trace REQ-F-001 | SCR-RSV-002 V-SCR-RSV-002-02, UX-SCR-RSV-002-01
  it("이름이 비면 필수 안내를 보인다", async () => {
    renderScreen(<JoinPage />);
    fill({ loginId: "newbie", name: "", password: "pw" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("name-error")).toHaveTextContent("필수 항목을 입력해 주세요.");
  });

  // @trace REQ-F-001 | SCR-RSV-002 V-SCR-RSV-002-03, UX-SCR-RSV-002-01
  it("비밀번호가 비면 필수 안내를 보인다", async () => {
    renderScreen(<JoinPage />);
    fill({ loginId: "newbie", name: "신입", password: "" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("password-error")).toHaveTextContent("필수 항목을 입력해 주세요.");
  });

  // @trace REQ-F-001 | SCR-RSV-002 F-SCR-RSV-002-04, F-SCR-RSV-002-05, UX-SCR-RSV-002-03
  it("가입에 성공하면 로그인 화면으로 이동한다", async () => {
    api.signup.mockResolvedValue(staff);
    renderScreen(<JoinPage />);
    fill({ loginId: "newbie", name: "신입", password: "pw" });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/login?joined=1"));
    expect(api.signup).toHaveBeenCalledWith({ loginId: "newbie", name: "신입", password: "pw" });
  });

  // @trace REQ-F-001 | SCR-RSV-002 F-SCR-RSV-002-06, UX-SCR-RSV-002-02
  it("가입 응답이 중복(409)이면 로그인 ID 필드에 안내한다", async () => {
    api.signup.mockRejectedValue(new ApiError(409, "ERR-4090", "이미 사용 중인 로그인 ID입니다."));
    renderScreen(<JoinPage />);
    fill({ loginId: "staff", name: "신입", password: "pw" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("loginId-error")).toHaveTextContent("이미 사용 중인 로그인 ID입니다.");
  });

  // @trace REQ-F-001 | SCR-RSV-002 F-SCR-RSV-002-07, UX-SCR-RSV-002-04
  it("가입에 실패하면 폼 위에 안내한다", async () => {
    api.signup.mockRejectedValue(new ApiError(500, "ERR-5000", "서버 내부 오류가 발생했습니다."));
    renderScreen(<JoinPage />);
    fill({ loginId: "newbie", name: "신입", password: "pw" });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("form-error")).toHaveTextContent("계정을 만들지 못했습니다.");
  });

  // @trace REQ-F-001 | SCR-RSV-002 UX-SCR-RSV-002-05
  it("처리 중에는 [가입]이 비활성이다", async () => {
    api.signup.mockReturnValue(new Promise(() => {}));
    renderScreen(<JoinPage />);
    fill({ loginId: "newbie", name: "신입", password: "pw" });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(screen.getByTestId("submit-button")).toBeDisabled());
  });

  // @trace REQ-F-001 | SCR-RSV-002 F-SCR-RSV-002-08
  it("[로그인으로 돌아가기]는 로그인 화면으로 연결된다", () => {
    renderScreen(<JoinPage />);

    expect(screen.getByRole("link", { name: "로그인으로 돌아가기" })).toHaveAttribute("href", "/login");
  });
});
