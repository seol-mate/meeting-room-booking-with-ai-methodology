package com.example.meetingroom.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/** 비밀번호 해시용 BCrypt 인코더. Spring Security 필터 체인은 쓰지 않고 암호 모듈만 쓴다. */
@Configuration
public class PasswordEncoderConfig {

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
