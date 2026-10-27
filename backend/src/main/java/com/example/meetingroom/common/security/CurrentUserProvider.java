package com.example.meetingroom.common.security;

import com.example.meetingroom.common.exception.BusinessException;
import com.example.meetingroom.common.exception.ErrorCode;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

/** 현재 요청의 로그인 사용자 — AuthFilter가 요청에 담아 둔 값을 읽는다. 요청 밖(배치 등)에서는 빈 값이다. */
@Component
public class CurrentUserProvider {

	/** AuthFilter가 요청 속성에 사용자를 담는 이름 */
	static final String REQUEST_ATTRIBUTE = CurrentUserProvider.class.getName() + ".USER";

	public Optional<LoginUser> find() {
		RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
		if (attributes == null) {
			return Optional.empty();
		}
		Object user = attributes.getAttribute(REQUEST_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
		return Optional.ofNullable((LoginUser) user);
	}

	public Optional<Long> findUserId() {
		return find().map(LoginUser::userId);
	}

	/** 로그인 사용자가 반드시 있어야 하는 곳에서 쓴다. 없으면 401 */
	public LoginUser require() {
		return find().orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
	}
}
