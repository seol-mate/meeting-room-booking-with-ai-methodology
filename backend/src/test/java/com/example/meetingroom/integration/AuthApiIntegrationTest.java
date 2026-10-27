package com.example.meetingroom.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import com.example.meetingroom.domain.reservation.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

class AuthApiIntegrationTest extends IntegrationTestSupport {

	// @trace REQ-F-001 | TE-reservation-I01, reservation-001
	@Test
	void signupLoginMe_flow_andProtectedPathsRequireLogin() throws Exception {
		// 가입·중복 확인은 로그인 없이 호출된다 (공개 경로)
		mockMvc.perform(get("/api/v1/auth/login-id-availability").param("loginId", "newbie"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.available").value(true));

		// 요청에 role이 있어도 USER로 가입된다
		mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"newbie\",\"name\":\"신입\",\"password\":\"" + PASSWORD
						+ "\",\"role\":\"ROOM_MANAGER\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.role").value("USER"))
				.andExpect(jsonPath("$.data.name").value("신입"));
		ReserverEntity saved = reservers.findByLoginId("newbie").orElseThrow();
		assertThat(saved.getRole()).isEqualTo(UserRole.USER);
		assertThat(saved.getPasswordHash()).isNotEqualTo(PASSWORD);

		mockMvc.perform(get("/api/v1/auth/login-id-availability").param("loginId", "newbie"))
				.andExpect(jsonPath("$.data.available").value(false));

		// 같은 ID로 다시 가입하면 409
		mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"newbie\",\"name\":\"또\",\"password\":\"x\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error.code").value("ERR-4090"));

		// 로그인하지 않으면 me와 보호 경로는 401 봉투
		mockMvc.perform(get("/api/v1/auth/me"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.error.code").value("ERR-4010"));
		mockMvc.perform(get("/api/v1/reservations").param("date", "2030-01-02"))
				.andExpect(status().isUnauthorized());

		// 틀린 비밀번호는 400, 맞으면 세션이 시작되어 me가 200
		mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"newbie\",\"password\":\"wrong\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.message").value("로그인 정보가 올바르지 않습니다."));
		MockHttpSession session = login("newbie");
		assertThat(session).isNotNull();
		mockMvc.perform(get("/api/v1/auth/me").session(session))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.name").value("신입"))
				.andExpect(jsonPath("$.data.role").value("USER"));
	}

	// @trace REQ-F-001 | TE-reservation-I01, reservation-001
	@Test
	void signup_withMissingFields_returnsBadRequestWithFieldErrors() throws Exception {
		mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"\",\"name\":\"\",\"password\":\"\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("ERR-4000"))
				.andExpect(jsonPath("$.error.errors").isArray());
	}
}
