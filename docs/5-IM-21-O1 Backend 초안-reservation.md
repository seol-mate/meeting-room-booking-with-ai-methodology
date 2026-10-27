# 5-IM-21-O1 Backend 초안-reservation

## 1. 문서 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 회의실 예약 시스템 |
| 작성자 | 설동혁 (DV) |
| 작성일 | 2026-10-27 |
| 버전 | 1.0 |
| 도메인 | `reservation` — 예약 |
| API 명세서 | `5-IM-12-O1 API 명세서-reservation.yaml` |
| 상태 | 완료 |

데이터 접근 기술은 JPA다(시스템 아키텍처 정의서 `4-DN-01-O1` §8.1). 응답 형식은 `Envelope`(공통 개발규칙 `4-DN-21-O3` §2), 오류 코드·상태 코드는 같은 문서 §4와 「이 프로젝트의 적용」 표를 따른다. 응답 봉투·예외 처리·인증 필터·현재 사용자 조회·세션 도구는 공통 기능 구현(5-IM-04)이 만든 것을 쓴다(`EnvelopeFactory`, `BusinessException`, `AuthFilter`, `CurrentUserProvider`, `LoginSession`).

## 2. 엔드포인트별 Backend 동작

### 엔드포인트 색인

| operationId | METHOD | PATH | 블록 |
|-------------|--------|------|------|
| reservation-001 | POST | /api/v1/auth/login | 동작 |
| reservation-002 | GET | /api/v1/auth/me | 동작 |
| reservation-003 | POST | /api/v1/auth/signup | 동작 |
| reservation-004 | GET | /api/v1/auth/login-id-availability | 동작 |
| reservation-005 | GET | /api/v1/reservations | 동작 |
| reservation-006 | POST | /api/v1/reservations | 동작 |
| reservation-007 | GET | /api/v1/reservations/mine | 동작 |
| reservation-008 | PATCH | /api/v1/reservations/{reservationId}/cancel | 동작 |

### reservation-001 — 로그인

```
POST /api/v1/auth/login
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| loginId | 필수, 공백 제거 후 1~50자 | BAD_REQUEST |
| password | 필수, 1자 이상 | BAD_REQUEST |

**업무 규칙 (Business Rules)**

- 로그인 ID로 예약자(`reserver.login_id`)를 찾고, 입력한 비밀번호를 저장된 해시(`reserver.password_hash`)와 대조한다. 일치하면 로그인 세션을 시작한다.
- 계정이 없는 경우와 비밀번호가 틀린 경우를 구분하지 않고 같은 오류를 돌려준다(어느 쪽이 틀렸는지 알려 주지 않는다).
- 이미 로그인한 세션에서 다시 로그인하면 세션 식별자를 새로 바꾼다(`LoginSession.begin`이 세션 고정 공격을 막는다).
- 비밀번호는 어떤 로그에도 남기지 않는다(`4-DN-21-O3` §5, C-RSV-LGN-003).

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `ALL` | ✓ | 인증 불필요(공개 경로 `app.security.public-paths`) |

**트랜잭션 경계 (Transaction)**

- 경계: 읽기 전용 단일 서비스 메서드. 세션 시작은 조회·대조가 끝난 뒤에 한다.
- 격리 수준: 기본(READ_COMMITTED).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 단건 조회 — `ReserverRepository`에서 `loginId`로 `ReserverEntity` 한 건 조회(`findByLoginId`).
- 저장: 없음.
- 상태 변경: 없음(세션은 서버 세션 저장소에 둔다, DB 변경 없음).

**응답 매핑 (Response)**

- 성공: `LoginUser`(reserverId·name·role)를 봉투 `data`에 담아 200으로 반환한다. 비밀번호·해시는 담지 않는다.
- 오류: 봉투 `error.code`·`error.message`에 사용자 안내 문구(`rsv.login.submit.failed`).

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 400 | BAD_REQUEST | 로그인 ID·비밀번호 누락, 계정 없음, 비밀번호 불일치 — 로그인하지 않고 재입력을 안내한다 | `EX-RSV-01` |
| 500 | INTERNAL | 계정 조회 중 시스템 장애 | — |

**구현 가정 (Assumptions)**

- 로그인 실패 횟수 제한(계정 잠금 등)은 요구사항에 없어 두지 않는다.
- 비밀번호 해시는 BCrypt로 한다(`spring-security-crypto`의 `BCryptPasswordEncoder`만 의존성에 추가하고 Spring Security 필터 체인은 쓰지 않는다 — 5-IM-24에서 의존성 추가).

---

### reservation-002 — 현재 로그인 사용자 조회

```
GET /api/v1/auth/me
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| (없음) | 요청 파라미터 없음 | — |

