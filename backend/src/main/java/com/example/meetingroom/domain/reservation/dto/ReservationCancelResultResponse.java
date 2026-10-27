package com.example.meetingroom.domain.reservation.dto;

import java.time.LocalDateTime;

public record ReservationCancelResultResponse(Long reservationId, String status, LocalDateTime cancelledAt) {
}
