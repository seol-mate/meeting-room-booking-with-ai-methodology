package com.example.meetingroom.common.security;

import java.util.Optional;

/**
 * 포트 — 「현재 로그인 사용자 식별」(시스템 아키텍처 정의서 4-DN-01-O1 §8.1 AuthFilter 행).
 * 세션에 들어 있는 사용자 식별자로 사용자를 찾아 준다. 구현(어댑터)은 예약자 계정 서비스가
 * Backend 코드 구현(5-IM-24)에서 제공한다. 구현이 없으면 AuthFilter는 모든 요청을 미로그인으로 본다.
 */
public interface LoginUserLookup {

	/** 사용자가 없으면(삭제됨 등) 빈 값 — 그 세션은 로그인 상태로 인정하지 않는다 */
	Optional<LoginUser> findLoginUser(Long userId);
}
