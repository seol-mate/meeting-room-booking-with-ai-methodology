package com.example.meetingroom.domain.reservation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/** 예약 등록 요청 — 예약자는 로그인한 사용자로 정해지므로 받지 않는다. */
public record ReservationCreateRequest(
		@NotNull @Positive Long meetingRoomId,
		@NotNull LocalDateTime startAt,
		@NotNull LocalDateTime endAt,
		@Size(max = 200) String title) {
}
