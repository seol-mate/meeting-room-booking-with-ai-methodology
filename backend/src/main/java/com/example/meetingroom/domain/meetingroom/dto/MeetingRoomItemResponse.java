package com.example.meetingroom.domain.meetingroom.dto;

import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;

public record MeetingRoomItemResponse(Long meetingRoomId, String name, String location, Integer capacity,
		String equipment) {

	public static MeetingRoomItemResponse from(MeetingRoomEntity entity) {
		return new MeetingRoomItemResponse(entity.getMeetingRoomId(), entity.getName(), entity.getLocation(),
				entity.getCapacity(), entity.getEquipment());
	}

	public static MeetingRoomItemResponse from(MeetingRoomItemRow row) {
		return new MeetingRoomItemResponse(row.meetingRoomId(), row.name(), row.location(), row.capacity(),
				row.equipment());
	}
}
