package com.example.meetingroom.common.util;

import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** 페이징 요청 파라미터(page·size·sort·direction)를 Spring Pageable로 바꾼다 — 공통 개발규칙(4-DN-21-O3) §3 */
public final class PageParams {

	public static final int DEFAULT_PAGE = 1;
	public static final int DEFAULT_SIZE = 20;
	public static final int MAX_SIZE = 100;

	private PageParams() {
	}

	/**
	 * @param sortableProperties 정렬을 허용하는 속성 이름. 이 밖의 sort 값은 400으로 거부한다.
	 */
	public static Pageable toPageable(Integer page, Integer size, String sort, String direction,
			Set<String> sortableProperties) {
		int pageNo = page == null ? DEFAULT_PAGE : page;
		int pageSize = size == null ? DEFAULT_SIZE : size;
		if (pageNo < 1) {
			throw new BusinessException(ErrorCode.BAD_REQUEST, "page는 1 이상이어야 합니다.");
		}
		if (pageSize < 1 || pageSize > MAX_SIZE) {
			throw new BusinessException(ErrorCode.BAD_REQUEST, "size는 1 이상 " + MAX_SIZE + " 이하여야 합니다.");
		}
		if (sort == null || sort.isBlank()) {
			return PageRequest.of(pageNo - 1, pageSize);
		}
		if (!sortableProperties.contains(sort)) {
			throw new BusinessException(ErrorCode.BAD_REQUEST, "정렬할 수 없는 항목입니다: " + sort);
		}
		Sort.Direction dir;
		if (direction == null || direction.isBlank()) {
			dir = Sort.Direction.ASC;
		}
		else if ("ASC".equalsIgnoreCase(direction)) {
			dir = Sort.Direction.ASC;
		}
		else if ("DESC".equalsIgnoreCase(direction)) {
			dir = Sort.Direction.DESC;
		}
		else {
			throw new BusinessException(ErrorCode.BAD_REQUEST, "direction은 ASC 또는 DESC여야 합니다.");
		}
		return PageRequest.of(pageNo - 1, pageSize, Sort.by(dir, sort));
	}
}
