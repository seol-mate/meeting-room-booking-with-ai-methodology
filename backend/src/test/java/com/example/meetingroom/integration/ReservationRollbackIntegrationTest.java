package com.example.meetingroom.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.meetingroom.TestcontainersConfiguration;
import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import com.example.meetingroom.domain.meetingroom.repository.MeetingRoomRepository;
import com.example.meetingroom.domain.reservation.entity.ReservationEntity;
import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import com.example.meetingroom.domain.reservation.entity.UserRole;
import com.example.meetingroom.domain.reservation.repository.ReservationRepository;
import com.example.meetingroom.domain.reservation.repository.ReserverRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 트랜잭션 롤백 대표 케이스 — 테스트가 감싸는 트랜잭션 없이 실제로 커밋·롤백되는 경계에서 확인한다.
 * 다른 통합 테스트는 테스트마다 롤백하므로 커밋 이후의 상태를 볼 수 없다. 이 클래스는 만든 데이터를 직접 지워 DB를 되돌린다.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class ReservationRollbackIntegrationTest {

	private static final LocalDateTime START = LocalDateTime.of(2031, 1, 2, 9, 0);

	@Autowired
	private ReservationRepository reservations;

	@Autowired
	private ReserverRepository reservers;

	@Autowired
	private MeetingRoomRepository rooms;

	@Autowired
	private PlatformTransactionManager transactionManager;

	private TransactionTemplate tx;
	private MeetingRoomEntity room;
	private ReserverEntity reserver;

	@BeforeEach
	void setUp() {
		tx = new TransactionTemplate(transactionManager);
		room = rooms.saveAndFlush(new MeetingRoomEntity("롤백 시험실", null, null, null));
		reserver = reservers.saveAndFlush(new ReserverEntity("rollback-" + System.nanoTime(), "hash", "롤백", UserRole.USER));
		reservations.saveAndFlush(new ReservationEntity(room, reserver, START, START.plusHours(1), "기존"));
	}

	@AfterEach
	void cleanUp() {
		reservations.deleteAll(reservations.findAll().stream()
				.filter(r -> room.getMeetingRoomId().equals(r.getMeetingRoomId())).toList());
		reservers.deleteById(reserver.getReserverId());
		rooms.deleteById(room.getMeetingRoomId());
	}

	private long countInRoom() {
		return reservations.findAll().stream().filter(r -> room.getMeetingRoomId().equals(r.getMeetingRoomId())).count();
	}

	// @trace REQ-F-004 | reservation-006 (추가 — 트랜잭션 롤백: 겹침 제약 위반 시 같은 트랜잭션의 쓰기가 함께 되돌려진다)
	@Test
	void constraintViolationInsideTransaction_rollsBackEverythingWrittenInIt() {
		long before = countInRoom();

		assertThatThrownBy(() -> tx.executeWithoutResult(status -> {
			reservations.saveAndFlush(new ReservationEntity(room, reserver, START.plusHours(3), START.plusHours(4), "먼저 쓴 예약"));
			reservations.saveAndFlush(new ReservationEntity(room, reserver, START.plusMinutes(30), START.plusMinutes(90), "겹침"));
		})).isInstanceOf(DataIntegrityViolationException.class);

		assertThat(countInRoom()).isEqualTo(before);
	}
}
