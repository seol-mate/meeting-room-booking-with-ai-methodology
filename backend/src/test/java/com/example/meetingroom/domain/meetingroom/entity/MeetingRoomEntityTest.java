package com.example.meetingroom.domain.meetingroom.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class MeetingRoomEntityTest {

	// @trace REQ-F-007 | TE-meeting-room-U02
	@Test
	void update_replacesAllFourFieldsIncludingNulls() {
		MeetingRoomEntity room = new MeetingRoomEntity("회의실 A", "본관 3층", 8, "모니터");

		room.update("회의실 A2", null, 10, null);

		assertThat(room.getName()).isEqualTo("회의실 A2");
		assertThat(room.getLocation()).isNull();
		assertThat(room.getCapacity()).isEqualTo(10);
		assertThat(room.getEquipment()).isNull();
	}

	// @trace REQ-F-007 | TE-meeting-room-U01
	@Test
	void newRoom_startsWithoutReservations() {
		MeetingRoomEntity room = new MeetingRoomEntity("회의실 B", null, null, null);

		assertThat(room.getReservations()).isEmpty();
		assertThat(room.getMeetingRoomId()).isNull();
	}
}
