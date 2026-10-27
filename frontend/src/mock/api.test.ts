import { beforeEach, describe, expect, it } from "vitest";
import { isApiError } from "@/lib/api-error";
import { addDays, todayString } from "@/lib/time";
import * as api from "./api";
import { useMockDb } from "./db";

const tomorrow = () => addDays(todayString(), 1);
const rejects = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    if (isApiError(error)) return error;
    throw error;
  }
  throw new Error("거부되어야 한다");
};

beforeEach(() => {
  api.setMockLatency(0);
  useMockDb.getState().reset();
});

// @trace REQ-NF-001 | SCR-RSV-001
describe("mock API — 로그인", () => {
  it("로그인하지 않고 호출하면 401이다", async () => {
    expect((await rejects(api.listRooms())).status).toBe(401);
  });

  it("틀린 비밀번호는 400, 맞으면 세션이 시작된다", async () => {
    expect((await rejects(api.login({ loginId: "staff", password: "x" }))).status).toBe(400);
    expect((await api.login({ loginId: "staff", password: "staff1!" })).name).toBe("박직원");
    expect((await api.me()).role).toBe("USER");
  });
});

// @trace REQ-F-001 | SCR-RSV-002
describe("mock API — 계정 가입", () => {
  it("로그인 ID가 겹치면 409, 새 ID는 USER 역할로 가입된다", async () => {
    expect((await rejects(api.signup({ loginId: "staff", name: "x", password: "y" }))).status).toBe(409);
    const user = await api.signup({ loginId: "newbie", name: "신입", password: "pw" });
    expect(user.role).toBe("USER");
    expect((await api.loginIdAvailability("newbie")).available).toBe(false);
  });
});

// @trace REQ-F-003, REQ-F-004 | SCR-RSV-004
describe("mock API — 예약 등록", () => {
  beforeEach(async () => {
    await api.login({ loginId: "staff", password: "staff1!" });
  });

  const at = (time: string) => `${tomorrow()}T${time}`;

  it("겹치는 시간은 409로 거부한다(시드: 회의실 A 내일 09:30~11:00)", async () => {
    const error = await rejects(api.createReservation({ meetingRoomId: 1, startAt: at("10:00"), endAt: at("10:30"), title: null }));
    expect(error.status).toBe(409);
    expect(error.message).toBe("이미 예약된 시간입니다.");
  });

  it("끝과 시작이 맞닿는 예약은 허용한다", async () => {
    const created = await api.createReservation({ meetingRoomId: 1, startAt: at("11:00"), endAt: at("11:30"), title: null });
    expect(created.status).toBe("RESERVED");
  });

  it("4시간을 넘으면 422다", async () => {
    const error = await rejects(api.createReservation({ meetingRoomId: 2, startAt: at("08:00"), endAt: at("12:30"), title: null }));
    expect(error.status).toBe(422);
  });

  it("취소된 예약과 같은 시간에는 다시 예약할 수 있다(시드: 회의실 B 내일 16:00~17:00 취소)", async () => {
    const created = await api.createReservation({ meetingRoomId: 2, startAt: at("16:00"), endAt: at("17:00"), title: "재예약" });
    expect(created.title).toBe("재예약");
  });
});

// @trace REQ-F-002 | SCR-RSV-003
describe("mock API — 예약 현황", () => {
  it("회의 제목은 예약자 본인과 ROOM_MANAGER에게만 보인다", async () => {
    await api.login({ loginId: "staff", password: "staff1!" });
    const asStaff = await api.listReservationStatus({ date: tomorrow() });
    expect(asStaff.find((r) => r.reserverName === "박직원")?.title).toBe("신규 입사자 면담");
    expect(asStaff.find((r) => r.reserverName === "김관리")?.title).toBeNull();

    await api.login({ loginId: "manager", password: "manager1!" });
    const asManager = await api.listReservationStatus({ date: tomorrow() });
    expect(asManager.every((r) => r.title !== null)).toBe(true);
  });

  it("취소된 예약은 현황에 나오지 않는다", async () => {
    await api.login({ loginId: "staff", password: "staff1!" });
    const list = await api.listReservationStatus({ date: tomorrow() });
    expect(list.some((r) => r.title === "고객사 통화 준비")).toBe(false);
  });
});

// @trace REQ-F-005, REQ-F-006 | SCR-RSV-005
describe("mock API — 예약 취소", () => {
  it("본인 예약은 시작 전이면 취소되고 이력이 남는다", async () => {
    await api.login({ loginId: "staff", password: "staff1!" });
    const result = await api.cancelReservation(3);
    expect(result.status).toBe("CANCELLED");
    const mine = await api.listMyReservations();
    expect(mine.find((r) => r.reservationId === 3)?.cancelledAt).not.toBeNull();
  });

  it("이미 시작한 예약은 422다(시드: 어제 예약)", async () => {
    await api.login({ loginId: "staff", password: "staff1!" });
    const error = await rejects(api.cancelReservation(1));
    expect(error.status).toBe(422);
    expect(error.message).toBe("시작된 예약은 취소할 수 없습니다.");
  });

  it("다른 사람 예약은 일반 사용자에게 403, 관리 담당자에게는 허용된다", async () => {
    await api.login({ loginId: "staff", password: "staff1!" });
    expect((await rejects(api.cancelReservation(2))).status).toBe(403);
    await api.login({ loginId: "manager", password: "manager1!" });
    expect((await api.cancelReservation(3)).status).toBe("CANCELLED");
  });
});

// @trace REQ-F-007, REQ-F-008 | SCR-MTR-002
describe("mock API — 회의실 관리와 전체 예약", () => {
  it("일반 사용자는 회의실을 등록할 수 없다(403)", async () => {
    await api.login({ loginId: "staff", password: "staff1!" });
    const input = { name: "회의실 C", location: null, capacity: null, equipment: null };
    expect((await rejects(api.createRoom(input))).status).toBe(403);
  });

  it("관리 담당자가 등록·변경하면 목록에 반영된다", async () => {
    await api.login({ loginId: "manager", password: "manager1!" });
    const room = await api.createRoom({ name: "회의실 C", location: "별관 2층", capacity: 6, equipment: null });
    await api.updateRoom(room.meetingRoomId, { name: "회의실 C2", location: "별관 2층", capacity: 6, equipment: null });
    expect((await api.listRooms()).some((r) => r.name === "회의실 C2")).toBe(true);
  });

  it("전체 예약 조회는 기간 오류를 400으로 거부하고 취소된 예약을 제외한다", async () => {
    await api.login({ loginId: "manager", password: "manager1!" });
    expect((await rejects(api.listAdminReservations({ from: "2026-11-05", to: "2026-11-04" }))).status).toBe(400);
    const list = await api.listAdminReservations({ from: todayString(), to: addDays(todayString(), 7) });
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((r) => r.title === "고객사 통화 준비")).toBe(false);
  });
});
