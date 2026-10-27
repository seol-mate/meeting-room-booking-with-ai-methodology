package com.example.meetingroom.common.envelope;

import com.example.meetingroom.common.exception.ErrorCode;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

/** 응답 봉투 생성 빈 — 요청 ID(MDC)와 시각(Clock)을 meta에 채운다. */
@Component
public class EnvelopeFactory {

	/** RequestLoggingFilter가 MDC에 넣는 키와 같다 */
	public static final String REQUEST_ID_KEY = "requestId";

	private final Clock clock;

	public EnvelopeFactory(Clock clock) {
		this.clock = clock;
	}

	public <T> Envelope<T> ok(T data) {
		return new Envelope<>(true, data, null, meta());
	}

	public Envelope<Void> error(ErrorCode code) {
		return error(code, code.getDefaultMessage(), null);
	}

	public Envelope<Void> error(ErrorCode code, String message, List<ValidationError> errors) {
		return new Envelope<>(false, null, new Envelope.ErrorBody(code.getCode(), message, errors), meta());
	}

	private Envelope.Meta meta() {
		return new Envelope.Meta(MDC.get(REQUEST_ID_KEY), OffsetDateTime.now(clock));
	}
}
