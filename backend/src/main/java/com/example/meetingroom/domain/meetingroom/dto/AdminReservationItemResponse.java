package com.example.meetingroom.domain.meetingroom.dto;

import java.time.LocalDateTime;

public record AdminReservationItemResponse(
		Long reservationId,
		Long meetingRoomId,
		String meetingRoomName,
		String reserverName,
		LocalDateTime startAt,
		LocalDateTime endAt,
		String title) {
}
