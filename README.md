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

### Backend

아직 세팅 전이다(5-IM-01 Backend 개발환경 세팅은 별도 수행).
