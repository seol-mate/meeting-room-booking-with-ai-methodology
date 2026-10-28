import { expect, test } from "@playwright/test";
import { createStaff, loginViaUi, MANAGER } from "./support";

test.describe("회의실 도메인·접근 차단 E2E", () => {
  // @trace REQ-F-007 | SCR-MTR-001, SCR-MTR-002, SCR-RSV-004
  test("관리 담당자가 회의실을 등록하면 목록과 예약 화면에 나타난다", async ({ page }) => {
    const name = `E2E 신규 ${Date.now().toString(36)}`;

    await loginViaUi(page, MANAGER.loginId, MANAGER.password);
    await page.goto("/admin/rooms");
    await page.getByRole("link", { name: "신규 등록" }).click();
    await page.getByTestId("field-name").fill(name);
    await page.getByTestId("field-location").fill("별관 1층");
    await page.getByTestId("field-capacity").fill("10");
    await page.getByTestId("field-equipment").fill("모니터");
    await page.getByTestId("submit-button").click();

    await expect(page).toHaveURL(/\/admin\/rooms$/);
    await expect(page.locator('[data-testid^="room-row-"]', { hasText: name })).toContainText("별관 1층");

    await page.goto("/reservations/new");
    await expect(page.getByTestId("field-room").locator("option", { hasText: name })).toHaveCount(1);
  });

  // @trace REQ-F-007 | SCR-MTR-001
  test("일반 직원은 회의실 관리 화면에 들어갈 수 없다", async ({ page, request }) => {
    const staff = await createStaff(request);

    await loginViaUi(page, staff.loginId, staff.password);
    await page.goto("/admin/rooms");

    await expect(page.getByTestId("forbidden")).toHaveText(/이 화면에 접근할 권한이 없습니다/);
    await expect(page.locator('[data-testid^="room-row-"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "회의실 관리" })).toHaveCount(0);
  });

  // @trace REQ-NF-001 | SCR-RSV-003
  test("로그인하지 않으면 보호 화면 대신 로그인 화면으로 이동한다", async ({ page }) => {
    await page.goto("/status");

    await expect(page).toHaveURL(/\/login\?reason=required/);
    await expect(page.getByTestId("notice")).toHaveText("로그인이 필요합니다.");
    await expect(page.locator('[data-testid^="cell-"]')).toHaveCount(0);
  });
});