**업무 규칙 (Business Rules)**

- `AuthFilter`가 세션의 사용자 식별자로 사용자를 확인한 요청만 서비스에 도달한다. 서비스는 `CurrentUserProvider`의 현재 사용자를 `LoginUser` 응답으로 옮긴다.
- 로그인 화면이 이미 로그인한 사용자를 예약 현황으로 보내는 데 쓴다(C-RSV-LGN-001).

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✓ | 로그인한 본인 |
| `ROOM_MANAGER` | ✓ | 로그인한 본인 |

**트랜잭션 경계 (Transaction)**

- 경계: 읽기 전용. 필터가 사용자를 조회한 결과를 그대로 쓰므로 추가 조회 없음.
- 격리 수준: 기본(READ_COMMITTED).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 단건 조회 — 필터 단계에서 포트 `LoginUserLookup`의 어댑터가 `ReserverRepository`로 `reserverId` 단건 조회(`findById`)를 한다(§3 「도메인 공통 구현 전제」).
- 저장·상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: `LoginUser`를 봉투 `data`에 담아 200으로 반환한다.
- 오류: 로그인 상태가 아니면 `AuthFilter`가 401 봉투를 직접 돌려준다.

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 401 | UNAUTHORIZED | 세션이 없거나 만료, 세션의 사용자가 더 이상 없음 | `EX-RSV-02` |

**구현 가정 (Assumptions)**

- 사용자의 역할이 바뀌면 다음 요청부터 바로 반영된다(요청마다 사용자를 다시 조회하므로).

---

### reservation-003 — 계정 가입

```
POST /api/v1/auth/signup
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| loginId | 필수, 공백 제거 후 1~50자 | BAD_REQUEST |
| name | 필수, 공백 제거 후 1~100자 | BAD_REQUEST |
| password | 필수, 1자 이상(길이·복잡도 규칙은 요구사항에 없다) | BAD_REQUEST |
| 요청 본문의 role | 받지 않는다(있어도 무시) | — |

**업무 규칙 (Business Rules)**

- 로그인 ID는 중복될 수 없다(C-RSV-JOIN-002, `reserver.login_id` 고유 제약). 서비스가 먼저 확인하고, 동시에 가입하는 경우는 고유 제약 위반을 공통 예외 핸들러가 409로 바꾼다.
- 가입한 계정의 역할은 항상 `USER`다. `ROOM_MANAGER`는 이 API로 만들 수 없다(C-RSV-JOIN-003).
- 비밀번호는 해시로만 저장하고 평문을 저장·기록하지 않는다(C-RSV-JOIN-004).
- 가입만 하고 로그인 세션은 시작하지 않는다(가입 성공 후 로그인 화면으로 이동, 와이어프레임 §4).

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `ALL` | ✓ | 인증 불필요 |

**트랜잭션 경계 (Transaction)**

- 경계: 단일 서비스 메서드 `@Transactional`. 저장 실패 시 롤백한다.
- 격리 수준: 기본(READ_COMMITTED). 중복 최종 보증은 DB 고유 제약이다.

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 중복 확인 — `ReserverRepository`의 `existsByLoginId`.
- 저장: `ReserverEntity` 생성 후 `save`(`login_id`, `password_hash`, `name`, `role=USER`). 감사 컬럼(`created_at` 등)은 공통 부모가 채운다.
- 상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: 만들어진 계정을 `LoginUser`로 변환해 봉투 `data`에 담아 201로 반환한다(비밀번호·해시 제외).
- 오류: 봉투 `error`에 문구. 검증 오류 항목은 `error.errors`(ValidationError 배열).

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 400 | BAD_REQUEST | 필수 항목 누락, 길이 초과(`rsv.join.field.required`) | — |
| 409 | CONFLICT | 이미 쓰는 로그인 ID(`rsv.join.id.duplicate`) | — (소급 예정: 업무프로세스 정의서 개정 요청 — 5-IM-22에서 접수) |
| 500 | INTERNAL | 계정 저장 실패, 가입을 롤백하고 재시도를 안내(`rsv.join.submit.failed`) | `EX-RSV-03` |

**구현 가정 (Assumptions)**

- 로그인 ID의 대소문자 구분·허용 문자는 요구사항에 없어 입력값을 그대로(공백 제거만) 쓰고 대소문자를 구분한다.
- 로그인 ID 중복은 상류(업무프로세스 정의서 `3-AN-09-O1`)에 예외 흐름(`EX-`)이 없다 — 4-DN-36 제약(C-RSV-JOIN-002)에는 있다. 소급 발급 대상이다.

---

### reservation-004 — 로그인 ID 중복 확인

```
GET /api/v1/auth/login-id-availability
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| loginId(쿼리) | 필수, 1~50자 | BAD_REQUEST |

