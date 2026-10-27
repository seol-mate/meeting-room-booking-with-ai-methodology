package com.example.meetingroom.domain.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 계정 가입 요청. 비밀번호가 로그에 남지 않도록 toString에서 가린다. */
public record SignupRequest(
		@NotBlank @Size(max = 50) String loginId,
		@NotBlank @Size(max = 100) String name,
		@NotBlank String password) {

	@Override
	public String toString() {
		return "SignupRequest[loginId=" + loginId + ", name=" + name + ", password=****]";
	}
}
