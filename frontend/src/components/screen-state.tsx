"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/messages";

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

export function StateEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export function StateError() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
      <p>{t("common.state.error")}</p>
      <div className="flex gap-2">
        <Button type="button">다시 시도</Button>
        <Button type="button" variant="outline">
          이전 화면
        </Button>
      </div>
    </div>
  );
}

export function StateForbidden() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
      <p>{t("common.state.forbidden")}</p>
      <Button type="button" variant="outline">
        이전 화면
      </Button>
    </div>
  );
}

type Props = {
  children: React.ReactNode;
  /** 빈 목록 상태 문구. 폼 화면처럼 빈 목록이 없으면 생략한다 */
  emptyMessage?: string;
  /** 폼 화면의 에러 상태: 전체 화면 대체 대신 상단 알림 배너로 보인다 */
  errorBanner?: string;
};

function Inner({ children, emptyMessage, errorBanner }: Props) {
  // 시안 미리보기용: ?state=loading|empty|error|forbidden 으로 상태별 UI를 확인한다
  const state = useSearchParams().get("state");
  if (state === "loading") return <StateLoading />;
  if (state === "forbidden") return <StateForbidden />;
  if (state === "empty" && emptyMessage) return <StateEmpty message={emptyMessage} />;
  if (state === "error") {
    if (!errorBanner) return <StateError />;
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{errorBanner}</AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }
  return <>{children}</>;
}

/** 화면 본문을 감싸 로딩·빈 목록·에러·권한없음 상태를 보여 주는 래퍼 (4-DN-36-O1 §2 전역 상태 메시지) */
export function ScreenState(props: Props) {
  return (
    <Suspense fallback={<StateLoading />}>
      <Inner {...props} />
    </Suspense>
  );
}
