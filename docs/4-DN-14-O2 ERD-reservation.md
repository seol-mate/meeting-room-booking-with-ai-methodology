# 4-DN-14-O2 ERD-reservation


담당 도메인의 테이블·컬럼·제약조건 상세 ERD.
타 도메인 테이블을 FK로 참조하는 경우 해당 테이블도 표시하되 PK 컬럼만 포함한다.

---

## 1. 문서 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 회의실 예약 시스템 |
| 작성자 | 설동혁 (DA) |
| 작성일 | 2026-10-27 |
| 버전 | 1.0 |
| 도메인 | 예약 (`domainId`: reservation) |
| 전략 | Code First — 코드 전 |
| 참조 | `4-DN-14-O1 ERD-overview.md`, `3-AN-05-O1 도메인 분석표.md`, `4-DN-12-O2` `entities.yaml` |

## 2. ERD

```mermaid
erDiagram
    meeting_room["회의실 (meeting_room)"] {
        bigint meeting_room_id PK "회의실 식별자 (ENT-01)"
    }

    reserver["예약자 (reserver)"] {
        bigint reserver_id PK "예약자 식별자 (ENT-03)"
        varchar(50) login_id UK "로그인 계정 식별자 (REQ-F-001)"
        varchar(255) password_hash "비밀번호 해시 (REQ-F-001)"
        varchar(100) name "예약 현황에 표시되는 이름 (REQ-F-002)"
        varchar(20) role "역할 USER 또는 ROOM_MANAGER (REQ-F-006)"
        timestamp created_at "생성 일시"
        timestamp updated_at "수정 일시"
        bigint created_by "생성 주체 · NULL 허용"
        bigint updated_by "수정 주체 · NULL 허용"
    }

    reservation["예약 (reservation)"] {
        bigint reservation_id PK "예약 식별자 (ENT-02)"
        bigint meeting_room_id FK "예약 대상 회의실 (REL-02)"
        bigint reserver_id FK "예약한 예약자 (REL-01)"
        timestamp start_at "예약 시작 일시 (REQ-F-003, BR-01)"
        timestamp end_at "예약 종료 일시 (REQ-F-003, BR-01)"
        varchar(200) title "회의 제목 · NULL 허용 (REQ-F-002)"
        varchar(20) status "예약 상태 RESERVED 또는 CANCELLED (BR-02)"
        timestamp cancelled_at "취소 일시 · NULL 허용 (REQ-F-005)"
        bigint cancelled_by "취소한 사용자 식별자 값 · NULL 허용 (REQ-F-005)"
        timestamp created_at "생성 일시"
        timestamp updated_at "수정 일시"
        bigint created_by "생성 주체 · NULL 허용"
        bigint updated_by "수정 주체 · NULL 허용"
    }

    reserver ||--o{ reservation : "예약한다 (REL-01)"
    meeting_room ||..o{ reservation : "예약을 받는다 (REL-02)"
```

## 3. 표기 규칙

