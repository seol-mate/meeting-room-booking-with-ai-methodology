# 5-IM-13-O1 화면 명세서-SCR-MTR-001

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
| screen_id | `SCR-MTR-001` |
| 화면명 | 회의실 목록 |
| 라우트 | `src/app/(app)/admin/rooms/page.tsx` |
| 관련 엔티티 | `meeting_room`(ENT-01) |
| 근거 요구사항 | REQ-F-007 |
| 문서 목적 | 회의실 목록 화면의 기능·클라이언트 검증·API 연동 구현 기준 |

---

## 3. 화면 기능·UI 동작

### 3.1 화면 흐름

```text
진입(로그인 가드 + ROOM_MANAGER 역할 가드: 아니면 권한 거부 화면)
  → 회의실 목록 로드(meeting-room-001)
  → 목록 표시, [신규 등록]·행별 [수정] → SCR-MTR-002 이동
```

### 3.2 UI 이벤트

| 이벤트 ID | UI 요소 / 이벤트 | 동작 | message_key | 비고 |
|---|---|---|---|---|
| `F-SCR-MTR-001-01` | 화면 진입 | 로그인 가드 + `ROOM_MANAGER` 역할 가드. 그 외 로그인 사용자는 권한 거부 화면 | `common.state.forbidden` | C-MTR-LST-001, C-CMN-04 |
| `F-SCR-MTR-001-02` | 마운트 | 회의실 목록을 조회 | — | §5 `meeting-room-001` |
| `F-SCR-MTR-001-03` | [신규 등록] 클릭 | SCR-MTR-002로 이동(신규) | — | 와이어프레임 §4 |
| `F-SCR-MTR-001-04` | 행별 [수정] 클릭 | SCR-MTR-002로 이동하며 대상 회의실 식별자를 주소(`?id=`)로 넘긴다 | — | 와이어프레임 §4 |
| `F-SCR-MTR-001-05` | 회의실이 없을 때 | 빈 안내와 [신규 등록]을 보인다 | `mtr.list.room.empty` | — |

### 3.3 인가·업무 제약

| 제약 ID | UI 반영 |
|---|---|
| C-MTR-LST-001 | `ROOM_MANAGER`만 접근. `admin/layout.tsx`의 역할 가드가 그 외 사용자에게 권한 거부 화면을 보인다. 메뉴도 `ROOM_MANAGER`에게만 노출(C-CMN-04) |

### 3.4 셀렉트박스 / 공통코드

해당 없음 — 셀렉트박스가 없다(4-DN-36 §4).

---

## 4. 클라이언트 검증 (Validation)

해당 없음 — 조회 전용 목록 화면이다(등록·변경은 SCR-MTR-002).

- **클라이언트 전용 검증**: —
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
| 회의실 목록 조회 | `meeting-room-001` | GET | `/api/v1/meeting-rooms` | — | `MeetingRoomItem[]` | UNAUTHORIZED, INTERNAL_SERVER_ERROR | C-MTR-LST-001 (이 API는 예약 화면 3곳도 쓰므로 로그인한 모든 사용자에게 열려 있고, 이 화면의 접근 제한은 화면 가드가 한다) |

**UI&UX 제약사항 정의(4-DN-36) CRUD 대응**

| 엔티티 | CRUD | API |
|---|---|---|
| 회의실(`meeting_room`) | R ○ | `meeting-room-001` |

### 5.3 캐시·invalidate (5-IM-14 이후)

서버 상태 관리는 코딩 컨벤션 규칙(`5-IM-05-O1`) §6의 구현체인 TanStack React Query다. queryKey는 `src/hooks`의 값을 따른다.

| 동작 | 정책 |
|---|---|
| 회의실 목록 | queryKey `["rooms"]` |
| 다른 화면에서 회의실 등록·변경 성공 | `["rooms"]` invalidate |

---

## 6. UI 필드 ↔ API DTO 매핑

### 6.1 회의실 목록

| UI 필드 | API (`MeetingRoomItem[]`) | 변환 규칙 |
|---|---|---|
| 회의실명 | `name` | 그대로 |
| 위치 | `location` | `null`이면 `-` |
| 수용 인원 | `capacity` | `null`이면 `-`, 값이 있으면 `{n}명` |
| 비치 장비 | `equipment` | `null`이면 `-` |
| [수정] 대상 | `meetingRoomId` | 주소 `?id=`로 전달 |

---

## 7. 에러·로딩·빈 상태 UX

| UX ID | 상황 | 판별 | UI | message_key | 테스트 층위 | EX-ID |
|---|---|---|---|---|---|---|
| `UX-SCR-MTR-001-01` | 화면·데이터 로딩 | — | Skeleton (목록·표 영역) | `common.state.loading` | 컴포넌트 | — |
| `UX-SCR-MTR-001-02` | 등록된 회의실 없음 | 2xx, 빈 배열 | 중앙 안내 + [신규 등록] | `mtr.list.room.empty` | 컴포넌트 | — |
| `UX-SCR-MTR-001-03` | 목록 조회 실패 | 5xx / `success: false` | 전체 화면 대체 — [다시 시도]·[이전 화면] | `common.state.error` | 컴포넌트 | — |
| `UX-SCR-MTR-001-04` | 401 Unauthorized(세션 만료·미로그인) | 401 | 로그인 화면으로 이동 | `rsv.login.access.required` | 공통 계층(대상 아님) | — |
| `UX-SCR-MTR-001-05` | 403 Forbidden | 403 | 전체 화면 대체 | `common.state.forbidden` | 공통 계층(대상 아님) | — |

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
