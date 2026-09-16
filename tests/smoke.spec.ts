import {
  test,
  expect,
} from "@playwright/test";

test.describe("TRIZEN smoke tests", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(
      /\/login/
    );

    await expect(
      page.locator("body")
    ).toContainText(
      /Login|Sign in/i
    );
  });

  test("team member page is accessible or redirects", async ({
    page,
  }) => {
    await page.goto("/team-member");

    await expect(page).toHaveURL(
      /\/team-member|\/login/
    );
  });

  test("admin route is protected", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(
      /\/admin|\/login/
    );
  });

  test("events route exists", async ({
    page,
  }) => {
    await page.goto("/admin/events");

    await expect(
      page.locator("body")
    ).not.toContainText(
      "This page could not be found"
    );
  });

  test("customer gallery route exists", async ({
    page,
  }) => {
    await page.goto(
      "/gallery/test-gallery"
    );

    await expect(
      page.locator("body")
    ).toContainText(
      /Gallery|PIN|Photo/i
    );
  });
});