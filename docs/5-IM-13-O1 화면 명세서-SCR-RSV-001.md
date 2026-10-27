# 5-IM-13-O1 화면 명세서-SCR-RSV-001

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
| screen_id | `SCR-RSV-001` |
| 화면명 | 로그인 |
| 라우트 | `src/app/(auth)/login/page.tsx` |
| 관련 엔티티 | `reserver`(ENT-03) |
| 근거 요구사항 | REQ-F-001, REQ-NF-001 (operation 없음 — 로그인하지 않은 접근 차단은 로그인 가드와 서버 인증 필터가 실현하고 비기능 요구사항은 `x-nf-req-ids`로 추적한다) |
| 문서 목적 | 로그인 화면의 기능·클라이언트 검증·API 연동 구현 기준 |

---

## 3. 화면 기능·UI 동작

### 3.1 화면 흐름

```text
진입 → 로그인 상태 확인(reservation-002) → 이미 로그인했으면 SCR-RSV-003으로 이동
  → 로그인 ID·비밀번호 입력
  → [로그인] → 클라이언트 검증 → reservation-001 호출
  → 성공: SCR-RSV-003 이동 / 실패: 로그인하지 않고 재입력 안내(인라인)
  → [계정 가입] → SCR-RSV-002 이동
```

### 3.2 UI 이벤트

| 이벤트 ID | UI 요소 / 이벤트 | 동작 | message_key | 비고 |
|---|---|---|---|---|
| `F-SCR-RSV-001-01` | 화면 진입 | 로그인 상태를 확인하고(§5 `reservation-002`) 이미 로그인한 사용자는 SCR-RSV-003으로 이동 | — | C-RSV-LGN-001 |
| `F-SCR-RSV-001-02` | 로그인 ID 입력 | 입력값을 폼 상태에 반영 | — | — |
| `F-SCR-RSV-001-03` | 비밀번호 입력 | 마스킹 표시(`type=password`)로 입력 | — | C-RSV-LGN-003 |
| `F-SCR-RSV-001-04` | [로그인] 클릭 | 클라이언트 검증 통과 시 `reservation-001` 호출, 성공하면 SCR-RSV-003 이동 | — | C-RSV-LGN-002 |
| `F-SCR-RSV-001-05` | 로그인 실패 응답 | 로그인하지 않고 폼 위에 안내를 보이고 재입력하게 한다 | `rsv.login.submit.failed` | C-RSV-LGN-002 |
| `F-SCR-RSV-001-06` | 로그인 필요로 이동해 온 진입 | 로그인 필요 안내를 폼 위에 보인다 | `rsv.login.access.required` | C-CMN-03 |
| `F-SCR-RSV-001-07` | [계정 가입] 클릭 | SCR-RSV-002로 이동 | — | 와이어프레임 §4 |

### 3.3 인가·업무 제약

| 제약 ID | UI 반영 |
|---|---|
| C-RSV-LGN-001 | 인증 불필요(`ALL`). 화면 진입 시 로그인 상태를 확인해 로그인한 사용자는 SCR-RSV-003으로 이동 |
| C-RSV-LGN-002 | 두 항목이 모두 입력돼야 [로그인]을 실행. 잘못된 정보면 로그인하지 않고 재입력 안내(§4 V-01·V-02, §7) |
| C-RSV-LGN-003 | 비밀번호 입력은 마스킹 표시하고 화면·로그·콘솔에 값을 남기지 않는다 |

### 3.4 셀렉트박스 / 공통코드

해당 없음 — 셀렉트박스가 없다(4-DN-36 §4).

---

## 4. 클라이언트 검증 (Validation)

| 검증 ID | 대상 필드·조건 | 시점 | message_key | 판정 층위 | 근거 |
|---|---|---|---|---|---|
| `V-SCR-RSV-001-01` | 로그인 ID가 비어 있음(공백만 포함) | [로그인] submit | `rsv.login.id.required` | 함수 | C-RSV-LGN-002 · `LoginRequest.loginId` required |
| `V-SCR-RSV-001-02` | 비밀번호가 비어 있음 | [로그인] submit | `rsv.login.password.required` | 함수 | C-RSV-LGN-002 · `LoginRequest.password` required |

