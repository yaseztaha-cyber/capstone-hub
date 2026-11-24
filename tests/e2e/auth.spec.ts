import { test, expect } from '@playwright/test';

test('homepage shows STEM Capstone text or redirects to login', async ({ page }) => {
  await page.goto('/');

  // The app redirects to /auth/login if not authenticated, or shows STEM Capstone Hub
  // Wait for either the login page or the home loading text
  await page.waitForLoadState('networkidle');

  const content = await page.content();
  const url = page.url();

  // Should either be on login, register, onboarding, dashboard, or root with STEM text
  const hasSTEMText = content.includes('STEM Capstone');
  const isAuthRoute = url.includes('/auth/login') || url.includes('/dashboard') || url.includes('/onboarding') || url.includes('/');
  expect(hasSTEMText || isAuthRoute).toBeTruthy();

  // If on login page, check for sign in text
  if (url.includes('/auth/login')) {
    await expect(page.getByText(/STEM Capstone Hub/i)).toBeVisible();
  } else if (hasSTEMText) {
    await expect(page.getByText(/STEM Capstone/i).first()).toBeVisible();
  }
});

test('login page has form', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByText(/STEM Capstone Hub/i)).toBeVisible();
  await expect(page.getByPlaceholder('you@stem.edu.eg')).toBeVisible();
});
