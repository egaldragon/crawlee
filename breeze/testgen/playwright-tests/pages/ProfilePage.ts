// pages/ProfilePage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly saveProfileButton: Locator;
    readonly currentPasswordInput: Locator;
    readonly newPasswordInput: Locator;
    readonly confirmNewPasswordInput: Locator;
    readonly savePasswordButton: Locator;
    readonly deleteAccountButton: Locator;

    constructor(page: Page) {
        super(page);
        this.nameInput = page.locator('input[name="name"]').first();
        this.emailInput = page.locator('input[name="email"]').first();
        this.saveProfileButton = page.locator('button[type="submit"], input[type="submit"]').first();
        this.currentPasswordInput = page.locator('input[name="current_password"]').first();
        this.newPasswordInput = page.locator('input[name="password"]').nth(1);
        this.confirmNewPasswordInput = page.locator('input[name="password_confirmation"]').first();
        this.savePasswordButton = page.locator('button[type="submit"], input[type="submit"]').nth(1);
        this.deleteAccountButton = page.locator('button[data-confirm], form[action*="delete"] button[type="submit"], button[type="submit"][form*="delete"]').first();
    }

    async goto(): Promise<void> { await this.navigate('/profile'); }

    async updateName(name: string): Promise<void> {
        await this.nameInput.clear();
        await this.nameInput.fill(name);
        await this.saveProfileButton.click();
    }

    async updateEmail(email: string): Promise<void> {
        await this.emailInput.clear();
        await this.emailInput.fill(email);
        await this.saveProfileButton.click();
    }

    async updateProfile(name: string, email: string): Promise<void> {
        await this.nameInput.clear();
        await this.nameInput.fill(name);
        await this.emailInput.clear();
        await this.emailInput.fill(email);
        await this.saveProfileButton.click();
    }

    async updatePassword(current: string, next: string, confirm: string): Promise<void> {
        await this.currentPasswordInput.fill(current);
        await this.newPasswordInput.fill(next);
        await this.confirmNewPasswordInput.fill(confirm);
        await this.savePasswordButton.click();
    }

    async assertOnProfilePage(): Promise<void> {
        await this.assertURLContains('profile');
        await expect(this.nameInput).toBeVisible();
    }
}
