// pages/PostPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PostPage extends BasePage {
    readonly createButton: Locator;
    readonly postsTable: Locator;
    readonly tableRows: Locator;
  readonly titleInput: Locator;
  readonly textInput: Locator;
  readonly categoryIdInput: Locator;
  readonly submitButton: Locator;

    constructor(page: Page) {
        super(page);
        this.createButton = page.locator('a[href*="/create"], a[href$="create"], a[href*="/new"]').first();
        this.postsTable = page.locator('table').first();
        this.tableRows = page.locator('table tbody tr');
    this.titleInput = page.locator('[name="title"]').first();
    this.textInput = page.locator('[name="text"]').first();
    this.categoryIdInput = page.locator('[name="category_id"]').first();
    this.submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
    }

    async gotoIndex(): Promise<void> { await this.navigate('/posts'); }
    async gotoCreate(): Promise<void> { await this.navigate('/posts/create'); }
    async clickSubmit(): Promise<void> { await this.submitButton.click(); }

  async fillTitle(value: string): Promise<void> {
    await this.titleInput.fill(value);
  }

  async fillText(value: string): Promise<void> {
    await this.textInput.fill(value);
  }

  async fillCategoryId(value: string): Promise<void> {
    await this.categoryIdInput.selectOption({ label: value });
  }

  async createPost(data: Record<string, string>): Promise<void> {
        await this.gotoCreate();
    if (data['title'] !== undefined) await this.fillTitle(data['title']);
    if (data['text'] !== undefined) await this.fillText(data['text']);
    if (data['category_id'] !== undefined) await this.fillCategoryId(data['category_id']);
        await this.clickSubmit();
    }

    async editPostByName(current: string, data: Record<string, string>): Promise<void> {
        const row = this.page.locator('table tbody tr').filter({ hasText: current });
        await row.locator('a[href*="/edit"], a[href*="edit"]').first().click();
    if (data['title'] !== undefined) {
      await this.titleInput.clear();
      await this.fillTitle(data['title']);
    }
    if (data['text'] !== undefined) {
      await this.textInput.clear();
      await this.fillText(data['text']);
    }
    if (data['category_id'] !== undefined) {
      await this.categoryIdInput.clear();
      await this.fillCategoryId(data['category_id']);
    }
        await this.clickSubmit();
    }

    async deletePostByName(name: string): Promise<void> {
        const row = this.page.locator('table tbody tr').filter({ hasText: name });
        this.page.once('dialog', (d) => d.accept());
        await row.locator('form button[type="submit"], button[data-action*="delete"], button[type="submit"]').first().click();
    }

    async assertOnIndexPage(): Promise<void> {
        await this.assertURLContains('posts');
        await expect(this.postsTable).toBeVisible();
    }

    async assertOnCreatePage(): Promise<void> {
        await this.assertURLContains('posts/create');
    await expect(this.titleInput).toBeVisible();
    }

    async assertPostExists(value: string): Promise<void> {
        await expect(this.page.locator('table').getByText(value)).toBeVisible();
    }

    async assertPostNotExists(value: string): Promise<void> {
        await expect(this.page.locator('table').getByText(value)).not.toBeVisible();
    }

    async assertTableVisible(): Promise<void> {
        await expect(this.postsTable).toBeVisible();
    }

    async assertCreateButtonVisible(): Promise<void> {
        await expect(this.createButton).toBeVisible();
    }

  async assertTitleVisible(): Promise<void> {
    await expect(this.titleInput).toBeVisible();
  }
  async assertTitleRequired(): Promise<void> {
    await expect(this.titleInput).toHaveAttribute('required');
  }

  async assertTextVisible(): Promise<void> {
    await expect(this.textInput).toBeVisible();
  }

  async assertCategoryidVisible(): Promise<void> {
    await expect(this.categoryIdInput).toBeVisible();
  }

  async assertSubmitButtonVisible(): Promise<void> {
        await expect(this.submitButton).toBeVisible();
    }

    async getRowCount(): Promise<number> {
        return this.tableRows.count();
    }
}
