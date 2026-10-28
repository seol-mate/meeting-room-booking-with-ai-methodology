import { defineConfig } from "@playwright/test";

/**
 * E2E 자동화 테스트(6-TS-15) 설정 — 실행 중인 실제 서버(Next 개발 서버 + Backend + PostgreSQL)에 붙는다. API mock을 쓰지 않는다.
 * 실행은 저장소 루트의 scripts/e2e.sh가 서버 상태를 확인한 뒤 호출한다.
 */
export default defineConfig({
  testDir: "./e2e",
  // 테스트마다 새 회의실·새 계정·무작위 날짜를 써서 서로 독립이다
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["json", { outputFile: "e2e-results/playwright.json" }]],
  outputDir: "e2e-results/artifacts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    // 설치된 Chrome을 쓴다(브라우저 별도 다운로드 없음)
    channel: "chrome",
    headless: true,
    trace: "off",
  },
});
