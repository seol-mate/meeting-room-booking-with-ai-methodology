package com.example.meetingroom.common.config;

import com.example.meetingroom.common.security.SecurityProperties;
import java.time.Clock;
import java.time.ZoneId;
import java.util.List;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/** 공통 빈 — 시각(Clock)과 CORS. CORS는 AuthFilter보다 먼저 적용해 401 응답에도 CORS 헤더가 붙게 한다. */
@Configuration
@EnableConfigurationProperties({ SecurityProperties.class, CorsProperties.class })
public class CommonConfig {

	@Bean
	Clock clock() {
		return Clock.system(ZoneId.of("Asia/Seoul"));
	}

	@Bean
	FilterRegistrationBean<CorsFilter> corsFilter(CorsProperties properties) {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(properties.allowedOrigins());
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setExposedHeaders(List.of("X-Request-Id"));
		configuration.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(new CorsFilter(source));
		registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
		return registration;
	}
}
