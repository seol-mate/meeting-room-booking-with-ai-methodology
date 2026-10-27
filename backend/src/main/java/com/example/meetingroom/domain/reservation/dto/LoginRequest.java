package com.example.meetingroom.domain.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 로그인 요청. 비밀번호가 로그에 남지 않도록 toString에서 가린다. */
public record LoginRequest(@NotBlank @Size(max = 50) String loginId, @NotBlank String password) {

	@Override
	public String toString() {
		return "LoginRequest[loginId=" + loginId + ", password=****]";
	}
}
