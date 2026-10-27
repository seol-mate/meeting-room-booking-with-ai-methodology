"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api/meeting-room";
import type { RoomInput } from "@/types/domain";

export function useRooms() {
  return useQuery({ queryKey: ["rooms"], queryFn: () => api.listRooms() });
}

export function useRoom(meetingRoomId: number | null) {
  return useQuery({
    queryKey: ["room", meetingRoomId],
    queryFn: () => api.getRoom(meetingRoomId as number),
    enabled: meetingRoomId !== null,
  });
}

/** 회의실을 바꾸면 회의실 목록과 예약 화면(현황·내 예약·전체 예약)을 모두 다시 읽는다 (C-MTR-EDT-003) */
function useInvalidateRooms() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rooms"] }),
      queryClient.invalidateQueries({ queryKey: ["room"] }),
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
    ]);
}

export function useCreateRoom() {
  const invalidate = useInvalidateRooms();
  return useMutation({ mutationFn: (input: RoomInput) => api.createRoom(input), onSuccess: invalidate });
}

export function useUpdateRoom() {
  const invalidate = useInvalidateRooms();
  return useMutation({
    mutationFn: (vars: { meetingRoomId: number; input: RoomInput }) =>
      api.updateRoom(vars.meetingRoomId, vars.input),
    onSuccess: invalidate,
  });
}
