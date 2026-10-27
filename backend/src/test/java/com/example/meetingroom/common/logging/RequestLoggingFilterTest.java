package com.example.meetingroom.common.logging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// @trace — | PGM-CMM-003 (공통 로깅 — 근거 요구사항 없음, 요청 ID 부여·요청 로그)
class RequestLoggingFilterTest {

	private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new ProbeController())
			.addFilters(new RequestLoggingFilter())
			.build();

	@Test
	void request_withValidRequestId_keepsItInLogContextAndHeader() throws Exception {
		mockMvc.perform(get("/probe/id").header("X-Request-Id", "abc-123"))
				.andExpect(status().isOk())
				.andExpect(header().string("X-Request-Id", "abc-123"))
				.andExpect(content().string("abc-123"));
	}

	@Test
	void request_withoutRequestId_generatesOne() throws Exception {
		String generated = mockMvc.perform(get("/probe/id"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getHeader("X-Request-Id");

		assertThat(generated).matches("[0-9a-f-]{36}");
	}

	@Test
	void request_withUnsafeRequestId_replacesIt() throws Exception {
		String used = mockMvc.perform(get("/probe/id").header("X-Request-Id", "bad id\nINJECTED"))
				.andReturn().getResponse().getHeader("X-Request-Id");

		assertThat(used).doesNotContain("INJECTED").matches("[0-9a-f-]{36}");
	}

	@Test
	void request_afterCompletion_clearsLogContext() throws Exception {
		mockMvc.perform(get("/probe/id"));

		assertThat(MDC.get("requestId")).isNull();
	}

	@RestController
	static class ProbeController {

		@GetMapping("/probe/id")
		String id() {
			return MDC.get("requestId");
		}
	}
}