**업무 규칙 (Business Rules)**

- 입력한 로그인 ID를 이미 쓰는 사람이 있으면 `available=false`, 없으면 `true`. 이 조회는 안내용이며 가입 시점의 중복 판정(reservation-003)이 최종이다.
- 응답으로 계정의 존재 여부 외 다른 정보를 주지 않는다.

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `ALL` | ✓ | 인증 불필요 |

**트랜잭션 경계 (Transaction)**

- 경계: 읽기 전용 단일 서비스 메서드.
- 격리 수준: 기본(READ_COMMITTED).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 존재 확인 — `ReserverRepository`의 `existsByLoginId`.
- 저장·상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: `LoginIdAvailability`(`available`)를 봉투 `data`에 담아 200으로 반환한다.
- 오류: 봉투 `error`.

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 400 | BAD_REQUEST | `loginId` 누락·길이 초과 | — |

**구현 가정 (Assumptions)**

- 계정 존재 여부를 알아내는 용도로 악용될 수 있으나(계정 열거) 개인 테스트 용도이고 가입 화면이 필요로 하는 기능이라 별도 제한을 두지 않는다.

---

### reservation-005 — 예약 현황 조회

```
GET /api/v1/reservations
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| date(쿼리) | 필수, `YYYY-MM-DD` 형식의 실제 날짜 | BAD_REQUEST |
| meetingRoomId(쿼리) | 선택, 숫자. 없는 회의실이어도 오류가 아니라 빈 목록 | BAD_REQUEST(형식 오류만) |

**업무 규칙 (Business Rules)**

- 그 날짜에 시작하는 예약 가운데 상태가 `RESERVED`인 것만 돌려준다. 취소된 예약(`CANCELLED`)은 현황에 예약된 것으로 보이지 않는다(C-RSV-STS-003).
- 회의 제목(`reservation.title`)은 예약자 본인과 `ROOM_MANAGER`에게만 값을 담고, 그 밖의 로그인 사용자에게는 `null`로 담는다(C-RSV-STS-002, BR-03).
- 예약자 이름(`reserver.name`)과 회의실명(`meeting_room.name`)을 함께 돌려준다. 정렬은 회의실, 시작 일시 순.
- 현황 표의 행인 회의실 목록은 이 응답에 없다 — `meeting-room-001`을 쓴다. 회의실이 없으면 이 목록은 빈 배열이다(`EX-RSV-06`은 §3 「오류 행이 없는 거부 규칙」).

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✓ | 회의 제목은 본인 예약에만 |
| `ROOM_MANAGER` | ✓ | 회의 제목 전체 |

**트랜잭션 경계 (Transaction)**

- 경계: 읽기 전용(`@Transactional(readOnly = true)`).
- 격리 수준: 기본(READ_COMMITTED).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 목록 — `ReservationRepository`에서 `start_at`이 그 날짜 범위(해당 일 00:00 이상, 다음 날 00:00 미만)이고 `status = RESERVED`(선택으로 `meeting_room_id` 일치)인 예약을 `@Query`로 조회하며 예약자 이름·회의실명은 프로젝션 DTO로 바로 받는다(엔티티를 거치지 않는다, `4-DN-21-O3` Repository 규칙). 회의실명은 회의실 도메인 서비스 계약으로 얻는다(→ meeting-room 초안 §3 참조).
- 저장·상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: `ReservationStatusItem` 배열을 봉투 `data`에 담아 200으로 반환한다. 예약이 없으면 빈 배열.
- 오류: 봉투 `error`.

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 400 | BAD_REQUEST | `date` 누락·형식 오류, `meetingRoomId` 형식 오류 | — |
| 401 | UNAUTHORIZED | 로그인하지 않고 현황을 요청 | `EX-RSV-04` |
| 500 | INTERNAL | 현황 조회 실패, 오류를 안내하고 재시도를 유도(`rsv.status.list.failed`) | `EX-RSV-05` |

**구현 가정 (Assumptions)**

- 이 operation은 예약 화면(SCR-RSV-004)의 기존 예약 확인에도 쓰인다(`meetingRoomId` 지정).
- 종료 일시가 다음 날로 넘어가는 예약은 시작 날짜 기준으로 한 건만 보인다.

---

### reservation-006 — 회의실 예약 등록

```
POST /api/v1/reservations
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| meetingRoomId | 필수, 양의 정수 | BAD_REQUEST |
| startAt·endAt | 필수, `YYYY-MM-DDTHH:mm(:ss)` 형식(시간대 없음) | BAD_REQUEST |
| title | 선택, 최대 200자 | BAD_REQUEST |
| 시작·종료 시각 | 분이 00 또는 30(30분 단위), 종료가 시작보다 늦고 길이가 30분 이상 4시간 이하 | BUSINESS_ERROR(422) |
| 요청 본문의 예약자 | 받지 않는다(있어도 무시) | — |

