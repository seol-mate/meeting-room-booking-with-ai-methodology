package com.example.meetingroom.domain.meetingroom.controller;

import com.example.meetingroom.common.envelope.Envelope;
import com.example.meetingroom.common.envelope.EnvelopeFactory;
import com.example.meetingroom.domain.meetingroom.dto.AdminReservationItemResponse;
import com.example.meetingroom.domain.meetingroom.service.AdminReservationQueryService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 회의실 관리 담당자의 전체 예약 조회 (meeting-room-005) */
@RestController
@RequestMapping("/api/v1/admin/reservations")
public class AdminReservationController {

	private final AdminReservationQueryService queryService;
	private final EnvelopeFactory envelopes;

	public AdminReservationController(AdminReservationQueryService queryService, EnvelopeFactory envelopes) {
		this.queryService = queryService;
		this.envelopes = envelopes;
	}

	@GetMapping
	public Envelope<List<AdminReservationItemResponse>> findReservations(
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@RequestParam(required = false) Long meetingRoomId) {
		return envelopes.ok(queryService.findReservations(from, to, meetingRoomId));
	}
}
