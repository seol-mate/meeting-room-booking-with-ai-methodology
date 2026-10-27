/**
 * mock API — 5-IM-12 API 명세서(reservation·meeting-room)의 operation을 브라우저 안에서 흉내 낸다.
 * 화면은 이 계층을 React Query 훅(src/hooks)으로만 부른다. API 결선(5-IM-14)에서 이 파일의 함수 본문을
 * 실제 HTTP 호출로 바꾸고 src/mock을 걷어낸다. 서버가 하는 검증·권한·상태 코드 배정을 같은 규칙으로 따른다.
 */
import { ApiError } from "@/lib/api-error";
import { t } from "@/lib/messages";
import { isValidReservationPeriod, nowLocal, splitLocalDateTime } from "@/lib/time";
import type { MeetingRoom, MockReservation, MockUser, ReservationStatus, UserRole } from "@/mock/data";
import { useMockDb } from "@/mock/db";

/** 모의 응답 지연(ms) — 로딩 상태를 눈으로 볼 수 있게 한다. 테스트에서는 0으로 둔다 */
let latencyMs = 150;
export function setMockLatency(ms: number) {
  latencyMs = ms;
}
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, latencyMs));

export type LoginUser = { reserverId: number; name: string; role: UserRole };
export type ReservationStatusItem = {
  reservationId: number;
  meetingRoomId: number;
  meetingRoomName: string;
  reserverName: string;
  startAt: string;
  endAt: string;
  title: string | null;
};
export type MyReservationItem = {
  reservationId: number;
  meetingRoomId: number;
  meetingRoomName: string;
  startAt: string;
  endAt: string;
  title: string | null;
  status: ReservationStatus;
  cancelledAt: string | null;
};
export type AdminReservationItem = ReservationStatusItem;
export type RoomInput = { name: string; location: string | null; capacity: number | null; equipment: string | null };
export type ReservationInput = { meetingRoomId: number; startAt: string; endAt: string; title: string | null };

const db = () => useMockDb.getState();

function unauthorized(): ApiError {
  return new ApiError(401, "ERR-4010", t("rsv.login.access.required"));
}

function currentUser(): MockUser {
  const { sessionUserId, users } = db();
  const user = users.find((u) => u.reserverId === sessionUserId);
  if (!user) throw unauthorized();
  return user;
}

function managerUser(): MockUser {
  const user = currentUser();
  if (user.role !== "ROOM_MANAGER") throw new ApiError(403, "ERR-4030", t("common.state.forbidden"));
  return user;
}

const toLoginUser = (u: MockUser): LoginUser => ({ reserverId: u.reserverId, name: u.name, role: u.role });
const roomName = (id: number) => db().rooms.find((r) => r.meetingRoomId === id)?.name ?? "";
const reserverName = (id: number) => db().users.find((u) => u.reserverId === id)?.name ?? "";

// ───────────── 계정 (reservation-001 ~ 004) ─────────────

export async function login(req: { loginId: string; password: string }): Promise<LoginUser> {
  await wait();
  const user = db().users.find((u) => u.loginId === req.loginId && u.password === req.password);
  if (!user) throw new ApiError(400, "ERR-4000", t("rsv.login.submit.failed"));
  useMockDb.setState({ sessionUserId: user.reserverId });
  return toLoginUser(user);
}

export async function me(): Promise<LoginUser> {
  await wait();
  return toLoginUser(currentUser());
}

/** 로그아웃 요구사항은 미확정(조건 C4)이라 API 명세서에 operation이 없다 — 프로토타입에서만 세션을 비운다 */
export async function logout(): Promise<void> {
  await wait();
  useMockDb.setState({ sessionUserId: null });
}

export async function signup(req: { loginId: string; name: string; password: string }): Promise<LoginUser> {
  await wait();
  if (db().users.some((u) => u.loginId === req.loginId)) {
    throw new ApiError(409, "ERR-4090", t("rsv.join.id.duplicate"));
  }
  const nextId = Math.max(0, ...db().users.map((u) => u.reserverId)) + 1;
  const user: MockUser = { reserverId: nextId, loginId: req.loginId, password: req.password, name: req.name, role: "USER" };
  useMockDb.setState({ users: [...db().users, user] });
  return toLoginUser(user);
}

export async function loginIdAvailability(loginId: string): Promise<{ available: boolean }> {
  await wait();
  return { available: !db().users.some((u) => u.loginId === loginId) };
}

// ───────────── 회의실 (meeting-room-001 ~ 004) ─────────────

