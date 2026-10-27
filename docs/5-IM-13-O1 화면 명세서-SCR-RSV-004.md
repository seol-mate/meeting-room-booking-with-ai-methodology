# 5-IM-13-O1 화면 명세서-SCR-RSV-004

## 1. 문서 정보

| 항목 | 내용 |
|---|---|
| 프로젝트명 | 회의실 예약 시스템 |
| 작성자 | 설동혁 (DV) |
| 작성일 | 2026-10-27 |
| 버전 | 1.0 |

## 2. 개요

| 항목 | 내용 |
|---|---|
| screen_id | `SCR-RSV-004` |
| 화면명 | 회의실 예약 |
| 라우트 | `src/app/(app)/reservations/new/page.tsx` |
| 관련 엔티티 | `reservation`(ENT-02), `meeting_room`(ENT-01) |
| 근거 요구사항 | REQ-F-003, REQ-F-004 |
| 문서 목적 | 회의실 예약 화면의 기능·클라이언트 검증·API 연동 구현 기준 |

---

## 3. 화면 기능·UI 동작

### 3.1 화면 흐름

```text
진입(로그인 가드) → 회의실 목록 로드(meeting-room-001)
  → 회의실·날짜·시작·종료 시각(30분 단위)·회의 제목 입력
  → [예약] → 클라이언트 검증 → reservation-006 호출
  → 성공: SCR-RSV-005 이동 / 겹침·시간 규칙 위반·실패: 인라인 안내
  → [취소] → SCR-RSV-003 이동
```

### 3.2 UI 이벤트

| 이벤트 ID | UI 요소 / 이벤트 | 동작 | message_key | 비고 |
|---|---|---|---|---|
| `F-SCR-RSV-004-01` | 화면 진입 | 로그인 가드가 로그인 사용자만 통과 | `rsv.login.access.required` | C-RSV-NEW-001, C-CMN-03 |
| `F-SCR-RSV-004-02` | 마운트 | 회의실 선택 목록을 조회 | — | §3.4 `외부(도메인 meeting-room): meeting-room-001` |
| `F-SCR-RSV-004-03` | 회의실·날짜·시각·제목 입력 | 폼 상태에 반영. 시작·종료 선택지는 00:00~23:30 30분 단위 | — | C-CMN-05, C-RSV-NEW-005 |
| `F-SCR-RSV-004-04` | [예약] 클릭 | 회의실을 고른 경우에만 활성. 클라이언트 검증 통과 시 `reservation-006` 호출 | — | C-RSV-NEW-002, C-RSV-NEW-004 |
| `F-SCR-RSV-004-05` | 시간 규칙 위반(클라이언트·서버 422) | 종료 시각 아래 인라인 안내 | `rsv.new.time.invalid` | C-RSV-NEW-002 |
| `F-SCR-RSV-004-06` | 겹침 응답(409) | 종료 시각 아래 인라인 안내, 기존 예약은 바뀌지 않음 | `rsv.new.time.overlap` | C-RSV-NEW-003 |
| `F-SCR-RSV-004-07` | 예약 성공 응답 | 토스트를 보이고 SCR-RSV-005로 이동 | `rsv.new.submit.success` | 와이어프레임 §4 |
| `F-SCR-RSV-004-08` | 예약 실패 응답 | 폼 위 인라인 안내 | `rsv.new.submit.failed` | — |
| `F-SCR-RSV-004-09` | [취소] 클릭 | SCR-RSV-003으로 이동 | — | 와이어프레임 §4 |

### 3.3 인가·업무 제약

| 제약 ID | UI 반영 |
|---|---|
| C-RSV-NEW-001 | 로그인한 `USER`·`ROOM_MANAGER`만 접근(로그인 가드) |
| C-RSV-NEW-002 | 30분 단위(선택지 고정), 최소 30분·최대 4시간, 종료가 시작보다 늦어야 함(§4 V-01) — 서버도 같은 규칙을 422로 검증 |
| C-RSV-NEW-003 | 겹침은 서버가 판정한다(`reservation-006` 409). 화면은 안내만 하고 기존 예약을 바꾸지 않는다 |
| C-RSV-NEW-004 | 요청에 예약자를 넣지 않는다(서버가 로그인 사용자로 등록). 화면에 예약자 입력을 두지 않는다 |
| C-RSV-NEW-005 | 회의 제목은 선택 입력(필수 여부 미확정 항목 C1) — 필수 검증을 두지 않는다 |

