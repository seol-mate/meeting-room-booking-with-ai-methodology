package com.example.meetingroom.common.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.meetingroom.common.envelope.EnvelopeFactory;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.json.JsonMapper;

// @trace REQ-NF-001 | PGM-CMM-001
class AuthFilterTest {

	private static final LoginUser MANAGER = new LoginUser(7L, "ROOM_MANAGER");

	private final CurrentUserProvider currentUser = new CurrentUserProvider();

	@Test
	void request_withoutSession_returns401() throws Exception {
		MockMvc mockMvc = mockMvc(id -> Optional.of(MANAGER));

		mockMvc.perform(get("/probe/me"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.error.code").value("ERR-4010"));
	}

	@Test
	void request_withLoggedInSession_passesAndExposesCurrentUser() throws Exception {
		MockMvc mockMvc = mockMvc(id -> id == 7L ? Optional.of(MANAGER) : Optional.empty());

		mockMvc.perform(get("/probe/me").session(sessionOf(7L)))
				.andExpect(status().isOk())
				.andExpect(content().string("7:ROOM_MANAGER"));
	}

	@Test
	void request_withSessionOfUnknownUser_returns401() throws Exception {
		MockMvc mockMvc = mockMvc(id -> Optional.empty());

		mockMvc.perform(get("/probe/me").session(sessionOf(99L)))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void request_withoutLookupAdapter_returns401() throws Exception {
		AuthFilter filter = filter(new StaticListableBeanFactory().getBeanProvider(LoginUserLookup.class));
		MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new ProbeController(currentUser)).addFilters(filter).build();

		mockMvc.perform(get("/probe/me").session(sessionOf(7L)))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void request_toPublicPath_passesWithoutLogin() throws Exception {
		MockMvc mockMvc = mockMvc(id -> Optional.empty());

		mockMvc.perform(get("/actuator/health"))
				.andExpect(status().isOk());
	}

	@Test
	void preflightRequest_passesWithoutLogin() throws Exception {
		MockMvc mockMvc = mockMvc(id -> Optional.empty());

		mockMvc.perform(options("/probe/me"))
				.andExpect(status().is(org.hamcrest.Matchers.not(401)));
	}

	private MockMvc mockMvc(LoginUserLookup lookup) {
		StaticListableBeanFactory beans = new StaticListableBeanFactory();
		beans.addBean("lookup", lookup);
		return MockMvcBuilders.standaloneSetup(new ProbeController(currentUser))
				.addFilters(filter(beans.getBeanProvider(LoginUserLookup.class)))
				.build();
	}

	private AuthFilter filter(ObjectProvider<LoginUserLookup> lookup) {
		return new AuthFilter(new SecurityProperties(List.of("/actuator/health")), lookup,
				new EnvelopeFactory(Clock.systemUTC()), JsonMapper.builder().build());
	}

	private MockHttpSession sessionOf(Long userId) {
		MockHttpSession session = new MockHttpSession();
		session.setAttribute(LoginSession.USER_ID_ATTRIBUTE, userId);
		return session;
	}

	@RestController
	static class ProbeController {

		private final CurrentUserProvider currentUser;

		ProbeController(CurrentUserProvider currentUser) {
			this.currentUser = currentUser;
		}

		@GetMapping("/probe/me")
		String me() {
			LoginUser user = currentUser.require();
			return user.userId() + ":" + user.role();
		}

		@GetMapping("/actuator/health")
		String health() {
			return "UP";
		}
	}
}
