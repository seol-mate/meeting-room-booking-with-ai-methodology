package com.example.meetingroom.common.config;

import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA 감사(생성·수정 일시/주체) 활성화.
 * 주체(created_by, updated_by)는 로그인 사용자 식별자인데, 인증은 공통 기능 구현(5-IM-04)에서 붙는다.
 * 그 전까지는 주체를 비워 둔다(두 컬럼 모두 NULL 허용).
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {

	@Bean
	AuditorAware<Long> auditorAware() {
		return Optional::empty;
	}
}
