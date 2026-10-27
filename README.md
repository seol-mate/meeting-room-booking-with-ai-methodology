# 회의실 예약 시스템

NuriAiM 방법론으로 만드는 회의실 예약 시스템. 산출물은 `docs/`, 승인·확정 기록은 `.nuriaim/`, 프론트엔드 코드는 `frontend/`에 있다.

## 개발환경

### Frontend (`frontend/`)

| 항목 | 값 |
|------|-----|
| 스택 | Next.js (App Router) + React + TypeScript |
| 서버 상태 관리·캐싱 | TanStack React Query (`src/providers/query-provider.tsx`) |
| HTTP 클라이언트 | Axios (`src/lib/axios.ts` — baseURL·인터셉터 한 곳) |
| 클라이언트 상태 | Zustand (`src/store/app-store.ts`) |
| 스키마 검증 | Zod (`src/lib/schemas.ts` — 실제 스키마는 5-IM-14에서) |
| 스타일링·컴포넌트 | Tailwind CSS 4 + shadcn/ui (`src/components/ui/`) |
| 테스트·커버리지 | Vitest + Testing Library + `@vitest/coverage-v8` |
| 패키지 매니저 | npm (사내 기본값은 pnpm이나 이 PC에 설치되어 있지 않아 npm을 쓴다) |
| 개발 포트 | 3000 |
| 디자인 토큰 | `src/app/globals.css` (4-DN-33-O1 디자인 컨셉 §4·§5 반영) |

기동 방법:

```bash
cd frontend
npm install
cp .env.local.example .env.local   # 개발 서버가 /api/* 를 넘겨 줄 백엔드 주소 (기본 http://localhost:8081)
npm run dev                        # http://localhost:3000
```

검증 명령: `npm run typecheck` · `npm run lint` · `npm run build` · `npm run test:coverage`.

- API codegen: `npm run codegen:api`는 5-IM-12 API 명세서 확정 뒤 5-IM-14에서 처음 실행한다(스크립트만 등록돼 있다).
- 골격 테스트(`src/store/app-store.test.ts`)는 `@trace — | skeleton`으로 표기돼 있으며 단위 테스트(6-TS-11) 분모에 들어가지 않는다.

#### 전체 화면 통합 (5-IM-11)

시안(4-DN-38)에 라우팅·상태·검증을 붙여 mock 데이터로 동작하는 프로토타입으로 통합했다(mock은 5-IM-14에서 제거되었다 — 아래 「화면 결선 현황」). 확인서는 `docs/5-IM-11-O1 전체 화면 코드베이스.md`.

- **구조**: 화면(`src/app`) → React Query 훅(`src/hooks`) → mock API(`src/mock/api.ts`). 5-IM-14에서 mock API 본문만 실제 호출로 바꾸고 `src/mock`을 걷어낸다.
- **인증·권한**: `(app)/layout.tsx`의 `AuthGate`가 로그인 상태를 확인하고(미로그인·세션 만료는 `/login`으로), `admin/layout.tsx`의 `RoleGuard`가 관리 담당자만 통과시킨다.
- **mock 계정**: `manager`(회의실 관리 담당자)와 `staff`(일반 사용자) — 비밀번호는 `src/mock/data.ts`. 데이터와 로그인은 브라우저 sessionStorage에 저장되며 탭을 닫으면 초기화된다.
- **폼 검증**: Zod(`src/lib/schemas.ts`), 메시지는 `src/lib/messages.ts`(`4-DN-36-O1` message_key).
- 알려진 안내: 개발 서버(`npm run dev`)가 Next.js 「즉시 탐색 검증」 Insight 1건을 표시한다 — 개발 모드 전용이며 빌드·동작에 영향이 없다.

#### 화면 결선 현황 (5-IM-14)

mock을 걷어내고 8개 화면을 백엔드 API에 결선했다. 구조: 화면(`src/app`) → React Query 훅(`src/hooks`) → API 호출 함수(`src/api/reservation.ts`·`meeting-room.ts`, Zod로 응답 검증) → Axios(`src/lib/axios.ts`).

