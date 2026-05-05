// pages/DashboardPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
    readonly heading: Locator;
    readonly profileLink: Locator;
    readonly logoutButton: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = page.locator('h1, h2').first();
        this.profileLink = page.locator('a[href*="/profile"]').first();
        this.logoutButton = page.locator('form[action*="logout"] button[type="submit"], button[data-action*="logout"], a[href*="logout"]').first();
    }

    async goto(): Promise<void> { await this.navigate('/dashboard'); }
    async assertOnDashboard(): Promise<void> { await this.assertURLContains('dashboard'); }
    async assertWelcomeVisible(): Promise<void> { await expect(this.heading).toBeVisible(); }
    async assertLogoutVisible(): Promise<void> { await expect(this.logoutButton).toBeVisible(); }
    async assertProfileLinkVisible(): Promise<void> { await expect(this.profileLink).toBeVisible(); }
}
