// pages/LoginPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput:         Locator;
  readonly passwordInput:      Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton:       Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink:       Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput         = page.getByLabel('Email');
    this.passwordInput      = page.getByLabel('Password');
    this.rememberMeCheckbox = page.getByLabel('Remember Me');
    this.submitButton       = page.getByRole('button', { name: /log in/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot/i });
    this.registerLink       = page.getByRole('link', { name: /register/i });
  }

  async goto(): Promise<void> { await this.navigate('/login'); }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async fillEmail(email: string): Promise<void>       { await this.emailInput.fill(email); }
  async fillPassword(pw: string): Promise<void>        { await this.passwordInput.fill(pw); }
  async clickSubmit(): Promise<void>                   { await this.submitButton.click(); }

  async assertOnLoginPage(): Promise<void> {
    await this.assertURL(/\/login/);
    await expect(this.submitButton).toBeVisible();
  }
}
