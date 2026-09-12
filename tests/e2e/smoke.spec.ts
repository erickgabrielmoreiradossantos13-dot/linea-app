import { test, expect } from "@playwright/test";

test("demo dashboard exposes commercial outcomes", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Una visión clara de tu negocio." })).toBeVisible();
  await expect(page.getByText("Acciones de contacto", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver todos", exact: true })).toBeVisible();
});

test("lead list is reachable", async ({ page }) => {
  await page.goto("/leads");
  await expect(page.getByRole("heading", { name: "Contactos" })).toBeVisible();
  await expect(page.getByText("María López")).toBeVisible();
});

test("content opens the visual editor with responsive canvas controls", async ({ page }) => {
  await page.goto("/content");
  await expect(page).toHaveURL(/\/site\/[0-9a-f-]+\/edit$/);
  await expect(page.getByRole("toolbar", { name: "Herramientas del editor" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Una sonrisa que habla de ti" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Vista móvil" })).toBeVisible();
});
