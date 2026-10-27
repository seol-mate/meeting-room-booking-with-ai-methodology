package com.example.meetingroom.domain.reservation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import com.example.meetingroom.common.security.CurrentUserProvider;
import com.example.meetingroom.common.security.LoginUser;
import com.example.meetingroom.domain.reservation.dto.LoginIdAvailabilityResponse;
import com.example.meetingroom.domain.reservation.dto.LoginRequest;
import com.example.meetingroom.domain.reservation.dto.LoginUserResponse;
import com.example.meetingroom.domain.reservation.dto.SignupRequest;
import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import com.example.meetingroom.domain.reservation.entity.UserRole;
import com.example.meetingroom.domain.reservation.repository.ReserverRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

	@Mock
	private ReserverRepository reserverRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	private AccountService service;

	@BeforeEach
	void setUp() {
		service = new AccountService(reserverRepository, passwordEncoder, currentUserProvider);
	}

	private ReserverEntity reserver(String loginId, String rawPassword, String name, UserRole role) {
		return new ReserverEntity(loginId, passwordEncoder.encode(rawPassword), name, role);
	}

	// @trace REQ-F-001 | TE-reservation-U01, reservation-001
	@Test
	void login_withCorrectPassword_returnsLoginUser() {
		when(reserverRepository.findByLoginId("staff"))
				.thenReturn(Optional.of(reserver("staff", "pw-1", "박직원", UserRole.USER)));

		LoginUserResponse response = service.login(new LoginRequest("staff", "pw-1"));

		assertThat(response.name()).isEqualTo("박직원");
		assertThat(response.role()).isEqualTo("USER");
	}

	// @trace REQ-F-001 | TE-reservation-U01, reservation-001
	@Test
	void login_withWrongPasswordOrUnknownAccount_throwsSameBadRequest() {
		when(reserverRepository.findByLoginId("staff"))
				.thenReturn(Optional.of(reserver("staff", "pw-1", "박직원", UserRole.USER)));
		when(reserverRepository.findByLoginId("ghost")).thenReturn(Optional.empty());

		BusinessException wrongPassword = catchBusiness(() -> service.login(new LoginRequest("staff", "bad")));
		BusinessException unknown = catchBusiness(() -> service.login(new LoginRequest("ghost", "pw-1")));

		assertThat(wrongPassword.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
		assertThat(unknown.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
		assertThat(unknown.getMessage()).isEqualTo(wrongPassword.getMessage())
				.isEqualTo("로그인 정보가 올바르지 않습니다.");
	}

	// @trace REQ-F-001 | TE-reservation-U02, reservation-003
	@Test
	void signup_withDuplicateLoginId_throwsConflictAndDoesNotSave() {
		when(reserverRepository.existsByLoginId("staff")).thenReturn(true);

		BusinessException exception = catchBusiness(() -> service.signup(new SignupRequest("staff", "박직원", "pw")));

		assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.CONFLICT);
		verify(reserverRepository, never()).save(any());
	}

	// @trace REQ-F-001 | TE-reservation-U02, reservation-003
	@Test
	void signup_withNewLoginId_savesUserRoleWithHashedPassword() {
		when(reserverRepository.existsByLoginId("newbie")).thenReturn(false);
		when(reserverRepository.save(any(ReserverEntity.class))).thenAnswer(call -> call.getArgument(0));

		LoginUserResponse response = service.signup(new SignupRequest("newbie", "신입", "plain-pw"));

		ArgumentCaptor<ReserverEntity> saved = ArgumentCaptor.forClass(ReserverEntity.class);
		verify(reserverRepository).save(saved.capture());
		assertThat(saved.getValue().getRole()).isEqualTo(UserRole.USER);
		assertThat(saved.getValue().getPasswordHash()).isNotEqualTo("plain-pw");
		assertThat(passwordEncoder.matches("plain-pw", saved.getValue().getPasswordHash())).isTrue();
		assertThat(response.role()).isEqualTo("USER");
	}

	// @trace REQ-F-001 | TE-reservation-U03, reservation-004
	@Test
	void loginIdAvailable_reflectsExistence() {
		when(reserverRepository.existsByLoginId("staff")).thenReturn(true);
		when(reserverRepository.existsByLoginId("free")).thenReturn(false);

		assertThat(service.loginIdAvailable("staff")).isEqualTo(new LoginIdAvailabilityResponse(false));
		assertThat(service.loginIdAvailable("free")).isEqualTo(new LoginIdAvailabilityResponse(true));
	}

	// @trace REQ-F-001 | TE-reservation-U03, reservation-004
	@Test
	void findLoginUser_unknownUser_returnsEmpty() {
		when(reserverRepository.findById(99L)).thenReturn(Optional.empty());

		assertThat(service.findLoginUser(99L)).isEmpty();
	}

	// @trace REQ-F-001 | TE-reservation-U03, reservation-004
	@Test
	void findLoginUser_knownUser_returnsIdAndRole() {
		when(reserverRepository.findById(1L))
				.thenReturn(Optional.of(reserver("manager", "pw", "김관리", UserRole.ROOM_MANAGER)));

		assertThat(service.findLoginUser(1L)).contains(new LoginUser(null, "ROOM_MANAGER"));
	}

	// @trace REQ-F-001 | TE-reservation-U03, reservation-004
	@Test
	void me_returnsNameAndRoleOfCurrentUser_andUnauthorizedWhenGone() {
		when(currentUserProvider.require()).thenReturn(new LoginUser(1L, "ROOM_MANAGER"));
		when(reserverRepository.findById(1L))
				.thenReturn(Optional.of(reserver("manager", "pw", "김관리", UserRole.ROOM_MANAGER)));

		assertThat(service.me().name()).isEqualTo("김관리");

		when(reserverRepository.findById(1L)).thenReturn(Optional.empty());
		assertThat(catchBusiness(() -> service.me()).getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED);
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
}
