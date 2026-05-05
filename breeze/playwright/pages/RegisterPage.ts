// pages/RegisterPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  readonly nameInput:            Locator;
  readonly emailInput:           Locator;
  readonly passwordInput:        Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton:         Locator;
  readonly loginLink:            Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput            = page.getByLabel('Name');
    this.emailInput           = page.getByLabel('Email');
    this.passwordInput        = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm Password');
    this.submitButton         = page.getByRole('button', { name: /register/i });
    this.loginLink            = page.getByRole('link', { name: /already registered|login|sign in/i });
  }

  async goto(): Promise<void> { await this.navigate('/register'); }

  async register(
    name: string, email: string, password: string, confirmPassword = password
  ): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }

  async fillName(v: string): Promise<void>            { await this.nameInput.fill(v); }
  async fillEmail(v: string): Promise<void>           { await this.emailInput.fill(v); }
  async fillPassword(v: string): Promise<void>        { await this.passwordInput.fill(v); }
  async fillConfirmPassword(v: string): Promise<void> { await this.confirmPasswordInput.fill(v); }
  async clickSubmit(): Promise<void>                  { await this.submitButton.click(); }

  async assertOnRegisterPage(): Promise<void> {
    await this.assertURL(/\/register/);
    await expect(this.submitButton).toBeVisible();
  }
}
