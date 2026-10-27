package com.example.meetingroom.domain.reservation.repository;

import com.example.meetingroom.domain.reservation.entity.ReserverEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReserverRepository extends JpaRepository<ReserverEntity, Long> {

	Optional<ReserverEntity> findByLoginId(String loginId);

	boolean existsByLoginId(String loginId);
}