- **API 계약**: `npm run codegen:api`가 만든 `src/types/api-<도메인>.d.ts`가 정본이고, `src/types/contract-check.ts`가 화면 타입(`domain.ts`)이 생성 타입과 어긋나면 typecheck를 실패시킨다. 호출 함수·Zod 스키마는 `operationId` 순서로 손으로 유지한다(`5-IM-05-O1` §3).
- **호출 경로**: 브라우저는 `{개발 origin}/api/v1/...`만 부른다. 경로 문자열에 앞 슬래시를 쓰지 않고(`api/v1/...`, baseURL `/`), `next.config.ts`의 rewrites가 `/api/*`를 `API_PROXY_TARGET`(기본 `http://localhost:8081`)으로 넘긴다. 같은 출처라 세션 쿠키(JSESSIONID)와 CORS 설정이 필요 없다.
- **서버 상태**: React Query만 쓴다. Zustand는 토스트(`toast-store`)·앱 UI 상태만 가진다(서버 데이터 이중 저장 없음).
- **헤더**: 로그아웃 요구사항이 없어(5-IM-22에서 기각 확정) [로그아웃] 버튼을 뺐다. `4-DN-38-O1` §4.1 정정은 별도 반영했다.
- **회의실 관리 담당자(ROOM_MANAGER)**: 생성 수단이 정해지지 않았다(조건 C2). 개발·시험에서는 DB에서 직접 올린다 — `update reserver set role='ROOM_MANAGER' where login_id='…'`.
- **사용법 문서(dev-guide류) 갱신(im-14.P14)**: 소비 프로젝트가 참조하는 사용법 문서가 없다(사전 질의 답: 「없음」). 이 README의 위 설명이 유일한 안내다.
- **NuriAF 메시지 시드(im-14.P16)**: 해당 없음(NuriAF 프로젝트가 아니다).

**§5 UI 동작 ↔ endpoint ↔ 훅**

| screen_id | UI 동작 | operationId | 훅 |
|-----------|---------|-------------|----|
| SCR-RSV-001 | 로그인 상태 확인 / [로그인] | reservation-002 / reservation-001 | `useMe` / `useLogin` |
| SCR-RSV-002 | ID 중복 확인 / [가입] | reservation-004 / reservation-003 | `useLoginIdAvailability` / `useSignup` |
| SCR-RSV-003 | 회의실 열 / 예약 현황 | meeting-room-001 / reservation-005 | `useRooms` / `useReservationStatus` |
| SCR-RSV-004 | 회의실 선택 / [예약] | meeting-room-001 / reservation-006 | `useRooms` / `useCreateReservation` |
| SCR-RSV-005 | 내 예약 목록 / [취소] | reservation-007 / reservation-008 | `useMyReservations` / `useCancelReservation` |
| SCR-MTR-001 | 회의실 목록 | meeting-room-001 | `useRooms` |
| SCR-MTR-002 | 대상 조회 / 신규 저장 / 변경 저장 | meeting-room-003 / 002 / 004 | `useRoom` / `useCreateRoom` / `useUpdateRoom` |
| SCR-MTR-003 | 전체 예약 / 조건용 회의실 / [취소] | meeting-room-005 / 001 / reservation-008 | `useAdminReservations` / `useRooms` / `useCancelReservation` |

**결선 행** (결선 일자 2026-10-27, 전체 `npm test` 13파일 127개 통과, typecheck·lint·build 통과)

