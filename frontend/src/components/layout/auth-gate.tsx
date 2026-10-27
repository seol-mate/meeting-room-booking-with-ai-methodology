"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { StateError, StateLoading } from "@/components/screen-state";
import { useMe } from "@/hooks/use-auth";
import { isApiError } from "@/lib/api-error";

/**
 * 로그인 후 화면의 문지기 — 로그인하지 않았거나 세션이 만료되면 로그인 화면으로 보낸다(C-CMN-03, REQ-NF-001).
 * 로그인한 경우에만 공통 헤더와 본문을 보여 준다.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, error, isPending, refetch } = useMe();
  const unauthorized = isApiError(error) && error.status === 401;

  useEffect(() => {
    if (unauthorized) router.replace("/login?reason=required");
  }, [unauthorized, router]);

  if (isPending || unauthorized) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <StateLoading />
      </div>
    );
  }
  if (error || !user) {
    return <StateError onRetry={() => void refetch()} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