**업무 규칙 (Business Rules)**

- 예약자는 로그인한 사용자 본인이다(C-RSV-NEW-004).
- 시간 규칙(REQ-F-003): 30분 단위, 최소 30분, 최대 4시간, 종료가 시작보다 늦어야 한다. 어기면 예약하지 않고 허용 범위를 안내한다.
- `BR-01` 겹침 거부(REQ-F-004): 같은 회의실에서 상태가 `RESERVED`인 기존 예약과 시간이 일부라도 겹치면 등록하지 않고 "이미 예약됨"을 안내한다. 기존 예약은 바뀌지 않는다. 겹침은 `기존.시작 < 새.종료`이고 `새.시작 < 기존.종료`일 때다 — 끝과 시작이 맞닿는 것은 겹침이 아니다. 취소된 예약은 겹침 대상이 아니다.
- 새 예약의 상태는 `RESERVED`이다.
- 존재하지 않는 회의실이면 등록하지 않는다.
- 예약 가능 시간대(운영 시간)·과거 시각 예약 제한은 요구사항에 없어(UI&UX 제약사항 조건 C3 미결) 서버는 제한하지 않는다.

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✓ | 본인 명의로만 |
| `ROOM_MANAGER` | ✓ | 본인 명의로만 |

**트랜잭션 경계 (Transaction)**

