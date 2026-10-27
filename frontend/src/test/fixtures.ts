import type {
  AdminReservationItem,
  LoginUser,
  MeetingRoom,
  MyReservationItem,
  ReservationStatusItem,
} from "@/types/domain";

export const staff: LoginUser = { reserverId: 2, name: "박직원", role: "USER" };
export const manager: LoginUser = { reserverId: 1, name: "김관리", role: "ROOM_MANAGER" };

export const rooms: MeetingRoom[] = [
  { meetingRoomId: 1, name: "회의실 A", location: "본관 3층", capacity: 8, equipment: "모니터" },
  { meetingRoomId: 2, name: "회의실 B", location: null, capacity: null, equipment: null },
];

export const statusItems: ReservationStatusItem[] = [
  {
    reservationId: 10,
    meetingRoomId: 1,
    meetingRoomName: "회의실 A",
    reserverName: "박직원",
    startAt: "2030-01-02T09:30",
    endAt: "2030-01-02T11:00",
    title: "주간 회의",
  },
  {
    reservationId: 11,
    meetingRoomId: 2,
    meetingRoomName: "회의실 B",
    reserverName: "김관리",
    startAt: "2030-01-02T14:00",
    endAt: "2030-01-02T15:00",
    title: null,
  },
];

export const myItems: MyReservationItem[] = [
  {
    reservationId: 21,
    meetingRoomId: 1,
    meetingRoomName: "회의실 A",
    startAt: "2099-01-02T09:00",
    endAt: "2099-01-02T10:00",
    title: "미래 회의",
    status: "RESERVED",
    cancelledAt: null,
  },
  {
    reservationId: 22,
    meetingRoomId: 1,
    meetingRoomName: "회의실 A",
    startAt: "2020-01-02T09:00",
    endAt: "2020-01-02T10:00",
    title: "지난 회의",
    status: "RESERVED",
    cancelledAt: null,
  },
  {
    reservationId: 23,
    meetingRoomId: 2,
    meetingRoomName: "회의실 B",
    startAt: "2099-02-02T09:00",
    endAt: "2099-02-02T10:00",
    title: null,
    status: "CANCELLED",
    cancelledAt: "2030-01-01T08:30",
  },
];

export const adminItems: AdminReservationItem[] = [
  {
    reservationId: 31,
    meetingRoomId: 1,
    meetingRoomName: "회의실 A",
    reserverName: "박직원",
    startAt: "2099-01-02T09:00",
    endAt: "2099-01-02T10:00",
    title: "미래 회의",
  },
  {
    reservationId: 32,
    meetingRoomId: 2,
    meetingRoomName: "회의실 B",
    reserverName: "김관리",
    startAt: "2020-01-02T09:00",
    endAt: "2020-01-02T10:00",
    title: "지난 회의",
  },
];
