package com.example.meetingroom.common.envelope;

/** 입력 검증 오류 항목 (스키마 이름 ValidationError — 4-DN-21-O3 §2) */
public record ValidationError(String field, String value, String reason) {
}
