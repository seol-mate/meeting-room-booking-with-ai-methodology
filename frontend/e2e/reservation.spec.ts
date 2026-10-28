import { expect, test } from "@playwright/test";
import { createReservationViaApi, createRoom, createStaff, loginViaUi, managerApi, randomFutureDate } from "./support";

test.describe("예약 도메인 E2E", () => {
  // @trace REQ-F-001, REQ-F-002 | SCR-RSV-002, SCR-RSV-001, SCR-RSV-003
  test("계정을 만들고 로그인하면 예약 현황이 열린다", async ({ page }) => {
    const loginId = `e2e-join-${Date.now().toString(36)}`;

    await page.goto("/join");
    await page.getByTestId("field-loginId").fill(loginId);
    await page.getByTestId("field-name").fill("가입시험");
    await page.getByTestId("field-password").fill("pw-12345");
    await page.getByTestId("submit-button").click();

    await expect(page).toHaveURL(/\/login\?joined=1/);
    await expect(page.getByTestId("notice")).toHaveText("계정이 만들어졌습니다. 로그인해 주세요.");

    // 이전 화면(가입)이 숨겨진 채 남아 있을 수 있어 보이는 요소만 고른다
    await page.locator('[data-testid="field-loginId"]:visible').fill(loginId);
    await page.locator('[data-testid="field-password"]:visible').fill("pw-12345");
    await page.locator('[data-testid="submit-button"]:visible').click();

    await expect(page).toHaveURL(/\/status/);
    await expect(page.getByRole("heading", { name: "예약 현황" })).toBeVisible();
  });

  // @trace REQ-F-001 | SCR-RSV-001
  test("잘못된 비밀번호로는 로그인되지 않고 입력한 ID가 남는다", async ({ page, request }) => {
    const staff = await createStaff(request);

    await page.goto("/login");
    await page.getByTestId("field-loginId").fill(staff.loginId);
    await page.getByTestId("field-password").fill("wrong-password");
    await page.getByTestId("submit-button").click();

    await expect(page.getByTestId("form-error")).toHaveText("로그인 정보가 올바르지 않습니다.");
    await expect(page.getByTestId("field-loginId")).toHaveValue(staff.loginId);
    await expect(page).toHaveURL(/\/login/);
  });

  // @trace REQ-F-003, REQ-F-002 | SCR-RSV-004, SCR-RSV-005, SCR-RSV-003
  test("회의실을 예약하면 내 예약과 예약 현황에 반영된다", async ({ page, request }) => {
    const manager = await managerApi();
    const room = await createRoom(manager);
    const staff = await createStaff(request);
    const date = randomFutureDate();
    const title = `E2E 예약 ${Date.now().toString(36)}`;

    await loginViaUi(page, staff.loginId, staff.password);
    await page.goto("/reservations/new");
    await page.getByTestId("field-room").selectOption(String(room.meetingRoomId));
    await page.getByTestId("field-date").fill(date);
    await page.getByTestId("field-start").selectOption("10:00");
    await page.getByTestId("field-end").selectOption("11:00");
    await page.getByTestId("field-title").fill(title);
    await page.getByTestId("submit-button").click();

    await expect(page).toHaveURL(/\/my-reservations/);
    await expect(page.locator('[data-testid^="row-"]', { hasText: title })).toContainText("예약됨");

    await page.goto(`/status?date=${date}`);
    await expect(page.getByTestId(`cell-${room.meetingRoomId}-10:00`)).toContainText(`예약됨 · ${staff.name} · ${title}`);
    await expect(page.getByTestId(`cell-${room.meetingRoomId}-11:00`)).toHaveText("비어 있음");
    await manager.dispose();
  });

  // @trace REQ-F-004 | SCR-RSV-004
  test("겹치는 시간은 예약되지 않고 이미 예약됨을 안내한다", async ({ page, request }) => {
    const manager = await managerApi();
    const room = await createRoom(manager);
    const staff = await createStaff(request);
    const date = randomFutureDate();

    await loginViaUi(page, staff.loginId, staff.password);
    await createReservationViaApi(page.request, room.meetingRoomId, date, "10:00", "11:00", "기존 예약");

    await page.goto("/reservations/new");
    await page.getByTestId("field-room").selectOption(String(room.meetingRoomId));
    await page.getByTestId("field-date").fill(date);
    await page.getByTestId("field-start").selectOption("10:30");
    await page.getByTestId("field-end").selectOption("11:30");
    await page.getByTestId("submit-button").click();

    await expect(page.getByTestId("end-error")).toHaveText("이미 예약된 시간입니다.");
    await expect(page).toHaveURL(/\/reservations\/new/);
    await manager.dispose();
  });

  // @trace REQ-F-005 | SCR-RSV-005, SCR-RSV-003
  test("내 예약을 취소하면 취소됨으로 남고 그 시간은 현황에서 비어 있다", async ({ page, request }) => {
    const manager = await managerApi();
    const room = await createRoom(manager);
    const staff = await createStaff(request);
    const date = randomFutureDate();

    await loginViaUi(page, staff.loginId, staff.password);
    const id = await createReservationViaApi(page.request, room.meetingRoomId, date, "14:00", "15:00", "취소할 예약");

    await page.goto("/my-reservations");
    await page.getByTestId(`cancel-${id}`).click();
    await page.getByTestId("confirm-cancel").click();

    await expect(page.getByTestId(`row-${id}`)).toContainText("취소됨");
    await expect(page.getByTestId(`cancel-${id}`)).toHaveCount(0);

    await page.goto(`/status?date=${date}`);
    await expect(page.getByTestId(`cell-${room.meetingRoomId}-14:00`)).toHaveText("비어 있음");
    await manager.dispose();
  });
});
