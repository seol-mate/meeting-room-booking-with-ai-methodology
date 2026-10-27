# 5-IM-13-O1 화면 명세서-SCR-RSV-003

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
| screen_id | `SCR-RSV-003` |
| 화면명 | 예약 현황 조회 |
| 라우트 | `src/app/(app)/status/page.tsx` |
| 관련 엔티티 | `meeting_room`(ENT-01), `reservation`(ENT-02), `reserver`(ENT-03) |
| 근거 요구사항 | REQ-F-002, REQ-NF-001 (operation 없음 — 로그인하지 않은 접근 차단은 로그인 가드와 서버 인증 필터가 실현하고 비기능 요구사항은 `x-nf-req-ids`로 추적한다) |
| 문서 목적 | 예약 현황 조회 화면의 기능·클라이언트 검증·API 연동 구현 기준 |

---

## 3. 화면 기능·UI 동작

### 3.1 화면 흐름

```text
진입(로그인 가드: 미로그인은 SCR-RSV-001) → 날짜 기본값 오늘
  → 회의실 목록(meeting-room-001) + 선택한 날짜의 예약 현황(reservation-005) 로드
  → 날짜 변경 시 주소(?date=)와 동기화하며 현황 갱신
  → 회의실 × 시간 표(모바일은 회의실별 목록)로 표시, 제목은 서버가 준 값만 표시
  → [예약하기] → SCR-RSV-004 이동
```

### 3.2 UI 이벤트

| 이벤트 ID | UI 요소 / 이벤트 | 동작 | message_key | 비고 |
|---|---|---|---|---|
| `F-SCR-RSV-003-01` | 화면 진입 | 로그인 가드가 로그인 사용자(`USER`·`ROOM_MANAGER`)만 통과, 미로그인은 SCR-RSV-001로 이동 | `rsv.login.access.required` | C-RSV-STS-001, C-CMN-03 |
| `F-SCR-RSV-003-02` | 마운트 | 날짜(주소 `date`, 없으면 오늘)로 회의실 목록과 예약 현황을 조회 | — | §5 `reservation-005`, 회의실 목록 §3.4 |
| `F-SCR-RSV-003-03` | 날짜 변경 / [조회] 클릭 | 주소의 `date`를 바꾸고 해당 날짜의 현황을 다시 조회 | — | REQ-F-002 |
| `F-SCR-RSV-003-04` | 현황 표 표시 | 취소된 예약은 서버가 주지 않으며, 제목은 값이 있을 때만 표시한다(없으면 「예약됨」만) | — | C-RSV-STS-002, C-RSV-STS-003 |
| `F-SCR-RSV-003-05` | 회의실이 없을 때 | 빈 안내를 보인다 | `rsv.status.room.empty` | EX-RSV-06 |
| `F-SCR-RSV-003-06` | 조회 실패 | 오류 안내와 재시도를 보인다 | `rsv.status.list.failed` | EX-RSV-05 |
| `F-SCR-RSV-003-07` | [예약하기] 클릭 | SCR-RSV-004로 이동 | — | 와이어프레임 §4 |

### 3.3 인가·업무 제약

| 제약 ID | UI 반영 |
|---|---|
| C-RSV-STS-001 | 로그인한 `USER`·`ROOM_MANAGER`만 접근. `(app)/layout.tsx`의 로그인 가드가 미로그인을 SCR-RSV-001로 보낸다 |
| C-RSV-STS-002 | 회의 제목은 서버가 본인·`ROOM_MANAGER`에게만 값을 담는다. 화면은 값이 `null`이면 제목을 그리지 않는다(화면에서 가리지 않고 서버 값을 따른다) |
| C-RSV-STS-003 | 취소된 예약은 응답에 없으므로 그대로 그리지 않는다 |

### 3.4 셀렉트박스 / 공통코드

해당 없음 — 날짜 선택(DatePicker)만 있고 셀렉트박스가 없다(4-DN-36 §4). 현황 표의 행인 회의실 목록은 `외부(도메인 meeting-room): meeting-room-001`을 쓴다.

---

## 4. 클라이언트 검증 (Validation)

해당 없음 — 조회 전용 화면이다. 날짜 입력은 브라우저 날짜 선택기가 형식을 보장하고, 서버가 형식 오류를 400으로 거부한다.

- **클라이언트 전용 검증**: 날짜 주소 파라미터가 형식(YYYY-MM-DD)에 맞지 않으면 오늘로 대체한다(UX 보완).
- **검증 스키마(5-IM-14)**: 해당 없음 — 클라이언트 검증 대상 필드가 없다. 응답 검증은 5-IM-14의 생성 타입을 쓴다.
- **개인정보·민감정보**: 회의 제목 노출 범위는 서버가 정한다(C-RSV-STS-002). 화면은 `null`을 그대로 따르고 다른 경로로 제목을 얻으려 하지 않는다.

