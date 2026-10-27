package com.example.meetingroom.domain.reservation.dto;

import com.example.meetingroom.domain.reservation.entity.ReservationStatus;
import java.time.LocalDateTime;

/** 내 예약 조회의 프로젝션 행(저장소 내부용) */
public record MyReservationRow(
		Long reservationId,
		Long meetingRoomId,
		LocalDateTime startAt,
		LocalDateTime endAt,
		String title,
		ReservationStatus status,
		LocalDateTime cancelledAt) {
}
