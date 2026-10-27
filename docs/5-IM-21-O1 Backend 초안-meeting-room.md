# 5-IM-21-O1 Backend 초안-meeting-room

## 1. 문서 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 회의실 예약 시스템 |
| 작성자 | 설동혁 (DV) |
| 작성일 | 2026-10-27 |
| 버전 | 1.0 |
| 도메인 | `meeting-room` — 회의실 |
| API 명세서 | `5-IM-12-O1 API 명세서-meeting-room.yaml` |
| 상태 | 완료 |

데이터 접근 기술은 JPA다(시스템 아키텍처 정의서 `4-DN-01-O1` §8.1). 응답 형식은 `Envelope`(공통 개발규칙 `4-DN-21-O3` §2), 오류 코드·상태 코드는 같은 문서 §4와 「이 프로젝트의 적용」 표를 따른다. 응답 봉투·예외 처리·인증 필터·현재 사용자 조회는 공통 기능 구현(5-IM-04)이 만든 것을 쓴다.

## 2. 엔드포인트별 Backend 동작

### 엔드포인트 색인

| operationId | METHOD | PATH | 블록 |
|-------------|--------|------|------|
| meeting-room-001 | GET | /api/v1/meeting-rooms | 동작 |
| meeting-room-002 | POST | /api/v1/meeting-rooms | 동작 |
| meeting-room-003 | GET | /api/v1/meeting-rooms/{meetingRoomId} | 동작 |
| meeting-room-004 | PUT | /api/v1/meeting-rooms/{meetingRoomId} | 동작 |
| meeting-room-005 | GET | /api/v1/admin/reservations | 동작 |

### meeting-room-001 — 회의실 목록 조회

```
GET /api/v1/meeting-rooms
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| (없음) | 요청 파라미터 없음 | — |

**업무 규칙 (Business Rules)**

- 등록된 회의실을 모두 돌려준다. 회의실이 없으면 빈 배열이다 — 오류가 아니다(안내 문구는 화면이 낸다, `mtr.list.room.empty`).
- 회의실 목록 화면(SCR-MTR-001)은 `ROOM_MANAGER`만 접근하지만, 같은 목록을 예약 현황(SCR-RSV-003)의 표 행, 회의실 예약(SCR-RSV-004)의 선택 목록, 전체 예약 조회(SCR-MTR-003)의 조회 조건이 쓴다. 그래서 이 API는 로그인한 `USER`·`ROOM_MANAGER` 모두에게 열려 있고, 목록 화면의 접근 제한은 화면(경로 가드)이 한다.
- 회의실명(`meeting_room.name`) 가나다 순으로 정렬한다.

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✓ | 조회만 |
| `ROOM_MANAGER` | ✓ | — |

**트랜잭션 경계 (Transaction)**

- 경계: 읽기 전용(`@Transactional(readOnly = true)`).
- 격리 수준: 기본(READ_COMMITTED).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 목록 — `MeetingRoomRepository`에서 전체를 프로젝션 DTO로 직접 조회한다(`name` 오름차순, DB는 ICU `ko-KR` 정렬, 엔티티를 거치지 않는다 — `4-DN-21-O3` Repository 규칙).
- 저장·상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: `MeetingRoomItem` 배열을 봉투 `data`에 담아 200으로 반환한다.
- 오류: 봉투 `error`.

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 401 | UNAUTHORIZED | 로그인하지 않음 | — |
| 500 | INTERNAL | 조회 실패 | — |

**구현 가정 (Assumptions)**

- 회의실 수가 적어(개인 테스트 규모) 페이징은 두지 않는다.

---

### meeting-room-002 — 회의실 등록

```
POST /api/v1/meeting-rooms
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| name | 필수, 공백 제거 후 1~100자(`mtr.edit.name.required`) | BAD_REQUEST |
| location | 선택, 최대 200자 | BAD_REQUEST |
| capacity | 선택, 정수(필수 여부 미확정 항목) | BAD_REQUEST |
| equipment | 선택, 최대 500자 | BAD_REQUEST |

**업무 규칙 (Business Rules)**

- `ROOM_MANAGER`만 등록할 수 있다(C-MTR-EDT-001).
- 회의실명 중복은 요구사항에 제한이 없어 허용한다(`meeting_room`에 고유 제약이 없다).
- 등록한 정보는 예약 화면(예약 현황·회의실 예약)에 바로 반영된다(C-MTR-EDT-003) — 별도 캐시를 두지 않으므로 다음 조회부터 보인다.

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✗ | 403 |
| `ROOM_MANAGER` | ✓ | — |

