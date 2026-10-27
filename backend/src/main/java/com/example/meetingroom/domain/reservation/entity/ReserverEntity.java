package com.example.meetingroom.domain.reservation.entity;

import com.example.meetingroom.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

/** 예약자 (ENT-03) — 로그인 계정과 역할 */
@Entity
@Table(name = "reserver")
public class ReserverEntity extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "reserver_id")
	private Long reserverId;

	@Column(name = "login_id", nullable = false, unique = true, length = 50)
	private String loginId;

	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;

	@Column(name = "name", nullable = false, length = 100)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "role", nullable = false, length = 20)
	private UserRole role = UserRole.USER;

	/** REL-01 예약한다 */
	@OneToMany(mappedBy = "reserver", fetch = FetchType.LAZY)
	private List<ReservationEntity> reservations = new ArrayList<>();

	protected ReserverEntity() {
	}

	public ReserverEntity(String loginId, String passwordHash, String name, UserRole role) {
		this.loginId = loginId;
		this.passwordHash = passwordHash;
		this.name = name;
		this.role = role;
	}

	public Long getReserverId() {
		return reserverId;
	}

	public String getLoginId() {
		return loginId;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public String getName() {
		return name;
	}

	public UserRole getRole() {
		return role;
	}

	public List<ReservationEntity> getReservations() {
		return reservations;
	}
}
