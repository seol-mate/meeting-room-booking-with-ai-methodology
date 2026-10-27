package com.example.meetingroom.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

// @trace REQ-NF-001 | PGM-CMM-001
class LoginSessionTest {

	private final LoginSession loginSession = new LoginSession();

	@Test
	void begin_withoutSession_createsSessionWithUserId() {
		MockHttpServletRequest request = new MockHttpServletRequest();

		loginSession.begin(request, 5L);

		assertThat(request.getSession(false).getAttribute(LoginSession.USER_ID_ATTRIBUTE)).isEqualTo(5L);
	}

	@Test
	void begin_withExistingSession_changesSessionId() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		MockHttpSession existing = (MockHttpSession) request.getSession(true);
		String before = existing.getId();

		loginSession.begin(request, 5L);

		assertThat(request.getSession(false).getId()).isNotEqualTo(before);
		assertThat(request.getSession(false).getAttribute(LoginSession.USER_ID_ATTRIBUTE)).isEqualTo(5L);
	}

	@Test
	void end_withSession_invalidatesIt() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		MockHttpSession session = (MockHttpSession) request.getSession(true);

		loginSession.end(request);

		assertThat(session.isInvalid()).isTrue();
	}

	@Test
	void currentUserProvider_outsideRequest_requireThrowsUnauthorized() {
		assertThatThrownBy(() -> new CurrentUserProvider().require())
				.isInstanceOfSatisfying(BusinessException.class,
						e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
	}
}