**트랜잭션 경계 (Transaction)**

- 경계: 단일 서비스 메서드 `@Transactional`. 저장 실패 시 롤백한다(`EX-MTR-03`).
- 격리 수준: 기본(READ_COMMITTED).

**영속화 의도 (Persistence)**

- 쿼리 방식: 없음.
- 저장: `MeetingRoomEntity` 생성 후 `save`(`name`, `location`, `capacity`, `equipment`). 감사 컬럼은 공통 부모가 채운다.
- 상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: 만들어진 회의실(`MeetingRoomItem`)을 봉투 `data`에 담아 201로 반환한다.
- 오류: 봉투 `error`(검증 오류 항목은 `error.errors`).

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 400 | BAD_REQUEST | 회의실명 누락·길이 초과, 형식에 맞지 않는 값 — 입력 항목을 안내 | `EX-MTR-01` |
| 401 | UNAUTHORIZED | 로그인하지 않음 | — |
| 403 | FORBIDDEN | `ROOM_MANAGER`가 아닌 사용자의 등록 요청 | `EX-MTR-02` |
| 500 | INTERNAL | 회의실 정보 저장 실패, 롤백하고 재시도를 안내 | `EX-MTR-03` |

**구현 가정 (Assumptions)**

- 위치 표기 형식·수용 인원 필수 여부는 미확정(조건 C1)이라 서버는 위 검증만 하고 값 형식은 강제하지 않는다. 확정되면 이 operation의 검증을 개정한다.

---

### meeting-room-003 — 회의실 상세 조회

```
GET /api/v1/meeting-rooms/{meetingRoomId}
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| meetingRoomId(경로) | 양의 정수 | BAD_REQUEST |

**업무 규칙 (Business Rules)**

- 회의실 등록·변경 화면(SCR-MTR-002)이 변경할 회의실을 불러올 때 쓴다. `ROOM_MANAGER`만 가능하다.

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✗ | 403 |
| `ROOM_MANAGER` | ✓ | — |

**트랜잭션 경계 (Transaction)**

- 경계: 읽기 전용.
- 격리 수준: 기본(READ_COMMITTED).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 단건 조회 — `MeetingRoomRepository`의 `findById`.
- 저장·상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: `MeetingRoomItem`을 봉투 `data`에 담아 200으로 반환한다.
- 오류: 봉투 `error`.

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 401 | UNAUTHORIZED | 로그인하지 않음 | — |
| 403 | FORBIDDEN | `ROOM_MANAGER`가 아닌 사용자 | — |
| 404 | NOT_FOUND | 없는 회의실 | — |
| 500 | INTERNAL | 조회 실패 | — |

**구현 가정 (Assumptions)**

- 경로 변수 `meetingRoomId`의 형식 오류(숫자가 아님)는 API 계약에 선언되지 않은 기반 오류이며 공통 예외 핸들러가 400으로 돌려준다.

---

### meeting-room-004 — 회의실 변경

```
PUT /api/v1/meeting-rooms/{meetingRoomId}
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| meetingRoomId(경로) | 양의 정수 | BAD_REQUEST |
| name | 필수, 공백 제거 후 1~100자(`mtr.edit.name.required`) | BAD_REQUEST |
| location | 선택, 최대 200자 | BAD_REQUEST |
| capacity | 선택, 정수 | BAD_REQUEST |
| equipment | 선택, 최대 500자 | BAD_REQUEST |

**업무 규칙 (Business Rules)**

- `ROOM_MANAGER`만 변경할 수 있다(C-MTR-EDT-001).
- 전체 교체(PUT)다. 요청에 없는 선택 항목은 비워진다(`null`).
- 변경한 정보는 예약 화면에 바로 반영된다(C-MTR-EDT-003). 이미 만들어진 예약은 회의실 식별자로 연결되어 있으므로 회의실명이 바뀌어도 예약이 끊어지지 않는다.
- 삭제는 요구사항에 없어 제공하지 않는다.

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✗ | 403 |
| `ROOM_MANAGER` | ✓ | — |

**트랜잭션 경계 (Transaction)**

- 경계: 단일 서비스 메서드 `@Transactional`. 저장 실패 시 롤백한다(`EX-MTR-03`).
- 격리 수준: 기본(READ_COMMITTED). 동시에 같은 회의실을 변경하면 마지막 저장이 이긴다(낙관적 잠금 버전 컬럼은 엔티티 명세에 없어 두지 않는다).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 단건 조회 — `MeetingRoomRepository`의 `findById`.
- 저장: 없음(변경 감지로 갱신).
- 상태 변경: `MeetingRoomEntity`의 `name`·`location`·`capacity`·`equipment`를 요청 값으로 바꾼다(엔티티의 변경 메서드 하나, 5-IM-24에서 추가).

