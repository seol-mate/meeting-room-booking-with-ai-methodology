package com.example.meetingroom.common.logging;

import com.example.meetingroom.common.envelope.EnvelopeFactory;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 공통 로깅 — 요청마다 requestId를 정해 로그(MDC)와 응답 헤더에 싣고, 요청 처리 결과를 INFO로 남긴다
 * (4-DN-21-O3 §5). 본문·쿼리 문자열은 개인정보가 섞일 수 있어 기록하지 않는다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

	public static final String REQUEST_ID_HEADER = "X-Request-Id";

	private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
	/** 클라이언트가 보낸 요청 ID는 로그 위조를 막기 위해 이 형식일 때만 받아들인다 */
	private static final Pattern VALID_REQUEST_ID = Pattern.compile("[A-Za-z0-9-]{1,64}");

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String requestId = resolveRequestId(request);
		MDC.put(EnvelopeFactory.REQUEST_ID_KEY, requestId);
		response.setHeader(REQUEST_ID_HEADER, requestId);
		long startedAt = System.nanoTime();
		try {
			chain.doFilter(request, response);
		}
		finally {
			long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
			log.info("{} {} -> {} ({}ms)", request.getMethod(), request.getRequestURI(), response.getStatus(),
					elapsedMs);
			MDC.remove(EnvelopeFactory.REQUEST_ID_KEY);
		}
	}

	private String resolveRequestId(HttpServletRequest request) {
		String incoming = request.getHeader(REQUEST_ID_HEADER);
		if (incoming != null && VALID_REQUEST_ID.matcher(incoming).matches()) {
			return incoming;
		}
		return UUID.randomUUID().toString();
	}
}
