package com.example.meetingroom.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import com.example.meetingroom.domain.reservation.entity.UserRole;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

class MeetingRoomApiIntegrationTest extends IntegrationTestSupport {

	private static final LocalDateTime DAY = LocalDateTime.of(2030, 1, 2, 0, 0);

	private ReserverEntity manager;
	private ReserverEntity staff;

	@BeforeEach
	void setUpData() {
		manager = saveUser("manager", "김관리", UserRole.ROOM_MANAGER);
		staff = saveUser("staff", "박직원", UserRole.USER);
	}

	// @trace REQ-F-007 | TE-meeting-room-I01, meeting-room-002
	@Test
	void createGetUpdate_asManager_flowAndRoleChecks() throws Exception {
		MockHttpSession asManager = login("manager");

		String created = mockMvc.perform(post("/api/v1/meeting-rooms").session(asManager)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"회의실 C\",\"location\":\"별관 2층\",\"capacity\":6,\"equipment\":\"화이트보드\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.name").value("회의실 C"))
				.andReturn().getResponse().getContentAsString();
		long id = Long.parseLong(created.replaceAll(".*\"meetingRoomId\":(\\d+).*", "$1"));

		mockMvc.perform(get("/api/v1/meeting-rooms/{id}", id).session(asManager))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.capacity").value(6));
		mockMvc.perform(put("/api/v1/meeting-rooms/{id}", id).session(asManager)
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"회의실 C2\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.name").value("회의실 C2"))
				.andExpect(jsonPath("$.data.location").doesNotExist())
				.andExpect(jsonPath("$.data.capacity").doesNotExist());
		mockMvc.perform(get("/api/v1/meeting-rooms").session(asManager))
				.andExpect(jsonPath("$.data[?(@.name == '회의실 C2')]").isNotEmpty());

		mockMvc.perform(post("/api/v1/meeting-rooms").session(asManager).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"  \"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("ERR-4000"));
		mockMvc.perform(get("/api/v1/meeting-rooms/{id}", 99999L).session(asManager))
				.andExpect(status().isNotFound());

		MockHttpSession asStaff = login("staff");
		mockMvc.perform(post("/api/v1/meeting-rooms").session(asStaff).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"몰래\"}"))
				.andExpect(status().isForbidden());
		mockMvc.perform(put("/api/v1/meeting-rooms/{id}", id).session(asStaff).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"몰래\"}"))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/meeting-rooms/{id}", id).session(asStaff))
				.andExpect(status().isForbidden());
	}

	// @trace REQ-F-002, REQ-F-003, REQ-F-004 | TE-meeting-room-I02, meeting-room-001
	@Test
	void list_isOpenToLoggedInUsers_andClosedWithoutLogin() throws Exception {
		saveRoom("회의실 B");
		saveRoom("회의실 A");

		mockMvc.perform(get("/api/v1/meeting-rooms").session(login("staff")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(2))
				.andExpect(jsonPath("$.data[0].name").value("회의실 A"));
		mockMvc.perform(get("/api/v1/meeting-rooms").session(login("manager")))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/v1/meeting-rooms"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error.code").value("ERR-4010"));
	}

	// @trace REQ-F-008 | TE-meeting-room-I03, meeting-room-005
	@Test
	void adminReservations_filtersByPeriodAndRoom_excludesCancelled() throws Exception {
		MeetingRoomEntity roomA = saveRoom("회의실 A");
		MeetingRoomEntity roomB = saveRoom("회의실 B");
		saveReservation(roomA, staff, DAY.withHour(9), DAY.withHour(10), "직원 회의");
		saveReservation(roomB, manager, DAY.plusDays(2).withHour(9), DAY.plusDays(2).withHour(10), "모레 회의");
		saveCancelledReservation(roomA, staff, DAY.withHour(13), DAY.withHour(14), "취소된 회의");
		saveReservation(roomA, staff, DAY.plusDays(10).withHour(9), DAY.plusDays(10).withHour(10), "먼 회의");
		MockHttpSession asManager = login("manager");

		mockMvc.perform(get("/api/v1/admin/reservations").param("from", "2030-01-02").param("to", "2030-01-04")
				.session(asManager))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(2))
				.andExpect(jsonPath("$.data[0].title").value("직원 회의"))
				.andExpect(jsonPath("$.data[0].reserverName").value("박직원"))
				.andExpect(jsonPath("$.data[0].meetingRoomName").value("회의실 A"));
		mockMvc.perform(get("/api/v1/admin/reservations").param("from", "2030-01-02").param("to", "2030-01-04")
				.param("meetingRoomId", String.valueOf(roomB.getMeetingRoomId())).session(asManager))
				.andExpect(jsonPath("$.data.length()").value(1));
		mockMvc.perform(get("/api/v1/admin/reservations").param("from", "2030-01-05").param("to", "2030-01-04")
				.session(asManager))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.message").value("조회 기간의 시작일이 종료일보다 늦을 수 없습니다."));
	}

	// @trace REQ-F-006 | TE-meeting-room-I04, meeting-room-005
	@Test
	void adminReservations_asUser_returns403() throws Exception {
		mockMvc.perform(get("/api/v1/admin/reservations").param("from", "2030-01-02").param("to", "2030-01-04")
				.session(login("staff")))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error.code").value("ERR-4030"));
		mockMvc.perform(get("/api/v1/admin/reservations").param("from", "2030-01-02").param("to", "2030-01-04"))
				.andExpect(status().isUnauthorized());
	}
}
