package com.example.meetingroom.common.envelope;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 공통 응답 봉투 (스키마 이름 Envelope — 4-DN-21-O3 §2): success / data / error{code,message} / meta.
 * 입력 검증 오류의 항목별 설명은 error.errors(ValidationError 배열)에 담는다.
 * 인스턴스는 {@link EnvelopeFactory}로만 만든다.
 */
public record Envelope<T>(
		boolean success,
		T data,
		@JsonInclude(JsonInclude.Include.NON_NULL) ErrorBody error,
		Meta meta) {

	public record ErrorBody(
			String code,
			String message,
			@JsonInclude(JsonInclude.Include.NON_EMPTY) List<ValidationError> errors) {
	}

	public record Meta(String requestId, OffsetDateTime timestamp) {
	}
}
