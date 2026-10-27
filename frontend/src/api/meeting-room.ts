/** meeting-room 도메인 API(5-IM-12 meeting-room-001 ~ 005). 경로는 앞 슬래시 없이 쓴다 */
import { z } from "zod";
import type { AdminReservationItem, MeetingRoom, RoomInput } from "@/types/domain";
import { localDateTime, request } from "./client";

const room = z.object({
  meetingRoomId: z.number(),
  name: z.string(),
  location: z.string().nullable(),
  capacity: z.number().nullable(),
  equipment: z.string().nullable(),
});
const adminItem = z.object({
  reservationId: z.number(),
  meetingRoomId: z.number(),
  meetingRoomName: z.string(),
  reserverName: z.string(),
  startAt: localDateTime,
  endAt: localDateTime,
  title: z.string().nullable(),
});

export const listRooms = (): Promise<MeetingRoom[]> =>
  request({ method: "get", url: "api/v1/meeting-rooms" }, z.array(room));

export const getRoom = (meetingRoomId: number): Promise<MeetingRoom> =>
  request({ method: "get", url: `api/v1/meeting-rooms/${meetingRoomId}` }, room);

export const createRoom = (input: RoomInput): Promise<MeetingRoom> =>
  request({ method: "post", url: "api/v1/meeting-rooms", data: input }, room);

export const updateRoom = (meetingRoomId: number, input: RoomInput): Promise<MeetingRoom> =>
  request({ method: "put", url: `api/v1/meeting-rooms/${meetingRoomId}`, data: input }, room);

export const listAdminReservations = (params: {
  from: string;
  to: string;
  meetingRoomId?: number;
}): Promise<AdminReservationItem[]> =>
  request({ method: "get", url: "api/v1/admin/reservations", params }, z.array(adminItem));
