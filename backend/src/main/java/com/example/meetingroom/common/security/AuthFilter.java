package com.example.meetingroom.common.security;

import com.example.meetingroom.common.envelope.EnvelopeFactory;
import com.example.meetingroom.common.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Optional;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

/**
 * 인증 필터 — 요청의 로그인 상태를 검사하고 미로그인 요청을 401로 거부한다(REQ-NF-001).
 * 세션의 사용자 식별자를 {@link LoginUserLookup}으로 확인하며, 로그인 사용자는
 * {@link CurrentUserProvider}로 꺼내 쓴다. 허용 경로(app.security.public-paths)와 CORS 사전 요청(OPTIONS)은 검사하지 않는다.
 */
@Component
// 요청 컨텍스트 필터(순서 -105) 뒤에 둬야 CurrentUserProvider가 요청 속성을 읽을 수 있다
@Order(-100)
public class AuthFilter extends OncePerRequestFilter {

	private final SecurityProperties properties;
	private final ObjectProvider<LoginUserLookup> lookup;
	private final EnvelopeFactory envelopes;
	private final JsonMapper jsonMapper;
	private final AntPathMatcher pathMatcher = new AntPathMatcher();

	public AuthFilter(SecurityProperties properties, ObjectProvider<LoginUserLookup> lookup,
			EnvelopeFactory envelopes, JsonMapper jsonMapper) {
		this.properties = properties;
		this.lookup = lookup;
		this.envelopes = envelopes;
		this.jsonMapper = jsonMapper;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		if (HttpMethod.OPTIONS.matches(request.getMethod())) {
			return true;
		}
		String path = request.getRequestURI().substring(request.getContextPath().length());
		return properties.publicPaths().stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		Optional<LoginUser> user = findLoginUser(request);
		if (user.isEmpty()) {
			reject(response);
			return;
		}
		request.setAttribute(CurrentUserProvider.REQUEST_ATTRIBUTE, user.get());
		chain.doFilter(request, response);
	}

	private Optional<LoginUser> findLoginUser(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (session == null) {
			return Optional.empty();
		}
		Object userId = session.getAttribute(LoginSession.USER_ID_ATTRIBUTE);
		if (!(userId instanceof Long id)) {
			return Optional.empty();
		}
		LoginUserLookup userLookup = lookup.getIfAvailable();
		if (userLookup == null) {
			return Optional.empty();
		}
		return userLookup.findLoginUser(id);
	}

	private void reject(HttpServletResponse response) throws IOException {
		response.setStatus(ErrorCode.UNAUTHORIZED.getStatus().value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");
		response.getWriter().write(jsonMapper.writeValueAsString(envelopes.error(ErrorCode.UNAUTHORIZED)));
	}
}
