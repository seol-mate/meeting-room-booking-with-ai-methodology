package com.example.meetingroom;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

// @trace — | skeleton
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class MeetingroomApplicationTests {

	@Test
	void contextLoads() {
	}

}
