"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/mock/api";

export function useReservationStatus(date: string, meetingRoomId?: number) {
  return useQuery({
    queryKey: ["reservations", "status", date, meetingRoomId ?? null],
    queryFn: () => api.listReservationStatus({ date, meetingRoomId }),
  });
}

export function useMyReservations() {
  return useQuery({ queryKey: ["reservations", "mine"], queryFn: api.listMyReservations });
}

export function useAdminReservations(params: { from: string; to: string; meetingRoomId?: number }, enabled = true) {
  return useQuery({
    queryKey: ["reservations", "admin", params.from, params.to, params.meetingRoomId ?? null],
    queryFn: () => api.listAdminReservations(params),
    enabled,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createReservation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cancelReservation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
