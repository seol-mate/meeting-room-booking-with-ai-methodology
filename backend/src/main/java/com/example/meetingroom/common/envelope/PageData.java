package com.example.meetingroom.common.envelope;

import java.util.List;
import org.springframework.data.domain.Page;

/** 목록 응답의 data 구조 — 공통 개발규칙(4-DN-21-O3) §3 (페이지 번호는 1부터) */
public record PageData<T>(List<T> items, Pagination pagination) {

	public record Pagination(int page, int size, long totalCount, int totalPages) {
	}

	public static <T> PageData<T> of(Page<T> page) {
		return new PageData<>(
				page.getContent(),
				new Pagination(page.getNumber() + 1, page.getSize(), page.getTotalElements(), page.getTotalPages()));
	}
}
