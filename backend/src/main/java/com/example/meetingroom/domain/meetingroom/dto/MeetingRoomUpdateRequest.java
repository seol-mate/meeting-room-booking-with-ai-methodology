package com.example.meetingroom.domain.meetingroom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 회의실 변경 요청 — 전체 교체이므로 요청에 없는 선택 항목은 비워진다. */
public record MeetingRoomUpdateRequest(
		@NotBlank @Size(max = 100) String name,
		@Size(max = 200) String location,
		Integer capacity,
		@Size(max = 500) String equipment) {
}
