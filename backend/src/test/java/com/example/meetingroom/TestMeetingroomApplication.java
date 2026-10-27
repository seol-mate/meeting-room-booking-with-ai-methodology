package com.example.meetingroom;

import org.springframework.boot.SpringApplication;

public class TestMeetingroomApplication {

	public static void main(String[] args) {
		SpringApplication.from(MeetingroomApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
