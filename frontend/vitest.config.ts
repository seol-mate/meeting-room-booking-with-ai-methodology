import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // JSX/TSX 변환을 위한 React 플러그인
  plugins: [react()],
  resolve: {
    // tsconfig의 "@/*" 별칭과 동일하게 맞춘다
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // 브라우저 환경 흉내(DOM API 제공)
    environment: "jsdom",
    // 각 테스트 파일 실행 전에 먼저 불러오는 설정 파일
    setupFiles: ["./vitest.setup.ts"],
    // 테스트로 인식할 파일 패턴
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      // 커버리지 측정 엔진(V8 내장)
      provider: "v8",
      // 출력 형식 — 터미널 표와 JSON 요약
      reporter: ["text", "json-summary"],
      // 커버리지 측정 대상 — 순수 로직 폴더만
      include: ["src/lib/**", "src/store/**"],
    },
  },
});
