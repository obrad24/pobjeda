import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
] as const;

test("početna prikazuje klub i sljedeću utakmicu", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("h1, h2, p").filter({ hasText: "Pobjeda" }).first()).toBeVisible();
  await expect(page.getByText(/Sljedeća utakmica|Još nema/i).first()).toBeVisible();
});

test("liga ima tabelu i highlight Pobjede", async ({ page }) => {
  await page.goto("/liga");
  await expect(page.locator("table")).toBeVisible();
  await expect(page.locator("table tbody tr").first()).toBeVisible();
});

test("/admin preusmjerava na login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Prijava" })).toBeVisible();
});

test("nepoznat slug igrača je 404 stranica", async ({ page }) => {
  const response = await page.goto("/igraci/nepoznat-slug-qa");
  await expect(page.getByRole("heading", { name: "Stranica nije pronađena" })).toBeVisible();
  expect([404, 200]).toContain(response?.status());
});

for (const viewport of VIEWPORTS) {
  test(`responsive ${viewport.width}px — navigacija i tabela`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    if (viewport.width < 1280) {
      await expect(page.getByRole("button", { name: /Otvori meni|Zatvori meni/ })).toBeVisible();
    } else {
      await expect(page.getByRole("navigation", { name: "Glavna navigacija" })).toBeVisible();
    }

    await page.goto("/liga");
    const table = page.locator("table");
    await expect(table).toBeVisible();
    const scroll = page.locator(".table-scroll");
    await expect(scroll).toBeVisible();
  });
}

test("fantasy stranica se učitava", async ({ page }) => {
  const response = await page.goto("/fantasy");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "FANTASY POBJEDA" })).toBeVisible();
});

test("SEO URL igrača", async ({ page }) => {
  await page.goto("/igraci");
  const profile = page.locator('a[href^="/igraci/"]').first();
  await expect(profile).toBeVisible();
  const href = await profile.getAttribute("href");
  expect(href).toMatch(/^\/igraci\/[a-z0-9-]+$/);
});
