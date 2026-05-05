// tests/profile.spec.ts

import { test, expect } from '@playwright/test';
import { ProfilePage } from '../pages/ProfilePage';
import { TEST_USER }   from '../fixtures/test-data';

// ── Component ───────────────────────────────────────────────────
test.describe('Profile page — Component', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('shows name field',                async () => { await expect(profilePage.nameInput).toBeVisible(); });
  test('shows email field',               async () => { await expect(profilePage.emailInput).toBeVisible(); });
  test('shows save profile button',       async () => { await expect(profilePage.saveProfileButton).toBeVisible(); });
  test('name field is required',          async () => { await expect(profilePage.nameInput).toHaveAttribute('required'); });
  test('email field is type email',       async () => { await expect(profilePage.emailInput).toHaveAttribute('type', 'email'); });
  test('shows current password field',    async () => { await expect(profilePage.currentPasswordInput).toBeVisible(); });
  test('current password is type password', async () => { await expect(profilePage.currentPasswordInput).toHaveAttribute('type', 'password'); });
  test('shows delete account button',     async () => { await expect(profilePage.deleteAccountButton).toBeVisible(); });
  test('email field shows logged-in user email', async () => { await expect(profilePage.emailInput).toHaveValue(TEST_USER.email); });
});

// ── Update profile ────────────────────────────────────────────────
test.describe('Profile page — Functionality', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('saves new name successfully', async () => {
    await profilePage.updateName('Updated Name');
    await expect(profilePage.nameInput).toHaveValue('Updated Name');
    await profilePage.updateName(TEST_USER.name);
  });

  test('name field reflects new value after save', async () => {
    await profilePage.updateName('Name After Update');
    await expect(profilePage.nameInput).toHaveValue('Name After Update');
    await profilePage.updateName(TEST_USER.name);
  });

  test('shows error when name is cleared', async () => {
    await profilePage.updateName('');
    await profilePage.assertOnProfilePage();
  });

  test('shows error for invalid email format', async () => {
    await profilePage.updateEmail('not-an-email');
    await profilePage.assertOnProfilePage();
  });

  test('save button is enabled', async () => {
    await expect(profilePage.saveProfileButton).toBeEnabled();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: '.auth/user.json' });
    const page    = await context.newPage();
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.updateProfile(TEST_USER.name, TEST_USER.email);
    await context.close();
  });
});

// ── Update password ───────────────────────────────────────────────
test.describe('Profile page — Functionality', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('shows new password field',          async () => { await expect(profilePage.newPasswordInput).toBeVisible(); });
  test('shows confirm password field',      async () => { await expect(profilePage.confirmNewPasswordInput).toBeVisible(); });
  test('new password field is type password', async () => { await expect(profilePage.newPasswordInput).toHaveAttribute('type', 'password'); });

  test('shows error when passwords do not match', async () => {
    await profilePage.updatePassword(TEST_USER.password, 'NewPass123!', 'Different456!');
    await profilePage.assertOnProfilePage();
    await expect(profilePage.currentPasswordInput).toBeVisible();
  });

  test('shows error for incorrect current password', async () => {
    await profilePage.updatePassword('wrongpassword', 'NewPass123!', 'NewPass123!');
    await profilePage.assertOnProfilePage();
    await expect(profilePage.currentPasswordInput).toBeVisible();
  });

  test('save password button is enabled', async () => {
    await expect(profilePage.savePasswordButton).toBeEnabled();
  });
});