| screen_id | 결선 일자 | 테스트 결과 | 관련 dev-guide 갱신 |
|-----------|-----------|-------------|---------------------|
| SCR-RSV-001 로그인 | 2026-10-27 | 12/12 통과 (+ 가드·API 계층 공통 테스트) | 없음 — 닿는 사용법 문서 없음 |
| SCR-RSV-002 계정 가입 | 2026-10-27 | 11/11 통과 | 없음 |
| SCR-RSV-003 예약 현황 | 2026-10-27 | 8/8 통과 | 없음 |
| SCR-RSV-004 회의실 예약 | 2026-10-27 | 14/14 통과 | 없음 |
| SCR-RSV-005 내 예약 | 2026-10-27 | 9/9 통과 | 없음 |
| SCR-MTR-001 회의실 목록 | 2026-10-27 | 6/6 통과 | 없음 |
| SCR-MTR-002 회의실 등록·변경 | 2026-10-27 | 14/14 통과 | 없음 |
| SCR-MTR-003 전체 예약 조회 | 2026-10-27 | 11/11 통과 | 없음 |

- 증적: Red 실행 로그 `docs/evidence/5-IM-14-red-run.log`(테스트 선행 커밋 `0397630`), Green 실행 로그 `5-IM-14-green-run.log`, `5-IM-14-typecheck.log`.
- 추적: 화면 명세 §3.2 `F-`·§4 `V-`·§7 `UX-` 122개 ID 전부와 §2 「근거 요구사항」 REQ-ID 전부가 테스트의 `@trace`에 있다(누락·지어낸 ID 0건, 대조 스크립트 결과).
- 실서버 확인(2026-10-27): 개발 서버 → 백엔드 프록시로 가입·로그인·예약 등록·겹침 거부(409)·예약 현황·전체 예약 조회·취소를 끝까지 실행했다. 브라우저 Network는 `/api/v1/...` 요청만 보였다.
- 화면 안 계정 가입 직후 로그인, 미로그인 이동(`/login?reason=required`), 권한 없는 접근 화면(`이 화면에 접근할 권한이 없습니다`)은 가드 테스트로 검증했다.

### Backend (`backend/`)

| 항목 | 값 |
|------|-----|
| 스택 | Java 25 + Spring Boot 4.1.2 (Spring Initializr로 생성), Maven(`./mvnw`) |
| 패키지 | 루트 `com.example.meetingroom` (임시 접두 — 수행 조직 확정 시 변경), 구조는 4-DN-21-O3 공통 개발규칙을 따른다 |
| 데이터 접근 | Spring Data JPA (4-DN-01-O1 §8.1, ADR-05). 복잡한 조회는 `@Query` 사용 — QueryDSL은 Spring Boot 4/Hibernate 7 호환을 확인한 뒤 필요할 때 추가 |
| DB | PostgreSQL 17 (docker compose) — UTF-8, ICU `ko-KR` 정렬 (ERD-overview §1 「DB 로케일·콜레이션」 확정값) |
| 마이그레이션 | Flyway (`src/main/resources/db/migration`). `ddl-auto`는 `validate` 고정 |
| 초기 마이그레이션 | 전략이 Code First(코드 전)라 V1은 엔티티 코드 구현(5-IM-06)에서 작성한다. 지금은 빈 디렉터리 |
| 헬스체크 | Actuator `/actuator/health`만 노출 |
| 테스트·커버리지 | JUnit + Spring Boot Test, JaCoCo (`backend/target/site/jacoco/index.html`) |
| 통합 테스트 DB 격리 | **컨테이너** — Testcontainers가 테스트마다 `postgres:17` 컨테이너를 띄운다(Docker 실행 필요) |
| 포트 | api 8081, db 5433 — 이 PC에서 8080(Jenkins)과 5432(로컬 PostgreSQL)가 이미 사용 중이라 피했다 |

접속 정보는 환경 변수로 분리한다. 저장소에는 `.env.example`만 있고 `.env`는 커밋하지 않는다.

기동 방법:

```bash
cp .env.example .env               # DB_PASSWORD 등을 채운다
docker compose up -d --wait        # 로컬 DB (localhost:5433)
set -a; . ./.env; set +a           # 환경 변수 적용 (bash 기준)
cd backend
./mvnw test                        # 테스트 + JaCoCo 리포트 (Docker 필요)
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run   # http://localhost:8081/actuator/health
```

