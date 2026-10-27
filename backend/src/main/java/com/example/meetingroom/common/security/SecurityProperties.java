package com.example.meetingroom.common.security;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * app.security.* 설정.
 *
 * @param publicPaths 로그인 없이 접근을 허용하는 경로 패턴(Ant 형식). 로그인·계정 가입 엔드포인트는
 *                    경로가 확정되는 API 명세서(5-IM-12) 이후에 여기에 추가한다.
 */
@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(List<String> publicPaths) {

	public SecurityProperties {
		publicPaths = publicPaths == null ? List.of() : List.copyOf(publicPaths);
	}
}
