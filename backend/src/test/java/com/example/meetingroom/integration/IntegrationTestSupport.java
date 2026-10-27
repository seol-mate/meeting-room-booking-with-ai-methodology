package com.example.meetingroom.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.example.meetingroom.TestcontainersConfiguration;
import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import com.example.meetingroom.domain.meetingroom.repository.MeetingRoomRepository;
import com.example.meetingroom.domain.reservation.entity.ReservationEntity;
import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import com.example.meetingroom.domain.reservation.entity.UserRole;
import com.example.meetingroom.domain.reservation.repository.ReservationRepository;
import com.example.meetingroom.domain.reservation.repository.ReserverRepository;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * 통합 테스트 공통 기반 — 실제 PostgreSQL(Testcontainers)과 전체 필터 체인으로 요청을 보낸다.
 * 테스트마다 트랜잭션을 롤백하므로 데이터가 남지 않는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
abstract class IntegrationTestSupport {

	protected static final String PASSWORD = "pw-1234";

	@Autowired
	protected MockMvc mockMvc;

	@Autowired
	protected ReserverRepository reservers;

	@Autowired
	protected MeetingRoomRepository rooms;

	@Autowired
	protected ReservationRepository reservations;

	@Autowired
	private PasswordEncoder passwordEncoder;

	protected ReserverEntity saveUser(String loginId, String name, UserRole role) {
		return reservers.saveAndFlush(new ReserverEntity(loginId, passwordEncoder.encode(PASSWORD), name, role));
	}

	protected MeetingRoomEntity saveRoom(String name) {
		return rooms.saveAndFlush(new MeetingRoomEntity(name, "본관 3층", 8, "모니터"));
	}

	protected ReservationEntity saveReservation(MeetingRoomEntity room, ReserverEntity reserver, LocalDateTime start,
			LocalDateTime end, String title) {
		return reservations.saveAndFlush(new ReservationEntity(room, reserver, start, end, title));
	}

	protected ReservationEntity saveCancelledReservation(MeetingRoomEntity room, ReserverEntity reserver,
			LocalDateTime start, LocalDateTime end, String title) {
		ReservationEntity entity = new ReservationEntity(room, reserver, start, end, title);
		entity.cancel(LocalDateTime.of(2020, 1, 1, 0, 0), reserver.getReserverId());
		return reservations.saveAndFlush(entity);
	}

	/** 로그인 API를 호출해 세션을 얻는다 */
	protected MockHttpSession login(String loginId) throws Exception {
		return (MockHttpSession) mockMvc
				.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"loginId\":\"" + loginId + "\",\"password\":\"" + PASSWORD + "\"}"))
				.andReturn().getRequest().getSession(false);
	}
}
