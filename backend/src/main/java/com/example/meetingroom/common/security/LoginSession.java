package com.example.meetingroom.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;

/**
 * 로그인 세션 시작·종료 도구. 계정 서비스가 로그인 검증을 끝낸 뒤 {@link #begin}을 부르고,
 * AuthFilter가 같은 키로 사용자 식별자를 읽는다.
 */
@Component
public class LoginSession {

	/** 세션에 사용자 식별자를 담는 속성 이름 */
	public static final String USER_ID_ATTRIBUTE = "loginUserId";

	/** 세션 고정 공격을 막기 위해 기존 세션이 있으면 식별자를 바꾼 뒤 사용자 식별자를 담는다 */
	public void begin(HttpServletRequest request, Long userId) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			request.changeSessionId();
		}
		else {
			session = request.getSession(true);
		}
		request.getSession(false).setAttribute(USER_ID_ATTRIBUTE, userId);
	}

	public void end(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
	}
}
