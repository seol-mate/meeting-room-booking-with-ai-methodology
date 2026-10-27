package com.example.meetingroom.domain.reservation.dto;

import com.example.meetingroom.domain.reservation.entity.ReservationEntity;
import java.time.LocalDateTime;

public record ReservationResultResponse(
		Long reservationId,
		Long meetingRoomId,
		LocalDateTime startAt,
		LocalDateTime endAt,
		String title,
		String status) {

	public static ReservationResultResponse from(ReservationEntity entity, Long meetingRoomId) {
		return new ReservationResultResponse(entity.getReservationId(), meetingRoomId, entity.getStartAt(),
				entity.getEndAt(), entity.getTitle(), entity.getStatus().name());
	}
}
