package com.example.meetingroom.common.exception;

import com.example.meetingroom.common.envelope.EnvelopeFactory;
import com.example.meetingroom.common.envelope.ValidationError;
import jakarta.validation.ConstraintViolationException;
import java.sql.SQLException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * 전역 예외 처리 — 모든 오류를 공통 응답 봉투로 변환한다(4-DN-21-O3 §2·§4).
 * 스택 트레이스는 응답에 싣지 않고 로그에만 남긴다. 4xx는 WARN, 5xx는 ERROR.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	/** PostgreSQL SQLState: 고유 제약 위반 / 배제 제약 위반 */
	private static final String SQLSTATE_UNIQUE_VIOLATION = "23505";
	private static final String SQLSTATE_EXCLUSION_VIOLATION = "23P01";

	private final EnvelopeFactory envelopes;

	public GlobalExceptionHandler(EnvelopeFactory envelopes) {
		this.envelopes = envelopes;
	}

	@ExceptionHandler(BusinessException.class)
	ResponseEntity<Object> handleBusiness(BusinessException ex) {
		ErrorCode code = ex.getErrorCode();
		log.warn("업무 오류 {}: {}", code.getCode(), ex.getMessage());
		return respond(code, ex.getMessage(), null);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	ResponseEntity<Object> handleConstraintViolation(ConstraintViolationException ex) {
		List<ValidationError> errors = ex.getConstraintViolations().stream()
				.map(v -> {
					String path = v.getPropertyPath().toString();
					String field = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
					return new ValidationError(field, stringOf(v.getInvalidValue()), v.getMessage());
				})
				.toList();
		log.warn("입력 검증 오류 {}건", errors.size());
		return respond(ErrorCode.BAD_REQUEST, ErrorCode.BAD_REQUEST.getDefaultMessage(), errors);
	}

	/** 고유·배제 제약 위반은 충돌(409), 그 밖의 무결성 오류는 서버 오류(500) */
	@ExceptionHandler(DataIntegrityViolationException.class)
	ResponseEntity<Object> handleDataIntegrity(DataIntegrityViolationException ex) {
		Throwable cause = NestedExceptionUtils.getMostSpecificCause(ex);
		String sqlState = cause instanceof SQLException sql ? sql.getSQLState() : null;
		if (SQLSTATE_UNIQUE_VIOLATION.equals(sqlState) || SQLSTATE_EXCLUSION_VIOLATION.equals(sqlState)) {
			log.warn("제약 위반(충돌) sqlState={}", sqlState);
			return respond(ErrorCode.CONFLICT, ErrorCode.CONFLICT.getDefaultMessage(), null);
		}
		log.error("데이터 무결성 오류", ex);
		return respond(ErrorCode.INTERNAL, ErrorCode.INTERNAL.getDefaultMessage(), null);
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<Object> handleUnexpected(Exception ex) {
		log.error("처리되지 않은 오류", ex);
		return respond(ErrorCode.INTERNAL, ErrorCode.INTERNAL.getDefaultMessage(), null);
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<ValidationError> errors = ex.getBindingResult().getFieldErrors().stream()
				.map(e -> new ValidationError(e.getField(), stringOf(e.getRejectedValue()), e.getDefaultMessage()))
				.toList();
		log.warn("입력 검증 오류 {}건", errors.size());
		return respond(ErrorCode.BAD_REQUEST, ErrorCode.BAD_REQUEST.getDefaultMessage(), errors);
	}

	/** Spring MVC 표준 예외(형식 오류·누락·미지원 메서드·없는 경로 등)를 봉투로 감싼다 */
	@Override
	protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
			HttpStatusCode statusCode, WebRequest request) {
		ErrorCode code;
		if (statusCode.value() == HttpStatus.NOT_FOUND.value()) {
			code = ErrorCode.NOT_FOUND;
		}
		else if (statusCode.is5xxServerError()) {
			code = ErrorCode.INTERNAL;
			log.error("서버 오류", ex);
		}
		else {
			code = ErrorCode.BAD_REQUEST;
		}
		if (!statusCode.is5xxServerError()) {
			log.warn("요청 오류 {}: {}", statusCode.value(), ex.getClass().getSimpleName());
		}
		return ResponseEntity.status(statusCode)
				.contentType(MediaType.APPLICATION_JSON)
				.body(envelopes.error(code));
	}

	private ResponseEntity<Object> respond(ErrorCode code, String message, List<ValidationError> errors) {
		return ResponseEntity.status(code.getStatus())
				.contentType(MediaType.APPLICATION_JSON)
				.body(envelopes.error(code, message, errors));
	}

	private static String stringOf(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}
