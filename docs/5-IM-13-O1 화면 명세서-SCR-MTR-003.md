# 5-IM-13-O1 화면 명세서-SCR-MTR-003

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
| screen_id | `SCR-MTR-003` |
| 화면명 | 전체 예약 조회 |
| 라우트 | `src/app/(app)/admin/reservations/page.tsx` |
| 관련 엔티티 | `reservation`(ENT-02), `meeting_room`(ENT-01), `reserver`(ENT-03) |
| 근거 요구사항 | REQ-F-006, REQ-F-008 |
| 문서 목적 | 전체 예약 조회 화면의 기능·클라이언트 검증·API 연동 구현 기준 |

---

## 3. 화면 기능·UI 동작

### 3.1 화면 흐름

```text
진입(로그인 가드 + ROOM_MANAGER 역할 가드)
  → 조회 조건(기본: 오늘부터 7일, 회의실 전체) + 회의실 목록(meeting-room-001)
  → [조회] → 기간 검증 → meeting-room-005 호출(조건은 주소와 동기화)
  → 목록 표시, 시작 이후 예약의 [취소]는 비활성
  → [취소] → 확인 대화상자 → 확인 시 reservation-008 호출 → 목록 갱신
```

### 3.2 UI 이벤트

| 이벤트 ID | UI 요소 / 이벤트 | 동작 | message_key | 비고 |
|---|---|---|---|---|
| `F-SCR-MTR-003-01` | 화면 진입 | 로그인 가드 + `ROOM_MANAGER` 역할 가드 | `common.state.forbidden` | C-MTR-ALL-001, C-CMN-04 |
| `F-SCR-MTR-003-02` | 마운트 | 기본 조건(오늘부터 7일)으로 전체 예약과 조회 조건용 회의실 목록을 조회 | — | §5 `meeting-room-005`, §3.4 |
| `F-SCR-MTR-003-03` | [조회] 클릭 | 기간 검증 통과 시 조건을 주소(`from`·`to`·`room`)에 반영하고 다시 조회 | — | C-MTR-ALL-002 |
| `F-SCR-MTR-003-04` | 기간 오류 | 종료일 아래 인라인 안내, 조회하지 않음 | `mtr.all.period.invalid` | C-MTR-ALL-002 |
| `F-SCR-MTR-003-05` | 목록 표시 | 취소된 예약은 서버가 주지 않으며, 시작 이후 예약의 [취소]는 비활성 | — | C-MTR-ALL-003, C-MTR-ALL-004 |
| `F-SCR-MTR-003-06` | [취소] 클릭 | 취소 확인 대화상자를 연다 | `mtr.all.cancel.confirm` | C-MTR-ALL-005 |
| `F-SCR-MTR-003-07` | 대화상자 확인 | `reservation-008` 호출(다른 사람 예약 취소) | — | §5 `reservation-008` |
| `F-SCR-MTR-003-08` | 취소 성공 응답 | 토스트를 보이고 목록을 다시 불러온다 | `mtr.all.cancel.success` | REQ-F-006 |
| `F-SCR-MTR-003-09` | 시작 이후 취소 거부 응답(422) | 목록 위 인라인 안내 | `mtr.all.cancel.started` | C-MTR-ALL-004 |
| `F-SCR-MTR-003-10` | 조회 기간에 예약이 없을 때 | 빈 안내를 보인다 | `mtr.all.list.empty` | — |
| `F-SCR-MTR-003-11` | 목록 조회 실패 | 오류 안내와 재시도를 보인다 | `mtr.all.list.failed` | EX-MTR-06 |

### 3.3 인가·업무 제약

| 제약 ID | UI 반영 |
|---|---|
| C-MTR-ALL-001 | `ROOM_MANAGER`만 접근·취소(역할 가드, 서버도 403) |
| C-MTR-ALL-002 | 조회 기간의 시작일이 종료일보다 늦으면 조회하지 않고 안내(§4 V-01) — 서버도 400으로 거부 |
| C-MTR-ALL-003 | 취소된 예약은 응답에 없으므로 그대로 그리지 않는다 |
| C-MTR-ALL-004 | 다른 사람 예약은 시작 전에만 취소 — 시작 이후 [취소] 비활성, 요청이 가면 서버가 422로 거부 |
| C-MTR-ALL-005 | 취소 실행 전 확인 대화상자를 보이고 확인해야 실행 |

### 3.4 셀렉트박스 / 공통코드

| 필드명 | 코드그룹 | 로드 시점 | API |
|---|---|---|---|
| 회의실 | — (회의실 마스터) | 마운트 | `meeting-room-001` (전체 + 등록된 회의실명) |

---

## 4. 클라이언트 검증 (Validation)

| 검증 ID | 대상 필드·조건 | 시점 | message_key | 판정 층위 | 근거 |
|---|---|---|---|---|---|
| `V-SCR-MTR-003-01` | 시작일이 종료일보다 늦음 | [조회] submit | `mtr.all.period.invalid` | 함수 | C-MTR-ALL-002 · REQ-F-008 |