### 3.4 셀렉트박스 / 공통코드

| 필드명 | 코드그룹 | 로드 시점 | API |
|---|---|---|---|
| 회의실 | — (회의실 마스터) | 마운트 | `외부(도메인 meeting-room): meeting-room-001` |
| 시작 시각·종료 시각 | — (고정 목록, 30분 단위) | 화면 상수 | —(API 없음, 00:00 ~ 23:30) |

---

## 4. 클라이언트 검증 (Validation)

| 검증 ID | 대상 필드·조건 | 시점 | message_key | 판정 층위 | 근거 |
|---|---|---|---|---|---|
| `V-SCR-RSV-004-01` | 종료 시각이 시작 시각보다 늦지 않거나 길이가 30분 미만·4시간 초과 | [예약] submit | `rsv.new.time.invalid` | 함수 | C-RSV-NEW-002 · REQ-F-003 |
| `V-SCR-RSV-004-02` | 회의실을 선택하지 않음 | [예약] 활성 조건 | — | 컴포넌트 | `ReservationCreateRequest.meetingRoomId` required — 안내 문구 없이 [예약]을 비활성으로 둔다 |

- **클라이언트 전용 검증**: 회의 제목 최대 200자는 입력 길이 제한(`maxLength`)으로 막는다(`ReservationCreateRequest.title`). 30분 단위는 선택지로 보장하므로 별도 문구가 없다.
- **검증 스키마(5-IM-14)**: `reservationFormSchema` — 파싱 성공 후 mutation 호출(Zod `safeParse`). 날짜·시각 문자열을 `YYYY-MM-DDTHH:mm`로 합쳐 `startAt`·`endAt`을 만든다. `src/lib/schemas.ts`
- **개인정보·민감정보**: —

---

## 5. API 연동

### 5.1 응답 표기

응답 봉투는 공통 개발규칙(`4-DN-21-O3`) §2 값이 정본이다. 이 화면이 따르는 값은 아래 하나다.

- `Envelope` — `success === true`면 `data` 사용, 아니면 `error.message`를 그 화면의 알림 위치에 표시한다(§7). 검증 오류 항목은 `error.errors`(`ValidationError` 배열)다.
- HTTP 401: 로그인하지 않았거나 세션이 만료된 것이다 → 로그인 화면으로 이동하고 로그인 필요 안내를 보인다(C-CMN-03).

### 5.2 엔드포인트 매핑

| UI 동작 | endpoint `id` | method | path | request | response | errors | 비고 |
|---|---|---|---|---|---|---|---|
| [예약] | `reservation-006` | POST | `/api/v1/reservations` | `ReservationCreateRequest` | `ReservationResult` | BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, CONFLICT, UNPROCESSABLE, INTERNAL_SERVER_ERROR | C-RSV-NEW-002, C-RSV-NEW-003, C-RSV-NEW-004 |
| 등록 전 기존 예약 확인(선택) | `reservation-005` | GET | `/api/v1/reservations` | `쿼리 date, meetingRoomId` | `ReservationStatusItem[]` | BAD_REQUEST, UNAUTHORIZED, INTERNAL_SERVER_ERROR | CRUD 표의 R(등록 전 기존 예약 확인) — `meetingRoomId`를 지정해 호출 |

**UI&UX 제약사항 정의(4-DN-36) CRUD 대응**

| 엔티티 | CRUD | API |
|---|---|---|
| 예약(`reservation`) | C ○ | `reservation-006` |
| 예약(`reservation`) | R ○ | `reservation-005` |
| 회의실(`meeting_room`) | R ○ | `외부(도메인 meeting-room): meeting-room-001` |

### 5.3 캐시·invalidate (5-IM-14 이후)

서버 상태 관리는 코딩 컨벤션 규칙(`5-IM-05-O1`) §6의 구현체인 TanStack React Query다. queryKey는 `src/hooks`의 값을 따른다.