- 프로파일: 기본(`application.yml`)과 `local`(`application-local.yml`, 디버그 로그).
- 골격 테스트(`MeetingroomApplicationTests` contextLoads)는 `// @trace — | skeleton`으로 표기돼 단위 테스트(6-TS-11) 분모에 들어가지 않는다.
- 검증 결과(2026-10-27): `./mvnw test` 통과(JaCoCo 리포트 생성), compose DB로 앱 기동 후 Flyway 연결·`/actuator/health` `UP` 확인.

#### 엔티티 코드 커버리지 (5-IM-06)

데이터 접근 기술은 JPA(4-DN-01-O1 §8.1)다. 전략은 Code First(코드 전)라 마이그레이션 V1을 이 활동에서 함께 썼다.

| ENT-ID | 엔티티 | 생성 파일 | 기술 |
|--------|--------|-----------|------|
| ENT-01 | MeetingRoom | `domain/meetingroom/entity/MeetingRoomEntity.java` | JPA `@Entity` |
| ENT-02 | Reservation | `domain/reservation/entity/ReservationEntity.java`, `ReservationStatus.java` | JPA `@Entity`, `@Enumerated(STRING)` |
| ENT-03 | Reserver | `domain/reservation/entity/ReserverEntity.java`, `UserRole.java` | JPA `@Entity`, `@Enumerated(STRING)` |
| — | (공통 부모) | `common/entity/BaseEntity.java`, `common/config/JpaAuditingConfig.java` | `@MappedSuperclass` + JPA auditing |

- 감사 컬럼 4개(`created_at`·`updated_at`·`created_by`·`updated_by`)는 `BaseEntity` 상속(ERD-overview §1 결정). 주체(`created_by`·`updated_by`)는 인증이 붙는 5-IM-04 전까지 비어 있다.
- 관계는 `entities.yaml` `relations`대로 `@ManyToOne`(LAZY, `optional=false`)과 `@OneToMany(mappedBy)`(LAZY, `List`)이며 cascade는 설정하지 않았다. `meetingRoomId`·`reserverId`는 명세 필드라 읽기 전용(`insertable=false, updatable=false`)으로 두고 값 변경은 연관관계로 한다. `cancelledBy`는 값만 보관한다(연관관계 없음).
- `status`·`role`은 명세상 `String`이지만 코드 정의서(4-DN-21-O2)의 관리 방식이 Enum이라 열거형 + `@Enumerated(STRING)`으로 매핑했다(저장 값·`varchar(20)`은 동일). `UserRole`에는 저장 값이 아닌 `ALL`을 두지 않았다.
- 엔티티에는 비즈니스 로직과 변경 메서드를 넣지 않았다 — 회의실 변경·예약 취소 등은 Backend 코드 구현(5-IM-24)에서 추가한다.

마이그레이션 파일:

| 파일 | 대상 테이블 | 근거 ERD |
|------|-------------|----------|
| `backend/src/main/resources/db/migration/V1__create_initial_tables.sql` | `reserver`, `meeting_room`, `reservation` (+ `btree_gist` 확장) | 4-DN-14-O1, 4-DN-14-O2 ERD-meeting-room·ERD-reservation (제약: `ck_reservation_status`, `ck_reservation_period`, `ex_reservation_overlap`, `idx_reservation_reserver`, `ck_reserver_role`) |

- 검증(2026-10-27): `./mvnw test`에서 V1 적용 + `ddl-auto: validate` 기동 통과. 개발 DB에서 제약 동작을 직접 확인했다 — 같은 회의실의 겹치는 예약 거부, 맞닿는 예약(10:00 종료/10:00 시작) 허용, 종료가 시작보다 빠른 예약 거부, 취소된 예약과 같은 시간 재예약 허용, 허용되지 않은 상태·역할 값 거부.
- 이 활동에서 이름을 붙인 제약: `pk_*`, `uk_reserver_login_id`, `fk_reservation_meeting_room`, `fk_reservation_reserver` (ERD 제약 표에 없던 것).

