import { describe, expect, it } from "vitest";
import { addDays, formatRange, halfHours, isValidReservationPeriod, minutesBetween } from "./time";

// @trace REQ-F-003 | SCR-RSV-004 V-SCR-RSV-004-01
describe("예약 시간 규칙", () => {
  it.each([
    ["2026-11-02T09:00", "2026-11-02T09:30", true],
    ["2026-11-02T09:00", "2026-11-02T13:00", true],
    ["2026-11-02T09:00", "2026-11-02T13:30", false],
    ["2026-11-02T09:00", "2026-11-02T09:00", false],
    ["2026-11-02T10:00", "2026-11-02T09:30", false],
    ["2026-11-02T09:10", "2026-11-02T10:00", false],
  ])("isValidReservationPeriod(%s, %s) = %s", (start, end, expected) => {
    expect(isValidReservationPeriod(start, end)).toBe(expected);
  });
});

// @trace — | PGM-CMM-002 (날짜·시각 도구 — 화면 통합 5-IM-11 공통 유틸)
describe("날짜·시각 도구", () => {
  it("halfHours는 시작 포함·끝 미포함으로 30분 단위를 만든다", () => {
    expect(halfHours(9, 11)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("addDays는 월·연 경계를 넘는다", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("minutesBetween은 날짜가 달라도 분 차이를 구한다", () => {
    expect(minutesBetween("2026-11-02T23:30", "2026-11-03T00:30")).toBe(60);
  });

  it("formatRange는 같은 날이면 종료 시각만 붙인다", () => {
    expect(formatRange("2026-11-02T09:30", "2026-11-02T11:00")).toBe("2026-11-02 09:30~11:00");
  });
});
