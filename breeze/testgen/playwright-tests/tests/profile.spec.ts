// tests/profile.spec.ts

import { test, expect } from '@playwright/test';
import { ProfilePage } from '../pages/ProfilePage';
import { TEST_USER } from '../fixtures/test-data';

test.describe('Profile page — Component', () => {
    let profilePage: ProfilePage;

    test.beforeEach(async ({ page }) => {
        profilePage = new ProfilePage(page);
        await profilePage.goto();
    });

    test('shows name field', async () => { await expect(profilePage.nameInput).toBeVisible(); });
    test('shows email field', async () => { await expect(profilePage.emailInput).toBeVisible(); });
    test('shows save profile button', async () => { await expect(profilePage.saveProfileButton).toBeVisible(); });
    test('email field shows logged-in user email', async () => { await expect(profilePage.emailInput).toHaveValue(TEST_USER.email); });
});

test.describe('Profile page — Functionality', () => {
    let profilePage: ProfilePage;

    test.beforeEach(async ({ page }) => {
        profilePage = new ProfilePage(page);
        await profilePage.goto();
    });

    test('save button is enabled', async () => {
        await expect(profilePage.saveProfileButton).toBeEnabled();
    });
});