- **클라이언트 전용 검증**: 로그인 ID 앞뒤 공백 제거는 클라이언트 보완이다. 계정 존재 여부·비밀번호 일치는 서버만 판정한다.
- **검증 스키마(5-IM-14)**: `loginSchema` — 파싱 성공 후 mutation 호출(Zod `safeParse`). `src/lib/schemas.ts`
- **개인정보·민감정보**: 비밀번호는 전송에만 쓰고 저장·로그·콘솔 출력을 하지 않는다(C-RSV-LGN-003). 폼 상태는 제출 후에도 URL·스토리지에 담지 않는다.

---

## 5. API 연동

### 5.1 응답 표기

응답 봉투는 공통 개발규칙(`4-DN-21-O3`) §2 값이 정본이다. 이 화면이 따르는 값은 아래 하나다.

- `Envelope` — `success === true`면 `data` 사용, 아니면 `error.message`를 그 화면의 알림 위치에 표시한다(§7). 검증 오류 항목은 `error.errors`(`ValidationError` 배열)다.
- HTTP 401: 이 화면의 API는 공개 경로라 401이 오지 않는다(C-RSV-LGN-001·C-RSV-JOIN-001).

### 5.2 엔드포인트 매핑

| UI 동작 | endpoint `id` | method | path | request | response | errors | 비고 |
|---|---|---|---|---|---|---|---|
| [로그인] | `reservation-001` | POST | `/api/v1/auth/login` | `LoginRequest` | `LoginUser` | BAD_REQUEST, INTERNAL_SERVER_ERROR | C-RSV-LGN-002 |
| 화면 진입 시 로그인 상태 확인 | `reservation-002` | GET | `/api/v1/auth/me` | — | `LoginUser` | UNAUTHORIZED | 비CRUD — Must 제약 C-RSV-LGN-001(로그인 사용자의 진입 이동)이 근거 |

**UI&UX 제약사항 정의(4-DN-36) CRUD 대응**

| 엔티티 | CRUD | API |
|---|---|---|
| 예약자(`reserver`) | R ○ | `reservation-001` |

### 5.3 캐시·invalidate (5-IM-14 이후)

서버 상태 관리는 코딩 컨벤션 규칙(`5-IM-05-O1`) §6의 구현체인 TanStack React Query다. queryKey는 `src/hooks`의 값을 따른다.

| 동작 | 정책 |
|---|---|
| 로그인 상태 조회 | queryKey `["me"]`, 실패(401)는 재시도하지 않는다 |
| 로그인 성공 | 이전 캐시를 모두 지우고 응답 `LoginUser`를 `["me"]`에 저장한 뒤 SCR-RSV-003으로 이동 |

---

## 6. UI 필드 ↔ API DTO 매핑

### 6.1 로그인 폼

| UI 필드·라벨 | API 필드 (`LoginRequest`) | 변환 규칙 |
|---|---|---|
| 로그인 ID | `loginId` | 앞뒤 공백 제거, 최대 50자 |
| 비밀번호 | `password` | 그대로 전송, 마스킹 표시 |

### 6.2 로그인 결과

| UI 필드 | API (`LoginUser`) | 변환 규칙 |
|---|---|---|
| (공통 헤더의 사용자 이름·메뉴) | `reserverId`, `name`, `role` | `["me"]` 캐시에 저장해 공통 헤더가 사용 |

---

## 7. 에러·로딩·빈 상태 UX

| UX ID | 상황 | 판별 | UI | message_key | 테스트 층위 | EX-ID |
|---|---|---|---|---|---|---|
| `UX-SCR-RSV-001-01` | 화면·데이터 로딩 | — | 로그인 상태 확인 중 Skeleton | `common.state.loading` | 컴포넌트 | — |
| `UX-SCR-RSV-001-02` | 클라이언트 검증 실패 | — | 필드 아래 인라인 문구 | `rsv.login.id.required`, `rsv.login.password.required` | 컴포넌트 | — |
| `UX-SCR-RSV-001-03` | 로그인 정보 불일치 | 400 `success: false` | 폼 위 인라인 안내, 입력 유지 | `rsv.login.submit.failed` | 컴포넌트 | `EX-RSV-01` |
| `UX-SCR-RSV-001-04` | 로그인 필요로 이동해 옴 | — | 폼 위 인라인 안내 | `rsv.login.access.required` | 컴포넌트 | — |
| `UX-SCR-RSV-001-05` | 서버 오류 | 5xx / `success: false` | 폼 위 인라인 안내(재시도 유도) | `rsv.login.submit.failed` | 컴포넌트 | — |
| `UX-SCR-RSV-001-06` | 저장 처리 중 | — | [로그인] 비활성(중복 제출 방지) | — | 컴포넌트 | — |

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
