// tests/auth.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage }    from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage }from '../pages/DashboardPage';
import { TEST_USER }    from '../fixtures/test-data';

// ── Login page ────────────────────────────────────────────────────
test.describe('Login page — Component', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('shows email field',           async () => { await expect(loginPage.emailInput).toBeVisible(); });
  test('shows password field',        async () => { await expect(loginPage.passwordInput).toBeVisible(); });
  test('shows submit button',         async () => { await expect(loginPage.submitButton).toBeEnabled(); });
  test('shows forgot password link',  async () => { await expect(loginPage.forgotPasswordLink).toBeVisible(); });
  test('shows remember me checkbox',  async () => { await expect(loginPage.rememberMeCheckbox).toBeVisible(); });
  test('email field is type email',   async () => { await expect(loginPage.emailInput).toHaveAttribute('type', 'email'); });
  test('password field is type password', async () => { await expect(loginPage.passwordInput).toHaveAttribute('type', 'password'); });
  test('email field is required',     async () => { await expect(loginPage.emailInput).toHaveAttribute('required'); });
  test('password field is required',  async () => { await expect(loginPage.passwordInput).toHaveAttribute('required'); });
});

test.describe('Login page — Functionality', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('shows error for invalid email format', async () => {
    await loginPage.fillEmail('not-an-email');
    await loginPage.fillPassword('password');
    await loginPage.clickSubmit();
    await loginPage.assertOnLoginPage();
  });

  test('shows error for wrong credentials', async () => {
    await loginPage.login('wrong@email.com', 'wrongpassword');
    await loginPage.assertOnLoginPage();
    await loginPage.assertErrorMessage('These credentials do not match our records.');
  });

  test('stays on login page when form is empty', async () => {
    await loginPage.clickSubmit();
    await loginPage.assertOnLoginPage();
  });
});

// ── Register page ─────────────────────────────────────────────────
test.describe('Register page — Component', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('shows name field',             async () => { await expect(registerPage.nameInput).toBeVisible(); });
  test('shows email field',            async () => { await expect(registerPage.emailInput).toBeVisible(); });
  test('shows password field',         async () => { await expect(registerPage.passwordInput).toBeVisible(); });
  test('shows confirm password field', async () => { await expect(registerPage.confirmPasswordInput).toBeVisible(); });
  test('shows register button',        async () => { await expect(registerPage.submitButton).toBeVisible(); });
  test('shows link to login page',     async () => { await expect(registerPage.loginLink).toBeVisible(); });
  test('password field is type password',
    async () => { await expect(registerPage.passwordInput).toHaveAttribute('type', 'password'); });
  test('confirm password field is type password',
    async () => { await expect(registerPage.confirmPasswordInput).toHaveAttribute('type', 'password'); });
});

test.describe('Register page — Functionality', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('shows error when passwords do not match', async () => {
    await registerPage.register('Test User', 'test@example.com', 'Password123!', 'Different!');
    await registerPage.assertOnRegisterPage();
    await registerPage.assertErrorMessage('The password field confirmation does not match.');
  });

  test('stays on register page when form is empty', async () => {
    await registerPage.clickSubmit();
    await registerPage.assertOnRegisterPage();
  });

  test('shows error for password too short', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelectorAll('input').forEach(el => el.removeAttribute('minlength'));
    });
    await registerPage.register('Test User', 'test@example.com', '123', '123');
    await registerPage.assertOnRegisterPage();
    await registerPage.assertErrorMessage('The password field must be at least 8 characters.');
  });
});

// ── Dashboard ─────────────────────────────────────────────────────
test.describe('Dashboard — Component', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await dashboardPage.assertOnDashboard();
  });

  test('shows dashboard heading',  async () => { await expect(dashboardPage.heading).toBeVisible(); });
  test('shows welcome text',        async () => { await dashboardPage.assertWelcomeVisible(); });
  test('shows logout in nav',       async () => { await dashboardPage.assertLogoutVisible(); });
  test('shows profile link in nav', async () => { await dashboardPage.assertProfileLinkVisible(); });
});

// ── Navigation ────────────────────────────────────────────────────
test.describe('Auth navigation', () => {
  test('register page links to login', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage    = new LoginPage(page);
    await registerPage.goto();
    await registerPage.loginLink.click();
    await loginPage.assertOnLoginPage();
  });

  test('unauthenticated access to dashboard redirects to login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.goto('/dashboard');
    await loginPage.assertOnLoginPage();
  });
});
