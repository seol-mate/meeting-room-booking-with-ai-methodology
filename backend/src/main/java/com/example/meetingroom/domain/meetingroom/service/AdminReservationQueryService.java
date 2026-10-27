package com.example.meetingroom.domain.meetingroom.service;

import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import com.example.meetingroom.common.security.CurrentUserProvider;
import com.example.meetingroom.common.security.LoginUser;
import com.example.meetingroom.domain.meetingroom.dto.AdminReservationItemResponse;
import com.example.meetingroom.domain.reservation.dto.ActiveReservation;
import com.example.meetingroom.domain.reservation.service.ReservationService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 전체 예약 조회(SVC-MTR-001 — meeting-room-005). 예약 도메인의 서비스 계약과 회의실 서비스를 조합한다.
 * 이 서비스가 두 서비스를 조합하므로 서비스 사이에 순환 의존이 생기지 않는다.
 */
@Service
@Transactional(readOnly = true)
public class AdminReservationQueryService {

	private final ReservationService reservationService;
	private final MeetingRoomService meetingRoomService;
	private final CurrentUserProvider currentUserProvider;

	public AdminReservationQueryService(ReservationService reservationService, MeetingRoomService meetingRoomService,
			CurrentUserProvider currentUserProvider) {
		this.reservationService = reservationService;
		this.meetingRoomService = meetingRoomService;
		this.currentUserProvider = currentUserProvider;
	}

	public List<AdminReservationItemResponse> findReservations(LocalDate from, LocalDate to, Long meetingRoomId) {
		LoginUser user = currentUserProvider.require();
		if (!user.hasRole("ROOM_MANAGER")) {
			throw new BusinessException(ErrorCode.FORBIDDEN);
		}
		if (from.isAfter(to)) {
			throw new BusinessException(ErrorCode.BAD_REQUEST, "조회 기간의 시작일이 종료일보다 늦을 수 없습니다.");
		}
		List<ActiveReservation> reservations = reservationService.findActiveReservationsInPeriod(from, to,
				meetingRoomId);
		Map<Long, String> roomNames = meetingRoomService.findNamesByIds(
				reservations.stream().map(ActiveReservation::meetingRoomId).collect(Collectors.toSet()));
		return reservations.stream()
				.map(item -> new AdminReservationItemResponse(item.reservationId(), item.meetingRoomId(),
						roomNames.getOrDefault(item.meetingRoomId(), ""), item.reserverName(), item.startAt(),
						item.endAt(), item.title()))
				.toList();
	}
}
