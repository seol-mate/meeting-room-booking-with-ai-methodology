package com.example.meetingroom.domain.reservation.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ReservationEntityTest {

	private static final LocalDateTime START = LocalDateTime.of(2030, 1, 2, 9, 0);
	private static final LocalDateTime END = LocalDateTime.of(2030, 1, 2, 10, 0);

	private ReservationEntity newReservation() {
		MeetingRoomEntity room = new MeetingRoomEntity("회의실 A", null, null, null);
		ReflectionTestUtils.setField(room, "meetingRoomId", 3L);
		ReserverEntity reserver = new ReserverEntity("staff", "hash", "박직원", UserRole.USER);
		ReflectionTestUtils.setField(reserver, "reserverId", 2L);
		return new ReservationEntity(room, reserver, START, END, "주간 회의");
	}

	// @trace REQ-F-004 | TE-reservation-U07
	@Test
	void newReservation_isReservedWithoutCancellationRecord() {
		ReservationEntity reservation = newReservation();

		assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.RESERVED);
		assertThat(reservation.getCancelledAt()).isNull();
		assertThat(reservation.getCancelledBy()).isNull();
	}

	// @trace REQ-F-004 | TE-reservation-U07
	@Test
	void ids_beforeColumnValuesAreFilled_fallBackToAssociations() {
		ReservationEntity reservation = newReservation();

		assertThat(reservation.getMeetingRoomId()).isEqualTo(3L);
		assertThat(reservation.getReserverId()).isEqualTo(2L);
	}

	// @trace REQ-F-004 | TE-reservation-U07
	@Test
	void ids_whenColumnValuesAreFilled_preferThem() {
		ReservationEntity reservation = newReservation();
		ReflectionTestUtils.setField(reservation, "meetingRoomId", 30L);
		ReflectionTestUtils.setField(reservation, "reserverId", 20L);

		assertThat(reservation.getMeetingRoomId()).isEqualTo(30L);
		assertThat(reservation.getReserverId()).isEqualTo(20L);
	}

	// @trace REQ-F-005 | TE-reservation-U09
	@Test
	void cancel_marksCancelledAndRecordsWhenAndWho() {
		ReservationEntity reservation = newReservation();
		LocalDateTime cancelledAt = LocalDateTime.of(2030, 1, 1, 8, 30);

		reservation.cancel(cancelledAt, 2L);

		assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
		assertThat(reservation.getCancelledAt()).isEqualTo(cancelledAt);
		assertThat(reservation.getCancelledBy()).isEqualTo(2L);
		assertThat(reservation.getStartAt()).isEqualTo(START);
	}
}