**응답 매핑 (Response)**

- 성공: 변경된 회의실(`MeetingRoomItem`)을 봉투 `data`에 담아 200으로 반환한다.
- 오류: 봉투 `error`.

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 400 | BAD_REQUEST | 회의실명 누락·길이 초과, 형식에 맞지 않는 값 | `EX-MTR-01` |
| 401 | UNAUTHORIZED | 로그인하지 않음 | — |
| 403 | FORBIDDEN | `ROOM_MANAGER`가 아닌 사용자의 변경 요청 | `EX-MTR-02` |
| 404 | NOT_FOUND | 없는 회의실 | — |
| 500 | INTERNAL | 회의실 정보 저장 실패, 롤백하고 재시도를 안내 | `EX-MTR-03` |

**구현 가정 (Assumptions)**

- 위치 표기 형식·수용 인원 필수 여부는 미확정(조건 C1) — meeting-room-002와 같다.

---

### meeting-room-005 — 전체 예약 조회

```
GET /api/v1/admin/reservations
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| from(쿼리) | 필수, `YYYY-MM-DD` 형식의 실제 날짜 | BAD_REQUEST |
| to(쿼리) | 필수, `YYYY-MM-DD` 형식의 실제 날짜 | BAD_REQUEST |
| from·to 관계 | 시작일이 종료일보다 늦으면 안 된다(같은 날 허용) — `mtr.all.period.invalid` | BAD_REQUEST |
| meetingRoomId(쿼리) | 선택, 숫자 | BAD_REQUEST |

**업무 규칙 (Business Rules)**

- `ROOM_MANAGER`만 조회할 수 있다(C-MTR-ALL-001).
- 회의실과 기간별로 전체 예약(시간·예약자·회의 제목)을 조회한다(REQ-F-008). 회의실을 지정하지 않으면 전체 회의실이다.
- 취소된 예약은 제외한다(C-MTR-ALL-003). 회의 제목은 `ROOM_MANAGER`에게 항상 보인다(BR-03).
- 예약 데이터는 예약 도메인이 소유한다 — 예약 도메인 서비스 계약을 호출해 얻고, 회의실명을 붙여 응답한다(→ reservation 초안 §3 참조).
- 정렬은 시작 일시 순.

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✗ | 403 |
| `ROOM_MANAGER` | ✓ | — |

**트랜잭션 경계 (Transaction)**

- 경계: 읽기 전용(`@Transactional(readOnly = true)`). 예약 도메인 서비스 호출도 같은 읽기 전용 트랜잭션에 참여한다.
- 격리 수준: 기본(READ_COMMITTED).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 목록 — 예약 도메인 서비스 계약 `findActiveReservationsInPeriod`로 기간·회의실 조건의 `RESERVED` 예약을 얻는다(→ reservation 초안 §3 참조). 회의실명은 `MeetingRoomRepository`로 해당 회의실을 한 번에 조회해 붙인다(N+1을 피한다).
- 저장·상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: `AdminReservationItem` 배열을 봉투 `data`에 담아 200으로 반환한다. 없으면 빈 배열(`mtr.all.list.empty`).
- 오류: 봉투 `error`에 안내 문구(`mtr.all.period.invalid`·`mtr.all.list.failed`).

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 400 | BAD_REQUEST | 기간 형식 오류, 시작일이 종료일보다 늦음 — 기간 재지정을 안내 | `EX-MTR-04` |
| 401 | UNAUTHORIZED | 로그인하지 않고 조회를 요청 | `EX-MTR-05` |
| 403 | FORBIDDEN | `ROOM_MANAGER`가 아닌 사용자 | — |
| 500 | INTERNAL | 예약 조회 실패, 오류를 안내하고 재시도를 유도 | `EX-MTR-06` |

**구현 가정 (Assumptions)**

- 조회 기간의 최대 길이 제한과 페이징은 화면 명세에 요구가 없어 두지 않는다.
- 이 목록의 [취소]는 예약 도메인의 취소 operation(`reservation-008`)을 쓴다 — 이 도메인에는 취소 동작이 없다.

---

## 3. 도메인 공통 사항

### 상태 전이 다이어그램

해당 없음 — 회의실에는 상태 값이 없다(`meeting_room`에 상태 컬럼이 없고 삭제도 제공하지 않는다).

### 도메인 간 서비스 계약 (피호출 도메인 소유)

| 메서드 | 호출 도메인 | 계약 설명 (파라미터·반환·예외) | 근거 |
|--------|-----------|------------------------------|------|
| `MeetingRoomService.existsById(meetingRoomId)` | `reservation` | 회의실이 존재하는지 돌려준다(`boolean`). 예외 없음 | `reservation-006`, REQ-F-003 |
| `MeetingRoomService.findNamesByIds(meetingRoomIds)` | `reservation` | 회의실 식별자 집합으로 {식별자 → 회의실명}을 한 번에 돌려준다. 없는 식별자는 결과에 없다. 예외 없음 | `reservation-005`·`reservation-007`, REQ-F-002·REQ-F-005 |

이 도메인이 다른 도메인의 계약을 호출하는 곳(기간별 예약 조회)은 → reservation 초안 §3 참조.

### 도메인 공통 구현 전제

- 서비스 배치: SVC-MTR-001을 두 서비스로 나눈다 — `MeetingRoomService`는 회의실 등록·변경·조회(`meeting-room-001`~`004`)와 이 도메인이 제공하는 서비스 계약을 맡고 다른 도메인 서비스를 호출하지 않는다. `AdminReservationQueryService`는 전체 예약 조회(`meeting-room-005`)를 맡아 예약 도메인의 서비스 계약과 `MeetingRoomService`를 조합한다. 이렇게 나누면 `ReservationService → MeetingRoomService`(→ 예약 도메인은 회의실 계약만 호출)와 `AdminReservationQueryService → ReservationService`가 한 방향이라 서비스 사이에 순환 의존이 생기지 않는다(패키지 단위로는 두 도메인이 서로 참조하지만 단일 모듈이고 경계 규칙이 없다). Controller는 검증과 봉투 변환만 한다.
- 역할 판정은 공통 기능의 `CurrentUserProvider`로 현재 사용자를 얻어 `LoginUser.hasRole("ROOM_MANAGER")`로 한다. `ROOM_MANAGER`가 필요한 operation은 서비스 진입에서 확인하고 아니면 `BusinessException(FORBIDDEN)`을 던진다.
- 도메인 간 호출은 서비스 계층에서만 한다. 예약 도메인의 Repository·엔티티를 직접 다루지 않는다(`4-DN-21-O3` Service 규칙). 엔티티 간 연관관계(`MeetingRoomEntity.reservations`)는 사용하지 않는다(목록 조회 시 지연 로딩으로 전체 예약이 끌려오지 않게 한다).
- 회의실 삭제가 없으므로 예약이 있는 회의실을 지우는 경우는 없다.

### 오류 행이 없는 거부 규칙

없음

### API 수정 제안 목록

없음

---

## 4. 품질 게이트 자가 점검

- [x] im-21.P1 — 모든 `operationId`가 §2 색인에 있고 블록이 있다
- [x] im-21.P2 — 검증·권한·트랜잭션·영속화·응답·오류가 기술되었고 영속화 어휘가 JPA다
- [x] im-21.P3 — 엔티티 참조가 `entities.yaml`의 테이블·컬럼 값이다
- [x] im-21.P4 — `EX-MTR-01`~`06`이 업무프로세스 정의서에 실재하고 소속 프로세스(PROC-MTR-01·02)와 맞으며 모두 오류 행이 있다. 상태 전이는 해당 없음
- [x] im-21.P5 — 응답·오류가 `Envelope`와 §4 상태 코드 배정에 맞고, 역할 코드가 사이트맵 §3의 `USER`·`ROOM_MANAGER`다
- [x] im-21.P6 — API 수정 제안 없음(「없음」 기재)
- [x] im-21.P8 — §3 「도메인 간 서비스 계약」 표가 있고 다른 도메인의 계약을 재기술하지 않았다
- [x] im-21.B1·B2 — 저장소 코드·SQL이 없고 명세에 없는 동작을 더하지 않았다

## 5. 변경 이력

| 버전 | 변경일 | 변경자 | 변경 내용 |
|------|--------|--------|---------|
| 1.0 | 2026-10-27 | 설동혁 (DV) | 최초 작성 |
| 1.0.1 | 2026-10-27 | 설동혁 (DV) | 정정 — 정합성 점검(5-IM-22) 중 발견: 목록 조회를 프로젝션 DTO로 명시, 계약에 없는 400 행(meeting-room-003) 제거하고 기반 오류로 명시, 서비스 순환 의존을 막도록 전체 예약 조회를 별도 서비스로 분리. 동작 변경 없음 |
