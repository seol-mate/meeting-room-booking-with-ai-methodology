"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api/meeting-room";
import * as reservationApi from "@/api/reservation";
import type { ReservationInput } from "@/types/domain";

export function useReservationStatus(date: string, meetingRoomId?: number) {
  return useQuery({
    queryKey: ["reservations", "status", date, meetingRoomId ?? null],
    queryFn: () => reservationApi.listReservationStatus({ date, meetingRoomId }),
  });
}

export function useMyReservations() {
  return useQuery({ queryKey: ["reservations", "mine"], queryFn: () => reservationApi.listMyReservations() });
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
    mutationFn: (input: ReservationInput) => reservationApi.createReservation(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: number) => reservationApi.cancelReservation(reservationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