| 항목 | 규칙 |
|------|------|
| 엔티티명 | `물리명["논리명 (물리명)"]` 별칭 표기 — 다이어그램 헤더에 논리명·물리명을 함께 표시한다 |
| 데이터 타입 | 길이를 포함해 타입 필드에 직접 표기한다 (예: `varchar(50)`, `varchar(100)`) |
| decimal/numeric | Mermaid 구문 제약(타입 괄호 안 콤마·점 불가)으로 precision·scale을 하이픈으로 표기한다 — `decimal(18-2)` = `DECIMAL(18,2)` |
| 키 | `PK` / `FK` / `UK`. 복합인 경우 `PK, FK` 형식으로 병기한다 |
| 예약어와 겹치는 컬럼명 | 컬럼명이 `PK`·`FK`·`UK`이면(대소문자 무관) Mermaid가 파싱하지 못한다. **§2에서만** 뒤에 밑줄을 붙이고(`pk` → `pk_`) 설명 앞머리에 실제 물리명을 병기한다 — `int pk_ UK "품목표준용어 식별자 · 물리명 PK · ENT-03"`. **§5 스펙 표의 「컬럼명」은 실제 물리명 그대로 둔다.** 컬럼을 §2에서 빼지 않는다 |
| Null 여부 | 모든 컬럼은 NOT NULL을 기본으로 간주한다. NULL 허용 컬럼만 설명에 `NULL 허용`을 표기한다 |
| 관계명 | `"한글 관계명 (REL-ID)"` 형식. 한글 관계명은 `4-DN-11-O1 도메인 정의서 §4 관계`에서 가져오며 새로 짓지 않는다. 도메인 정의서 작성(`4-DN-11`) 생략 시 엔티티 명세서(`4-DN-12-O1`)의 `relations[].name_ko`를 쓴다. 이 값은 도메인 분석표(`3-AN-05-O1`)의 `관계명`을 계승한다. DB First로 엔티티 명세서 작성(`4-DN-12`)보다 앞서면 도메인 분석표를 직접 계승한다 |
| 관계선 | 담당 도메인 내부 관계는 실선(`\|\|--o{`), 타 도메인 참조 관계는 점선(`\|\|..o{`) |
| 타 도메인 테이블 | PK 컬럼만 표시한다 |
| 추적성 | 컬럼·관계 설명에 도메인 분석표 또는 도메인 정의서(4-DN-11)의 ENT- / REL- / BR- ID를 병기한다 (설계에서 신설된 엔티티·관계는 도메인 정의서 ID) |

> **[작성 안내]** **호환성**: 위 문법은 GitLab 16.x(Mermaid 10) 기준으로 검증되었다(0.7.22). 타입 괄호 안 콤마·점 금지, 번호 접두어 금지 등 렌더러 제약과 문법별 검증 상태는 다이어그램 표기 규약(9-CM-04, `get_common_guide("diagram")`)이 정본이다.

---

## 4. 테이블 요약

| 논리명 | 테이블명 | ENT-ID | 도메인 | 설명 |
|--------|---------|--------|--------|------|
| 예약 | reservation | ENT-02 | 예약 (담당) | 회의실 예약과 취소 이력 |
| 예약자 | reserver | ENT-03 | 예약 (담당) | 로그인 계정과 역할 |
| 회의실 | meeting_room | ENT-01 | 회의실 (참조) | FK 참조 테이블 — PK만 표시 |

## 5. 테이블 스펙

> **역할 구분** — §2 Mermaid ERD는 관계 **조감용**이고, 이 표가 이 문서 안에서 컬럼 스펙
> (DB 타입·NULL·키·변환 근거)의 정본이다. 둘이 어긋나면 이 표를 따르고 ERD를 고친다.
> 구현 스키마 전체의 SSOT는 `entities.yaml`(4-DN-12)이며, 이 표와 entities.yaml의 정합은
> 데이터 설계 흐름 백서 운영 원칙 6(엔티티 명세서·ERD 양방향 정합)을 따른다.

### reservation — 예약

| 컬럼명 | Java 필드명 | 논리명 | 타입 | NULL | 키 | 참조 대상 | AS-IS 원컬럼 | 비고 |
|--------|------------|--------|------|:----:|:--:|----------|-------------|------|
| reservation_id | reservationId | 예약 식별자 | bigint | N | PK | — | — | ENT-02 |
| meeting_room_id | meetingRoomId | 회의실 식별자 | bigint | N | FK | meeting_room.meeting_room_id | — | REL-02 |
| reserver_id | reserverId | 예약자 식별자 | bigint | N | FK | reserver.reserver_id | — | REL-01 |
| start_at | startAt | 예약 시작 일시 | timestamp | N | — | — | — | REQ-F-003, BR-01 |
| end_at | endAt | 예약 종료 일시 | timestamp | N | — | — | — | REQ-F-003, BR-01 |
| title | title | 회의 제목 | varchar(200) | Y | — | — | — | REQ-F-002 · 예약자·관리 담당자에게만 노출 |
| status | status | 예약 상태 | varchar(20) | N | — | — | — | RESERVED/CANCELLED, 기본 RESERVED (BR-02) |
| cancelled_at | cancelledAt | 취소 일시 | timestamp | Y | — | — | — | REQ-F-005 |
| cancelled_by | cancelledBy | 취소한 사용자 식별자 | bigint | Y | — | — | — | REQ-F-005, REQ-F-006 · 값만 보관 |
| created_at | createdAt | 생성 일시 | timestamp | N | — | — | — | 공통(BaseEntity) |
| updated_at | updatedAt | 수정 일시 | timestamp | N | — | — | — | 공통(BaseEntity) |
| created_by | createdBy | 생성 주체 | bigint | Y | — | — | — | 공통(BaseEntity) |
| updated_by | updatedBy | 수정 주체 | bigint | Y | — | — | — | 공통(BaseEntity) |

