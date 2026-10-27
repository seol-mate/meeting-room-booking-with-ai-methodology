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