- 경계: 단일 서비스 메서드 `@Transactional` — 회의실 존재 확인, 겹침 확인, 저장을 한 트랜잭션에서 한다. 저장 실패 시 롤백한다(`EX-RSV-09`).
- 격리 수준: 기본(READ_COMMITTED). 동시에 같은 시간을 예약하는 경쟁은 서비스 확인만으로 막을 수 없으므로 DB 배제 제약(`ex_reservation_overlap`)이 최종으로 거부하고, 그 제약 위반(PostgreSQL SQLState 23P01)을 공통 예외 핸들러가 409로 바꾼다(`4-DN-21-O3` §6 Repository 잠금 규칙).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 회의실 존재 확인 — 회의실 도메인 서비스 계약(→ meeting-room 초안 §3 참조). 겹침 확인 — `ReservationRepository`에서 `meeting_room_id` 일치, `status = RESERVED`, 시간이 겹치는 예약이 있는지(`@Query` 존재 확인).
- 저장: `ReservationEntity` 생성 후 `save` — `meeting_room_id`, `reserver_id`(현재 사용자), `start_at`, `end_at`, `title`, `status=RESERVED`. `cancelled_at`·`cancelled_by`는 비워 둔다.
- 상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: 만들어진 예약(`ReservationResult`)을 봉투 `data`에 담아 201로 반환한다.
- 오류: 봉투 `error`에 안내 문구(`rsv.new.time.invalid`·`rsv.new.time.overlap`·`rsv.new.submit.failed`).

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 400 | BAD_REQUEST | 필수 항목 누락, 일시 형식 오류, 제목 길이 초과 | — |
| 401 | UNAUTHORIZED | 로그인하지 않음 | — |
| 404 | NOT_FOUND | 없는 회의실 | — |
| 409 | CONFLICT | 같은 회의실의 기존 예약과 시간이 일부라도 겹침 — "이미 예약됨"(`BR-01`) | `EX-RSV-08` |
| 422 | UNPROCESSABLE | 30분 단위가 아니거나 30분 미만·4시간 초과, 종료가 시작보다 이름 | `EX-RSV-07` |
| 500 | INTERNAL | 예약 저장 실패, 등록을 롤백하고 재시도를 안내 | `EX-RSV-09` |

**구현 가정 (Assumptions)**

- 시간 규칙 위반은 업무프로세스 정의서가 「입력 오류」로 분류하지만 공통 개발규칙 「이 프로젝트의 적용」 표가 422로 배정했다. 형식이 틀린 입력(400)과 규칙 위반(422)을 가른다.
- 서버 시각은 `Clock`(Asia/Seoul) 빈을 쓴다.

---

### reservation-007 — 내 예약 목록 조회

