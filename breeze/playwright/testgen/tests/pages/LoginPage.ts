// pages/LoginPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly rememberMeCheckbox: Locator;
    readonly submitButton: Locator;
    readonly forgotPasswordLink: Locator;
    readonly registerLink: Locator;

    constructor(page: Page) {
        super(page);
        const form = page.locator('form').first();
        this.emailInput = form.locator('input[name="email"]');
        this.passwordInput = form.locator('input[name="password"]');
        this.rememberMeCheckbox = form.locator('input[name="remember"]');
        this.submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
        this.forgotPasswordLink = page.locator('a[href*="forgot-password"], a[href*="reset-password"]').first();
        this.registerLink = page.locator('a[href*="/register"]').first();
    }

    async goto(): Promise<void> { await this.navigate('/login'); }

    async login(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async fillEmail(value: string): Promise<void> { await this.emailInput.fill(value); }
    async fillPassword(value: string): Promise<void> { await this.passwordInput.fill(value); }
    async clickSubmit(): Promise<void> { await this.submitButton.click(); }

    async assertOnLoginPage(): Promise<void> {
        await this.assertURL(/\/login/);
        await expect(this.submitButton).toBeVisible();
    }
}
