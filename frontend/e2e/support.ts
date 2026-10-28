import { expect, request, type APIRequestContext, type Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/** 회의실 관리 담당자 계정 — 생성 수단이 정해지지 않아(조건 C2) DB에서 role을 올려 둔 계정을 쓴다 */
export const MANAGER = {
  loginId: process.env.E2E_MANAGER_ID ?? "e2eprobe",
  password: process.env.E2E_MANAGER_PASSWORD ?? "x",
};

const PASSWORD = "pw-12345";

let counter = 0;
const unique = () => `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** 다른 테스트와 겹치지 않도록 먼 미래의 무작위 날짜("YYYY-MM-DD")를 돌려준다 */
export function randomFutureDate(): string {
  const year = 2040 + Math.floor(Math.random() * 20);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type Staff = { loginId: string; name: string; password: string };

/** 가입 API로 일반 직원 계정을 만든다 */
export async function createStaff(api: APIRequestContext): Promise<Staff> {
  const staff = { loginId: `e2e-${unique()}`, name: "시험직원", password: PASSWORD };
  const res = await api.post("/api/v1/auth/signup", { data: staff });
  expect(res.status()).toBe(201);
  return staff;
}

/** 관리 담당자 세션을 가진 API 컨텍스트 */
export async function managerApi(): Promise<APIRequestContext> {
  const api = await request.newContext({ baseURL: BASE_URL });
  const res = await api.post("/api/v1/auth/login", { data: MANAGER });
  expect(res.status()).toBe(200);
  return api;
}

export type Room = { meetingRoomId: number; name: string };

/** 테스트마다 새 회의실을 만들어 예약이 서로 겹치지 않게 한다 */
export async function createRoom(manager: APIRequestContext): Promise<Room> {
  const name = `E2E 회의실 ${unique()}`;
  const res = await manager.post("/api/v1/meeting-rooms", { data: { name, location: "E2E", capacity: 6, equipment: null } });
  expect(res.status()).toBe(201);
  return { ...(await res.json()).data, name };
}

/** 화면에서 로그인한다 */
export async function loginViaUi(page: Page, loginId: string, password: string) {
  await page.goto("/login");
  await page.getByTestId("field-loginId").fill(loginId);
  await page.getByTestId("field-password").fill(password);
  await page.getByTestId("submit-button").click();
  await expect(page).toHaveURL(/\/status/);
}

/** 로그인한 페이지의 세션으로 예약을 API로 만든다(사전 조건) */
export async function createReservationViaApi(
  api: APIRequestContext,
  roomId: number,
  date: string,
  start: string,
  end: string,
  title: string,
): Promise<number> {
  const res = await api.post("/api/v1/reservations", {
    data: { meetingRoomId: roomId, startAt: `${date}T${start}`, endAt: `${date}T${end}`, title },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.reservationId;
}