### reserver — 예약자

| 컬럼명 | Java 필드명 | 논리명 | 타입 | NULL | 키 | 참조 대상 | AS-IS 원컬럼 | 비고 |
|--------|------------|--------|------|:----:|:--:|----------|-------------|------|
| reserver_id | reserverId | 예약자 식별자 | bigint | N | PK | — | — | ENT-03 |
| login_id | loginId | 로그인 계정 식별자 | varchar(50) | N | UK | — | — | REQ-F-001 |
| password_hash | passwordHash | 비밀번호 해시 | varchar(255) | N | — | — | — | REQ-F-001, REQ-NF-001 |
| name | name | 이름 | varchar(100) | N | — | — | — | REQ-F-002 |
| role | role | 역할 | varchar(20) | N | — | — | — | USER/ROOM_MANAGER, 기본 USER (REQ-F-006, REQ-F-007) |
| created_at | createdAt | 생성 일시 | timestamp | N | — | — | — | 공통(BaseEntity) |
| updated_at | updatedAt | 수정 일시 | timestamp | N | — | — | — | 공통(BaseEntity) |
| created_by | createdBy | 생성 주체 | bigint | Y | — | — | — | 공통(BaseEntity) |
| updated_by | updatedBy | 수정 주체 | bigint | Y | — | — | — | 공통(BaseEntity) |

## 6. 테이블 수준 제약·인덱스

| 제약명 | 종류 | 컬럼 | 근거 |
|--------|------|------|------|
| ck_reservation_status | CHECK | status | BR-02 (RESERVED/CANCELLED만 허용) |
| ck_reservation_period | CHECK | start_at, end_at | REQ-F-003 (종료 일시가 시작 일시보다 늦어야 한다) |
| ex_reservation_overlap | EXCLUDE (gist) | meeting_room_id, start_at~end_at (status=RESERVED) | BR-01, REQ-F-004 — 같은 회의실의 시간이 겹치는 예약을 DB가 거부한다. PostgreSQL `btree_gist` 확장이 필요하며 적용은 마이그레이션 스크립트에서 확정(5-IM) |
| idx_reservation_reserver | INDEX | reserver_id | 예약자별 내 예약 조회 (REQ-F-005) |
| ck_reserver_role | CHECK | role | REQ-F-006, REQ-F-007 (USER/ROOM_MANAGER만 허용) |

## 7. 관계 요약

| REL-ID | 관계명 | 부모 논리명 | 부모 테이블 | 자식 논리명 | 자식 테이블 | FK 컬럼 | 카디널리티 | 설명 |
|--------|-------|-----------|------------|-----------|------------|---------|:----------:|------|
| REL-01 | 예약한다 | 예약자 | reserver | 예약 | reservation | reserver_id | 1:N | 예약자 1인은 여러 예약을 가진다 |
| REL-02 | 예약을 받는다 | 회의실 | meeting_room | 예약 | reservation | meeting_room_id | 1:N | 회의실 1곳은 여러 예약을 일시별로 받는다 (부모 테이블은 회의실 도메인 소관) |

## 8. 변경 이력

| 버전 | 변경일 | 변경자 | 변경 내용 |
|------|--------|--------|---------|
| 1.0 | 2026-10-27 | 설동혁 (DA) | 최초 작성 |