```
GET /api/v1/reservations/mine
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| (없음) | 요청 파라미터 없음 | — |

**업무 규칙 (Business Rules)**

- 로그인한 사용자 본인의 예약만 돌려준다(C-RSV-MY-001). 다른 사람의 예약은 어떤 경우에도 포함하지 않는다.
- 취소한 예약도 상태 `CANCELLED`와 취소 일시(`cancelled_at`)로 함께 돌려준다 — 취소 이력을 보존한다(C-RSV-MY-003, REQ-F-005).
- 시작 일시 내림차순으로 정렬한다. 회의실명을 함께 돌려준다.

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✓ | 본인 예약만 |
| `ROOM_MANAGER` | ✓ | 본인 예약만(전체 예약은 `meeting-room-005`) |

**트랜잭션 경계 (Transaction)**

- 경계: 읽기 전용(`@Transactional(readOnly = true)`).
- 격리 수준: 기본(READ_COMMITTED).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 목록 — `ReservationRepository`에서 `reserver_id` = 현재 사용자인 예약을 `start_at` 내림차순으로 프로젝션 DTO로 조회한다. 회의실명은 회의실 도메인 서비스 계약으로 얻는다(→ meeting-room 초안 §3 참조).
- 저장·상태 변경: 없음.

**응답 매핑 (Response)**

- 성공: `MyReservationItem` 배열을 봉투 `data`에 담아 200으로 반환한다. 없으면 빈 배열.
- 오류: 봉투 `error`.

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 401 | UNAUTHORIZED | 로그인하지 않음 | — |
| 500 | INTERNAL | 조회 실패 | — |

**구현 가정 (Assumptions)**

- 페이징은 두지 않는다(화면 명세에 요구가 없음).

---

### reservation-008 — 예약 취소

```
PATCH /api/v1/reservations/{reservationId}/cancel
```

**검증 (Validation)**

| 대상 | 규칙 | 오류 코드 |
|------|------|---------|
| reservationId(경로) | 양의 정수 | BAD_REQUEST |

**업무 규칙 (Business Rules)**

- `BR-02` 예약 취소(REQ-F-005, REQ-F-006): 취소는 삭제가 아니라 상태 갱신이다. 상태를 `CANCELLED`로 바꾸고 취소 일시(`cancelled_at`)와 취소한 사용자(`cancelled_by`)를 기록한다 — 예약을 삭제하지 않는다(C-RSV-MY-003).
- 취소할 수 있는 사람: 예약자 본인, 또는 `ROOM_MANAGER`(다른 사람 예약 포함). 둘 다 아니면 거부한다.
- 예약 시작 시각이 지난 예약(`start_at` ≤ 지금)은 취소할 수 없다.
- 이미 취소된 예약을 다시 취소하는 요청은 거부한다.
- 취소하면 그 회의실·시간은 다시 예약 가능한 상태가 된다(취소된 예약은 겹침 대상이 아니므로 별도 작업이 필요 없다).

**권한 · 테넌시 (Authorization)**

| 역할 (접근 권한 코드) | 허용 | 조건 |
|----------------------|------|------|
| `USER` | ✓ | 본인 예약만 |
| `ROOM_MANAGER` | ✓ | 모든 예약(시작 전만) |

**트랜잭션 경계 (Transaction)**

- 경계: 단일 서비스 메서드 `@Transactional` — 예약 조회, 권한·시각·상태 확인, 상태 갱신을 한 트랜잭션에서 한다. 저장 실패 시 롤백한다(`EX-RSV-12`).
- 격리 수준: 기본(READ_COMMITTED). 같은 예약을 동시에 취소하는 경쟁은 예약 한 건(Aggregate 루트)에 비관적 잠금을 걸어 직렬화한다(`4-DN-21-O3` §6 Repository 잠금 규칙).

**영속화 의도 (Persistence)**

- 쿼리 방식: `[JPA]` 단건 조회 — `ReservationRepository`에서 `reservationId`로 `ReservationEntity`를 비관적 잠금으로 조회한다.
- 저장: 없음(변경 감지로 갱신).
- 상태 변경: `status`를 `CANCELLED`로, `cancelled_at`을 지금 시각으로, `cancelled_by`를 현재 사용자 `reserverId`로 갱신한다 — 코드 정의서(`4-DN-21-O2`) 코드 그룹 RESERVATION_STATUS 참조. 상태 변경 규칙은 엔티티의 변경 메서드 하나로 둔다(5-IM-24에서 추가).

**응답 매핑 (Response)**

- 성공: `ReservationCancelResult`(reservationId·status·cancelledAt)를 봉투 `data`에 담아 200으로 반환한다.
- 오류: 봉투 `error`에 안내 문구(`rsv.my.cancel.started`·`rsv.my.cancel.failed`).

**오류 의미 (Errors)**

| HTTP | 코드 | 발생 상황 | EX-ID |
|------|------|---------|-------|
| 401 | UNAUTHORIZED | 로그인하지 않음 | — |
| 403 | FORBIDDEN | 예약자 본인도 `ROOM_MANAGER`도 아닌 사용자의 취소 요청 | `EX-RSV-11` |
| 404 | NOT_FOUND | 없는 예약 | — |
| 422 | UNPROCESSABLE | 예약 시작 이후에 취소 요청(`BR-02`) | `EX-RSV-10` |
| 422 | UNPROCESSABLE | 이미 취소된 예약을 다시 취소 요청 | — (소급 예정: 업무프로세스 정의서 개정 요청 — 5-IM-22에서 접수) |
| 500 | INTERNAL | 예약 해제·이력 저장 실패, 롤백하고 재시도를 안내 | `EX-RSV-12` |

**구현 가정 (Assumptions)**

- 이미 취소된 예약의 재취소를 422로 거부한다(API 명세서가 「Backend 최종 명세서(5-IM-23)에서 확정」으로 남긴 경계). 멱등하게 200으로 처리하는 대안은 취소 이력(`cancelled_at`) 덮어쓰기 문제 때문에 택하지 않았다.
- 비교 기준 시각은 서버 `Clock`(Asia/Seoul)이다.
- 이 operation은 예약 취소(SCR-RSV-005)와 회의실 관리 담당자의 전체 예약 조회 화면의 [취소](SCR-MTR-003)가 함께 쓴다.
- 경로 변수 `reservationId`의 형식 오류(숫자가 아님)는 API 계약에 선언되지 않은 기반 오류이며 공통 예외 핸들러가 400으로 돌려준다.

---

## 3. 도메인 공통 사항

### 상태 전이 다이어그램

```text
예약(reservation.status)

