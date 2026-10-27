import { describe, expect, it } from "vitest";
import { fieldErrors, loginSchema, periodSchema, reservationFormSchema, roomFormSchema, signupSchema } from "./schemas";

// @trace REQ-F-001 | SCR-RSV-001 V-SCR-RSV-001-01, V-SCR-RSV-001-02
describe("loginSchema", () => {
  it("로그인 ID와 비밀번호가 비면 각각의 안내 문구를 돌려준다", () => {
    const result = loginSchema.safeParse({ loginId: " ", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({
        loginId: "로그인 ID를 입력해 주세요.",
        password: "비밀번호를 입력해 주세요.",
      });
    }
  });
});

// @trace REQ-F-001 | SCR-RSV-002 V-SCR-RSV-002-01, V-SCR-RSV-002-02, V-SCR-RSV-002-03
describe("signupSchema", () => {
  it("세 항목이 모두 필수다", () => {
    const result = signupSchema.safeParse({ loginId: "", name: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(Object.keys(fieldErrors(result.error)).sort()).toEqual(["loginId", "name", "password"]);
  });
});

// @trace REQ-F-003 | SCR-RSV-004 V-SCR-RSV-004-01
describe("reservationFormSchema", () => {
  const valid = { meetingRoomId: 1, date: "2026-11-02", start: "09:00", end: "10:00", title: "" };

  it("30분 단위로 30분~4시간이면 통과한다", () => {
    expect(reservationFormSchema.safeParse(valid).success).toBe(true);
    expect(reservationFormSchema.safeParse({ ...valid, end: "13:00" }).success).toBe(true);
  });

  it("4시간을 넘거나 종료가 시작보다 이르면 시간 안내 문구로 실패한다", () => {
    for (const end of ["13:30", "08:30", "09:00"]) {
      const result = reservationFormSchema.safeParse({ ...valid, end });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(fieldErrors(result.error).end).toBe("예약은 30분 단위로 최소 30분, 최대 4시간까지 가능합니다.");
      }
    }
  });

  it("회의실을 고르지 않으면 실패한다", () => {
    expect(reservationFormSchema.safeParse({ ...valid, meetingRoomId: Number.NaN }).success).toBe(false);
  });
});

// @trace REQ-F-007 | SCR-MTR-002 V-SCR-MTR-002-01, V-SCR-MTR-002-03
describe("roomFormSchema", () => {
  const valid = { name: "회의실 C", location: "", capacity: "", equipment: "" };

  it("회의실명만 있어도 통과한다(위치·수용 인원·장비는 선택)", () => {
    expect(roomFormSchema.safeParse(valid).success).toBe(true);
  });

  it("회의실명이 비면 안내 문구로 실패한다", () => {
    const result = roomFormSchema.safeParse({ ...valid, name: " " });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).name).toBe("회의실명을 입력해 주세요.");
  });

  it("수용 인원은 양의 정수만 받는다", () => {
    expect(roomFormSchema.safeParse({ ...valid, capacity: "8" }).success).toBe(true);
    expect(roomFormSchema.safeParse({ ...valid, capacity: "-1" }).success).toBe(false);
    expect(roomFormSchema.safeParse({ ...valid, capacity: "2.5" }).success).toBe(false);
  });
});

// @trace REQ-F-008 | SCR-MTR-003 V-SCR-MTR-003-01
describe("periodSchema", () => {
  it("시작일이 종료일보다 늦으면 기간 안내 문구로 실패한다", () => {
    const result = periodSchema.safeParse({ from: "2026-11-05", to: "2026-11-04" });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).to).toBe("조회 기간의 시작일이 종료일보다 늦을 수 없습니다.");
  });

  it("같은 날은 허용한다", () => {
    expect(periodSchema.safeParse({ from: "2026-11-04", to: "2026-11-04" }).success).toBe(true);
  });
});
