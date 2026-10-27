package com.example.meetingroom.domain.reservation.service;

import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import com.example.meetingroom.common.security.CurrentUserProvider;
import com.example.meetingroom.common.security.LoginUser;
import com.example.meetingroom.common.security.LoginUserLookup;
import com.example.meetingroom.domain.reservation.dto.LoginIdAvailabilityResponse;
import com.example.meetingroom.domain.reservation.dto.LoginRequest;
import com.example.meetingroom.domain.reservation.dto.LoginUserResponse;
import com.example.meetingroom.domain.reservation.dto.SignupRequest;
import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import com.example.meetingroom.domain.reservation.entity.UserRole;
import com.example.meetingroom.domain.reservation.repository.ReserverRepository;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 예약자 계정 서비스(SVC-RSV-001) — 가입·로그인 확인·현재 사용자 조회.
 * 공통 기능이 선언한 포트 {@link LoginUserLookup}의 어댑터이기도 하다.
 * 세션 시작은 HTTP 타입이 필요하므로 컨트롤러가 한다(서비스는 HttpServletRequest에 의존하지 않는다).
 */
@Service
@Transactional(readOnly = true)
public class AccountService implements LoginUserLookup {

	private static final String LOGIN_FAILED = "로그인 정보가 올바르지 않습니다.";
	private static final String LOGIN_ID_DUPLICATE = "이미 사용 중인 로그인 ID입니다.";

	private final ReserverRepository reserverRepository;
	private final PasswordEncoder passwordEncoder;
	private final CurrentUserProvider currentUserProvider;

	public AccountService(ReserverRepository reserverRepository, PasswordEncoder passwordEncoder,
			CurrentUserProvider currentUserProvider) {
		this.reserverRepository = reserverRepository;
		this.passwordEncoder = passwordEncoder;
		this.currentUserProvider = currentUserProvider;
	}

	/** 계정 없음과 비밀번호 불일치를 구분하지 않고 같은 오류를 던진다 */
	public LoginUserResponse login(LoginRequest request) {
		ReserverEntity reserver = reserverRepository.findByLoginId(request.loginId().trim())
				.filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
				.orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, LOGIN_FAILED));
		return LoginUserResponse.from(reserver);
	}

	@Transactional
	public LoginUserResponse signup(SignupRequest request) {
		String loginId = request.loginId().trim();
		if (reserverRepository.existsByLoginId(loginId)) {
			throw new BusinessException(ErrorCode.CONFLICT, LOGIN_ID_DUPLICATE);
		}
		ReserverEntity saved = reserverRepository.save(new ReserverEntity(loginId,
				passwordEncoder.encode(request.password()), request.name().trim(), UserRole.USER));
		return LoginUserResponse.from(saved);
	}

	public LoginIdAvailabilityResponse loginIdAvailable(String loginId) {
		return new LoginIdAvailabilityResponse(!reserverRepository.existsByLoginId(loginId.trim()));
	}

	/** 현재 로그인 사용자의 이름·역할 — 사용자가 더 이상 없으면 401 */
	public LoginUserResponse me() {
		LoginUser current = currentUserProvider.require();
		return reserverRepository.findById(current.userId()).map(LoginUserResponse::from)
				.orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
	}

	@Override
	public Optional<LoginUser> findLoginUser(Long userId) {
		return reserverRepository.findById(userId)
				.map(found -> new LoginUser(found.getReserverId(), found.getRole().name()));
	}
}
