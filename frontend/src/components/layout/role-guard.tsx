"use client";

import { StateForbidden, StateLoading } from "@/components/screen-state";
import { useMe } from "@/hooks/use-auth";
import type { UserRole } from "@/types/domain";

/** 지정한 역할만 하위 화면을 볼 수 있게 한다 — 그 밖의 로그인 사용자는 권한 거부 화면(C-CMN-04) */
export function RoleGuard({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { data: user, isPending } = useMe();
  if (isPending) return <StateLoading />;
  if (!user || !roles.includes(user.role)) return <StateForbidden />;
  return <>{children}</>;
}
