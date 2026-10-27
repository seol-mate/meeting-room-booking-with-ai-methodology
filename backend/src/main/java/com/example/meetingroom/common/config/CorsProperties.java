package com.example.meetingroom.common.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * app.cors.* 설정.
 *
 * @param allowedOrigins 쿠키(세션)를 포함한 요청을 허용할 프런트엔드 출처
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {

	public CorsProperties {
		allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
	}
}
