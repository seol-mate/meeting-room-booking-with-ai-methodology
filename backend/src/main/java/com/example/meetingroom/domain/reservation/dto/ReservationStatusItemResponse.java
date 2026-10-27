package com.example.meetingroom.domain.reservation.dto;

import java.time.LocalDateTime;

/** 예약 현황의 예약 한 건. 회의 제목은 본인·ROOM_MANAGER가 아니면 null. */
public record ReservationStatusItemResponse(
		Long reservationId,
		Long meetingRoomId,
		String meetingRoomName,
		String reserverName,
		LocalDateTime startAt,
		LocalDateTime endAt,
		String title) {
}
