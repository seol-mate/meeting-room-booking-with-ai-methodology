import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components 활성화 — 정적 셸을 먼저 보내고 동적 부분은 Suspense 경계에서 스트리밍한다("use cache" 사용 가능)
  cacheComponents: true,
  // 동적 라우트도 정적으로 만들 수 있는 부분(셸)만 미리 가져와 링크 이동을 빠르게 한다
  partialPrefetching: true,
  experimental: {
    // 즉시 네비게이션 검증(dev 전용) 수준
    // 페이지가 전부 클라이언트 컴포넌트(AuthGate 뒤)라 `instant = false`를 둘 수 없다. 명시한 구간만 검증한다
    instantInsights: { validationLevel: "manual-warning" },
  },
  turbopack: {
    // 파일 패턴별 로더 지정
    rules: {
      // 모든 CSS를 Tailwind 로더로 처리하고, 결과도 CSS로 취급한다
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
