package com.example.meetingroom.domain.reservation.controller;

import com.example.meetingroom.common.envelope.Envelope;
import com.example.meetingroom.common.envelope.EnvelopeFactory;
import com.example.meetingroom.common.security.LoginSession;
import com.example.meetingroom.domain.reservation.dto.LoginIdAvailabilityResponse;
import com.example.meetingroom.domain.reservation.dto.LoginRequest;
import com.example.meetingroom.domain.reservation.dto.LoginUserResponse;
import com.example.meetingroom.domain.reservation.dto.SignupRequest;
import com.example.meetingroom.domain.reservation.service.AccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 계정 가입·로그인 (reservation-001~004). 요청 검증과 응답 봉투 변환, 세션 시작만 맡는다. */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AccountService accountService;
	private final LoginSession loginSession;
	private final EnvelopeFactory envelopes;

	public AuthController(AccountService accountService, LoginSession loginSession, EnvelopeFactory envelopes) {
		this.accountService = accountService;
		this.loginSession = loginSession;
		this.envelopes = envelopes;
	}

	@PostMapping("/login")
	public Envelope<LoginUserResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
		LoginUserResponse user = accountService.login(request);
		loginSession.begin(http, user.reserverId());
		return envelopes.ok(user);
	}

	@GetMapping("/me")
	public Envelope<LoginUserResponse> me() {
		return envelopes.ok(accountService.me());
	}

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	public Envelope<LoginUserResponse> signup(@Valid @RequestBody SignupRequest request) {
		return envelopes.ok(accountService.signup(request));
	}

	@GetMapping("/login-id-availability")
	public Envelope<LoginIdAvailabilityResponse> loginIdAvailability(
			@RequestParam @NotBlank @Size(max = 50) String loginId) {
		return envelopes.ok(accountService.loginIdAvailable(loginId));
	}
}
