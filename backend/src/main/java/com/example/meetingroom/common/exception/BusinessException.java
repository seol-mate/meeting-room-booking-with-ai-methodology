package com.example.meetingroom.common.exception;

/**
 * 업무 규칙·권한·충돌 등 예상된 오류. Service에서 던지면 GlobalExceptionHandler가 오류 코드에 맞는
 * 상태 코드와 응답 봉투로 변환한다.
 */
public class BusinessException extends RuntimeException {

	private final ErrorCode errorCode;

	public BusinessException(ErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}

	public BusinessException(ErrorCode errorCode, String message) {
		super(message);
		this.errorCode = errorCode;
	}

	public ErrorCode getErrorCode() {
		return errorCode;
	}
}
