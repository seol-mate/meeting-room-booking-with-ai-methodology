package com.example.meetingroom.domain.reservation.service;

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
import com.example.meetingroom.domain.reservation.dto.ReservationResultResponse;
import com.example.meetingroom.domain.reservation.dto.ReservationStatusItemResponse;
import com.example.meetingroom.domain.reservation.dto.ReservationStatusRow;
import com.example.meetingroom.domain.reservation.entity.ReservationEntity;
import com.example.meetingroom.domain.reservation.entity.ReservationStatus;
import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import com.example.meetingroom.domain.reservation.repository.ReservationRepository;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 예약 서비스(SVC-RSV-002) — 현황 조회·예약 등록·내 예약·예약 취소.
 * 회의실 정보는 회의실 도메인의 서비스 계약으로만 얻고, 그 반대 방향 의존은 없다.
 */
@Service
@Transactional(readOnly = true)
public class ReservationService {

	private static final String ROOM_MANAGER = "ROOM_MANAGER";
	private static final int MIN_MINUTES = 30;
	private static final int MAX_MINUTES = 240;

	private final ReservationRepository reservationRepository;
	private final MeetingRoomService meetingRoomService;
	private final CurrentUserProvider currentUserProvider;
	private final Clock clock;
	private final EntityManager entityManager;

	public ReservationService(ReservationRepository reservationRepository, MeetingRoomService meetingRoomService,
			CurrentUserProvider currentUserProvider, Clock clock, EntityManager entityManager) {
		this.reservationRepository = reservationRepository;
		this.meetingRoomService = meetingRoomService;
		this.currentUserProvider = currentUserProvider;
		this.clock = clock;
		this.entityManager = entityManager;
	}

	/** 그 날짜의 RESERVED 예약 현황. 회의 제목은 예약자 본인과 ROOM_MANAGER에게만 담는다(BR-03) */
	public List<ReservationStatusItemResponse> findStatus(LocalDate date, Long meetingRoomId) {
		LoginUser user = currentUserProvider.require();
		List<ReservationStatusRow> rows = reservationRepository.findStatusRows(date.atStartOfDay(),
				date.plusDays(1).atStartOfDay(), meetingRoomId);
		Map<Long, String> roomNames = meetingRoomService
				.findNamesByIds(rows.stream().map(ReservationStatusRow::meetingRoomId).collect(Collectors.toSet()));
		return rows.stream()
				.map(row -> new ReservationStatusItemResponse(row.reservationId(), row.meetingRoomId(),
						roomNames.getOrDefault(row.meetingRoomId(), ""), row.reserverName(), row.startAt(),
						row.endAt(), canSeeTitle(user, row.reserverId()) ? row.title() : null))
				.toList();
	}

	@Transactional
	public ReservationResultResponse create(ReservationCreateRequest request) {
		LoginUser user = currentUserProvider.require();
		validatePeriod(request.startAt(), request.endAt());
		if (!meetingRoomService.existsById(request.meetingRoomId())) {
			throw new BusinessException(ErrorCode.NOT_FOUND, "존재하지 않는 회의실입니다.");
		}
		if (reservationRepository.existsOverlap(request.meetingRoomId(), request.startAt(), request.endAt())) {
			throw new BusinessException(ErrorCode.CONFLICT, "이미 예약된 시간입니다.");
		}
		ReserverEntity reserver = entityManager.getReference(ReserverEntity.class, user.userId());
		MeetingRoomEntity room = entityManager.getReference(MeetingRoomEntity.class, request.meetingRoomId());
		String title = request.title() == null || request.title().isBlank() ? null : request.title().trim();
		// flush로 DB 배제 제약 위반을 이 시점에 드러낸다(경쟁 상황은 공통 핸들러가 409로 바꾼다)
		ReservationEntity saved = reservationRepository
				.saveAndFlush(new ReservationEntity(room, reserver, request.startAt(), request.endAt(), title));
		return ReservationResultResponse.from(saved, request.meetingRoomId());
	}

	/** 본인 예약 전체(취소 이력 포함). 순서는 저장소가 준 시작 일시 내림차순을 유지한다 */
	public List<MyReservationItemResponse> findMine() {
		LoginUser user = currentUserProvider.require();
		List<MyReservationRow> rows = reservationRepository.findMineRows(user.userId());
		Map<Long, String> roomNames = meetingRoomService
				.findNamesByIds(rows.stream().map(MyReservationRow::meetingRoomId).collect(Collectors.toSet()));
		return rows.stream()
				.map(row -> new MyReservationItemResponse(row.reservationId(), row.meetingRoomId(),
						roomNames.getOrDefault(row.meetingRoomId(), ""), row.startAt(), row.endAt(), row.title(),
						row.status().name(), row.cancelledAt()))
				.toList();
	}

	/** 예약 취소 — 삭제가 아니라 상태 갱신이다(BR-02). 예약 한 건을 비관적 잠금으로 직렬화한다 */
	@Transactional
	public ReservationCancelResultResponse cancel(Long reservationId) {
		LoginUser user = currentUserProvider.require();
		ReservationEntity reservation = reservationRepository.findByIdForUpdate(reservationId)
				.orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "존재하지 않는 예약입니다."));
		boolean owner = user.userId().equals(reservation.getReserverId());
		if (!owner && !user.hasRole(ROOM_MANAGER)) {
			throw new BusinessException(ErrorCode.FORBIDDEN);
		}
		if (reservation.getStatus() == ReservationStatus.CANCELLED) {
			throw new BusinessException(ErrorCode.UNPROCESSABLE, "이미 취소된 예약입니다.");
		}
		LocalDateTime now = LocalDateTime.now(clock);
		if (!reservation.getStartAt().isAfter(now)) {
			throw new BusinessException(ErrorCode.UNPROCESSABLE, "시작된 예약은 취소할 수 없습니다.");
		}
		reservation.cancel(now, user.userId());
		return new ReservationCancelResultResponse(reservation.getReservationId(), reservation.getStatus().name(),
				reservation.getCancelledAt());
	}

	/**
	 * 서비스 계약 — 기간(시작일·종료일 포함) 안에 시작하는 RESERVED 예약을 시작 일시 순으로 돌려준다.
	 * 권한 확인은 호출하는 도메인이 한다.
	 */
	public List<ActiveReservation> findActiveReservationsInPeriod(LocalDate from, LocalDate to,
			Long meetingRoomId) {
		return reservationRepository.findActiveInPeriod(from.atStartOfDay(), to.plusDays(1).atStartOfDay(),
				meetingRoomId);
	}

	private boolean canSeeTitle(LoginUser user, Long reserverId) {
		return user.hasRole(ROOM_MANAGER) || user.userId().equals(reserverId);
	}

	/** 시간 규칙(REQ-F-003) — 30분 단위, 종료가 시작보다 늦고, 길이 30분 이상 4시간 이하 */
	private void validatePeriod(LocalDateTime startAt, LocalDateTime endAt) {
		long minutes = Duration.between(startAt, endAt).toMinutes();
		boolean unitOk = startAt.getMinute() % 30 == 0 && endAt.getMinute() % 30 == 0 && startAt.getSecond() == 0
				&& endAt.getSecond() == 0;
		if (!unitOk || minutes < MIN_MINUTES || minutes > MAX_MINUTES) {
			throw new BusinessException(ErrorCode.UNPROCESSABLE, "예약은 30분 단위로 최소 30분, 최대 4시간까지 가능합니다.");
		}
	}

}
