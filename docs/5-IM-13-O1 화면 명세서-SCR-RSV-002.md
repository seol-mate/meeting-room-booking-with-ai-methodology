# 5-IM-13-O1 화면 명세서-SCR-RSV-002

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
| screen_id | `SCR-RSV-002` |
| 화면명 | 계정 가입 |
| 라우트 | `src/app/(auth)/join/page.tsx` |
| 관련 엔티티 | `reserver`(ENT-03) |
| 근거 요구사항 | REQ-F-001 |
| 문서 목적 | 계정 가입 화면의 기능·클라이언트 검증·API 연동 구현 기준 |

---

## 3. 화면 기능·UI 동작

### 3.1 화면 흐름

```text
진입(인증 불필요) → 로그인 ID·이름·비밀번호 입력
  → 로그인 ID 입력을 마치면(blur) 중복 확인(reservation-004)
  → [가입] → 클라이언트 검증 → reservation-003 호출
  → 성공: SCR-RSV-001로 이동하며 가입 완료 안내 / 실패: 인라인 안내
```

### 3.2 UI 이벤트

| 이벤트 ID | UI 요소 / 이벤트 | 동작 | message_key | 비고 |
|---|---|---|---|---|
| `F-SCR-RSV-002-01` | 화면 진입 | 인증 없이 표시 | — | C-RSV-JOIN-001 |
| `F-SCR-RSV-002-02` | 로그인 ID 입력 후 포커스 이동(blur) | 비어 있지 않으면 `reservation-004`로 사용 가능 여부 확인, 사용 중이면 인라인 안내 | `rsv.join.id.duplicate` | C-RSV-JOIN-002 |
| `F-SCR-RSV-002-03` | 이름·비밀번호 입력 | 입력값을 폼 상태에 반영(비밀번호는 마스킹) | — | C-RSV-JOIN-004 |
| `F-SCR-RSV-002-04` | [가입] 클릭 | 클라이언트 검증 통과 시 `reservation-003` 호출 | — | C-RSV-JOIN-002 |
| `F-SCR-RSV-002-05` | 가입 성공 응답 | SCR-RSV-001로 이동하고 가입 완료 안내를 보인다 | `rsv.join.submit.success` | 와이어프레임 §4 |
| `F-SCR-RSV-002-06` | 로그인 ID 중복 응답(409) | 로그인 ID 필드에 인라인 안내 | `rsv.join.id.duplicate` | C-RSV-JOIN-002 |
| `F-SCR-RSV-002-07` | 가입 실패 응답 | 폼 위 인라인 안내 | `rsv.join.submit.failed` | — |
| `F-SCR-RSV-002-08` | [로그인으로 돌아가기] 클릭 | SCR-RSV-001로 이동 | — | — |

### 3.3 인가·업무 제약

| 제약 ID | UI 반영 |
|---|---|
| C-RSV-JOIN-001 | 인증 불필요(`ALL`) — 로그인 가드를 두지 않는다 |
| C-RSV-JOIN-002 | 로그인 ID 중복 불가, ID·이름·비밀번호 모두 필수(§4 V-01~V-03, 중복은 서버가 최종 판정) |
| C-RSV-JOIN-003 | 가입 요청에 역할을 보내지 않는다(서버가 항상 `USER`로 만든다). 화면에 역할 선택을 두지 않는다 |
| C-RSV-JOIN-004 | 비밀번호는 마스킹 표시, 화면·로그에 값을 남기지 않는다(해시 저장은 서버) |

### 3.4 셀렉트박스 / 공통코드

해당 없음 — 셀렉트박스가 없다(4-DN-36 §4).

---

## 4. 클라이언트 검증 (Validation)

| 검증 ID | 대상 필드·조건 | 시점 | message_key | 판정 층위 | 근거 |
|---|---|---|---|---|---|
| `V-SCR-RSV-002-01` | 로그인 ID가 비어 있음 | [가입] submit | `rsv.join.field.required` | 함수 | C-RSV-JOIN-002 · `SignupRequest.loginId` required |
| `V-SCR-RSV-002-02` | 이름이 비어 있음 | [가입] submit | `rsv.join.field.required` | 함수 | C-RSV-JOIN-002 · `SignupRequest.name` required |
| `V-SCR-RSV-002-03` | 비밀번호가 비어 있음 | [가입] submit | `rsv.join.field.required` | 함수 | C-RSV-JOIN-002 · `SignupRequest.password` required |

