package com.example.meetingroom.domain.meetingroom.entity;

import com.example.meetingroom.common.entity.BaseEntity;
import com.example.meetingroom.domain.reservation.entity.ReservationEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

/** 회의실 (ENT-01) — 예약 대상 회의실 정보 */
@Entity
@Table(name = "meeting_room")
public class MeetingRoomEntity extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "meeting_room_id")
	private Long meetingRoomId;

	@Column(name = "name", nullable = false, length = 100)
	private String name;

	@Column(name = "location", length = 200)
	private String location;

	@Column(name = "capacity")
	private Integer capacity;

	@Column(name = "equipment", length = 500)
	private String equipment;

	/** REL-02 예약을 받는다 */
	@OneToMany(mappedBy = "meetingRoom", fetch = FetchType.LAZY)
	private List<ReservationEntity> reservations = new ArrayList<>();

	protected MeetingRoomEntity() {
	}

	public MeetingRoomEntity(String name, String location, Integer capacity, String equipment) {
		this.name = name;
		this.location = location;
		this.capacity = capacity;
		this.equipment = equipment;
	}

	public Long getMeetingRoomId() {
		return meetingRoomId;
	}

	public String getName() {
		return name;
	}

	public String getLocation() {
		return location;
	}

	public Integer getCapacity() {
		return capacity;
	}

	public String getEquipment() {
		return equipment;
	}

	public List<ReservationEntity> getReservations() {
		return reservations;
	}
}
