// pages/BasePage.ts

import { Page, expect } from '@playwright/test';

export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigate(path: string): Promise<void> {
        await this.page.goto(path);
    }

    async assertURL(pattern: string | RegExp): Promise<void> {
        await expect(this.page).toHaveURL(pattern);
    }

    async assertURLContains(segment: string): Promise<void> {
        await expect(this.page).toHaveURL(new RegExp(segment));
    }

    async assertErrorMessage(message: string): Promise<void> {
        await expect(
            this.page.locator('.text-red-600, .text-red-500, [class*="error"], .alert-danger')
                .filter({ hasText: message })
        ).toBeVisible();
    }
}
