package com.example.meetingroom.domain.reservation.entity;

import com.example.meetingroom.common.entity.BaseEntity;
import com.example.meetingroom.domain.meetingroom.entity.MeetingRoomEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/** 예약 (ENT-02) — 회의실 예약과 취소 이력 */
@Entity
@Table(name = "reservation")
public class ReservationEntity extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "reservation_id")
	private Long reservationId;

	/** 읽기 전용 — 값 변경은 meetingRoom 연관관계로 한다 */
	@Column(name = "meeting_room_id", insertable = false, updatable = false)
	private Long meetingRoomId;

	/** 읽기 전용 — 값 변경은 reserver 연관관계로 한다 */
	@Column(name = "reserver_id", insertable = false, updatable = false)
	private Long reserverId;

	/** REL-02 예약을 받는다 */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "meeting_room_id", nullable = false)
	private MeetingRoomEntity meetingRoom;

	/** REL-01 예약한다 */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "reserver_id", nullable = false)
	private ReserverEntity reserver;

	@Column(name = "start_at", nullable = false)
	private LocalDateTime startAt;

	@Column(name = "end_at", nullable = false)
	private LocalDateTime endAt;

	@Column(name = "title", length = 200)
	private String title;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private ReservationStatus status = ReservationStatus.RESERVED;

	@Column(name = "cancelled_at")
	private LocalDateTime cancelledAt;

	/** 취소한 사용자의 식별자 값만 보관한다(연관관계 없음) */
	@Column(name = "cancelled_by")
	private Long cancelledBy;

	protected ReservationEntity() {
	}

	public ReservationEntity(MeetingRoomEntity meetingRoom, ReserverEntity reserver,
			LocalDateTime startAt, LocalDateTime endAt, String title) {
		this.meetingRoom = meetingRoom;
		this.reserver = reserver;
		this.startAt = startAt;
		this.endAt = endAt;
		this.title = title;
	}

	public Long getReservationId() {
		return reservationId;
	}

	public Long getMeetingRoomId() {
		return meetingRoomId;
	}

	public Long getReserverId() {
		return reserverId;
	}

	public MeetingRoomEntity getMeetingRoom() {
		return meetingRoom;
	}

	public ReserverEntity getReserver() {
		return reserver;
	}

	public LocalDateTime getStartAt() {
		return startAt;
	}

	public LocalDateTime getEndAt() {
		return endAt;
	}

	public String getTitle() {
		return title;
	}

	public ReservationStatus getStatus() {
		return status;
	}

	public LocalDateTime getCancelledAt() {
		return cancelledAt;
	}

	public Long getCancelledBy() {
		return cancelledBy;
	}
}
