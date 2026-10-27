package com.example.meetingroom.domain.meetingroom.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import com.example.meetingroom.common.security.CurrentUserProvider;
import com.example.meetingroom.common.security.LoginUser;
import com.example.meetingroom.domain.meetingroom.dto.AdminReservationItemResponse;
import com.example.meetingroom.domain.reservation.dto.ActiveReservation;
import com.example.meetingroom.domain.reservation.service.ReservationService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminReservationQueryServiceTest {

	@Mock
	private ReservationService reservationService;

	@Mock
	private MeetingRoomService meetingRoomService;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private AdminReservationQueryService service;

	@BeforeEach
	void setUp() {
		service = new AdminReservationQueryService(reservationService, meetingRoomService, currentUserProvider);
	}

	// @trace REQ-F-008 | TE-meeting-room-U07, meeting-room-005
	@Test
	void findReservations_withReversedPeriod_throwsBadRequest() {
		when(currentUserProvider.require()).thenReturn(new LoginUser(1L, "ROOM_MANAGER"));

		BusinessException exception = null;
		try {
			service.findReservations(LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 4), null);
		}
		catch (BusinessException e) {
			exception = e;
		}

		assertThat(exception).isNotNull();
		assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
		assertThat(exception.getMessage()).isEqualTo("조회 기간의 시작일이 종료일보다 늦을 수 없습니다.");
		verify(reservationService, never()).findActiveReservationsInPeriod(any(), any(), any());
	}

	// @trace REQ-F-008 | TE-meeting-room-U07, meeting-room-005
	@Test
	void findReservations_sameDayPeriod_attachesRoomNamesInOrder() {
		when(currentUserProvider.require()).thenReturn(new LoginUser(1L, "ROOM_MANAGER"));
		LocalDateTime start = LocalDateTime.of(2026, 11, 4, 9, 0);
		when(reservationService.findActiveReservationsInPeriod(LocalDate.of(2026, 11, 4), LocalDate.of(2026, 11, 4), null))
				.thenReturn(List.of(
						new ActiveReservation(1L, 3L, "박직원", start, start.plusHours(1), "첫째"),
						new ActiveReservation(2L, 4L, "김관리", start.plusHours(2), start.plusHours(3), "둘째")));
		when(meetingRoomService.findNamesByIds(any())).thenReturn(Map.of(3L, "회의실 C", 4L, "회의실 D"));

		List<AdminReservationItemResponse> result = service.findReservations(LocalDate.of(2026, 11, 4),
				LocalDate.of(2026, 11, 4), null);

		assertThat(result).extracting(AdminReservationItemResponse::meetingRoomName).containsExactly("회의실 C", "회의실 D");
		assertThat(result).extracting(AdminReservationItemResponse::title).containsExactly("첫째", "둘째");
	}

	// @trace REQ-F-006 | TE-meeting-room-U08, meeting-room-005
	@Test
	void findReservations_asUser_throwsForbidden() {
		when(currentUserProvider.require()).thenReturn(new LoginUser(2L, "USER"));

		BusinessException exception = null;
		try {
			service.findReservations(LocalDate.of(2026, 11, 4), LocalDate.of(2026, 11, 4), null);
		}
		catch (BusinessException e) {
			exception = e;
		}

		assertThat(exception).isNotNull();
		assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN);
		verify(reservationService, never()).findActiveReservationsInPeriod(any(), any(), any());
	}
}
