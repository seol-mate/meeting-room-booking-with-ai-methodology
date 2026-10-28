package com.example.meetingroom.common.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.meetingroom.common.envelope.PageData;
import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

// @trace — | PGM-CMM-002 (공통 응답 포맷 — 근거 요구사항 없음, 페이징 규약 4-DN-21-O3 §3)
class PageParamsTest {

	private static final Set<String> SORTABLE = Set.of("name", "startAt");

	@Test
	void toPageable_withDefaults_usesFirstPageOf20() {
		Pageable pageable = PageParams.toPageable(null, null, null, null, SORTABLE);

		assertThat(pageable.getPageNumber()).isZero();
		assertThat(pageable.getPageSize()).isEqualTo(20);
		assertThat(pageable.getSort().isUnsorted()).isTrue();
	}

	@Test
	void toPageable_withPageAndDescSort_convertsToZeroBasedAndSorts() {
		Pageable pageable = PageParams.toPageable(3, 50, "startAt", "desc", SORTABLE);

		assertThat(pageable.getPageNumber()).isEqualTo(2);
		assertThat(pageable.getSort().getOrderFor("startAt").getDirection()).isEqualTo(Sort.Direction.DESC);
	}

	@Test
	void toPageable_withSortAndNoDirection_sortsAscending() {
		Pageable pageable = PageParams.toPageable(1, 20, "name", null, SORTABLE);

		assertThat(pageable.getSort().getOrderFor("name").getDirection()).isEqualTo(Sort.Direction.ASC);
	}

	@Test
	void toPageable_withLowercaseAsc_sortsAscending() {
		Pageable pageable = PageParams.toPageable(1, 20, "name", "asc", SORTABLE);

		assertThat(pageable.getSort().getOrderFor("name").getDirection()).isEqualTo(Sort.Direction.ASC);
	}

	@Test
	void toPageable_withSizeOver100_throwsBadRequest() {
		assertBadRequest(() -> PageParams.toPageable(1, 101, null, null, SORTABLE));
	}

	@Test
	void toPageable_withPageZero_throwsBadRequest() {
		assertBadRequest(() -> PageParams.toPageable(0, 20, null, null, SORTABLE));
	}

	@Test
	void toPageable_withUnknownSort_throwsBadRequest() {
		assertBadRequest(() -> PageParams.toPageable(1, 20, "passwordHash", null, SORTABLE));
	}

	@Test
	void toPageable_withInvalidDirection_throwsBadRequest() {
		assertBadRequest(() -> PageParams.toPageable(1, 20, "name", "sideways", SORTABLE));
	}

	@Test
	void pageData_of_convertsToOneBasedPagination() {
		PageImpl<String> page = new PageImpl<>(List.of("a", "b"), PageRequest.of(1, 2), 5);

		PageData<String> data = PageData.of(page);

		assertThat(data.items()).containsExactly("a", "b");
		assertThat(data.pagination()).isEqualTo(new PageData.Pagination(2, 2, 5, 3));
	}

	private void assertBadRequest(Runnable action) {
		assertThatThrownBy(action::run).isInstanceOfSatisfying(BusinessException.class,
				e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST));
	}
}
