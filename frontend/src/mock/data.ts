/**
 * 시안용 표시 데이터 — 4-DN-38 전체 화면 시안 전용 고정값이다.
 * API 호출이 없고, Frontend 코드 구현(5-IM-14)에서 API 결선 때 걷어낸다.
 * 필드명·코드값은 entities.yaml(4-DN-12)과 코드 정의서(4-DN-21-O2)를 따른다.
 */

export type UserRole = "USER" | "ROOM_MANAGER";
export type ReservationStatus = "RESERVED" | "CANCELLED";

export type CurrentUser = { name: string; role: UserRole };

export type MeetingRoom = {
  meetingRoomId: number;
  name: string;
  location: string;
  capacity: number;
  equipment: string;
};

export type Reservation = {
  reservationId: number;
  meetingRoomId: number;
  reserverId: number;
  reserverName: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  title: string;
  status: ReservationStatus;
  /** 시작 시각이 이미 지난 예약인지(취소 불가 표시용) */
  started: boolean;
  cancelledAt?: string;
};

export const currentUser: CurrentUser = { name: "김관리", role: "ROOM_MANAGER" };

export const sampleDate = "2026-11-02";

export const rooms: MeetingRoom[] = [
  {
    meetingRoomId: 1,
    name: "회의실 A",
    location: "본관 3층",
    capacity: 8,
    equipment: "모니터, 화이트보드",
  },
  {
    meetingRoomId: 2,
    name: "회의실 B",
    location: "본관 3층",
    capacity: 4,
    equipment: "모니터",
  },
  {
    meetingRoomId: 3,
    name: "대회의실",
    location: "별관 1층",
    capacity: 20,
    equipment: "빔프로젝터, 마이크",
  },
];

export const reservations: Reservation[] = [
  {
    reservationId: 101,
    meetingRoomId: 1,
    reserverId: 11,
    reserverName: "김관리",
    date: sampleDate,
    start: "09:30",
    end: "11:00",
    title: "주간 업무 회의",
    status: "RESERVED",
    started: false,
  },
  {
    reservationId: 102,
    meetingRoomId: 1,
    reserverId: 12,
    reserverName: "박직원",
    date: sampleDate,
    start: "14:00",
    end: "15:00",
    title: "신규 입사자 면담",
    status: "RESERVED",
    started: false,
  },
  {
    reservationId: 103,
    meetingRoomId: 2,
    reserverId: 13,
    reserverName: "이직원",
    date: sampleDate,
    start: "10:00",
    end: "10:30",
    title: "1:1 면담",
    status: "RESERVED",
    started: true,
  },
  {
    reservationId: 104,
    meetingRoomId: 3,
    reserverId: 11,
    reserverName: "김관리",
    date: sampleDate,
    start: "13:00",
    end: "17:00",
    title: "분기 워크숍",
    status: "RESERVED",
    started: false,
  },
  {
    reservationId: 105,
    meetingRoomId: 2,
    reserverId: 11,
    reserverName: "김관리",
    date: sampleDate,
    start: "16:00",
    end: "17:00",
    title: "고객사 통화 준비",
    status: "CANCELLED",
    started: false,
    cancelledAt: "2026-10-30 09:12",
  },
];

export function roomName(id: number): string {
  return rooms.find((r) => r.meetingRoomId === id)?.name ?? "";
}

/** 회의 제목은 예약자 본인과 회의실 관리 담당자에게만 보인다 (C-RSV-STS-002) */
export function canSeeTitle(
  reservation: Reservation,
  user: CurrentUser,
): boolean {
  return user.role === "ROOM_MANAGER" || reservation.reserverName === user.name;
}
