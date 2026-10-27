package com.example.meetingroom.domain.meetingroom.dto;

/** 회의실 목록 조회의 프로젝션 행(저장소 내부용) */
public record MeetingRoomItemRow(Long meetingRoomId, String name, String location, Integer capacity, String equipment) {
}
