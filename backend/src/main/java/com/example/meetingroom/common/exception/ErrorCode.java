package com.example.meetingroom.common.exception;

import org.springframework.http.HttpStatus;

/** 오류 코드 체계 — 공통 개발규칙(4-DN-21-O3) §4 */
public enum ErrorCode {

	BAD_REQUEST(HttpStatus.BAD_REQUEST, "ERR-4000", "요청 형식이 올바르지 않습니다."),
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "ERR-4010", "로그인이 필요합니다."),
	FORBIDDEN(HttpStatus.FORBIDDEN, "ERR-4030", "접근 권한이 없습니다."),
	NOT_FOUND(HttpStatus.NOT_FOUND, "ERR-4040", "요청한 대상을 찾을 수 없습니다."),
	CONFLICT(HttpStatus.CONFLICT, "ERR-4090", "이미 처리된 요청과 충돌합니다."),
	UNPROCESSABLE(HttpStatus.UNPROCESSABLE_CONTENT, "ERR-4220", "요청을 처리할 수 없습니다."),
	INTERNAL(HttpStatus.INTERNAL_SERVER_ERROR, "ERR-5000", "서버 내부 오류가 발생했습니다.");

	private final HttpStatus status;
	private final String code;
	private final String defaultMessage;

	ErrorCode(HttpStatus status, String code, String defaultMessage) {
		this.status = status;
		this.code = code;
		this.defaultMessage = defaultMessage;
	}

	public HttpStatus getStatus() {
		return status;
	}

	public String getCode() {
		return code;
	}

	public String getDefaultMessage() {
		return defaultMessage;
	}
}
