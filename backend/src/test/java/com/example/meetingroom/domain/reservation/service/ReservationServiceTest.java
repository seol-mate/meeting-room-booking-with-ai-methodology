package com.example.meetingroom.domain.reservation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import com.example.meetingroom.common.security.CurrentUserProvider;
import com.example.meetingroom.common.security.LoginUser;
import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import com.example.meetingroom.domain.meetingroom.service.MeetingRoomService;
import com.example.meetingroom.domain.reservation.dto.ActiveReservation;
import com.example.meetingroom.domain.reservation.dto.MyReservationItemResponse;
import com.example.meetingroom.domain.reservation.dto.MyReservationRow;
import com.example.meetingroom.domain.reservation.dto.ReservationCancelResultResponse;
import com.example.meetingroom.domain.reservation.dto.ReservationCreateRequest;
import com.example.meetingroom.domain.reservation.dto.ReservationStatusItemResponse;
import com.example.meetingroom.domain.reservation.dto.ReservationStatusRow;
import com.example.meetingroom.domain.reservation.entity.ReservationEntity;
import com.example.meetingroom.domain.reservation.entity.ReservationStatus;
import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import com.example.meetingroom.domain.reservation.entity.UserRole;
import com.example.meetingroom.domain.reservation.repository.ReservationRepository;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

	/** 고정 시각: 2026-11-02 10:00 (Asia/Seoul) */
	private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-02T01:00:00Z"), ZoneId.of("Asia/Seoul"));
	private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 2, 10, 0);
	private static final LoginUser STAFF = new LoginUser(2L, "USER");
	private static final LoginUser MANAGER = new LoginUser(1L, "ROOM_MANAGER");

	@Mock
	private ReservationRepository reservationRepository;

	@Mock
	private MeetingRoomService meetingRoomService;

	@Mock
	private CurrentUserProvider currentUserProvider;

	@Mock
	private EntityManager entityManager;

	private ReservationService service;

	@BeforeEach
	void setUp() {
		service = new ReservationService(reservationRepository, meetingRoomService, currentUserProvider, CLOCK,
				entityManager);
	}

	private BusinessException catchBusiness(Runnable action) {
		try {
			action.run();
		}
		catch (BusinessException e) {
			return e;
		}
		throw new AssertionError("BusinessException이 던져져야 한다");
	}

	private ReservationCreateRequest request(String start, String end) {
		return new ReservationCreateRequest(1L, LocalDateTime.parse(start), LocalDateTime.parse(end), "회의");
	}

	private ReservationEntity reservationOf(long reserverId, LocalDateTime start, ReservationStatus status) {
		ReservationEntity entity = new ReservationEntity(new MeetingRoomEntity("A", null, null, null),
				new ReserverEntity("u", "h", "이름", UserRole.USER), start, start.plusHours(1), "제목");
		org.springframework.test.util.ReflectionTestUtils.setField(entity, "reserverId", reserverId);
		org.springframework.test.util.ReflectionTestUtils.setField(entity, "status", status);
		return entity;
	}

	// @trace REQ-F-002 | TE-reservation-U04, reservation-005
	@Test
	void findStatus_asUser_hidesTitleOfOthers() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		LocalDateTime start = LocalDateTime.of(2026, 11, 3, 9, 0);
		when(reservationRepository.findStatusRows(any(), any(), any())).thenReturn(List.of(
				new ReservationStatusRow(10L, 1L, 2L, "박직원", start, start.plusHours(1), "내 회의"),
				new ReservationStatusRow(11L, 1L, 1L, "김관리", start.plusHours(2), start.plusHours(3), "남의 회의")));
		when(meetingRoomService.findNamesByIds(any())).thenReturn(Map.of(1L, "회의실 A"));

		List<ReservationStatusItemResponse> result = service.findStatus(LocalDate.of(2026, 11, 3), null);

		assertThat(result).extracting(ReservationStatusItemResponse::title).containsExactly("내 회의", null);
		assertThat(result).extracting(ReservationStatusItemResponse::meetingRoomName)
				.containsOnly("회의실 A");
	}

	// @trace REQ-F-002 | TE-reservation-U04, reservation-005
	@Test
	void findStatus_asManager_showsAllTitles() {
		when(currentUserProvider.require()).thenReturn(MANAGER);
		LocalDateTime start = LocalDateTime.of(2026, 11, 3, 9, 0);
		when(reservationRepository.findStatusRows(any(), any(), any())).thenReturn(List.of(
				new ReservationStatusRow(10L, 1L, 2L, "박직원", start, start.plusHours(1), "남의 회의")));
		when(meetingRoomService.findNamesByIds(any())).thenReturn(Map.of(1L, "회의실 A"));

		assertThat(service.findStatus(LocalDate.of(2026, 11, 3), null).get(0).title()).isEqualTo("남의 회의");
	}

	// @trace REQ-F-002 | TE-reservation-U05, reservation-005
	@Test
	void findStatus_queriesDayRangeAndKeepsRepositoryOrder() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		LocalDateTime start = LocalDateTime.of(2026, 11, 3, 9, 0);
		when(reservationRepository.findStatusRows(any(), any(), eq(5L))).thenReturn(List.of(
				new ReservationStatusRow(12L, 5L, 2L, "박직원", start, start.plusHours(1), null),
				new ReservationStatusRow(10L, 5L, 2L, "박직원", start.plusHours(3), start.plusHours(4), null)));
		when(meetingRoomService.findNamesByIds(any())).thenReturn(Map.of(5L, "회의실 E"));

		List<ReservationStatusItemResponse> result = service.findStatus(LocalDate.of(2026, 11, 3), 5L);

		verify(reservationRepository).findStatusRows(LocalDateTime.of(2026, 11, 3, 0, 0),
				LocalDateTime.of(2026, 11, 4, 0, 0), 5L);
		assertThat(result).extracting(ReservationStatusItemResponse::reservationId).containsExactly(12L, 10L);
	}

	// @trace REQ-F-003 | TE-reservation-U06, reservation-006
	@Test
	void create_withInvalidTimeRule_throwsUnprocessable() {
		when(currentUserProvider.require()).thenReturn(STAFF);

		for (ReservationCreateRequest invalid : List.of(
				request("2026-11-03T09:10", "2026-11-03T10:00"),
				request("2026-11-03T09:00", "2026-11-03T09:00"),
				request("2026-11-03T10:00", "2026-11-03T09:30"),
				request("2026-11-03T09:00", "2026-11-03T13:30"))) {
			BusinessException exception = catchBusiness(() -> service.create(invalid));
			assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.UNPROCESSABLE);
			assertThat(exception.getMessage()).isEqualTo("예약은 30분 단위로 최소 30분, 최대 4시간까지 가능합니다.");
		}
		verify(reservationRepository, never()).saveAndFlush(any());
	}

	// @trace REQ-F-003 | TE-reservation-U06, reservation-006
	@Test
	void create_atBoundaryLengths_isAccepted() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		when(meetingRoomService.existsById(1L)).thenReturn(true);
		when(reservationRepository.existsOverlap(any(), any(), any())).thenReturn(false);
		when(entityManager.getReference(eq(ReserverEntity.class), any()))
				.thenReturn(new ReserverEntity("u", "h", "이름", UserRole.USER));
		when(entityManager.getReference(eq(MeetingRoomEntity.class), any()))
				.thenReturn(new MeetingRoomEntity("A", null, null, null));
		when(reservationRepository.saveAndFlush(any(ReservationEntity.class))).thenAnswer(call -> call.getArgument(0));

		service.create(request("2026-11-03T09:00", "2026-11-03T09:30"));
		service.create(request("2026-11-03T09:00", "2026-11-03T13:00"));

		verify(reservationRepository, org.mockito.Mockito.times(2)).saveAndFlush(any(ReservationEntity.class));
	}

	// @trace REQ-F-004 | TE-reservation-U07, reservation-006
	@Test
	void create_whenOverlapExists_throwsConflictAndDoesNotSave() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		when(meetingRoomService.existsById(1L)).thenReturn(true);
		when(reservationRepository.existsOverlap(eq(1L), any(), any())).thenReturn(true);

		BusinessException exception = catchBusiness(
				() -> service.create(request("2026-11-03T09:00", "2026-11-03T10:00")));

		assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.CONFLICT);
		assertThat(exception.getMessage()).isEqualTo("이미 예약된 시간입니다.");
		verify(reservationRepository, never()).saveAndFlush(any());
	}

	// @trace REQ-F-004 | TE-reservation-U07, reservation-006
	@Test
	void create_withUnknownRoom_throwsNotFound() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		when(meetingRoomService.existsById(1L)).thenReturn(false);

		BusinessException exception = catchBusiness(
				() -> service.create(request("2026-11-03T09:00", "2026-11-03T10:00")));

		assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND);
	}

	// @trace REQ-F-004 | TE-reservation-U07, reservation-006
	@Test
	void create_whenFree_savesReservedUnderCurrentUser() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		when(meetingRoomService.existsById(1L)).thenReturn(true);
		when(reservationRepository.existsOverlap(any(), any(), any())).thenReturn(false);
		ReserverEntity reserverRef = new ReserverEntity("u", "h", "이름", UserRole.USER);
		when(entityManager.getReference(ReserverEntity.class, 2L)).thenReturn(reserverRef);
		when(entityManager.getReference(MeetingRoomEntity.class, 1L))
				.thenReturn(new MeetingRoomEntity("A", null, null, null));
		when(reservationRepository.saveAndFlush(any(ReservationEntity.class))).thenAnswer(call -> call.getArgument(0));

		var result = service.create(new ReservationCreateRequest(1L, LocalDateTime.parse("2026-11-03T09:00"),
				LocalDateTime.parse("2026-11-03T10:00"), "  "));

		ArgumentCaptor<ReservationEntity> saved = ArgumentCaptor.forClass(ReservationEntity.class);
		verify(reservationRepository).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getReserver()).isSameAs(reserverRef);
		assertThat(saved.getValue().getStatus()).isEqualTo(ReservationStatus.RESERVED);
		assertThat(saved.getValue().getTitle()).isNull();
		assertThat(result.status()).isEqualTo("RESERVED");
	}

	// @trace REQ-F-005 | TE-reservation-U08, reservation-007
	@Test
	void findMine_usesCurrentUserIdAndKeepsOrder() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		LocalDateTime start = LocalDateTime.of(2026, 11, 3, 9, 0);
		when(reservationRepository.findMineRows(2L)).thenReturn(List.of(
				new MyReservationRow(21L, 1L, start.plusDays(1), start.plusDays(1).plusHours(1), "다음", ReservationStatus.RESERVED, null),
				new MyReservationRow(20L, 1L, start, start.plusHours(1), "이전", ReservationStatus.CANCELLED, NOW)));
		when(meetingRoomService.findNamesByIds(any())).thenReturn(Map.of(1L, "회의실 A"));

		List<MyReservationItemResponse> result = service.findMine();

		assertThat(result).extracting(MyReservationItemResponse::reservationId).containsExactly(21L, 20L);
		assertThat(result.get(1).status()).isEqualTo("CANCELLED");
		assertThat(result.get(1).cancelledAt()).isEqualTo(NOW);
		assertThat(result.get(0).meetingRoomName()).isEqualTo("회의실 A");
	}

	// @trace REQ-F-005 | TE-reservation-U09, reservation-008
	@Test
	void cancel_ownReservationBeforeStart_marksCancelledWithHistory() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		ReservationEntity entity = reservationOf(2L, NOW.plusDays(1), ReservationStatus.RESERVED);
		when(reservationRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(entity));

		ReservationCancelResultResponse result = service.cancel(7L);

		assertThat(entity.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
		assertThat(entity.getCancelledAt()).isEqualTo(NOW);
		assertThat(entity.getCancelledBy()).isEqualTo(2L);
		assertThat(result.status()).isEqualTo("CANCELLED");
	}

	// @trace REQ-F-005 | TE-reservation-U09, reservation-008
	@Test
	void cancel_afterStartOrAlreadyCancelled_throwsUnprocessable() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		ReservationEntity started = reservationOf(2L, NOW.minusMinutes(1), ReservationStatus.RESERVED);
		ReservationEntity cancelled = reservationOf(2L, NOW.plusDays(1), ReservationStatus.CANCELLED);
		when(reservationRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(started));
		when(reservationRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(cancelled));

		BusinessException afterStart = catchBusiness(() -> service.cancel(1L));
		BusinessException again = catchBusiness(() -> service.cancel(2L));

		assertThat(afterStart.getErrorCode()).isEqualTo(ErrorCode.UNPROCESSABLE);
		assertThat(afterStart.getMessage()).isEqualTo("시작된 예약은 취소할 수 없습니다.");
		assertThat(again.getErrorCode()).isEqualTo(ErrorCode.UNPROCESSABLE);
		assertThat(started.getStatus()).isEqualTo(ReservationStatus.RESERVED);
	}

	// @trace REQ-F-005 | TE-reservation-U09, reservation-008
	@Test
	void cancel_unknownReservation_throwsNotFound() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		when(reservationRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

		assertThat(catchBusiness(() -> service.cancel(99L)).getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND);
	}

	// @trace REQ-F-006 | TE-reservation-U10, reservation-008
	@Test
	void cancel_othersReservation_forbiddenForUserButAllowedForManager() {
		ReservationEntity others = reservationOf(5L, NOW.plusDays(1), ReservationStatus.RESERVED);
		when(reservationRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(others));

		when(currentUserProvider.require()).thenReturn(STAFF);
		assertThat(catchBusiness(() -> service.cancel(7L)).getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN);
		assertThat(others.getStatus()).isEqualTo(ReservationStatus.RESERVED);

		when(currentUserProvider.require()).thenReturn(MANAGER);
		service.cancel(7L);
		assertThat(others.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
		assertThat(others.getCancelledBy()).isEqualTo(1L);
	}

	// @trace REQ-F-008 | TE-reservation-U11
	@Test
	void findActiveReservationsInPeriod_includesBothBoundaryDays() {
		LocalDateTime start = LocalDateTime.of(2026, 11, 4, 9, 0);
		List<ActiveReservation> rows = List.of(new ActiveReservation(1L, 3L, "박직원", start, start.plusHours(1), "제목"));
		when(reservationRepository.findActiveInPeriod(any(), any(), any())).thenReturn(rows);

		List<ActiveReservation> result = service.findActiveReservationsInPeriod(LocalDate.of(2026, 11, 2),
				LocalDate.of(2026, 11, 5), 3L);

		verify(reservationRepository).findActiveInPeriod(LocalDateTime.of(2026, 11, 2, 0, 0),
				LocalDateTime.of(2026, 11, 6, 0, 0), 3L);
		assertThat(result).isEqualTo(rows);
		assertThat(result.get(0).title()).isEqualTo("제목");
	}
}
