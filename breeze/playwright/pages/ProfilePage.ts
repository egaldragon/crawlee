// pages/ProfilePage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly nameInput:              Locator;
  readonly emailInput:             Locator;
  readonly saveProfileButton:      Locator;
  readonly currentPasswordInput:   Locator;
  readonly newPasswordInput:       Locator;
  readonly confirmNewPasswordInput:Locator;
  readonly savePasswordButton:     Locator;
  readonly deleteAccountButton:    Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput               = page.getByLabel('Name');
    this.emailInput              = page.getByLabel('Email');
    this.saveProfileButton       = page.getByRole('button', { name: 'Save' }).first();
    this.currentPasswordInput    = page.getByLabel('Current Password');
    this.newPasswordInput        = page.getByLabel('New Password');
    this.confirmNewPasswordInput = page.getByLabel('Confirm Password');
    this.savePasswordButton      = page.getByRole('button', { name: 'Save' }).nth(1);
    this.deleteAccountButton     = page.getByRole('button', { name: /delete account/i });
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

  async assertSavedSuccessfully(): Promise<void> {
    await expect(this.page.getByText('Saved.')).toBeVisible();
  }
}