---

## 5. API 연동

### 5.1 응답 표기

응답 봉투는 공통 개발규칙(`4-DN-21-O3`) §2 값이 정본이다. 이 화면이 따르는 값은 아래 하나다.

- `Envelope` — `success === true`면 `data` 사용, 아니면 `error.message`를 그 화면의 알림 위치에 표시한다(§7). 검증 오류 항목은 `error.errors`(`ValidationError` 배열)다.
- HTTP 401: 로그인하지 않았거나 세션이 만료된 것이다 → 로그인 화면으로 이동하고 로그인 필요 안내를 보인다(C-CMN-03).

### 5.2 엔드포인트 매핑

| UI 동작 | endpoint `id` | method | path | request | response | errors | 비고 |
|---|---|---|---|---|---|---|---|
| 날짜별 예약 현황 조회 | `reservation-005` | GET | `/api/v1/reservations` | `쿼리 date, meetingRoomId` | `ReservationStatusItem[]` | BAD_REQUEST, UNAUTHORIZED, INTERNAL_SERVER_ERROR | C-RSV-STS-002, C-RSV-STS-003 |

**UI&UX 제약사항 정의(4-DN-36) CRUD 대응**

| 엔티티 | CRUD | API |
|---|---|---|
| 회의실(`meeting_room`) | R ○ | `외부(도메인 meeting-room): meeting-room-001` |
| 예약(`reservation`) | R ○ | `reservation-005` |
| 예약자(`reserver`) | R ○ | `reservation-005` (`reserverName` 표시 필드) |

### 5.3 캐시·invalidate (5-IM-14 이후)

서버 상태 관리는 코딩 컨벤션 규칙(`5-IM-05-O1`) §6의 구현체인 TanStack React Query다. queryKey는 `src/hooks`의 값을 따른다.

| 동작 | 정책 |
|---|---|
| 예약 현황 | queryKey `["reservations","status",date,meetingRoomId]`, 날짜가 바뀌면 새 query |
| 회의실 목록 | queryKey `["rooms"]` |
| 다른 화면에서 예약·취소·회의실 변경 성공 | `["reservations"]`·`["rooms"]` invalidate |

---

## 6. UI 필드 ↔ API DTO 매핑

### 6.1 조회 조건

| UI 필드·라벨 | API 필드 | 변환 규칙 |
|---|---|---|
| 날짜 | 쿼리 `date` | `YYYY-MM-DD`, 주소 `?date=`와 동기화 |

### 6.2 현황 표

| UI 필드 | API (`ReservationStatusItem[]`) | 변환 규칙 |
|---|---|---|
| 회의실(열) | `meetingRoomName`(식별자 `meetingRoomId`) | 회의실 목록의 순서를 따른다 |
| 시간대(행) | `startAt`, `endAt` | 30분 칸으로 펼침. 시작 칸에만 상세를 표시 |
| 예약자 | `reserverName` | 그대로 표시 |
| 회의 제목 | `title` | `null`이면 표시하지 않고 「예약됨」만 |

---

## 7. 에러·로딩·빈 상태 UX

| UX ID | 상황 | 판별 | UI | message_key | 테스트 층위 | EX-ID |
|---|---|---|---|---|---|---|
| `UX-SCR-RSV-003-01` | 화면·데이터 로딩 | — | Skeleton (목록·표 영역) | `common.state.loading` | 컴포넌트 | — |
| `UX-SCR-RSV-003-02` | 회의실이 하나도 없음 | 2xx, 빈 배열 | 중앙 안내 | `rsv.status.room.empty` | 컴포넌트 | `EX-RSV-06` |
| `UX-SCR-RSV-003-03` | 선택한 날짜에 예약 없음 | 2xx, 빈 배열 | 표의 모든 칸을 「비어 있음」으로 표시 | — | 컴포넌트 | — |
| `UX-SCR-RSV-003-04` | 현황 조회 실패 | 5xx / `success: false` | 전체 화면 대체 — [다시 시도]·[이전 화면] | `rsv.status.list.failed` | 컴포넌트 | `EX-RSV-05` |
| `UX-SCR-RSV-003-05` | 로그인하지 않고 현황 요청 | 401 | 로그인 화면으로 이동 | `rsv.login.access.required` | 공통 계층(대상 아님) | `EX-RSV-04` |
| `UX-SCR-RSV-003-06` | 403 Forbidden | 403 | 전체 화면 대체 | `common.state.forbidden` | 공통 계층(대상 아님) | — |

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
