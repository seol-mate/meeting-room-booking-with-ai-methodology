import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import * as meetingRoomApi from "@/api/meeting-room";
import * as reservationApi from "@/api/reservation";
import { ApiError } from "@/lib/api-error";
import { http } from "@/lib/axios";

type Reply = { status: number; data: unknown };
let reply: Reply = { status: 200, data: {} };
let last: InternalAxiosRequestConfig | undefined;

const meta = { requestId: "r-1", timestamp: "2030-01-02T09:00:00+09:00" };
const ok = (data: unknown, status = 200): Reply => ({ status, data: { success: true, data, error: null, meta } });
const fail = (status: number, code: string, message: string, errors?: unknown[]): Reply => ({
  status,
  data: { success: false, data: null, error: { code, message, errors }, meta },
});

beforeEach(() => {
  last = undefined;
  http.defaults.adapter = async (config) => {
    last = config;
    const settled = { data: reply.data, status: reply.status, statusText: "", headers: {}, config };
    if (reply.status >= 400) {
      const { AxiosError } = await import("axios");
      throw new AxiosError("failed", "ERR_BAD_RESPONSE", config, null, settled);
    }
    return settled;
  };
});

describe("API 계층 — 요청 형식", () => {
  // @trace REQ-F-001 | SCR-RSV-001 F-SCR-RSV-001-04
  it("로그인은 POST api/v1/auth/login으로 본문을 보내고 앞에 슬래시를 붙이지 않는다", async () => {
    reply = ok({ reserverId: 2, name: "박직원", role: "USER" });

    const user = await reservationApi.login({ loginId: "staff", password: "pw" });

    expect(last?.method).toBe("post");
    expect(last?.url).toBe("api/v1/auth/login");
    expect(JSON.parse(last?.data)).toEqual({ loginId: "staff", password: "pw" });
    expect(user).toEqual({ reserverId: 2, name: "박직원", role: "USER" });
  });

  // @trace REQ-F-002 | SCR-RSV-003 F-SCR-RSV-003-02
  it("예약 현황은 쿼리 date·meetingRoomId로 호출하고 초를 뗀 로컬 일시로 바꾼다", async () => {
    reply = ok([
      { reservationId: 1, meetingRoomId: 3, meetingRoomName: "A", reserverName: "박직원", startAt: "2030-01-02T09:00:00", endAt: "2030-01-02T10:00:00", title: null },
    ]);

    const items = await reservationApi.listReservationStatus({ date: "2030-01-02", meetingRoomId: 3 });

    expect(last?.url).toBe("api/v1/reservations");
    expect(last?.params).toEqual({ date: "2030-01-02", meetingRoomId: 3 });
    expect(items[0].startAt).toBe("2030-01-02T09:00");
    expect(items[0].title).toBeNull();
  });

  // @trace REQ-F-003 | SCR-RSV-004 F-SCR-RSV-004-04
  it("예약 등록은 POST api/v1/reservations로 보내고 예약자를 보내지 않는다", async () => {
    reply = ok({ reservationId: 5, meetingRoomId: 1, startAt: "2030-01-02T09:00:00", endAt: "2030-01-02T10:00:00", title: null, status: "RESERVED" }, 201);

    const result = await reservationApi.createReservation({
      meetingRoomId: 1,
      startAt: "2030-01-02T09:00",
      endAt: "2030-01-02T10:00",
      title: null,
    });

    expect(last?.url).toBe("api/v1/reservations");
    expect(Object.keys(JSON.parse(last?.data))).toEqual(["meetingRoomId", "startAt", "endAt", "title"]);
    expect(result.startAt).toBe("2030-01-02T09:00");
  });

  // @trace REQ-F-005 | SCR-RSV-005 F-SCR-RSV-005-05
  it("예약 취소는 PATCH api/v1/reservations/{id}/cancel을 호출한다", async () => {
    reply = ok({ reservationId: 7, status: "CANCELLED", cancelledAt: "2030-01-02T09:00:00" });

    const result = await reservationApi.cancelReservation(7);

    expect(last?.method).toBe("patch");
    expect(last?.url).toBe("api/v1/reservations/7/cancel");
    expect(result.cancelledAt).toBe("2030-01-02T09:00");
  });

  // @trace REQ-F-007 | SCR-MTR-002 F-SCR-MTR-002-04
  it("회의실 변경은 PUT api/v1/meeting-rooms/{id}로 전체 항목을 보낸다", async () => {
    reply = ok({ meetingRoomId: 1, name: "A", location: null, capacity: null, equipment: null });

    await meetingRoomApi.updateRoom(1, { name: "A", location: null, capacity: null, equipment: null });

    expect(last?.method).toBe("put");
    expect(last?.url).toBe("api/v1/meeting-rooms/1");
    expect(JSON.parse(last?.data)).toEqual({ name: "A", location: null, capacity: null, equipment: null });
  });

  // @trace REQ-F-008 | SCR-MTR-003 F-SCR-MTR-003-03
  it("전체 예약 조회는 쿼리 from·to를 보내고 회의실 전체면 meetingRoomId를 생략한다", async () => {
    reply = ok([]);

    await meetingRoomApi.listAdminReservations({ from: "2030-01-01", to: "2030-01-07" });

    expect(last?.url).toBe("api/v1/admin/reservations");
    expect(last?.params).toEqual({ from: "2030-01-01", to: "2030-01-07", meetingRoomId: undefined });
  });
});

describe("API 계층 — 응답과 오류", () => {
  // @trace REQ-F-003 | SCR-RSV-004 F-SCR-RSV-004-06, UX-SCR-RSV-004-05
  it("오류 봉투는 상태 코드·오류 코드·메시지를 가진 ApiError로 바뀐다", async () => {
    reply = fail(409, "ERR-4090", "이미 예약된 시간입니다.");

    const error = await reservationApi
      .createReservation({ meetingRoomId: 1, startAt: "2030-01-02T09:00", endAt: "2030-01-02T10:00", title: null })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: "ERR-4090", message: "이미 예약된 시간입니다." });
  });

  // @trace REQ-F-001 | SCR-RSV-002 F-SCR-RSV-002-07, UX-SCR-RSV-002-04
  it("검증 오류 항목(error.errors)을 ApiError에 담는다", async () => {
    reply = fail(400, "ERR-4000", "요청 형식이 올바르지 않습니다.", [{ field: "loginId", value: "", reason: "필수" }]);

    const error = await reservationApi.signup({ loginId: "", name: "x", password: "y" }).catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 400, errors: [{ field: "loginId", reason: "필수" }] });
  });

  // @trace REQ-F-005 | SCR-RSV-005 UX-SCR-RSV-005-08
  it("서버에 닿지 못하면 상태 0의 ApiError가 된다", async () => {
    http.defaults.adapter = async () => {
      const { AxiosError } = await import("axios");
      throw new AxiosError("Network Error", "ERR_NETWORK");
    };

    const error = await reservationApi.listMyReservations().catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 0, code: "ERR-NETWORK" });
  });

  // @trace REQ-F-001 | SCR-RSV-001 F-SCR-RSV-001-01
  it("응답이 명세의 형태가 아니면 오류로 알린다", async () => {
    reply = ok({ unexpected: true });

    await expect(reservationApi.me()).rejects.toThrow();
  });
});
