import { AuthGate } from "@/components/layout/auth-gate";

/** 로그인 후 화면 공통 레이아웃 — 로그인 검사 + 공통 헤더 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