(예약 등록) → [RESERVED]
[RESERVED] → (취소: 예약자 본인 또는 ROOM_MANAGER, 시작 시각 전) → [CANCELLED]
[RESERVED] → (시작 시각 경과) → 취소 불가(상태는 RESERVED로 유지)
[CANCELLED] → (종단 상태: 재취소·복구 없음)
```

### 도메인 간 서비스 계약 (피호출 도메인 소유)

| 메서드 | 호출 도메인 | 계약 설명 (파라미터·반환·예외) | 근거 |
|--------|-----------|------------------------------|------|
| `ReservationService.findActiveReservationsInPeriod(from, to, meetingRoomId)` | `meeting-room` | 기간(시작일·종료일 포함) 안에 시작하는 `RESERVED` 예약을 시작 일시 순으로 돌려준다. `meetingRoomId`가 비어 있으면 모든 회의실. 반환은 예약 식별자·회의실 식별자·예약자 이름·시작·종료·회의 제목(호출 도메인이 관리 담당자 권한을 이미 확인했으므로 제목 전체). 취소된 예약은 제외. 예외 없음(없으면 빈 목록) | `meeting-room-005`, REQ-F-008 |

이 도메인이 다른 도메인의 계약을 호출하는 곳(회의실 존재 확인·회의실명 조회)은 → meeting-room 초안 §3 참조.

### 도메인 공통 구현 전제

- 서비스 배치: `AccountService`(SVC-RSV-001 — reservation-001~004)와 `ReservationService`(SVC-RSV-002 — reservation-005~008)로 나눈다. `ReservationService`는 회의실 도메인의 서비스 계약만 호출하고 그 반대 방향 의존은 없다 — 전체 예약 조회(`meeting-room-005`)는 회의실 도메인의 별도 조회 서비스가 두 서비스를 조합해 처리한다(→ meeting-room 초안 §3 참조). 서비스 사이에 순환 의존이 생기지 않게 하기 위함이다. 상태 변경은 서비스에서만 하고 Controller는 검증과 봉투 변환만 한다(`4-DN-21-O3` Controller·Service 규칙).
- 포트 어댑터: 공통 기능이 선언한 포트 `LoginUserLookup`(현재 로그인 사용자 식별)의 구현은 `AccountService`가 맡는다. 세션의 사용자 식별자로 `ReserverRepository.findById`를 조회해 `LoginUser(reserverId, role)`를 돌려준다. 이 어댑터가 생기면 보호 경로가 열린다.
- 로그인 세션은 공통 기능의 `LoginSession.begin`으로 시작하고 `CurrentUserProvider`로 현재 사용자를 읽는다. 역할 판정은 `LoginUser.hasRole("ROOM_MANAGER")`로 한다.
- 예약 겹침 최종 보증은 DB 배제 제약 `ex_reservation_overlap`이고, 서비스의 확인은 사용자에게 친절한 오류를 주기 위한 1차 확인이다. 제약 위반은 공통 예외 핸들러가 409로 바꾼다.
- 시각 처리는 시간대 없는 `LocalDateTime`과 공통 `Clock`(Asia/Seoul)을 쓴다.
- 감사 컬럼(`created_by`·`updated_by`)은 공통 JPA auditing이 현재 로그인 사용자로 채운다. 가입(reservation-003)은 로그인 전이라 비어 있다.
- 최초 `ROOM_MANAGER` 계정을 만드는 방법은 정해지지 않았다(UI&UX 제약사항 조건 C2 미결). 이 API에는 역할을 바꾸는 operation이 없으므로 5-IM-24 이전에 PM이 지정 방식을 정해야 한다 — 임시로는 DB의 `reserver.role`을 직접 바꾼다.
- 로깅: 비밀번호·해시는 어떤 레벨에도 기록하지 않는다(`4-DN-21-O3` §5).

### 오류 행이 없는 거부 규칙

| 규칙 ID | 행이 없는 사유 |
|---|---|
| `EX-RSV-06` | 등록된 회의실이 없는 것은 오류가 아니라 기준 데이터 결손이다. 이 도메인의 reservation-005는 예약 목록만 돌려주고(없으면 빈 배열), 회의실 목록은 `meeting-room-001`이 돌려준다. 안내 문구는 화면이 낸다(`rsv.status.room.empty`) |

### API 수정 제안 목록

| 엔드포인트 | 제안 내용 | 근거 |
|-----------|---------|------|
| (신규) `POST /api/v1/auth/logout` | (API 수정 제안) 로그아웃 operation 추가 — 현재 공통 헤더의 [로그아웃] 버튼이 서버 세션을 끝낼 방법이 없다. 추가하려면 요구사항(REQ-F-001 개정)이 먼저 정해져야 한다 | C-CMN-06, UI&UX 제약사항 §2 「로그아웃 요구사항 부재」(조건 C4) |

---

## 4. 품질 게이트 자가 점검

- [x] im-21.P1 — 모든 `operationId`가 §2 색인에 있고 블록이 있다
- [x] im-21.P2 — 검증·권한·트랜잭션·영속화·응답·오류가 기술되었고 영속화 어휘가 JPA다
- [x] im-21.P3 — 엔티티 참조가 `entities.yaml`의 테이블·컬럼 값이다
- [x] im-21.P4 — 상태 전이가 §3에 있고, `EX-ID`가 업무프로세스 정의서에 실재하며 소속 프로세스와 맞고, 소급 예정 2건(로그인 ID 중복, 이미 취소된 예약의 재취소)이 사유와 함께 있다. `EX-RSV-06`은 §3 「오류 행이 없는 거부 규칙」에 있다
- [x] im-21.P5 — 응답·오류가 `Envelope`와 §4 상태 코드 배정에 맞고, 역할 코드가 사이트맵 §3의 `USER`·`ROOM_MANAGER`·`ALL`이다
- [x] im-21.P6 — API 수정 제안 1건이 `(API 수정 제안)`으로 표시되어 §3에 있고 상류 근거가 있다
- [x] im-21.P8 — §3 「도메인 간 서비스 계약」 표가 있고 다른 도메인의 계약을 재기술하지 않았다
- [x] im-21.B1·B2 — 저장소 코드·SQL이 없고 명세에 없는 동작을 더하지 않았다

## 5. 변경 이력

| 버전 | 변경일 | 변경자 | 변경 내용 |
|------|--------|--------|---------|
| 1.0 | 2026-10-27 | 설동혁 (DV) | 최초 작성 |
| 1.0.1 | 2026-10-27 | 설동혁 (DV) | 정정 — 정합성 점검(5-IM-22) 중 발견: 계약에 없는 400 행(reservation-008) 제거하고 기반 오류로 명시, 서비스 순환 의존 방지 문구 추가. 동작 변경 없음 |