#### 공통 기능 구현 결과 (5-IM-04)

시스템 아키텍처 정의서(4-DN-01-O1) §8.1 공통 모듈 목록의 `프로젝트 구현` 모듈 3개를 모두 구현했다(`제품 제공` 행은 없다). 위치는 `backend/src/main/java/com/example/meetingroom/common/` 아래다.

| 모듈 (PGM-ID) | 구현 | 위치 | 테스트 |
|---------------|------|------|--------|
| AuthFilter (PGM-CMM-001) | 구현 | `security/AuthFilter`, `LoginSession`, `CurrentUserProvider`, `LoginUser`, `SecurityProperties` | `AuthFilterTest`, `LoginSessionTest` |
| 공통 예외 처리·응답 포맷 (PGM-CMM-002) | 구현 | `exception/GlobalExceptionHandler`, `ErrorCode`, `BusinessException`; `envelope/Envelope`, `ValidationError`, `EnvelopeFactory`, `PageData`; `util/PageParams` | `GlobalExceptionHandlerTest`, `EnvelopeFactoryTest`, `PageParamsTest` |
| 공통 로깅 (PGM-CMM-003) | 구현 | `logging/RequestLoggingFilter`; 로그 형식은 `application.yml`의 `logging.pattern.console` | `RequestLoggingFilterTest` |

동작:
- **응답 형식**: 모든 응답을 `Envelope`(`success`/`data`/`error{code,message,errors}`/`meta{requestId,timestamp}`)로 통일한다(4-DN-21-O3 §2). 검증 오류 항목은 `error.errors`(ValidationError 배열)에 담는다. 오류 코드·상태 코드는 4-DN-21-O3 §4 표를 따르며 스택 트레이스는 응답에 싣지 않는다(4xx는 WARN, 5xx는 ERROR 로그).
- **충돌 변환**: 고유·배제 제약 위반(PostgreSQL SQLState `23505`·`23P01`)은 409 `ERR-4090`으로 바꾼다 — 예약 겹침 제약(`ex_reservation_overlap`)도 이 경로다.
- **인증**: 세션 기반. `AuthFilter`가 세션의 사용자 식별자(`LoginSession.USER_ID_ATTRIBUTE`)를 포트 `LoginUserLookup`으로 확인하고, 없으면 401 `ERR-4010`. 허용 경로는 `app.security.public-paths`(`/actuator/health`와 API 명세서(5-IM-12)의 공개 operation인 `/api/v1/auth/login`·`signup`·`login-id-availability`), CORS 사전 요청(OPTIONS)은 검사하지 않는다. 서비스에서는 `CurrentUserProvider.require()`로 현재 사용자를 얻는다. JPA 감사(`created_by`·`updated_by`)도 이 값을 쓴다.
- **포트 선언(P7)**: `LoginUserLookup`(현재 로그인 사용자 식별)은 선언만 했다. 어댑터는 예약자 계정 서비스가 Backend 코드 구현(5-IM-24)에서 구현한다. 어댑터가 없는 동안에는 모든 보호 경로가 401이다.
- **세션 설정**: 만료 30분(임시 — 확정 전, UI&UX 제약사항 조건 C3), 쿠키 HttpOnly·SameSite=Lax. CSRF 방어는 별도로 구현하지 않았다(소프트웨어 아키텍처 정의서의 AuthFilter 책임에 CSRF 정책이 없다).
- **CORS**: 프런트엔드 출처(`FRONTEND_ORIGIN`, 기본 `http://localhost:3000`)만 쿠키 포함 요청을 허용한다. AuthFilter보다 먼저 적용해 401에도 CORS 헤더가 붙는다.
- **로깅**: 요청마다 `requestId`(요청 헤더 `X-Request-Id`가 안전한 형식이면 사용, 아니면 새로 생성)를 MDC와 응답 헤더에 싣고, 처리 결과를 INFO로 남긴다. 본문·쿼리 문자열은 기록하지 않는다. 형식: `[레벨] [requestId] [클래스명.메서드명] 메시지`.
- **페이징**: `PageParams.toPageable`(page 1부터, size 기본 20·최대 100, 정렬 허용 속성 지정)과 `PageData`(`items` + `pagination`)가 4-DN-21-O3 §3 규약을 구현한다.
- **데이터 접근 공통 설정**: JPA Auditing(`JpaAuditingConfig`). QueryDSL은 설정하지 않았다(필요해지면 호환 확인 후 추가).
- 검증(2026-10-27): `./mvnw test` 33개 통과(공통 기능 단위 테스트 32개 + 골격 1개). 기동 후 미로그인 요청이 401 봉투·CORS 헤더·요청 ID와 함께 거부되고 로그 형식이 규칙대로 찍히는 것을 확인했다.

