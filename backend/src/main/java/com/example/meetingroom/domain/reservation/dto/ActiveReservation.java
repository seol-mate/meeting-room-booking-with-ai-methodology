package com.example.meetingroom.domain.reservation.dto;

import java.time.LocalDateTime;

/** 다른 도메인에 제공하는 서비스 계약의 반환값 — 기간 안의 RESERVED 예약 한 건(회의 제목 전체 포함) */
public record ActiveReservation(
		Long reservationId,
		Long meetingRoomId,
		String reserverName,
		LocalDateTime startAt,
		LocalDateTime endAt,
		String title) {
}