export async function listRooms(): Promise<MeetingRoom[]> {
  await wait();
  currentUser();
  return [...db().rooms].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export async function getRoom(meetingRoomId: number): Promise<MeetingRoom> {
  await wait();
  managerUser();
  const room = db().rooms.find((r) => r.meetingRoomId === meetingRoomId);
  if (!room) throw new ApiError(404, "ERR-4040", t("common.state.error"));
  return room;
}

function validateRoom(input: RoomInput) {
  if (!input.name.trim() || input.name.length > 100) {
    throw new ApiError(400, "ERR-4000", t("mtr.edit.name.required"));
  }
}

export async function createRoom(input: RoomInput): Promise<MeetingRoom> {
  await wait();
  managerUser();
  validateRoom(input);
  const nextId = Math.max(0, ...db().rooms.map((r) => r.meetingRoomId)) + 1;
  const room: MeetingRoom = { meetingRoomId: nextId, ...input };
  useMockDb.setState({ rooms: [...db().rooms, room] });
  return room;
}

export async function updateRoom(meetingRoomId: number, input: RoomInput): Promise<MeetingRoom> {
  await wait();
  managerUser();
  validateRoom(input);
  const existing = db().rooms.find((r) => r.meetingRoomId === meetingRoomId);
  if (!existing) throw new ApiError(404, "ERR-4040", t("common.state.error"));
  const room: MeetingRoom = { meetingRoomId, ...input };
  useMockDb.setState({ rooms: db().rooms.map((r) => (r.meetingRoomId === meetingRoomId ? room : r)) });
  return room;
}

// ───────────── 예약 (reservation-005 ~ 008, meeting-room-005) ─────────────

/** 회의 제목은 예약자 본인과 ROOM_MANAGER에게만 보인다 (C-RSV-STS-002) */
function visibleTitle(reservation: MockReservation, user: MockUser): string | null {
  return user.role === "ROOM_MANAGER" || reservation.reserverId === user.reserverId ? reservation.title : null;
}

const byStart = (a: MockReservation, b: MockReservation) => a.startAt.localeCompare(b.startAt);

export async function listReservationStatus(params: {
  date: string;
  meetingRoomId?: number;
}): Promise<ReservationStatusItem[]> {
  await wait();
  const user = currentUser();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) throw new ApiError(400, "ERR-4000", t("rsv.status.list.failed"));
  return db()
    .reservations.filter(
      (r) =>
        r.status === "RESERVED" &&
        r.startAt.startsWith(params.date) &&
        (params.meetingRoomId === undefined || r.meetingRoomId === params.meetingRoomId),
    )
    .sort(byStart)
    .map((r) => ({
      reservationId: r.reservationId,
      meetingRoomId: r.meetingRoomId,
      meetingRoomName: roomName(r.meetingRoomId),
      reserverName: reserverName(r.reserverId),
      startAt: r.startAt,
      endAt: r.endAt,
      title: visibleTitle(r, user),
    }));
}

export async function createReservation(input: ReservationInput): Promise<MyReservationItem> {
  await wait();
  const user = currentUser();
  if (!db().rooms.some((r) => r.meetingRoomId === input.meetingRoomId)) {
    throw new ApiError(404, "ERR-4040", t("rsv.new.submit.failed"));
  }
  if (!isValidReservationPeriod(input.startAt, input.endAt)) {
    throw new ApiError(422, "ERR-4220", t("rsv.new.time.invalid"));
  }
  const overlaps = db().reservations.some(
    (r) =>
      r.status === "RESERVED" &&
      r.meetingRoomId === input.meetingRoomId &&
      r.startAt < input.endAt &&
      input.startAt < r.endAt,
  );
  if (overlaps) throw new ApiError(409, "ERR-4090", t("rsv.new.time.overlap"));

  const reservation: MockReservation = {
    reservationId: Math.max(0, ...db().reservations.map((r) => r.reservationId)) + 1,
    meetingRoomId: input.meetingRoomId,
    reserverId: user.reserverId,
    startAt: input.startAt,
    endAt: input.endAt,
    title: input.title && input.title.trim() ? input.title.trim() : null,
    status: "RESERVED",
    cancelledAt: null,
    cancelledBy: null,
  };
  useMockDb.setState({ reservations: [...db().reservations, reservation] });
  return toMyItem(reservation);
}

function toMyItem(r: MockReservation): MyReservationItem {
  return {
    reservationId: r.reservationId,
    meetingRoomId: r.meetingRoomId,
    meetingRoomName: roomName(r.meetingRoomId),
    startAt: r.startAt,
    endAt: r.endAt,
    title: r.title,
    status: r.status,
    cancelledAt: r.cancelledAt,
  };
}

export async function listMyReservations(): Promise<MyReservationItem[]> {
  await wait();
  const user = currentUser();
  return db()
    .reservations.filter((r) => r.reserverId === user.reserverId)
    .sort((a, b) => b.startAt.localeCompare(a.startAt))
    .map(toMyItem);
}

export async function cancelReservation(
  reservationId: number,
): Promise<{ reservationId: number; status: ReservationStatus; cancelledAt: string }> {
  await wait();
  const user = currentUser();
  const target = db().reservations.find((r) => r.reservationId === reservationId);
  if (!target) throw new ApiError(404, "ERR-4040", t("rsv.my.cancel.failed"));
  if (target.reserverId !== user.reserverId && user.role !== "ROOM_MANAGER") {
    throw new ApiError(403, "ERR-4030", t("common.state.forbidden"));
  }
  if (target.status === "CANCELLED") throw new ApiError(422, "ERR-4220", t("rsv.my.cancel.failed"));
  if (target.startAt <= nowLocal()) throw new ApiError(422, "ERR-4220", t("rsv.my.cancel.started"));

  const cancelledAt = nowLocal();
  useMockDb.setState({
    reservations: db().reservations.map((r) =>
      r.reservationId === reservationId
        ? { ...r, status: "CANCELLED" as const, cancelledAt, cancelledBy: user.reserverId }
        : r,
    ),
  });
  return { reservationId, status: "CANCELLED", cancelledAt };
}

export async function listAdminReservations(params: {
  from: string;
  to: string;
  meetingRoomId?: number;
}): Promise<AdminReservationItem[]> {
  await wait();
  managerUser();
  if (params.from > params.to) throw new ApiError(400, "ERR-4000", t("mtr.all.period.invalid"));
  return db()
    .reservations.filter((r) => {
      const day = splitLocalDateTime(r.startAt).date;
      return (
        r.status === "RESERVED" &&
        day >= params.from &&
        day <= params.to &&
        (params.meetingRoomId === undefined || r.meetingRoomId === params.meetingRoomId)
      );
    })
    .sort(byStart)
    .map((r) => ({
      reservationId: r.reservationId,
      meetingRoomId: r.meetingRoomId,
      meetingRoomName: roomName(r.meetingRoomId),
      reserverName: reserverName(r.reserverId),
      startAt: r.startAt,
      endAt: r.endAt,
      title: r.title,
    }));
}
