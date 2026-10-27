/**
 * 화면 도메인 타입(domain.ts)이 API 명세서에서 생성한 스키마(api-*.d.ts)와 어긋나지 않는지 컴파일 시점에 확인한다(게이트 im-14.P1).
 * 명세가 바뀌어 `npm run codegen:api`를 다시 돌렸을 때 여기서 typecheck가 실패하면 domain.ts·src/api의 Zod 스키마를 함께 고친다.
 * 시각 필드는 생성 타입이 문자열("YYYY-MM-DDTHH:mm:ss")이고 화면은 초를 뗀 문자열을 쓰므로 형태(string)만 맞춘다.
 */
import type { components as MeetingRoomSchemas } from "./api-meeting-room";
import type { components as ReservationSchemas } from "./api-reservation";
import type {
  AdminReservationItem,
  CancelResult,
  LoginUser,
  MeetingRoom,
  MyReservationItem,
  ReservationStatusItem,
  RoomInput,
} from "./domain";

/** 생성 타입은 null 가능 필드를 선택(optional)으로 두므로, 화면 타입(더 엄격)이 생성 타입에 대입 가능한지를 본다 */
type Assert<Generated, Domain extends Generated> = Domain;

export type ContractChecks = [
  Assert<ReservationSchemas["schemas"]["LoginUser"], LoginUser>,
  Assert<ReservationSchemas["schemas"]["ReservationStatusItem"], ReservationStatusItem>,
  Assert<ReservationSchemas["schemas"]["MyReservationItem"], MyReservationItem>,
  Assert<ReservationSchemas["schemas"]["ReservationCancelResult"], CancelResult>,
  Assert<MeetingRoomSchemas["schemas"]["MeetingRoomItem"], MeetingRoom>,
  Assert<MeetingRoomSchemas["schemas"]["MeetingRoomCreateRequest"], RoomInput>,
  Assert<MeetingRoomSchemas["schemas"]["MeetingRoomUpdateRequest"], RoomInput>,
  Assert<MeetingRoomSchemas["schemas"]["AdminReservationItem"], AdminReservationItem>,
];
