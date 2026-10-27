import { RoleGuard } from "@/components/layout/role-guard";

/** 회의실 관리 담당자 전용 화면 — ROOM_MANAGER만 접근한다 (C-MTR-LST-001, C-MTR-EDT-001, C-MTR-ALL-001) */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["ROOM_MANAGER"]}>{children}</RoleGuard>;
}
