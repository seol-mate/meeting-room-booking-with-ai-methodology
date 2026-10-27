package com.example.meetingroom.domain.meetingroom.repository;

import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomItemRow;
import com.example.meetingroom.domain.meetingroom.dto.MeetingRoomNameRow;
import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MeetingRoomRepository extends JpaRepository<MeetingRoomEntity, Long> {

	@Query("""
			select new com.example.meetingroom.domain.meetingroom.dto.MeetingRoomItemRow(
			    m.meetingRoomId, m.name, m.location, m.capacity, m.equipment)
			from MeetingRoomEntity m
			order by m.name
			""")
	List<MeetingRoomItemRow> findAllItems();

	@Query("""
			select new com.example.meetingroom.domain.meetingroom.dto.MeetingRoomNameRow(m.meetingRoomId, m.name)
			from MeetingRoomEntity m
			where m.meetingRoomId in :ids
			""")
	List<MeetingRoomNameRow> findNameRows(@Param("ids") Collection<Long> ids);
}
