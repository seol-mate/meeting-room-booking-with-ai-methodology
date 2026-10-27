package com.example.meetingroom.common.config;

import com.example.meetingroom.common.security.CurrentUserProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA 감사(생성·수정 일시/주체) 활성화.
 * 주체(created_by, updated_by)는 현재 요청의 로그인 사용자 식별자이며, 로그인 사용자가 없는 곳(배치 등)에서는 비운다.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {

	@Bean
	AuditorAware<Long> auditorAware(CurrentUserProvider currentUserProvider) {
		return currentUserProvider::findUserId;
	}
}
