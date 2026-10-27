package com.example.meetingroom.domain.meetingroom.service;

import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import com.example.meetingroom.common.security.CurrentUserProvider;
import com.example.meetingroom.common.security.LoginUser;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomCreateRequest;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomItemResponse;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomNameRow;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomUpdateRequest;
import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import com.example.meetingroom.domain.meetingroom.repository.MeetingRoomRepository;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회의실 서비스(SVC-MTR-001) — 회의실 등록·변경·조회와 다른 도메인에 제공하는 서비스 계약.
 * 다른 도메인 서비스를 호출하지 않는다(서비스 사이 순환 의존을 막기 위함).
 */
@Service
@Transactional(readOnly = true)
public class MeetingRoomService {

	private static final String ROOM_MANAGER = "ROOM_MANAGER";
	private static final String NAME_REQUIRED = "회의실명을 입력해 주세요.";

	private final MeetingRoomRepository meetingRoomRepository;
	private final CurrentUserProvider currentUserProvider;

	public MeetingRoomService(MeetingRoomRepository meetingRoomRepository, CurrentUserProvider currentUserProvider) {
		this.meetingRoomRepository = meetingRoomRepository;
		this.currentUserProvider = currentUserProvider;
	}

	/** 로그인한 모든 사용자에게 열려 있다 — 예약 화면들도 이 목록을 쓴다 */
	public List<MeetingRoomItemResponse> findAll() {
		currentUserProvider.require();
		return meetingRoomRepository.findAllItems().stream().map(MeetingRoomItemResponse::from).toList();
	}

	@Transactional
	public MeetingRoomItemResponse create(MeetingRoomCreateRequest request) {
		requireManager();
		validateName(request.name());
		MeetingRoomEntity saved = meetingRoomRepository.save(new MeetingRoomEntity(request.name().trim(),
				blankToNull(request.location()), request.capacity(), blankToNull(request.equipment())));
		return MeetingRoomItemResponse.from(saved);
	}

	public MeetingRoomItemResponse findOne(Long meetingRoomId) {
		requireManager();
		return MeetingRoomItemResponse.from(find(meetingRoomId));
	}

	/** 전체 교체 — 요청에 없는 선택 항목은 비워진다 */
	@Transactional
	public MeetingRoomItemResponse update(Long meetingRoomId, MeetingRoomUpdateRequest request) {
		requireManager();
		MeetingRoomEntity room = find(meetingRoomId);
		validateName(request.name());
		room.update(request.name().trim(), blankToNull(request.location()), request.capacity(),
				blankToNull(request.equipment()));
		return MeetingRoomItemResponse.from(room);
	}

	/** 서비스 계약 — 회의실이 존재하는지 돌려준다 */
	public boolean existsById(Long meetingRoomId) {
		return meetingRoomRepository.existsById(meetingRoomId);
	}

	/** 서비스 계약 — 식별자 집합의 {식별자 → 회의실명}을 한 번에 돌려준다. 없는 식별자는 결과에 없다 */
	public Map<Long, String> findNamesByIds(Collection<Long> meetingRoomIds) {
		if (meetingRoomIds.isEmpty()) {
			return Map.of();
		}
		return meetingRoomRepository.findNameRows(meetingRoomIds).stream()
				.collect(Collectors.toMap(MeetingRoomNameRow::meetingRoomId, MeetingRoomNameRow::name,
						(first, second) -> first, java.util.HashMap::new));
	}

	private MeetingRoomEntity find(Long meetingRoomId) {
		return meetingRoomRepository.findById(meetingRoomId)
				.orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "존재하지 않는 회의실입니다."));
	}

	private void requireManager() {
		LoginUser user = currentUserProvider.require();
		if (!user.hasRole(ROOM_MANAGER)) {
			throw new BusinessException(ErrorCode.FORBIDDEN);
		}
	}

	private void validateName(String name) {
		if (name == null || name.isBlank() || name.trim().length() > 100) {
			throw new BusinessException(ErrorCode.BAD_REQUEST, NAME_REQUIRED);
		}
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

}
