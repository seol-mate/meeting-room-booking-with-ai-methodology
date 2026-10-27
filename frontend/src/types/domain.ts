/** 화면이 다루는 도메인 타입 — 5-IM-12 API 명세서(reservation·meeting-room)의 응답 스키마와 같은 이름·코드값을 쓴다 */
export type UserRole = "USER" | "ROOM_MANAGER";
export type ReservationStatus = "RESERVED" | "CANCELLED";

export type LoginUser = { reserverId: number; name: string; role: UserRole };

export type MeetingRoom = {
  meetingRoomId: number;
  name: string;
  location: string | null;
  capacity: number | null;
  equipment: string | null;
};
export type RoomInput = Omit<MeetingRoom, "meetingRoomId">;

export type ReservationStatusItem = {
  reservationId: number;
  meetingRoomId: number;
  meetingRoomName: string;
  reserverName: string;
  /** "YYYY-MM-DDTHH:mm" 로컬 일시 */
  startAt: string;
  endAt: string;
  title: string | null;
};
export type AdminReservationItem = ReservationStatusItem;

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

export type ReservationInput = { meetingRoomId: number; startAt: string; endAt: string; title: string | null };
export type CreatedReservation = ReservationInput & { reservationId: number; status: ReservationStatus };
export type CancelResult = { reservationId: number; status: ReservationStatus; cancelledAt: string };
