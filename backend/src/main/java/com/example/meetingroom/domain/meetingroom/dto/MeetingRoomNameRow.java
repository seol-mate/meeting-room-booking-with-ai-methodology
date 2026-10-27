package com.example.meetingroom.domain.meetingroom.dto;

/** 회의실 식별자와 이름만 담는 프로젝션 행(저장소 내부용) */
public record MeetingRoomNameRow(Long meetingRoomId, String name) {
}
