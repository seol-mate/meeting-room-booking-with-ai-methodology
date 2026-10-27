# 5-IM-13-O1 화면 명세서-SCR-MTR-002

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
| screen_id | `SCR-MTR-002` |
| 화면명 | 회의실 등록·변경 |
| 라우트 | `src/app/(app)/admin/rooms/edit/page.tsx` |
| 관련 엔티티 | `meeting_room`(ENT-01) |
| 근거 요구사항 | REQ-F-007 |
| 문서 목적 | 회의실 등록·변경 화면의 기능·클라이언트 검증·API 연동 구현 기준 |

---

## 3. 화면 기능·UI 동작

### 3.1 화면 흐름

```text
진입(로그인 가드 + ROOM_MANAGER 역할 가드)
  → 주소 `?id=`가 있으면 변경: meeting-room-003으로 대상 회의실을 불러와 폼에 채움 / 없으면 신규
  → 회의실명·위치·수용 인원·비치 장비 입력
  → [저장] → 클라이언트 검증 → 신규는 meeting-room-002, 변경은 meeting-room-004 호출
  → 성공: SCR-MTR-001 이동 / 실패: 인라인 안내
  → [취소] → SCR-MTR-001 이동
```

### 3.2 UI 이벤트

| 이벤트 ID | UI 요소 / 이벤트 | 동작 | message_key | 비고 |
|---|---|---|---|---|
| `F-SCR-MTR-002-01` | 화면 진입 | 로그인 가드 + `ROOM_MANAGER` 역할 가드 | `common.state.forbidden` | C-MTR-EDT-001, C-CMN-04 |
| `F-SCR-MTR-002-02` | 마운트(변경) | 주소 `id`로 대상 회의실을 조회해 폼에 채운다. 없으면 신규 폼 | — | §5 `meeting-room-003` |
| `F-SCR-MTR-002-03` | 입력 | 회의실명·위치·수용 인원·비치 장비를 폼 상태에 반영 | — | C-MTR-EDT-002 |
| `F-SCR-MTR-002-04` | [저장] 클릭 | 클라이언트 검증 통과 시 신규는 `meeting-room-002`, 변경은 `meeting-room-004` 호출 | — | C-MTR-EDT-002 |
| `F-SCR-MTR-002-05` | 회의실명 누락 | 회의실명 아래 인라인 안내 | `mtr.edit.name.required` | C-MTR-EDT-002 |
| `F-SCR-MTR-002-06` | 저장 성공 응답 | 토스트를 보이고 SCR-MTR-001로 이동. 변경한 정보는 예약 화면 캐시를 무효화해 반영 | `mtr.edit.save.success` | C-MTR-EDT-003 |
| `F-SCR-MTR-002-07` | 저장 실패 응답 | 폼 위 인라인 안내 | `mtr.edit.save.failed` | — |
| `F-SCR-MTR-002-08` | [취소] 클릭 | SCR-MTR-001로 이동 | — | 와이어프레임 §4 |

### 3.3 인가·업무 제약

| 제약 ID | UI 반영 |
|---|---|
| C-MTR-EDT-001 | `ROOM_MANAGER`만 접근·저장(역할 가드). 서버도 403으로 거부 |
| C-MTR-EDT-002 | 회의실명 필수·최대 100자, 위치 최대 200자, 수용 인원 정수, 비치 장비 최대 500자(필수 여부는 미확정 항목 C1이라 필수 검증을 두지 않는다) |
| C-MTR-EDT-003 | 저장 성공 시 회의실 목록·예약 현황·예약 화면의 캐시를 무효화해 반영 |

### 3.4 셀렉트박스 / 공통코드

해당 없음 — 셀렉트박스가 없다(4-DN-36 §4).

---

## 4. 클라이언트 검증 (Validation)

| 검증 ID | 대상 필드·조건 | 시점 | message_key | 판정 층위 | 근거 |
|---|---|---|---|---|---|
| `V-SCR-MTR-002-01` | 회의실명이 비어 있음(공백만 포함) | [저장] submit | `mtr.edit.name.required` | 함수 | C-MTR-EDT-002 · `MeetingRoomCreateRequest.name` required |
| `V-SCR-MTR-002-02` | 회의실명 100자 초과·위치 200자 초과·비치 장비 500자 초과 | 입력(`maxLength`) | — | 컴포넌트 | C-MTR-EDT-002 · API 스키마 `maxLength` — 입력 길이 제한으로 막고 별도 문구를 두지 않는다 |
| `V-SCR-MTR-002-03` | 수용 인원이 정수가 아님 | 입력(`type=number`)·[저장] submit | — | 함수 | C-MTR-EDT-002 · API 스키마 `integer` — 숫자 입력으로 막고 별도 문구를 두지 않는다 |

- **클라이언트 전용 검증**: 수용 인원은 1 이상의 정수만 받는 것은 UX 보완이며 서버 검증은 정수 여부만 한다.
- **검증 스키마(5-IM-14)**: `roomFormSchema` — 파싱 성공 후 mutation 호출(Zod `safeParse`). 비어 있는 선택 항목은 `null`로 보낸다. `src/lib/schemas.ts`
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
| [저장] (신규) | `meeting-room-002` | POST | `/api/v1/meeting-rooms` | `MeetingRoomCreateRequest` | `MeetingRoomItem` | BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, INTERNAL_SERVER_ERROR | C ○ — C-MTR-EDT-002 |
| 변경 대상 불러오기 | `meeting-room-003` | GET | `/api/v1/meeting-rooms/{meetingRoomId}` | `경로 meetingRoomId` | `MeetingRoomItem` | UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INTERNAL_SERVER_ERROR | R ○ — 변경 대상 불러오기 |
| [저장] (변경) | `meeting-room-004` | PUT | `/api/v1/meeting-rooms/{meetingRoomId}` | `MeetingRoomUpdateRequest` | `MeetingRoomItem` | BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INTERNAL_SERVER_ERROR | U ○ — 전체 교체, C-MTR-EDT-003 |

