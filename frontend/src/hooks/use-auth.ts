"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/mock/api";

/** 현재 로그인 사용자 — 로그인하지 않았으면 401 오류 상태가 된다 */
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: api.me, retry: false });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.login,
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(["me"], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => queryClient.clear(),
  });
}

export function useSignup() {
  return useMutation({ mutationFn: api.signup });
}

export function useLoginIdAvailability() {
  return useMutation({ mutationFn: api.loginIdAvailability });
}
