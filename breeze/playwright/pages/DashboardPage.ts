// pages/DashboardPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly heading:            Locator;
  readonly navDropdownTrigger: Locator;
  readonly logoutLink:         Locator;
  readonly profileLink:        Locator;

  constructor(page: Page) {
    super(page);
    this.heading            = this.page.getByRole('heading', { name: /dashboard/i });
    this.navDropdownTrigger = this.page.locator('nav button').filter({ hasText: /./i }).first();
    this.logoutLink         = this.page.getByRole('link', { name: /log out/i });
    this.profileLink        = this.page.getByRole('link', { name: /^profile$/i });
  }

  async assertOnDashboard(): Promise<void> {
    await this.assertURL(/\/dashboard/);
  }

  async assertWelcomeVisible(): Promise<void> {
    await expect(this.page.getByText(/you're logged in|welcome/i)).toBeVisible();
  }

  async assertLogoutVisible(): Promise<void> {
    await this.navDropdownTrigger.click();
    await expect(this.logoutLink).toBeVisible();
  }

  async assertProfileLinkVisible(): Promise<void> {
    await this.navDropdownTrigger.click();
    await expect(this.profileLink).toBeVisible();
  }
}
