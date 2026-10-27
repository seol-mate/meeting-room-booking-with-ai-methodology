/** 예약 시각은 30분 단위다 (REQ-F-003, C-CMN-05). */

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
