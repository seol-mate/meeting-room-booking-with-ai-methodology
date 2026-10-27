package com.example.meetingroom.common.security;

/**
 * 로그인한 사용자 — 공통 기능이 알아야 하는 최소 정보. 역할은 코드 문자열로 받아
 * 공통 코드가 도메인(UserRole)에 의존하지 않게 한다.
 */
public record LoginUser(Long userId, String role) {

	public boolean hasRole(String expectedRole) {
		return role != null && role.equals(expectedRole);
	}
}
