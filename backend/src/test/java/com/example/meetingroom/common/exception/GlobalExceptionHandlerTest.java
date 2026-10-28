package com.example.meetingroom.common.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.meetingroom.common.envelope.EnvelopeFactory;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.Validation;
import jakarta.validation.constraints.NotBlank;
import java.sql.SQLException;
import java.time.Clock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.ErrorResponseException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// @trace — | PGM-CMM-002 (공통 예외 처리 — 근거 요구사항 없음, 전역 예외 핸들러)
class GlobalExceptionHandlerTest {

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		GlobalExceptionHandler advice = new GlobalExceptionHandler(new EnvelopeFactory(Clock.systemUTC()));
		mockMvc = MockMvcBuilders.standaloneSetup(new ProbeController()).setControllerAdvice(advice).build();
	}

	@Test
	void businessException_unprocessable_returns422WithCode() throws Exception {
		mockMvc.perform(get("/probe/business"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.error.code").value("ERR-4220"))
				.andExpect(jsonPath("$.error.message").value("규칙 위반"));
	}

	@Test
	void invalidBody_blankField_returns400WithValidationErrors() throws Exception {
		mockMvc.perform(post("/probe/body").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("ERR-4000"))
				.andExpect(jsonPath("$.error.errors[0].field").value("name"));
	}

	@Test
	void missingRequestParam_returns400() throws Exception {
		mockMvc.perform(get("/probe/param"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("ERR-4000"));
	}

	@Test
	void unreadableBody_returns400() throws Exception {
		mockMvc.perform(post("/probe/body").contentType(MediaType.APPLICATION_JSON).content("not json"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("ERR-4000"));
	}

	@Test
	void exclusionViolation_returns409() throws Exception {
		mockMvc.perform(get("/probe/exclusion"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error.code").value("ERR-4090"));
	}

	@Test
	void otherIntegrityViolation_returns500() throws Exception {
		mockMvc.perform(get("/probe/integrity"))
				.andExpect(status().isInternalServerError())
				.andExpect(jsonPath("$.error.code").value("ERR-5000"));
	}

	@Test
	void constraintViolation_returns400WithLastPathSegmentAsField() throws Exception {
		mockMvc.perform(get("/probe/constraint"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("ERR-4000"))
				.andExpect(jsonPath("$.error.errors[0].field").value("name"))
				.andExpect(jsonPath("$.error.errors[0].reason").isNotEmpty());
	}

	@Test
	void notFoundStatusException_returns404WithNotFoundCode() throws Exception {
		mockMvc.perform(get("/probe/not-found"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error.code").value("ERR-4040"));
	}

	@Test
	void serverErrorStatusException_returns500WithoutInternalDetails() throws Exception {
		mockMvc.perform(get("/probe/server-error"))
				.andExpect(status().isInternalServerError())
				.andExpect(jsonPath("$.error.code").value("ERR-5000"))
				.andExpect(jsonPath("$.error.message").value(ErrorCode.INTERNAL.getDefaultMessage()));
	}

	@Test
	void unexpectedException_returns500WithoutInternalDetails() throws Exception {
		mockMvc.perform(get("/probe/boom"))
				.andExpect(status().isInternalServerError())
				.andExpect(jsonPath("$.error.code").value("ERR-5000"))
				.andExpect(jsonPath("$.error.message").value(ErrorCode.INTERNAL.getDefaultMessage()));
	}

	@RestController
	static class ProbeController {

		record Body(@NotBlank String name) {
		}

		@GetMapping("/probe/business")
		String business() {
			throw new BusinessException(ErrorCode.UNPROCESSABLE, "규칙 위반");
		}

		@PostMapping("/probe/body")
		String body(@Valid @RequestBody Body body) {
			return body.name();
		}

		@GetMapping("/probe/param")
		String param(@RequestParam("id") int id) {
			return String.valueOf(id);
		}

		@GetMapping("/probe/exclusion")
		String exclusion() {
			throw new DataIntegrityViolationException("겹침", new SQLException("overlap", "23P01"));
		}

		@GetMapping("/probe/integrity")
		String integrity() {
			throw new DataIntegrityViolationException("널 위반", new SQLException("null", "23502"));
		}

		@GetMapping("/probe/constraint")
		String constraint() {
			throw new ConstraintViolationException(
					Validation.buildDefaultValidatorFactory().getValidator().validate(new Body("")));
		}

		@GetMapping("/probe/not-found")
		String notFound() {
			throw new ErrorResponseException(HttpStatus.NOT_FOUND);
		}

		@GetMapping("/probe/server-error")
		String serverError() {
			throw new ErrorResponseException(HttpStatus.INTERNAL_SERVER_ERROR);
		}

		@GetMapping("/probe/boom")
		String boom() {
			throw new IllegalStateException("내부 상세는 응답에 나오면 안 된다");
		}
	}
}
