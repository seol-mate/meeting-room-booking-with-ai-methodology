"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { isApiError } from "@/lib/api-error";

/** 4xx 응답은 다시 시도해도 같으므로 재시도하지 않는다 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => {
    // 어떤 요청이든 401을 받으면 로그인 상태를 다시 확인한다 — 세션 만료 시 로그인 화면으로 보낸다(C-CMN-03)
    const onUnauthorized = (error: unknown) => {
      if (isApiError(error) && error.status === 401) {
        void created.invalidateQueries({ queryKey: ["me"] });
      }
    };
    const created: QueryClient = new QueryClient({
      // 로그인 상태 조회(me) 자체의 401은 무시한다 — 다시 조회하면 끝없이 반복된다
      queryCache: new QueryCache({
        onError: (error, query) => {
          if (query.queryKey[0] !== "me") onUnauthorized(error);
        },
      }),
      mutationCache: new MutationCache({ onError: onUnauthorized }),
      defaultOptions: { queries: { staleTime: 30_000, retry: shouldRetry } },
    });
    return created;
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