#### Backend 구현 현황 (5-IM-24)

| domainId | 구현 일자 | 범위 | 테스트 결과 | 관련 사용법 문서(dev-guide) |
|----------|-----------|------|-------------|------------------------------|
| reservation | 2026-10-27 | API 8개(reservation-001~008), `AccountService`·`ReservationService`, `ReserverRepository`·`ReservationRepository`, 서비스 계약 `findActiveReservationsInPeriod`, `LoginUserLookup` 어댑터, BCrypt 설정, `ReservationEntity.cancel` | 단위 + 통합 `TE-reservation-*` 17개 전부 통과 | 없음 — 소비 프로젝트가 참조하는 사용법 문서가 없는 자체 구현 프로젝트다 |
| meeting-room | 2026-10-27 | API 5개(meeting-room-001~005), `MeetingRoomService`·`AdminReservationQueryService`, `MeetingRoomRepository`, 서비스 계약 `existsById`·`findNamesByIds`, `MeetingRoomEntity.update` | 단위 + 통합 `TE-meeting-room-*` 12개 전부 통과 | 없음 — 위와 같다 |

- 전체 `./mvnw test` 82개 통과(공통 기능·골격 33개 + 이번 49개). 통합 테스트는 Testcontainers PostgreSQL을 쓴다(Docker 필요).
- Test-First: 테스트를 먼저 커밋했고(`bce936f`, Red 실행 증적 `docs/evidence/5-IM-24-red-run.log`) 구현은 그 뒤 커밋이다. 추적 점검 결과(`@trace` ↔ 최종 명세서 TE 전수)는 `docs/evidence/5-IM-24-trace-scan.json` — 누락 0, 잘못된 ID 0.
- 구현 중 최종 명세서를 정정 1.0.1로 고쳤다 — 서비스는 HTTP 타입에 의존하지 않으므로 로그인 세션 시작을 컨트롤러로 옮기고, 현재 사용자 이름 조회용 `AccountService.me`를 추가했고, 저장소 쿼리 동작에 속하는 TE 설명을 단위/통합 경계에 맞췄다. 동작 변경은 없다.
- `ReservationEntity.getMeetingRoomId()`·`getReserverId()`는 읽기 전용 컬럼 값이 비어 있는 같은 트랜잭션의 새 엔티티에서 연관관계의 식별자를 대신 돌려준다(엔티티 코드 5-IM-06의 최소 수정).
- 실서버 확인: 가입 → 로그인 → 회의실 등록 → 예약 등록 → 겹침 409 → 시간 규칙 422 → 제목 가리기 → 일반 사용자의 관리 API 403 → 취소(타인 403, 관리자 200) → 재취소 422.
- 최초 `ROOM_MANAGER` 계정을 만드는 방법은 아직 없다(UI&UX 제약사항 조건 C2 미결). 임시로 DB의 `reserver.role`을 직접 바꾼다(`update reserver set role = 'ROOM_MANAGER' where login_id = '...'`).
