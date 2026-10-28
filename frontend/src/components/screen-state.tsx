"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/messages";

/** 화면 상태 UI — 로딩·빈 목록·에러·권한없음 (4-DN-36-O1 §2 전역 상태 메시지, 4-DN-38-O1 §4.4) */

export function StateLoading() {
  return (
    <div className="space-y-3" role="status" aria-label={t("common.state.loading")}>
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
      <p className="text-sm text-muted-foreground">{t("common.state.loading")}</p>
    </div>
  );
}

export function StateEmpty({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
      <p className="text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}

export function StateError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
      <p>{message ?? t("common.state.error")}</p>
      <div className="flex gap-2">
        <Button type="button" onClick={onRetry}>
          다시 시도
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          이전 화면
        </Button>
      </div>
    </div>
  );
}

export function StateForbidden() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert" data-testid="forbidden">
      <p>{t("common.state.forbidden")}</p>
      <Button type="button" variant="outline" onClick={() => router.back()}>
        이전 화면
      </Button>
    </div>
  );
}