- **클라이언트 전용 검증**: 기본 조회 기간(오늘부터 7일)은 UX 보완이다. 주소 파라미터가 형식에 맞지 않으면 기본값으로 대체한다.
- **검증 스키마(5-IM-14)**: `periodSchema` — 파싱 성공 후 조회 조건을 주소에 반영(Zod `safeParse`). `src/lib/schemas.ts`
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
| [조회] / 전체 예약 조회 | `meeting-room-005` | GET | `/api/v1/admin/reservations` | `쿼리 from, to, meetingRoomId` | `AdminReservationItem[]` | BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, INTERNAL_SERVER_ERROR | C-MTR-ALL-001~003 |
| [취소] 확인 후 실행 | `외부(도메인 reservation): reservation-008` | PATCH | `/api/v1/reservations/{reservationId}/cancel` | 경로 reservationId | `ReservationCancelResult` | UNAUTHORIZED, FORBIDDEN, NOT_FOUND, UNPROCESSABLE, INTERNAL_SERVER_ERROR | △ 다른 사람 예약 취소(U) — 시작 전만. C-MTR-ALL-004. 예약 도메인 operation이며 회의실 API 명세서 `meeting-room-005`의 설명에 있는 참조(`5-IM-12` im-12.P6)를 옮겼다 |

**UI&UX 제약사항 정의(4-DN-36) CRUD 대응**

| 엔티티 | CRUD | API |
|---|---|---|
| 예약(`reservation`) | R ○ | `meeting-room-005` |
| 예약(`reservation`) | U △ | `외부(도메인 reservation): reservation-008` |
| 예약(`reservation`) | D × | — (삭제 operation 없음) |
| 회의실(`meeting_room`) | R ○ | `meeting-room-001` (조회 조건 선택 목록) |
| 예약자(`reserver`) | R ○ | `meeting-room-005` (`reserverName` 표시 필드) |

### 5.3 캐시·invalidate (5-IM-14 이후)

서버 상태 관리는 코딩 컨벤션 규칙(`5-IM-05-O1`) §6의 구현체인 TanStack React Query다. queryKey는 `src/hooks`의 값을 따른다.

| 동작 | 정책 |
|---|---|
| 전체 예약 | queryKey `["reservations","admin",from,to,meetingRoomId]`, 조건이 바뀌면 새 query, 기간 오류면 `enabled: false` |
| 회의실 목록 | queryKey `["rooms"]` |
| 취소 성공 | `["reservations"]` invalidate |

---

## 6. UI 필드 ↔ API DTO 매핑

### 6.1 조회 조건

| UI 필드·라벨 | API 필드 | 변환 규칙 |
|---|---|---|
| 시작일 | 쿼리 `from` | `YYYY-MM-DD` |
| 종료일 | 쿼리 `to` | `YYYY-MM-DD` |
| 회의실 | 쿼리 `meetingRoomId` | 「전체」는 생략 |

### 6.2 전체 예약 목록

| UI 필드 | API (`AdminReservationItem[]`) | 변환 규칙 |
|---|---|---|
| 회의실 | `meetingRoomName` | 그대로 |
| 시간 | `startAt`, `endAt` | 같은 날이면 `YYYY-MM-DD HH:mm~HH:mm` |
| 예약자 | `reserverName` | 그대로 |
| 회의 제목 | `title` | `null`이면 `-` |
| [취소] 대상 | `reservationId` | 취소 요청 경로 변수 |

---

## 7. 에러·로딩·빈 상태 UX

| UX ID | 상황 | 판별 | UI | message_key | 테스트 층위 | EX-ID |
|---|---|---|---|---|---|---|
| `UX-SCR-MTR-003-01` | 화면·데이터 로딩 | — | Skeleton (목록·표 영역) | `common.state.loading` | 컴포넌트 | — |
| `UX-SCR-MTR-003-02` | 기간 검증 실패 | — | 종료일 아래 인라인 문구 | `mtr.all.period.invalid` | 컴포넌트 | `EX-MTR-04` |
| `UX-SCR-MTR-003-03` | 조회 기간에 예약 없음 | 2xx, 빈 배열 | 중앙 안내 | `mtr.all.list.empty` | 컴포넌트 | — |
| `UX-SCR-MTR-003-04` | 목록 조회 실패 | 5xx / `success: false` | 전체 화면 대체 — [다시 시도]·[이전 화면] | `mtr.all.list.failed` | 컴포넌트 | `EX-MTR-06` |
| `UX-SCR-MTR-003-05` | 취소 확인 | — | 확인 대화상자 | `mtr.all.cancel.confirm` | 컴포넌트 | — |
| `UX-SCR-MTR-003-06` | 시작 이후 취소 거부 | 422 `success: false` | 목록 위 인라인 안내 | `mtr.all.cancel.started` | 컴포넌트 | `EX-RSV-10` |
| `UX-SCR-MTR-003-07` | 취소 성공 | 200 | 토스트 후 목록 갱신 | `mtr.all.cancel.success` | 컴포넌트 | — |
| `UX-SCR-MTR-003-08` | 로그인하지 않고 조회 요청 | 401 | 로그인 화면으로 이동 | `rsv.login.access.required` | 공통 계층(대상 아님) | `EX-MTR-05` |
| `UX-SCR-MTR-003-09` | 403 Forbidden | 403 | 전체 화면 대체 | `common.state.forbidden` | 공통 계층(대상 아님) | — |

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
