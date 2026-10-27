package com.example.meetingroom.domain.meetingroom.controller;

import com.example.meetingroom.common.envelope.Envelope;
import com.example.meetingroom.common.envelope.EnvelopeFactory;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomCreateRequest;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomItemResponse;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomUpdateRequest;
import com.example.meetingroom.domain.meetingroom.service.MeetingRoomService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 회의실 목록·등록·상세·변경 (meeting-room-001~004). 요청 검증과 응답 봉투 변환만 맡는다. */
@RestController
@RequestMapping("/api/v1/meeting-rooms")
public class MeetingRoomController {

	private final MeetingRoomService meetingRoomService;
	private final EnvelopeFactory envelopes;

	public MeetingRoomController(MeetingRoomService meetingRoomService, EnvelopeFactory envelopes) {
		this.meetingRoomService = meetingRoomService;
		this.envelopes = envelopes;
	}

	@GetMapping
	public Envelope<List<MeetingRoomItemResponse>> findAll() {
		return envelopes.ok(meetingRoomService.findAll());
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Envelope<MeetingRoomItemResponse> create(@Valid @RequestBody MeetingRoomCreateRequest request) {
		return envelopes.ok(meetingRoomService.create(request));
	}

	@GetMapping("/{meetingRoomId}")
	public Envelope<MeetingRoomItemResponse> findOne(@PathVariable Long meetingRoomId) {
		return envelopes.ok(meetingRoomService.findOne(meetingRoomId));
	}

	@PutMapping("/{meetingRoomId}")
	public Envelope<MeetingRoomItemResponse> update(@PathVariable Long meetingRoomId,
			@Valid @RequestBody MeetingRoomUpdateRequest request) {
		return envelopes.ok(meetingRoomService.update(meetingRoomId, request));
	}
}
