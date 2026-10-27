package com.example.meetingroom.domain.reservation.dto;

import java.time.LocalDateTime;

public record MyReservationItemResponse(
		Long reservationId,
		Long meetingRoomId,
		String meetingRoomName,
		LocalDateTime startAt,
		LocalDateTime endAt,
		String title,
		String status,
		LocalDateTime cancelledAt) {
}
