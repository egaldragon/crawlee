// pages/PostPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PostPage extends BasePage {
  readonly createButton: Locator;
  readonly postsTable:  Locator;
  readonly tableRows:    Locator;
  readonly titleInput: Locator;
  readonly textInput: Locator;
  readonly categorySelect: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.createButton = page.getByRole('link', { name: /create|add/i });
    this.postsTable   = page.locator('table');
    this.tableRows     = page.locator('table tbody tr');
    this.titleInput         = page.getByLabel('Title');
    this.textInput          = page.getByLabel('Text');
    this.categorySelect     = page.getByLabel('Category');
    this.submitButton  = page.getByRole('button', { name: /save|create|submit/i });
  }

  async gotoIndex(): Promise<void>  { await this.navigate('/posts'); }
  async gotoCreate(): Promise<void> { await this.navigate('/posts/create'); }
  async clickSubmit(): Promise<void> { await this.submitButton.click(); }

  async fillTitle(value: string): Promise<void> {
    await this.titleInput.fill(value);
  }
  async fillText(value: string): Promise<void> {
    await this.textInput.fill(value);
  }
  async fillCategoryId(value: string): Promise<void> {
    await this.categorySelect.selectOption({ label: value });
  }

  async createPost(title: string, text: string, categoryId?: string): Promise<void> {
    await this.gotoCreate();
    await this.fillTitle(title);
    await this.fillText(text);
    if (categoryId) await this.fillCategoryId(categoryId);
    await this.clickSubmit();
  }

  async editPostByName(current: string, title: string, text: string): Promise<void> {
    const row = this.page.locator('table tbody tr').filter({ hasText: current });
    await row.getByRole('link', { name: /edit/i }).click();
    await this.titleInput.clear();
    await this.titleInput.fill(title);
    await this.textInput.clear();
    await this.textInput.fill(text);
    await this.clickSubmit();
  }

  async deletePostByName(name: string): Promise<void> {
    const row = this.page.locator('table tbody tr').filter({ hasText: name });
    this.page.once('dialog', d => d.accept());
    await row.getByRole('button', { name: /delete/i }).click();
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
  async assertTitleInputVisible(): Promise<void> {
    await expect(this.titleInput).toBeVisible();
  }
  async assertTitleRequired(): Promise<void> {
    await expect(this.titleInput).toHaveAttribute('required');
  }
  async assertTextInputVisible(): Promise<void> {
    await expect(this.textInput).toBeVisible();
  }
  async assertCategorySelectVisible(): Promise<void> {
    if (await this.categorySelect.isVisible()) {
      await expect(this.categorySelect).toBeVisible();
    }
  }
  async assertSubmitButtonVisible(): Promise<void> {
    await expect(this.submitButton).toBeVisible();
  }
  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }
}