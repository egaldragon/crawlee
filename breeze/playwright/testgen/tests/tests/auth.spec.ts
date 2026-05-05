// tests/auth.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TEST_USER } from '../fixtures/test-data';

test.describe('Login page — Component', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('shows email field', async () => { await expect(loginPage.emailInput).toBeVisible(); });
    test('shows password field', async () => { await expect(loginPage.passwordInput).toBeVisible(); });
    test('shows submit button', async () => { await expect(loginPage.submitButton).toBeEnabled(); });
    test('email field is type email', async () => { await expect(loginPage.emailInput).toHaveAttribute('type', 'email'); });
    test('password field is type password', async () => { await expect(loginPage.passwordInput).toHaveAttribute('type', 'password'); });
});

test.describe('Login page — Functionality', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('shows error for wrong credentials', async () => {
        await loginPage.login('wrong@email.com', 'wrongpassword');
        await loginPage.assertOnLoginPage();
    });

    test('stays on login page when form is empty', async () => {
        await loginPage.clickSubmit();
        await loginPage.assertOnLoginPage();
    });
});

test.describe('Register page — Component', () => {
    let registerPage: RegisterPage;

    test.beforeEach(async ({ page }) => {
        registerPage = new RegisterPage(page);
        await registerPage.goto();
    });

    test('shows name field', async () => { await expect(registerPage.nameInput).toBeVisible(); });
    test('shows email field', async () => { await expect(registerPage.emailInput).toBeVisible(); });
    test('shows password field', async () => { await expect(registerPage.passwordInput).toBeVisible(); });
    test('shows confirm password field', async () => { await expect(registerPage.confirmPasswordInput).toBeVisible(); });
});

test.describe('Dashboard — Component', () => {
    let dashboardPage: DashboardPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        await loginPage.goto();
        await loginPage.login(TEST_USER.email, TEST_USER.password);
        await dashboardPage.assertOnDashboard();
    });

    test('shows dashboard heading', async () => { await dashboardPage.assertWelcomeVisible(); });
});
