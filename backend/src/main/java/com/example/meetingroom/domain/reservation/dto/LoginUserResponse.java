package com.example.meetingroom.domain.reservation.dto;

import com.example.meetingroom.domain.reservation.entity.ReserverEntity;

/** 로그인한 사용자(비밀번호·해시 제외) */
public record LoginUserResponse(Long reserverId, String name, String role) {

	public static LoginUserResponse from(ReserverEntity entity) {
		return new LoginUserResponse(entity.getReserverId(), entity.getName(), entity.getRole().name());
	}
}