- **클라이언트 전용 검증**: blur 시점의 중복 확인은 사용자 안내용이고 가입 시점의 서버 판정이 최종이다(`reservation-003` 409). 길이 상한(로그인 ID 50, 이름 100)은 API 스키마의 `maxLength`다.
- **검증 스키마(5-IM-14)**: `signupSchema` — 파싱 성공 후 mutation 호출(Zod `safeParse`). `src/lib/schemas.ts`
- **개인정보·민감정보**: 비밀번호는 전송에만 쓰고 저장·로그·콘솔 출력을 하지 않는다(C-RSV-JOIN-004).

---

## 5. API 연동

### 5.1 응답 표기

응답 봉투는 공통 개발규칙(`4-DN-21-O3`) §2 값이 정본이다. 이 화면이 따르는 값은 아래 하나다.

- `Envelope` — `success === true`면 `data` 사용, 아니면 `error.message`를 그 화면의 알림 위치에 표시한다(§7). 검증 오류 항목은 `error.errors`(`ValidationError` 배열)다.
- HTTP 401: 이 화면의 API는 공개 경로라 401이 오지 않는다(C-RSV-LGN-001·C-RSV-JOIN-001).

### 5.2 엔드포인트 매핑

| UI 동작 | endpoint `id` | method | path | request | response | errors | 비고 |
|---|---|---|---|---|---|---|---|
| [가입] | `reservation-003` | POST | `/api/v1/auth/signup` | `SignupRequest` | `LoginUser` | BAD_REQUEST, CONFLICT, INTERNAL_SERVER_ERROR | C-RSV-JOIN-002, C-RSV-JOIN-003 |
| 로그인 ID 입력 후 중복 확인 | `reservation-004` | GET | `/api/v1/auth/login-id-availability` | `쿼리 loginId` | `LoginIdAvailability` | BAD_REQUEST | CRUD 표의 R(로그인 ID 중복 확인) |

**UI&UX 제약사항 정의(4-DN-36) CRUD 대응**

| 엔티티 | CRUD | API |
|---|---|---|
| 예약자(`reserver`) | C ○ | `reservation-003` |
| 예약자(`reserver`) | R ○ | `reservation-004` |

### 5.3 캐시·invalidate (5-IM-14 이후)

서버 상태 관리는 코딩 컨벤션 규칙(`5-IM-05-O1`) §6의 구현체인 TanStack React Query다. queryKey는 `src/hooks`의 값을 따른다.

| 동작 | 정책 |
|---|---|
| 중복 확인 | 캐시하지 않는다(mutation 형태로 호출) |
| 가입 성공 | 무효화할 쿼리 없음(로그인 전) |

---

## 6. UI 필드 ↔ API DTO 매핑

### 6.1 가입 폼

| UI 필드·라벨 | API 필드 (`SignupRequest`) | 변환 규칙 |
|---|---|---|
| 로그인 ID | `loginId` | 앞뒤 공백 제거, 최대 50자 |
| 이름 | `name` | 앞뒤 공백 제거, 최대 100자 |
| 비밀번호 | `password` | 그대로 전송, 마스킹 표시 |

### 6.2 중복 확인 결과

| UI 필드 | API (`LoginIdAvailability`) | 변환 규칙 |
|---|---|---|
| 로그인 ID 인라인 안내 | `available` | `false`면 `rsv.join.id.duplicate` 표시 |

---

## 7. 에러·로딩·빈 상태 UX

| UX ID | 상황 | 판별 | UI | message_key | 테스트 층위 | EX-ID |
|---|---|---|---|---|---|---|
| `UX-SCR-RSV-002-01` | 클라이언트 검증 실패 | — | 필드 아래 인라인 문구 | `rsv.join.field.required` | 컴포넌트 | — |
| `UX-SCR-RSV-002-02` | 로그인 ID 중복(확인·가입 응답) | 409 `success: false` | 로그인 ID 필드 인라인 안내 | `rsv.join.id.duplicate` | 컴포넌트 | — |
| `UX-SCR-RSV-002-03` | 가입 성공 | 201 | SCR-RSV-001로 이동하며 안내 | `rsv.join.submit.success` | 컴포넌트 | — |
| `UX-SCR-RSV-002-04` | 가입 실패(저장 실패) | 5xx / `success: false` | 폼 위 인라인 안내 | `rsv.join.submit.failed` | 컴포넌트 | `EX-RSV-03` |
| `UX-SCR-RSV-002-05` | 처리 중 | — | [가입] 비활성(중복 제출 방지) | — | 컴포넌트 | — |

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
