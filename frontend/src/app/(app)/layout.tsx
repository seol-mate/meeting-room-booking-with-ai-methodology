import { AuthGate } from "@/components/layout/auth-gate";

/** AuthGate가 로그인 확인 전에는 본문을 그리지 않으므로 즉시 네비게이션 검증에서 제외한다 */
export const instant = false;

/** 로그인 후 화면 공통 레이아웃 — 로그인 검사 + 공통 헤더 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
