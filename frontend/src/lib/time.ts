/** 날짜·시각 도구. 예약 시각은 30분 단위다 (REQ-F-003, C-CMN-05). 일시는 시간대 없는 로컬 일시 문자열(YYYY-MM-DDTHH:mm)로 다룬다. */

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** from~to 사이의 30분 단위 시각 목록(시작 포함, 끝 미포함). 예: halfHours(9, 18) → 09:00 … 17:30 */
export function halfHours(fromHour: number, toHour: number): string[] {
  const result: string[] = [];
  for (let h = fromHour; h < toHour; h++) {
    result.push(`${pad(h)}:00`, `${pad(h)}:30`);
  }
  return result;
}

/** 하루 전체 30분 단위 목록 00:00 … 23:30 (예약 폼 선택용) */
export const allHalfHours: string[] = halfHours(0, 24);

/** "HH:mm"을 분으로 */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Date → "YYYY-MM-DD" (로컬 기준) */
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

/** "YYYY-MM-DD"에 일수를 더한다 */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return toDateString(new Date(y, m - 1, d + days));
}

/** 지금 시각 "YYYY-MM-DDTHH:mm" (로컬 기준) */
export function nowLocal(): string {
  const now = new Date();
  return `${toDateString(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function toLocalDateTime(date: string, time: string): string {
  return `${date}T${time}`;
}

/** "YYYY-MM-DDTHH:mm(:ss)" → { date, time } */
export function splitLocalDateTime(value: string): { date: string; time: string } {
  const [date, rest] = value.split("T");
  return { date, time: rest.slice(0, 5) };
}

/** 두 로컬 일시의 차이(분) */
export function minutesBetween(startAt: string, endAt: string): number {
  const a = splitLocalDateTime(startAt);
  const b = splitLocalDateTime(endAt);
  const [ay, am, ad] = a.date.split("-").map(Number);
  const [by, bm, bd] = b.date.split("-").map(Number);
  const dayDiff = (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 60000;
  return dayDiff + toMinutes(b.time) - toMinutes(a.time);
}

/** 예약 시간 규칙(REQ-F-003) — 시작·종료가 30분 단위이고 길이가 30분 이상 4시간 이하, 종료가 시작보다 늦어야 한다 */
export function isValidReservationPeriod(startAt: string, endAt: string): boolean {
  const start = splitLocalDateTime(startAt).time;
  const end = splitLocalDateTime(endAt).time;
  if (toMinutes(start) % 30 !== 0 || toMinutes(end) % 30 !== 0) return false;
  const length = minutesBetween(startAt, endAt);
  return length >= 30 && length <= 240;
}

/** "YYYY-MM-DDTHH:mm" → "YYYY-MM-DD HH:mm" */
export function formatDateTime(value: string): string {
  const { date, time } = splitLocalDateTime(value);
  return `${date} ${time}`;
}

/** 예약 시간 표시 — 같은 날이면 "YYYY-MM-DD HH:mm~HH:mm", 날짜가 다르면 양쪽을 모두 표시 */
export function formatRange(startAt: string, endAt: string): string {
  const start = splitLocalDateTime(startAt);
  const end = splitLocalDateTime(endAt);
  return start.date === end.date
    ? `${start.date} ${start.time}~${end.time}`
    : `${formatDateTime(startAt)} ~ ${formatDateTime(endAt)}`;
}
