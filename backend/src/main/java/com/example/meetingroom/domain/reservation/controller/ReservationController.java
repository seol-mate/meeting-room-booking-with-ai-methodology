package com.example.meetingroom.domain.reservation.controller;

import com.example.meetingroom.common.envelope.Envelope;
import com.example.meetingroom.common.envelope.EnvelopeFactory;
import com.example.meetingroom.domain.reservation.dto.MyReservationItemResponse;
import com.example.meetingroom.domain.reservation.dto.ReservationCancelResultResponse;
import com.example.meetingroom.domain.reservation.dto.ReservationCreateRequest;
import com.example.meetingroom.domain.reservation.dto.ReservationResultResponse;
import com.example.meetingroom.domain.reservation.dto.ReservationStatusItemResponse;
import com.example.meetingroom.domain.reservation.service.ReservationService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 예약 현황·등록·내 예약·취소 (reservation-005~008). 요청 검증과 응답 봉투 변환만 맡는다. */
@RestController
@RequestMapping("/api/v1/reservations")
public class ReservationController {

	private final ReservationService reservationService;
	private final EnvelopeFactory envelopes;

	public ReservationController(ReservationService reservationService, EnvelopeFactory envelopes) {
		this.reservationService = reservationService;
		this.envelopes = envelopes;
	}

	@GetMapping
	public Envelope<List<ReservationStatusItemResponse>> findStatus(
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
			@RequestParam(required = false) Long meetingRoomId) {
		return envelopes.ok(reservationService.findStatus(date, meetingRoomId));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Envelope<ReservationResultResponse> create(@Valid @RequestBody ReservationCreateRequest request) {
		return envelopes.ok(reservationService.create(request));
	}

	@GetMapping("/mine")
	public Envelope<List<MyReservationItemResponse>> findMine() {
		return envelopes.ok(reservationService.findMine());
	}

	@PatchMapping("/{reservationId}/cancel")
	public Envelope<ReservationCancelResultResponse> cancel(@PathVariable Long reservationId) {
		return envelopes.ok(reservationService.cancel(reservationId));
	}
}
