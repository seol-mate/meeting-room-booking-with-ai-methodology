#!/usr/bin/env bash
# 운영 배포 실행 + Smoke Test (7-DP-04, 배포 계획서 7-DP-01-O1 §4~§6) — 사람이 터미널에서 직접 실행한다.
# 에이전트는 이 스크립트를 실행하지 않는다(게이트 dp-04.B4). 실행 로그는 docs/evidence/7-DP/ 에 남는다.
#
# 사용:  bash scripts/deploy.sh            # 배포 + Smoke Test + 5분 판정 창 오류율 출력
#        bash scripts/deploy.sh rollback   # 롤백(컨테이너 중지, 볼륨 유지)
#        bash scripts/deploy.sh cleanup    # Smoke 데이터 삭제(배포 계획서 §4.3)
# 사전: Docker Desktop 실행, 저장소 루트에 .env.prod (견본 .env.prod.example), 개발 서버·검증 스택이 포트 3200을 쓰지 않을 것
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose --env-file .env.prod -f docker-compose.prod.yml)
EVID=docs/evidence/7-DP
mkdir -p "$EVID"
set -a; . ./.env.prod; set +a
WEB="http://127.0.0.1:${WEB_PORT:-3200}"
STAMP=$(date +%Y%m%d-%H%M%S)
LOG="$EVID/deploy-$STAMP.log"

psql_exec() { docker exec meetingroom-prod-db psql -U "$DB_USERNAME" -d "$DB_NAME" -t -A "$@"; }

case "${1:-deploy}" in
  rollback)
    "${COMPOSE[@]}" down
    echo "중지했습니다(볼륨 유지). 직전 이미지 태그로 되돌리려면 APP_VERSION을 바꿔 다시 up 하세요."
    exit 0 ;;
  cleanup)
    psql_exec -c "delete from reservation where meeting_room_id in (select meeting_room_id from meeting_room where name like 'SMOKE %');" \
              -c "delete from meeting_room where name like 'SMOKE %';" \
              -c "delete from reserver where login_id like 'smoke-%';"
    psql_exec -c "select (select count(*) from reserver where login_id like 'smoke-%') + (select count(*) from meeting_room where name like 'SMOKE %')"
    exit 0 ;;
esac

exec > >(tee -a "$LOG") 2>&1
echo "== 배포 시작 $(date '+%F %T') =="

echo "-- [배포 전] 포트·기존 컨테이너 확인"
if curl -s -m 3 -o /dev/null "$WEB/login"; then echo "포트 ${WEB_PORT:-3200}이 이미 응답합니다. 검증 스택을 내리고 다시 실행하세요." >&2; exit 2; fi

echo "-- [배포 전] 이미지 빌드 및 해시 기록"
"${COMPOSE[@]}" build
docker image inspect --format '{{.RepoTags}} {{.Id}}' "meetingroom-api:${APP_VERSION:-1.0.0}" "meetingroom-web:${APP_VERSION:-1.0.0}"

echo "-- [배포 전] 운영 DB 백업 (기존 볼륨이 있을 때만)"
if docker volume ls -q | grep -q "meetingroom-prod-db-data"; then
  "${COMPOSE[@]}" up -d db --wait
  docker exec meetingroom-prod-db pg_dump -U "$DB_USERNAME" -d "$DB_NAME" > "$EVID/pre-deploy-backup-$STAMP.sql"
  echo "백업: $EVID/pre-deploy-backup-$STAMP.sql ($(wc -c < "$EVID/pre-deploy-backup-$STAMP.sql") bytes)"
else
  echo "첫 배포 — 기존 DB 볼륨 없음(백업할 데이터 없음)"
fi

echo "-- [배포 중] 기동"
"${COMPOSE[@]}" up -d --wait
"${COMPOSE[@]}" ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'
docker exec meetingroom-prod-api curl -s http://localhost:8081/actuator/health; echo

echo "-- [Smoke Test] 가입 → 로그인 → 회의실 등록 → 예약 → 취소 → 미로그인 401"
J=$(mktemp); trap 'rm -f "$J"' EXIT
SID="smoke-$STAMP"
H='Content-Type: application/json'
fail() { echo "SMOKE FAIL: $1" >&2; exit 3; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

[ "$(code -m 10 "$WEB/login")" = 200 ] || fail "메인(로그인) 화면 200 아님"
[ "$(code -m 10 -H "$H" -d "{\"loginId\":\"$SID\",\"name\":\"smoke\",\"password\":\"pw-12345\"}" "$WEB/api/v1/auth/signup")" = 201 ] || fail "가입 201 아님"
# 회의실 등록은 관리 담당자만 가능 — 생성 수단 미정(조건 C2)이라 Smoke 계정의 역할을 DB에서 잠시 올린다(cleanup으로 삭제)
psql_exec -c "update reserver set role='ROOM_MANAGER' where login_id='$SID'" >/dev/null
[ "$(code -m 10 -c "$J" -H "$H" -d "{\"loginId\":\"$SID\",\"password\":\"pw-12345\"}" "$WEB/api/v1/auth/login")" = 200 ] || fail "로그인 200 아님"
ROOM=$(curl -s -m 10 -b "$J" -H "$H" -d '{"name":"SMOKE 회의실","location":"smoke","capacity":2}' "$WEB/api/v1/meeting-rooms")
RID=$(echo "$ROOM" | sed -n 's/.*"meetingRoomId":\([0-9]*\).*/\1/p'); [ -n "$RID" ] || fail "회의실 등록 실패: $ROOM"
RES=$(curl -s -m 10 -b "$J" -H "$H" -d "{\"meetingRoomId\":$RID,\"startAt\":\"2099-01-01T10:00\",\"endAt\":\"2099-01-01T11:00\",\"title\":\"smoke\"}" "$WEB/api/v1/reservations")
XID=$(echo "$RES" | sed -n 's/.*"reservationId":\([0-9]*\).*/\1/p'); [ -n "$XID" ] || fail "예약 등록 실패: $RES"
[ "$(code -m 10 -b "$J" "$WEB/api/v1/reservations?date=2099-01-01")" = 200 ] || fail "예약 현황 200 아님"
[ "$(code -m 10 -b "$J" -X PATCH "$WEB/api/v1/reservations/$XID/cancel")" = 200 ] || fail "예약 취소 200 아님"
[ "$(code -m 10 "$WEB/api/v1/reservations/mine")" = 401 ] || fail "미로그인 접근이 401이 아님"
echo "SMOKE PASS (계정 $SID, 회의실 $RID, 예약 $XID — 정리: bash scripts/deploy.sh cleanup)"

echo "-- [배포 후] 5분 판정 창 오류율 (롤백 트리거 1% / Pass 기준 0.1% — 배포 계획서 §6)"
TOTAL=$("${COMPOSE[@]}" logs --since 5m api | grep -cE ' -> [0-9]{3} ' || true)
ERR=$("${COMPOSE[@]}" logs --since 5m api | grep -cE ' -> 5[0-9]{2} ' || true)
echo "요청 ${TOTAL}건 중 5xx ${ERR}건 → 오류율 $(awk -v e="$ERR" -v t="$TOTAL" 'BEGIN{ if (t==0) print "n/a(요청 0건 — 창 확장)"; else printf "%.2f%%", 100*e/t }')"
echo "30분 동안 아래 명령으로 반복 확인한 뒤 결과를 7-DP-04-O1 §5에 적으세요:"
echo "  docker compose --env-file .env.prod -f docker-compose.prod.yml logs --since 5m api | grep -cE ' -> 5[0-9]{2} '"
echo "== 완료 $(date '+%F %T') — 로그 $LOG =="