**UI&UX 제약사항 정의(4-DN-36) CRUD 대응**

| 엔티티 | CRUD | API |
|---|---|---|
| 회의실(`meeting_room`) | C ○ | `meeting-room-002` |
| 회의실(`meeting_room`) | R ○ | `meeting-room-003` |
| 회의실(`meeting_room`) | U ○ | `meeting-room-004` |
| 회의실(`meeting_room`) | D — | — (삭제 operation 없음) |

### 5.3 캐시·invalidate (5-IM-14 이후)

서버 상태 관리는 코딩 컨벤션 규칙(`5-IM-05-O1`) §6의 구현체인 TanStack React Query다. queryKey는 `src/hooks`의 값을 따른다.

| 동작 | 정책 |
|---|---|
| 변경 대상 조회 | queryKey `["room", meetingRoomId]` |
| 저장 성공 | `["rooms"]`·`["room"]`·`["reservations"]` invalidate 후 SCR-MTR-001로 이동 |

---

## 6. UI 필드 ↔ API DTO 매핑

### 6.1 회의실 폼

| UI 필드·라벨 | API 필드 (`MeetingRoomCreateRequest` / `MeetingRoomUpdateRequest`) | 변환 규칙 |
|---|---|---|
| 회의실명 | `name` | 앞뒤 공백 제거, 필수, 최대 100자 |
| 위치 | `location` | 비어 있으면 `null`, 최대 200자 |
| 수용 인원 | `capacity` | 비어 있으면 `null`, 값이 있으면 정수 |
| 비치 장비 | `equipment` | 비어 있으면 `null`, 최대 500자 |

### 6.2 변경 대상 불러오기

| UI 필드 | API (`MeetingRoomItem`) | 변환 규칙 |
|---|---|---|
| 폼 초기값 | `name`, `location`, `capacity`, `equipment` | `null`은 빈 입력으로 |

---

## 7. 에러·로딩·빈 상태 UX

| UX ID | 상황 | 판별 | UI | message_key | 테스트 층위 | EX-ID |
|---|---|---|---|---|---|---|
| `UX-SCR-MTR-002-01` | 화면·데이터 로딩 | — | Skeleton (목록·표 영역) | `common.state.loading` | 컴포넌트 | — |
| `UX-SCR-MTR-002-02` | 클라이언트 검증 실패 | — | 필드 아래 인라인 문구 | `mtr.edit.name.required` | 컴포넌트 | `EX-MTR-01` |
| `UX-SCR-MTR-002-03` | 입력 오류(서버) | 400 `success: false` | 회의실명 아래 인라인 안내 | `mtr.edit.name.required` | 컴포넌트 | `EX-MTR-01` |
| `UX-SCR-MTR-002-04` | 저장 성공 | 201 / 200 | 토스트 후 SCR-MTR-001로 이동 | `mtr.edit.save.success` | 컴포넌트 | — |
| `UX-SCR-MTR-002-05` | 저장 실패 | 5xx / `success: false` | 폼 위 인라인 안내 | `mtr.edit.save.failed` | 컴포넌트 | `EX-MTR-03` |
| `UX-SCR-MTR-002-06` | 변경 대상 없음 | 404 | 전체 화면 대체 — [다시 시도]·[이전 화면] | `common.state.error` | 컴포넌트 | — |
| `UX-SCR-MTR-002-07` | 관리 담당자가 아닌 사용자의 요청 | 403 | 전체 화면 대체 | `common.state.forbidden` | 공통 계층(대상 아님) | `EX-MTR-02` |
| `UX-SCR-MTR-002-08` | 처리 중 | — | [저장] 비활성(중복 제출 방지) | — | 컴포넌트 | — |
| `UX-SCR-MTR-002-09` | 401 Unauthorized(세션 만료·미로그인) | 401 | 로그인 화면으로 이동 | `rsv.login.access.required` | 공통 계층(대상 아님) | — |

---

## 8. 부록 — 입력·산출 대응

| 항목 | 본 문서 | 입력 근거 |
|---|---|---|
| 개요 | §2 | UI&UX 제약사항(4-DN-36-O1) 헤더 · 전체 화면 코드베이스(`5-IM-11-O1`) §2 라우트 |
| 기능 | §3 | UI&UX 제약사항 정의(4-DN-36) 화면 블록의 제약사항·메시지·셀렉트박스 표 |
| 검증 | §4 | UI&UX 제약사항 정의(4-DN-36) **Must** + API schema `required` |
| API | §5 | `5-IM-12-O1 API 명세서-meeting-room.yaml` · 응답 표기는 공통 개발규칙(`4-DN-21-O3`) §2 |
| 매핑 | §6 | CRUD 표 엔티티·필드 |
| UX | §7 | UI&UX 제약사항 정의(4-DN-36) 메시지 표 + §2 전역 상태 메시지 · 업무프로세스 정의서(`3-AN-09-O1`) Exception Flow |

## 9. 변경 이력

| 버전 | 변경일 | 변경자 | 변경 내용 |
|---|---|---|---|
| 1.0 | 2026-10-27 | 설동혁 (DV) | 최초 작성 |
