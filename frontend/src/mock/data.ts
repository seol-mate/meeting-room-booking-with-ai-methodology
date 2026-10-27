/**
 * 시안·프로토타입용 고정 데이터 — 전체 화면 코드베이스 통합(5-IM-11)의 mock 계층 전용이다.
 * API 결선(5-IM-14)에서 src/mock 전체를 걷어낸다. 필드명·코드값은 entities.yaml(4-DN-12)과 코드 정의서(4-DN-21-O2)를 따른다.
 */
import { addDays, todayString } from "@/lib/time";

export type UserRole = "USER" | "ROOM_MANAGER";
export type ReservationStatus = "RESERVED" | "CANCELLED";

/** mock 계정 — 비밀번호를 평문으로 둔다. 실제 시스템에서는 해시로만 저장한다 */
export type MockUser = {
  reserverId: number;
  loginId: string;
  password: string;
  name: string;
  role: UserRole;
};

export type MeetingRoom = {
  meetingRoomId: number;
  name: string;
  location: string | null;
  capacity: number | null;
  equipment: string | null;
};

export type MockReservation = {
  reservationId: number;
  meetingRoomId: number;
  reserverId: number;
  startAt: string;
  endAt: string;
  title: string | null;
  status: ReservationStatus;
  cancelledAt: string | null;
  cancelledBy: number | null;
};

export type MockData = {
  users: MockUser[];
  rooms: MeetingRoom[];
  reservations: MockReservation[];
};

/** 오늘 기준 상대 날짜로 만든 초기 데이터 — 이미 시작한 예약과 앞으로의 예약을 함께 둔다 */
export function seed(): MockData {
  const today = todayString();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const inTwoDays = addDays(today, 2);

  const reservation = (
    reservationId: number,
    meetingRoomId: number,
    reserverId: number,
    day: string,
    start: string,
    end: string,
    title: string | null,
    cancelled = false,
  ): MockReservation => ({
    reservationId,
    meetingRoomId,
    reserverId,
    startAt: `${day}T${start}`,
    endAt: `${day}T${end}`,
    title,
    status: cancelled ? "CANCELLED" : "RESERVED",
    cancelledAt: cancelled ? `${yesterday}T09:12` : null,
    cancelledBy: cancelled ? reserverId : null,
  });

  return {
    users: [
      { reserverId: 1, loginId: "manager", password: "manager1!", name: "김관리", role: "ROOM_MANAGER" },
      { reserverId: 2, loginId: "staff", password: "staff1!", name: "박직원", role: "USER" },
    ],
    rooms: [
      { meetingRoomId: 1, name: "회의실 A", location: "본관 3층", capacity: 8, equipment: "모니터, 화이트보드" },
      { meetingRoomId: 2, name: "회의실 B", location: "본관 3층", capacity: 4, equipment: "모니터" },
      { meetingRoomId: 3, name: "대회의실", location: "별관 1층", capacity: 20, equipment: "빔프로젝터, 마이크" },
    ],
    reservations: [
      reservation(1, 2, 2, yesterday, "10:00", "10:30", "1:1 면담"),
      reservation(2, 1, 1, tomorrow, "09:30", "11:00", "주간 업무 회의"),
      reservation(3, 1, 2, tomorrow, "14:00", "15:00", "신규 입사자 면담"),
      reservation(4, 3, 1, inTwoDays, "13:00", "17:00", "분기 워크숍"),
      reservation(5, 2, 2, tomorrow, "16:00", "17:00", "고객사 통화 준비", true),
    ],
  };
}
