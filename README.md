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
cp .env.local.example .env.local   # API 주소 (백엔드 준비 전에는 기본값 그대로)
npm run dev                        # http://localhost:3000
```

검증 명령: `npm run typecheck` · `npm run lint` · `npm run build` · `npm run test:coverage`.

- API codegen: `npm run codegen:api`는 5-IM-12 API 명세서 확정 뒤 5-IM-14에서 처음 실행한다(스크립트만 등록돼 있다).
- 골격 테스트(`src/store/app-store.test.ts`)는 `@trace — | skeleton`으로 표기돼 있으며 단위 테스트(6-TS-11) 분모에 들어가지 않는다.

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
