# 5-IM-13-O1 화면 명세서-SCR-RSV-005

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
| screen_id | `SCR-RSV-005` |
| 화면명 | 내 예약 |
| 라우트 | `src/app/(app)/my-reservations/page.tsx` |
| 관련 엔티티 | `reservation`(ENT-02), `meeting_room`(ENT-01) |
| 근거 요구사항 | REQ-F-005 |
| 문서 목적 | 내 예약 화면의 기능·클라이언트 검증·API 연동 구현 기준 |

---

## 3. 화면 기능·UI 동작

### 3.1 화면 흐름

```text
진입(로그인 가드) → 내 예약 로드(reservation-007)
  → 목록 표시(모바일은 카드), 취소한 예약은 상태 「취소됨」과 취소 일시 표시
  → 시작 이후 예약의 [취소]는 비활성
  → [취소] → 확인 대화상자 → 확인 시 reservation-008 호출
  → 성공: 토스트 후 목록 갱신 / 실패: 인라인 안내
```

### 3.2 UI 이벤트

| 이벤트 ID | UI 요소 / 이벤트 | 동작 | message_key | 비고 |
|---|---|---|---|---|
| `F-SCR-RSV-005-01` | 화면 진입 | 로그인 가드가 로그인 사용자만 통과 | `rsv.login.access.required` | C-RSV-MY-001, C-CMN-03 |
| `F-SCR-RSV-005-02` | 마운트 | 내 예약 목록을 조회(본인 예약만, 취소 이력 포함) | — | §5 `reservation-007` |
| `F-SCR-RSV-005-03` | 목록 표시 | 시작 일시가 지난 예약과 이미 취소한 예약은 [취소]를 비활성 또는 숨김. 취소한 예약은 상태와 취소 일시 표시 | — | C-RSV-MY-002, C-RSV-MY-003 |
| `F-SCR-RSV-005-04` | [취소] 클릭 | 취소 확인 대화상자를 연다 | `rsv.my.cancel.confirm` | C-RSV-MY-004 |
| `F-SCR-RSV-005-05` | 대화상자 확인 | `reservation-008` 호출 | — | §5 `reservation-008` |
| `F-SCR-RSV-005-06` | 취소 성공 응답 | 토스트를 보이고 목록을 다시 불러온다 | `rsv.my.cancel.success` | REQ-F-005 |
| `F-SCR-RSV-005-07` | 시작 이후 취소 거부 응답(422) | 목록 위 인라인 안내 | `rsv.my.cancel.started` | C-RSV-MY-002 |
| `F-SCR-RSV-005-08` | 취소 실패 응답 | 목록 위 인라인 안내 | `rsv.my.cancel.failed` | — |
| `F-SCR-RSV-005-09` | 예약 내역이 없을 때 | 빈 안내를 보인다 | `rsv.my.list.empty` | — |

### 3.3 인가·업무 제약

| 제약 ID | UI 반영 |
|---|---|
| C-RSV-MY-001 | 로그인한 사용자만 접근하고 서버가 본인 예약만 준다. 화면은 다른 사람 예약을 요청하지 않는다 |
| C-RSV-MY-002 | 예약 시작 이후 [취소] 비활성(화면 시각 기준 30초 단위 갱신), 요청이 가면 서버가 422로 거부 |
| C-RSV-MY-003 | 취소는 삭제가 아니라 상태 변경이다. 삭제 동작을 화면에 두지 않는다. 취소됨 상태와 취소 일시를 표시 |
| C-RSV-MY-004 | 취소 실행 전 확인 대화상자를 보이고 확인해야 실행 |

### 3.4 셀렉트박스 / 공통코드

해당 없음 — 셀렉트박스가 없다(4-DN-36 §4).

---

## 4. 클라이언트 검증 (Validation)

해당 없음 — 입력 폼이 없는 목록 화면이다. 취소 가능 여부는 §3.3 C-RSV-MY-002의 비활성 처리와 서버 판정이 맡는다.

