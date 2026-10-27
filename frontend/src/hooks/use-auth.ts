"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api/reservation";

/** 현재 로그인 사용자 — 로그인하지 않았으면 401 오류 상태가 된다 */
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api.me(), retry: false });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: { loginId: string; password: string }) => api.login(req),
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(["me"], user);
    },
  });
}

export function useSignup() {
  return useMutation({ mutationFn: (req: { loginId: string; name: string; password: string }) => api.signup(req) });
}

export function useLoginIdAvailability() {
  return useMutation({ mutationFn: (loginId: string) => api.loginIdAvailability(loginId) });
}
