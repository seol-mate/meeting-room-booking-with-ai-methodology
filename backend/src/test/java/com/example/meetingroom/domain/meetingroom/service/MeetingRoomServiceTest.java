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
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomCreateRequest;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomItemResponse;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomItemRow;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomNameRow;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomUpdateRequest;
import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import com.example.meetingroom.domain.meetingroom.repository.MeetingRoomRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MeetingRoomServiceTest {

	private static final LoginUser STAFF = new LoginUser(2L, "USER");
	private static final LoginUser MANAGER = new LoginUser(1L, "ROOM_MANAGER");

	@Mock
	private MeetingRoomRepository repository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private MeetingRoomService service;

	@BeforeEach
	void setUp() {
		service = new MeetingRoomService(repository, currentUserProvider);
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

	// @trace REQ-F-007 | TE-meeting-room-U01, meeting-room-002
	@Test
	void create_asUser_throwsForbidden() {
		when(currentUserProvider.require()).thenReturn(STAFF);

		BusinessException exception = catchBusiness(
				() -> service.create(new MeetingRoomCreateRequest("회의실 C", null, null, null)));

		assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN);
		verify(repository, never()).save(any());
	}

	// @trace REQ-F-007 | TE-meeting-room-U01, meeting-room-002
	@Test
	void create_withBlankName_throwsBadRequest() {
		when(currentUserProvider.require()).thenReturn(MANAGER);

		BusinessException exception = catchBusiness(
				() -> service.create(new MeetingRoomCreateRequest("   ", null, null, null)));

		assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
		assertThat(exception.getMessage()).isEqualTo("회의실명을 입력해 주세요.");
	}

	// @trace REQ-F-007 | TE-meeting-room-U01, meeting-room-002
	@Test
	void create_normalizesBlankOptionalFieldsToNull() {
		when(currentUserProvider.require()).thenReturn(MANAGER);
		when(repository.save(any(MeetingRoomEntity.class))).thenAnswer(call -> call.getArgument(0));

		MeetingRoomItemResponse response = service.create(new MeetingRoomCreateRequest(" 회의실 C ", " ", 6, ""));

		ArgumentCaptor<MeetingRoomEntity> saved = ArgumentCaptor.forClass(MeetingRoomEntity.class);
		verify(repository).save(saved.capture());
		assertThat(saved.getValue().getName()).isEqualTo("회의실 C");
		assertThat(saved.getValue().getLocation()).isNull();
		assertThat(saved.getValue().getEquipment()).isNull();
		assertThat(saved.getValue().getCapacity()).isEqualTo(6);
		assertThat(response.name()).isEqualTo("회의실 C");
	}

	// @trace REQ-F-007 | TE-meeting-room-U02, meeting-room-004
	@Test
	void update_replacesAllFields() {
		when(currentUserProvider.require()).thenReturn(MANAGER);
		MeetingRoomEntity entity = new MeetingRoomEntity("회의실 A", "본관 3층", 8, "모니터");
		when(repository.findById(1L)).thenReturn(Optional.of(entity));

		service.update(1L, new MeetingRoomUpdateRequest("회의실 A2", null, null, null));

		assertThat(entity.getName()).isEqualTo("회의실 A2");
		assertThat(entity.getLocation()).isNull();
		assertThat(entity.getCapacity()).isNull();
		assertThat(entity.getEquipment()).isNull();
	}

	// @trace REQ-F-007 | TE-meeting-room-U02, meeting-room-004
	@Test
	void update_unknownRoomOrNotManager_throws() {
		when(currentUserProvider.require()).thenReturn(MANAGER);
		when(repository.findById(9L)).thenReturn(Optional.empty());
		assertThat(catchBusiness(() -> service.update(9L, new MeetingRoomUpdateRequest("x", null, null, null)))
				.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND);

		when(currentUserProvider.require()).thenReturn(STAFF);
		assertThat(catchBusiness(() -> service.update(1L, new MeetingRoomUpdateRequest("x", null, null, null)))
				.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN);
	}

	// @trace REQ-F-007 | TE-meeting-room-U03, meeting-room-003
	@Test
	void findOne_unknownRoomOrNotManager_throws() {
		when(currentUserProvider.require()).thenReturn(MANAGER);
		when(repository.findById(9L)).thenReturn(Optional.empty());
		assertThat(catchBusiness(() -> service.findOne(9L)).getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND);

		when(currentUserProvider.require()).thenReturn(STAFF);
		assertThat(catchBusiness(() -> service.findOne(1L)).getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN);
	}

	// @trace REQ-F-002 | TE-meeting-room-U04, meeting-room-001
	@Test
	void findAll_asUser_returnsRepositoryOrder() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		when(repository.findAllItems()).thenReturn(List.of(
				new MeetingRoomItemRow(2L, "가 회의실", null, null, null),
				new MeetingRoomItemRow(1L, "나 회의실", "본관", 4, "모니터")));

		List<MeetingRoomItemResponse> result = service.findAll();

		assertThat(result).extracting(MeetingRoomItemResponse::name).containsExactly("가 회의실", "나 회의실");
	}

	// @trace REQ-F-002 | TE-meeting-room-U04, meeting-room-001
	@Test
	void findAll_withNoRooms_returnsEmptyList() {
		when(currentUserProvider.require()).thenReturn(STAFF);
		when(repository.findAllItems()).thenReturn(List.of());

		assertThat(service.findAll()).isEmpty();
	}

	// @trace REQ-F-003, REQ-F-004 | TE-meeting-room-U05
	@Test
	void existsById_reflectsRepository() {
		when(repository.existsById(1L)).thenReturn(true);
		when(repository.existsById(2L)).thenReturn(false);

		assertThat(service.existsById(1L)).isTrue();
		assertThat(service.existsById(2L)).isFalse();
	}

	// @trace REQ-F-005 | TE-meeting-room-U06
	@Test
	void findNamesByIds_returnsMapWithoutUnknownIds_andEmptyMapForEmptyInput() {
		when(repository.findNameRows(any())).thenReturn(List.of(new MeetingRoomNameRow(1L, "회의실 A")));

		assertThat(service.findNamesByIds(Set.of(1L, 99L))).isEqualTo(Map.of(1L, "회의실 A"));
		assertThat(service.findNamesByIds(Set.of())).isEmpty();
		verify(repository).findNameRows(Set.of(1L, 99L));
	}
}