- **클라이언트 전용 검증**: 시작 이후 [취소] 비활성은 UX 보완이며 서버 422가 최종이다.
- **검증 스키마(5-IM-14)**: 해당 없음 — 클라이언트 검증 대상 필드가 없다.
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
| 내 예약 목록 조회 | `reservation-007` | GET | `/api/v1/reservations/mine` | — | `MyReservationItem[]` | UNAUTHORIZED, INTERNAL_SERVER_ERROR | C-RSV-MY-001, C-RSV-MY-003 |
| [취소] 확인 후 실행 | `reservation-008` | PATCH | `/api/v1/reservations/{reservationId}/cancel` | `경로 reservationId` | `ReservationCancelResult` | UNAUTHORIZED, FORBIDDEN, NOT_FOUND, UNPROCESSABLE, INTERNAL_SERVER_ERROR | △ 취소는 상태 갱신(U) — 시작 전 예약만, 본인 예약. C-RSV-MY-002 |

**UI&UX 제약사항 정의(4-DN-36) CRUD 대응**

| 엔티티 | CRUD | API |
|---|---|---|
| 예약(`reservation`) | R ○ | `reservation-007` |
| 예약(`reservation`) | U △ | `reservation-008` |
| 예약(`reservation`) | D × | — (삭제 operation 없음) |
| 회의실(`meeting_room`) | R ○ | `reservation-007` (`meetingRoomName` 표시 필드) |

### 5.3 캐시·invalidate (5-IM-14 이후)

서버 상태 관리는 코딩 컨벤션 규칙(`5-IM-05-O1`) §6의 구현체인 TanStack React Query다. queryKey는 `src/hooks`의 값을 따른다.

| 동작 | 정책 |
|---|---|
| 내 예약 | queryKey `["reservations","mine"]` |
| 취소 성공 | `["reservations"]` invalidate |

---

## 6. UI 필드 ↔ API DTO 매핑

### 6.1 내 예약 목록

| UI 필드 | API (`MyReservationItem[]`) | 변환 규칙 |
|---|---|---|
| 회의실 | `meetingRoomName` | 그대로 표시 |
| 일시 | `startAt`, `endAt` | 같은 날이면 `YYYY-MM-DD HH:mm~HH:mm` |
| 회의 제목 | `title` | `null`이면 `-` |
| 상태 | `status` | `RESERVED`=예약됨, `CANCELLED`=취소됨(색과 라벨 함께) |
| 취소 일시 | `cancelledAt` | 취소된 예약에만 `YYYY-MM-DD HH:mm 취소` |

### 6.2 취소 요청

| UI 동작 | API | 변환 규칙 |
|---|---|---|
| [취소] | 경로 `reservationId` | 목록 행의 `reservationId` |

---

## 7. 에러·로딩·빈 상태 UX

| UX ID | 상황 | 판별 | UI | message_key | 테스트 층위 | EX-ID |
|---|---|---|---|---|---|---|
| `UX-SCR-RSV-005-01` | 화면·데이터 로딩 | — | Skeleton (목록·표 영역) | `common.state.loading` | 컴포넌트 | — |
| `UX-SCR-RSV-005-02` | 예약 내역 없음 | 2xx, 빈 배열 | 중앙 안내 | `rsv.my.list.empty` | 컴포넌트 | — |
| `UX-SCR-RSV-005-03` | 취소 확인 | — | 확인 대화상자 | `rsv.my.cancel.confirm` | 컴포넌트 | — |
| `UX-SCR-RSV-005-04` | 시작 이후 취소 거부 | 422 `success: false` | 목록 위 인라인 안내 | `rsv.my.cancel.started` | 컴포넌트 | `EX-RSV-10` |
| `UX-SCR-RSV-005-05` | 본인·관리 담당자가 아닌 취소 요청 | 403 | 전체 화면 대체 | `common.state.forbidden` | 공통 계층(대상 아님) | `EX-RSV-11` |
| `UX-SCR-RSV-005-06` | 취소 실패 | 5xx / `success: false` | 목록 위 인라인 안내 | `rsv.my.cancel.failed` | 컴포넌트 | `EX-RSV-12` |
| `UX-SCR-RSV-005-07` | 취소 성공 | 200 | 토스트 후 목록 갱신 | `rsv.my.cancel.success` | 컴포넌트 | — |
| `UX-SCR-RSV-005-08` | 목록 조회 실패 | 5xx / `success: false` | 전체 화면 대체 — [다시 시도]·[이전 화면] | `common.state.error` | 컴포넌트 | — |
| `UX-SCR-RSV-005-09` | 401 Unauthorized(세션 만료·미로그인) | 401 | 로그인 화면으로 이동 | `rsv.login.access.required` | 공통 계층(대상 아님) | — |

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
