/** reservation 도메인 API(5-IM-12 reservation-001 ~ 008). 경로는 앞 슬래시 없이 쓴다 — baseURL 뒤에 붙는다 */
import { z } from "zod";
import type {
  CancelResult,
  CreatedReservation,
  LoginUser,
  MyReservationItem,
  ReservationInput,
  ReservationStatusItem,
} from "@/types/domain";
import { localDateTime, request } from "./client";

const statusCode = z.enum(["RESERVED", "CANCELLED"]);
const loginUser = z.object({ reserverId: z.number(), name: z.string(), role: z.enum(["USER", "ROOM_MANAGER"]) });
const statusItem = z.object({
  reservationId: z.number(),
  meetingRoomId: z.number(),
  meetingRoomName: z.string(),
  reserverName: z.string(),
  startAt: localDateTime,
  endAt: localDateTime,
  title: z.string().nullable(),
});
const myItem = z.object({
  reservationId: z.number(),
  meetingRoomId: z.number(),
  meetingRoomName: z.string(),
  startAt: localDateTime,
  endAt: localDateTime,
  title: z.string().nullable(),
  status: statusCode,
  cancelledAt: localDateTime.nullable(),
});
const created = z.object({
  reservationId: z.number(),
  meetingRoomId: z.number(),
  startAt: localDateTime,
  endAt: localDateTime,
  title: z.string().nullable(),
  status: statusCode,
});
const cancelResult = z.object({ reservationId: z.number(), status: statusCode, cancelledAt: localDateTime });

export const login = (req: { loginId: string; password: string }): Promise<LoginUser> =>
  request({ method: "post", url: "api/v1/auth/login", data: req }, loginUser);

export const me = (): Promise<LoginUser> => request({ method: "get", url: "api/v1/auth/me" }, loginUser);

export const signup = (req: { loginId: string; name: string; password: string }): Promise<LoginUser> =>
  request({ method: "post", url: "api/v1/auth/signup", data: req }, loginUser);

export const loginIdAvailability = (loginId: string): Promise<{ available: boolean }> =>
  request(
    { method: "get", url: "api/v1/auth/login-id-availability", params: { loginId } },
    z.object({ available: z.boolean() }),
  );

export const listReservationStatus = (params: { date: string; meetingRoomId?: number }): Promise<ReservationStatusItem[]> =>
  request({ method: "get", url: "api/v1/reservations", params }, z.array(statusItem));

export const createReservation = (input: ReservationInput): Promise<CreatedReservation> =>
  request(
    {
      method: "post",
      url: "api/v1/reservations",
      data: { meetingRoomId: input.meetingRoomId, startAt: input.startAt, endAt: input.endAt, title: input.title },
    },
    created,
  );

export const listMyReservations = (): Promise<MyReservationItem[]> =>
  request({ method: "get", url: "api/v1/reservations/mine" }, z.array(myItem));

export const cancelReservation = (reservationId: number): Promise<CancelResult> =>
  request({ method: "patch", url: `api/v1/reservations/${reservationId}/cancel` }, cancelResult);
