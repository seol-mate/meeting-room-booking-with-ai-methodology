package com.example.meetingroom.domain.reservation.dto;

import java.time.LocalDateTime;

/** 예약 현황 조회의 프로젝션 행(저장소 내부용). 제목 가리기는 서비스가 한다. */
public record ReservationStatusRow(
		Long reservationId,
		Long meetingRoomId,
		Long reserverId,
		String reserverName,
		LocalDateTime startAt,
		LocalDateTime endAt,
		String title) {
}
