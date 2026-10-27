package com.example.meetingroom.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import com.example.meetingroom.domain.reservation.entity.ReservationEntity;
import com.example.meetingroom.domain.reservation.entity.ReservationStatus;
import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import com.example.meetingroom.domain.reservation.entity.UserRole;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

class ReservationApiIntegrationTest extends IntegrationTestSupport {

	private static final LocalDateTime DAY = LocalDateTime.of(2030, 1, 2, 0, 0);

	private ReserverEntity staff;
	private ReserverEntity manager;
	private MeetingRoomEntity roomA;
	private MeetingRoomEntity roomB;

	@BeforeEach
	void setUpData() {
		manager = saveUser("manager", "김관리", UserRole.ROOM_MANAGER);
		staff = saveUser("staff", "박직원", UserRole.USER);
		roomA = saveRoom("회의실 A");
		roomB = saveRoom("회의실 B");
	}

	private String createBody(Long roomId, String start, String end, String title) {
		return "{\"meetingRoomId\":" + roomId + ",\"startAt\":\"" + start + "\",\"endAt\":\"" + end
				+ "\",\"title\":\"" + title + "\"}";
	}

	// @trace REQ-F-003 | TE-reservation-I03, reservation-006
	@Test
	void create_asLoggedInUser_returns201AndSavesUnderLoginUser() throws Exception {
		MockHttpSession session = login("staff");

		mockMvc.perform(post("/api/v1/reservations").session(session).contentType(MediaType.APPLICATION_JSON)
				.content(createBody(roomA.getMeetingRoomId(), "2030-01-02T09:00", "2030-01-02T10:00", "주간 회의")
						.replace("}", ",\"reserverId\":" + manager.getReserverId() + "}")))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.status").value("RESERVED"))
				.andExpect(jsonPath("$.data.title").value("주간 회의"));

		ReservationEntity saved = reservations.findAll().get(0);
		assertThat(saved.getReserver().getReserverId()).isEqualTo(staff.getReserverId());
	}

