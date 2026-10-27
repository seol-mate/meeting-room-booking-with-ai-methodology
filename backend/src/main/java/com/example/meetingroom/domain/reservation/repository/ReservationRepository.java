package com.example.meetingroom.domain.reservation.repository;

import com.example.meetingroom.domain.reservation.dto.ActiveReservation;
import com.example.meetingroom.domain.reservation.dto.MyReservationRow;
import com.example.meetingroom.domain.reservation.dto.ReservationStatusRow;
import com.example.meetingroom.domain.reservation.entity.ReservationEntity;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 목록 조회는 엔티티를 거치지 않고 프로젝션 DTO를 직접 반환한다(4-DN-21-O3 Repository 규칙).
 * 상태 조건의 RESERVED는 코드 정의서(4-DN-21-O2) RESERVATION_STATUS 값이다.
 */
public interface ReservationRepository extends JpaRepository<ReservationEntity, Long> {

	@Query("""
			select new com.example.meetingroom.domain.reservation.dto.ReservationStatusRow(
			    r.reservationId, r.meetingRoomId, rv.reserverId, rv.name, r.startAt, r.endAt, r.title)
			from ReservationEntity r join r.reserver rv
			where r.status = com.example.meetingroom.domain.reservation.entity.ReservationStatus.RESERVED
			  and r.startAt >= :fromInclusive and r.startAt < :toExclusive
			  and (:meetingRoomId is null or r.meetingRoomId = :meetingRoomId)
			order by r.meetingRoomId, r.startAt
			""")
	List<ReservationStatusRow> findStatusRows(@Param("fromInclusive") LocalDateTime fromInclusive,
			@Param("toExclusive") LocalDateTime toExclusive, @Param("meetingRoomId") Long meetingRoomId);

	/** 같은 회의실에서 RESERVED 예약과 시간이 일부라도 겹치는지 — 끝과 시작이 맞닿는 것은 겹침이 아니다(BR-01) */
	@Query("""
			select count(r) > 0 from ReservationEntity r
			where r.meetingRoomId = :meetingRoomId
			  and r.status = com.example.meetingroom.domain.reservation.entity.ReservationStatus.RESERVED
			  and r.startAt < :endAt and :startAt < r.endAt
			""")
	boolean existsOverlap(@Param("meetingRoomId") Long meetingRoomId, @Param("startAt") LocalDateTime startAt,
			@Param("endAt") LocalDateTime endAt);

	@Query("""
			select new com.example.meetingroom.domain.reservation.dto.MyReservationRow(
			    r.reservationId, r.meetingRoomId, r.startAt, r.endAt, r.title, r.status, r.cancelledAt)
			from ReservationEntity r
			where r.reserverId = :reserverId
			order by r.startAt desc
			""")
	List<MyReservationRow> findMineRows(@Param("reserverId") Long reserverId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select r from ReservationEntity r where r.reservationId = :reservationId")
	Optional<ReservationEntity> findByIdForUpdate(@Param("reservationId") Long reservationId);

	@Query("""
			select new com.example.meetingroom.domain.reservation.dto.ActiveReservation(
			    r.reservationId, r.meetingRoomId, rv.name, r.startAt, r.endAt, r.title)
			from ReservationEntity r join r.reserver rv
			where r.status = com.example.meetingroom.domain.reservation.entity.ReservationStatus.RESERVED
			  and r.startAt >= :fromInclusive and r.startAt < :toExclusive
			  and (:meetingRoomId is null or r.meetingRoomId = :meetingRoomId)
			order by r.startAt
			""")
	List<ActiveReservation> findActiveInPeriod(@Param("fromInclusive") LocalDateTime fromInclusive,
			@Param("toExclusive") LocalDateTime toExclusive, @Param("meetingRoomId") Long meetingRoomId);
}
