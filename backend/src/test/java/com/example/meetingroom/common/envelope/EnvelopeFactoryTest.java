package com.example.meetingroom.common.envelope;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.meetingroom.common.exception.ErrorCode;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

// @trace — | PGM-CMM-002 (공통 응답 포맷 — 근거 요구사항 없음, 응답 봉투 생성 빈)
class EnvelopeFactoryTest {

	private final Clock fixed = Clock.fixed(Instant.parse("2026-11-02T00:00:00Z"), ZoneId.of("Asia/Seoul"));
	private final EnvelopeFactory factory = new EnvelopeFactory(fixed);

	@AfterEach
	void clearMdc() {
		MDC.clear();
	}

	@Test
	void ok_withData_fillsSuccessAndMeta() {
		MDC.put(EnvelopeFactory.REQUEST_ID_KEY, "req-1");

		Envelope<String> envelope = factory.ok("hello");

		assertThat(envelope.success()).isTrue();
		assertThat(envelope.data()).isEqualTo("hello");
		assertThat(envelope.error()).isNull();
		assertThat(envelope.meta().requestId()).isEqualTo("req-1");
		assertThat(envelope.meta().timestamp().toString()).isEqualTo("2026-11-02T09:00+09:00");
	}

	@Test
	void error_withCode_fillsErrorBodyWithDefaultMessage() {
		Envelope<Void> envelope = factory.error(ErrorCode.UNAUTHORIZED);

		assertThat(envelope.success()).isFalse();
		assertThat(envelope.data()).isNull();
		assertThat(envelope.error().code()).isEqualTo("ERR-4010");
		assertThat(envelope.error().message()).isEqualTo(ErrorCode.UNAUTHORIZED.getDefaultMessage());
	}

	@Test
	void error_withValidationErrors_keepsEachItem() {
		List<ValidationError> errors = List.of(new ValidationError("name", "", "must not be blank"));

		Envelope<Void> envelope = factory.error(ErrorCode.BAD_REQUEST, "검증 실패", errors);

		assertThat(envelope.error().errors()).containsExactlyElementsOf(errors);
	}

	@Test
	void ok_withoutRequestId_leavesRequestIdNull() {
		assertThat(factory.ok(1).meta().requestId()).isNull();
	}
}
