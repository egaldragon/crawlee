// pages/RegisterPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly submitButton: Locator;
    readonly loginLink: Locator;

    constructor(page: Page) {
        super(page);
        const form = page.locator('form').first();
        this.nameInput = form.locator('input[name="name"]');
        this.emailInput = form.locator('input[name="email"]');
        this.passwordInput = form.locator('input[name="password"]');
        this.confirmPasswordInput = form.locator('input[name="password_confirmation"]');
        this.submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
        this.loginLink = page.locator('a[href*="/login"]').first();
    }

    async goto(): Promise<void> { await this.navigate('/register'); }

    async register(name: string, email: string, password: string, confirmPassword = password): Promise<void> {
        await this.nameInput.fill(name);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.confirmPasswordInput.fill(confirmPassword);
        await this.submitButton.click();
    }

    async clickSubmit(): Promise<void> { await this.submitButton.click(); }

    async assertOnRegisterPage(): Promise<void> {
        await this.assertURL(/\/register/);
        await expect(this.submitButton).toBeVisible();
    }
}
