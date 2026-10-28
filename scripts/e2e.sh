#!/usr/bin/env bash
# E2E 자동화 테스트(6-TS-15) 로컬 실행 — CI&CD 파이프라인 구성(5-IM-02)을 생략해(RSK-13) 이 스크립트가 CI e2e 단계를 갈음한다.
# 사전 조건: PostgreSQL(docker compose) · Backend(8081) · Frontend 개발 서버(3000)가 떠 있고, 회의실 관리 담당자 계정이 있어야 한다(frontend/e2e/support.ts).
set -euo pipefail
cd "$(dirname "$0")/.."

base="${E2E_BASE_URL:-http://localhost:3000}"
for url in "http://localhost:8081/actuator/health" "$base/login"; do
  if ! curl -s -m 5 -o /dev/null "$url"; then
    echo "서버에 연결할 수 없습니다: $url" >&2
    echo "README의 기동 방법으로 DB·Backend·Frontend를 먼저 띄우세요." >&2
    exit 2
  fi
done

cd frontend
mkdir -p ../docs/evidence/6-TS-15
npx playwright test 2>&1 | tee ../docs/evidence/6-TS-15/e2e-run.log
cp e2e-results/playwright.json ../docs/evidence/6-TS-15/playwright.json