| 동작 | 정책 |
|---|---|
| 회의실 목록 | queryKey `["rooms"]` |
| 예약 등록 성공 | `["reservations"]` invalidate 후 SCR-RSV-005로 이동 |

---

## 6. UI 필드 ↔ API DTO 매핑

### 6.1 예약 폼

| UI 필드·라벨 | API 필드 (`ReservationCreateRequest`) | 변환 규칙 |
|---|---|---|
| 회의실 | `meetingRoomId` | 선택한 회의실 식별자(숫자) |
| 날짜 + 시작 | `startAt` | `{날짜}T{시작}` 로컬 일시(시간대 없음) |
| 날짜 + 종료 | `endAt` | `{날짜}T{종료}` 로컬 일시 |
| 회의 제목 | `title` | 비어 있으면 `null`, 최대 200자 |

---

## 7. 에러·로딩·빈 상태 UX

| UX ID | 상황 | 판별 | UI | message_key | 테스트 층위 | EX-ID |
|---|---|---|---|---|---|---|
| `UX-SCR-RSV-004-01` | 화면·데이터 로딩 | — | Skeleton (목록·표 영역) | `common.state.loading` | 컴포넌트 | — |
| `UX-SCR-RSV-004-02` | 회의실이 하나도 없음 | 2xx, 빈 배열 | 폼 대신 중앙 안내 | `rsv.status.room.empty` | 컴포넌트 | `EX-RSV-06` |
| `UX-SCR-RSV-004-03` | 클라이언트 검증 실패(시간 규칙) | — | 종료 시각 아래 인라인 문구 | `rsv.new.time.invalid` | 컴포넌트 | `EX-RSV-07` |
| `UX-SCR-RSV-004-04` | 시간 규칙 위반(서버) | 422 `success: false` | 종료 시각 아래 인라인 문구 | `rsv.new.time.invalid` | 컴포넌트 | `EX-RSV-07` |
| `UX-SCR-RSV-004-05` | 겹침 거부 | 409 `success: false` | 종료 시각 아래 인라인 문구 | `rsv.new.time.overlap` | 컴포넌트 | `EX-RSV-08` |
| `UX-SCR-RSV-004-06` | 예약 성공 | 201 | 토스트 후 SCR-RSV-005로 이동 | `rsv.new.submit.success` | 컴포넌트 | — |
| `UX-SCR-RSV-004-07` | 예약 저장 실패 | 5xx / `success: false` | 폼 위 인라인 안내 | `rsv.new.submit.failed` | 컴포넌트 | `EX-RSV-09` |
| `UX-SCR-RSV-004-08` | 처리 중 | — | [예약] 비활성(중복 제출 방지) | — | 컴포넌트 | — |
| `UX-SCR-RSV-004-09` | 401 Unauthorized(세션 만료·미로그인) | 401 | 로그인 화면으로 이동 | `rsv.login.access.required` | 공통 계층(대상 아님) | — |
| `UX-SCR-RSV-004-10` | 403 Forbidden | 403 | 전체 화면 대체 | `common.state.forbidden` | 공통 계층(대상 아님) | — |

---

## 8. 부록 — 입력·산출 대응

| 항목 | 본 문서 | 입력 근거 |
|---|---|---|
| 개요 | §2 | UI&UX 제약사항(4-DN-36-O1) 헤더 · 전체 화면 코드베이스(`5-IM-11-O1`) §2 라우트 |
| 기능 | §3 | UI&UX 제약사항 정의(4-DN-36) 화면 블록의 제약사항·메시지·셀렉트박스 표 |
| 검증 | §4 | UI&UX 제약사항 정의(4-DN-36) **Must** + API schema `required` |
| API | §5 | `5-IM-12-O1 API 명세서-reservation.yaml` · 응답 표기는 공통 개발규칙(`4-DN-21-O3`) §2 |
| 매핑 | §6 | CRUD 표 엔티티·필드 |
| UX | §7 | UI&UX 제약사항 정의(4-DN-36) 메시지 표 + §2 전역 상태 메시지 · 업무프로세스 정의서(`3-AN-09-O1`) Exception Flow |

## 9. 변경 이력

| 버전 | 변경일 | 변경자 | 변경 내용 |
|---|---|---|---|
| 1.0 | 2026-10-27 | 설동혁 (DV) | 최초 작성 |
