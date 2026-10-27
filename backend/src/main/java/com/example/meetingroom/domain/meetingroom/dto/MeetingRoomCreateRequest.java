package com.example.meetingroom.domain.meetingroom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MeetingRoomCreateRequest(
		@NotBlank @Size(max = 100) String name,
		@Size(max = 200) String location,
		Integer capacity,
		@Size(max = 500) String equipment) {
}