	// @trace REQ-F-003 | TE-reservation-I03, reservation-006
	@Test
	void create_withBadInput_returns400_422_404() throws Exception {
		MockHttpSession session = login("staff");

		mockMvc.perform(post("/api/v1/reservations").session(session).contentType(MediaType.APPLICATION_JSON)
				.content(createBody(roomA.getMeetingRoomId(), "not-a-time", "2030-01-02T10:00", "x")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("ERR-4000"));
		mockMvc.perform(post("/api/v1/reservations").session(session).contentType(MediaType.APPLICATION_JSON)
				.content(createBody(roomA.getMeetingRoomId(), "2030-01-02T08:00", "2030-01-02T12:30", "x")))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.error.code").value("ERR-4220"));
		mockMvc.perform(post("/api/v1/reservations").session(session).contentType(MediaType.APPLICATION_JSON)
				.content(createBody(99999L, "2030-01-02T09:00", "2030-01-02T10:00", "x")))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error.code").value("ERR-4040"));
	}

	// @trace REQ-F-004 | TE-reservation-I02, reservation-006
	@Test
	void create_overlappingTime_returns409() throws Exception {
		saveReservation(roomA, manager, DAY.withHour(9), DAY.withHour(11), "기존");
		MockHttpSession session = login("staff");

		mockMvc.perform(post("/api/v1/reservations").session(session).contentType(MediaType.APPLICATION_JSON)
				.content(createBody(roomA.getMeetingRoomId(), "2030-01-02T10:00", "2030-01-02T10:30", "x")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error.code").value("ERR-4090"))
				.andExpect(jsonPath("$.error.message").value("이미 예약된 시간입니다."));
		// 끝과 시작이 맞닿는 예약은 허용된다
		mockMvc.perform(post("/api/v1/reservations").session(session).contentType(MediaType.APPLICATION_JSON)
				.content(createBody(roomA.getMeetingRoomId(), "2030-01-02T11:00", "2030-01-02T11:30", "x")))
				.andExpect(status().isCreated());
	}

	// @trace REQ-F-004 | TE-reservation-I02
	@Test
	void overlapQueryAndDatabaseConstraint_rejectOverlapsAndIgnoreCancelled() {
		saveReservation(roomA, manager, DAY.withHour(9), DAY.withHour(10), "기존");
		saveCancelledReservation(roomA, manager, DAY.withHour(14), DAY.withHour(15), "취소됨");

		assertThat(reservations.existsOverlap(roomA.getMeetingRoomId(), DAY.withHour(9).withMinute(30), DAY.withHour(10).withMinute(30))).isTrue();
		assertThat(reservations.existsOverlap(roomA.getMeetingRoomId(), DAY.withHour(10), DAY.withHour(11))).isFalse();
		assertThat(reservations.existsOverlap(roomA.getMeetingRoomId(), DAY.withHour(14), DAY.withHour(15))).isFalse();
		assertThat(reservations.existsOverlap(roomB.getMeetingRoomId(), DAY.withHour(9), DAY.withHour(10))).isFalse();

		// 서비스 확인을 우회해 겹치는 예약을 저장하면 DB 배제 제약이 거부한다
		assertThatThrownBy(() -> saveReservation(roomA, staff, DAY.withHour(9).withMinute(30), DAY.withHour(10).withMinute(30), "우회"))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	// @trace REQ-F-005 | TE-reservation-I04, reservation-008
	@Test
	void cancel_ownReservation_thenListedAsCancelledAndSlotReusable() throws Exception {
		MockHttpSession session = login("staff");
		ReservationEntity mine = saveReservation(roomA, staff, DAY.withHour(9), DAY.withHour(10), "내 회의");
		saveReservation(roomB, manager, DAY.withHour(9), DAY.withHour(10), "남의 회의");

		mockMvc.perform(patch("/api/v1/reservations/{id}/cancel", mine.getReservationId()).session(session))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.status").value("CANCELLED"));

		mockMvc.perform(get("/api/v1/reservations/mine").session(session))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(1))
				.andExpect(jsonPath("$.data[0].status").value("CANCELLED"))
				.andExpect(jsonPath("$.data[0].cancelledAt").isNotEmpty());
		mockMvc.perform(post("/api/v1/reservations").session(session).contentType(MediaType.APPLICATION_JSON)
				.content(createBody(roomA.getMeetingRoomId(), "2030-01-02T09:00", "2030-01-02T10:00", "다시")))
				.andExpect(status().isCreated());
	}

	// @trace REQ-F-005 | TE-reservation-I04, reservation-008
	@Test
	void cancel_startedReservationOrUnknown_returns422Or404() throws Exception {
		MockHttpSession session = login("staff");
		ReservationEntity started = saveReservation(roomA, staff, LocalDateTime.of(2020, 1, 2, 9, 0),
				LocalDateTime.of(2020, 1, 2, 10, 0), "지난 회의");

		mockMvc.perform(patch("/api/v1/reservations/{id}/cancel", started.getReservationId()).session(session))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.error.message").value("시작된 예약은 취소할 수 없습니다."));
		mockMvc.perform(patch("/api/v1/reservations/{id}/cancel", 99999L).session(session))
				.andExpect(status().isNotFound());
		assertThat(reservations.findById(started.getReservationId()).orElseThrow().getStatus())
				.isEqualTo(ReservationStatus.RESERVED);
	}

	// @trace REQ-F-002 | TE-reservation-I05, reservation-005
	@Test
	void status_filtersByDateAndRoom_excludesCancelled_masksTitle() throws Exception {
		saveReservation(roomA, staff, DAY.withHour(9), DAY.withHour(10), "내 회의");
		saveReservation(roomB, manager, DAY.withHour(8), DAY.withHour(9), "남의 회의");
		saveCancelledReservation(roomA, manager, DAY.withHour(13), DAY.withHour(14), "취소된 회의");
		saveReservation(roomA, manager, DAY.plusDays(1).withHour(9), DAY.plusDays(1).withHour(10), "다음 날");

		MockHttpSession asStaff = login("staff");
		mockMvc.perform(get("/api/v1/reservations").param("date", "2030-01-02").session(asStaff))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(2))
				.andExpect(jsonPath("$.data[0].meetingRoomName").value("회의실 A"))
				.andExpect(jsonPath("$.data[0].title").value("내 회의"))
				.andExpect(jsonPath("$.data[1].meetingRoomName").value("회의실 B"))
				.andExpect(jsonPath("$.data[1].title").doesNotExist());
		mockMvc.perform(get("/api/v1/reservations").param("date", "2030-01-02")
				.param("meetingRoomId", String.valueOf(roomB.getMeetingRoomId())).session(asStaff))
				.andExpect(jsonPath("$.data.length()").value(1));

		MockHttpSession asManager = login("manager");
		mockMvc.perform(get("/api/v1/reservations").param("date", "2030-01-02").session(asManager))
				.andExpect(jsonPath("$.data[1].title").value("남의 회의"));

		mockMvc.perform(get("/api/v1/reservations").param("date", "2030-13-45").session(asStaff))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("ERR-4000"));
	}

	// @trace REQ-F-006 | TE-reservation-I06, reservation-008
	@Test
	void cancel_othersReservation_forbiddenForUserAllowedForManager() throws Exception {
		ReservationEntity others = saveReservation(roomA, staff, DAY.withHour(9), DAY.withHour(10), "직원 회의");
		ReserverEntity other = saveUser("other", "이직원", UserRole.USER);

		mockMvc.perform(patch("/api/v1/reservations/{id}/cancel", others.getReservationId()).session(login("other")))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error.code").value("ERR-4030"));
		assertThat(other.getReserverId()).isNotNull();

		mockMvc.perform(patch("/api/v1/reservations/{id}/cancel", others.getReservationId()).session(login("manager")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.status").value("CANCELLED"));
		assertThat(reservations.findById(others.getReservationId()).orElseThrow().getCancelledBy())
				.isEqualTo(manager.getReserverId());
	}
}
