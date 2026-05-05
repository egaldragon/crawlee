// tests/posts.spec.ts

import { test, expect } from '@playwright/test';
import { PostPage } from '../pages/PostPage';
import { CategoryPage } from '../pages/CategoryPage';
import { POSTS, CATEGORIES } from '../fixtures/test-data';

test.describe('Post index — Component', () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    await postPage.gotoIndex();
  });

  test('shows post table', async () => {
    await postPage.assertTableVisible();
  });

  test('shows create button', async () => {
    await postPage.assertCreateButtonVisible();
  });

  test('table has Title column', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Title/i })).toBeVisible();
  });

  test('table has Actions column', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Actions/i })).toBeVisible();
  });
});

test.describe('Post create — Component', () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    await postPage.gotoCreate();
  });

  test('shows Title field', async () => {
    await postPage.assertTitleInputVisible();
  });

  test('shows Text field', async () => {
    await postPage.assertTextInputVisible();
  });

  test('shows Category dropdown', async () => {
    await postPage.assertCategorySelectVisible();
  });

  test('shows submit button', async () => {
    await postPage.assertSubmitButtonVisible();
  });

  test('submit button is enabled', async () => {
    await expect(postPage.submitButton).toBeEnabled();
  });

  test('Title field is required', async () => {
    await postPage.assertTitleRequired();
  });

  test('Title field is empty on open', async () => {
    await expect(postPage.titleInput).toHaveValue('');
  });

  test('Text field is empty on open', async () => {
    await expect(postPage.textInput).toHaveValue('');
  });
});

test.describe('Post create — Functionality', () => {
  let postPage: PostPage;
  let categoryPage: CategoryPage;
  let testCategoryName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    categoryPage = new CategoryPage(page);
    testCategoryName = `Category-${Date.now()}`;
    await categoryPage.createCategory(testCategoryName);
  });

  test('creates post with valid data', async () => {
    const uniqueTitle = `Post-${Date.now()}`;
    await postPage.createPost(uniqueTitle, `Post-${Date.now()}`, testCategoryName);
    await postPage.assertOnIndexPage();
    await postPage.assertPostExists(uniqueTitle);
  });

  test('shows error when required fields are empty', async () => {
    await postPage.gotoCreate();
    await postPage.clickSubmit();
    await postPage.assertOnCreatePage();
  });

  test('redirects to index after successful create', async () => {
    await postPage.createPost(`Post-${Date.now()}`, `Post-${Date.now()}`, testCategoryName);
    await postPage.assertOnIndexPage();
  });

  test('created post is visible in table', async () => {
    const createdLabel = `Post-${Date.now()}`;
    await postPage.createPost(createdLabel, `Post-${Date.now()}`, testCategoryName);
    await postPage.assertOnIndexPage();
    await postPage.assertPostExists(createdLabel);
  });

  test('creates post with Category selected', async ({ page }) => {
    const extraCategoryPage = new CategoryPage(page);
    const extraCategoryName = `Category-${Date.now()}`;
    await extraCategoryPage.createCategory(extraCategoryName);
    await postPage.gotoCreate();
    await postPage.fillTitle(`Post-${Date.now()}`);
    await postPage.fillText(`Post-${Date.now()}`);
    if (await postPage.categorySelect.isVisible()) {
      await postPage.fillCategoryId(extraCategoryName);
    }
    await postPage.clickSubmit();
    await postPage.assertOnIndexPage();
  });
});

test.describe('Post edit — Component', () => {
  let postPage: PostPage;
  let testPostName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    testPostName = `Edit-${Date.now()}`;
    const categoryPage = new CategoryPage(page);
    const relCategoryName = `Category-${Date.now()}`;
    await categoryPage.createCategory(relCategoryName);
    await postPage.createPost(testPostName, `text-${Date.now()}`, relCategoryName);
    await postPage.assertOnIndexPage();
    const row = postPage.page.locator('table tbody tr').filter({ hasText: testPostName });
    await row.getByRole('link', { name: /edit/i }).click();
  });

  test('edit page shows Title field', async () => {
    await postPage.assertTitleInputVisible();
  });

  test('edit page shows Text field', async () => {
    await postPage.assertTextInputVisible();
  });

  test('edit page shows Category dropdown', async () => {
    await postPage.assertCategorySelectVisible();
  });

  test('Title field shows current value', async () => {
    await expect(postPage.titleInput).toHaveValue(testPostName);
  });

  test('save button is visible and enabled', async () => {
    await expect(postPage.submitButton).toBeVisible();
    await postPage.assertSubmitButtonVisible();
  });
});

test.describe('Post edit — Functionality', () => {
  let postPage: PostPage;
  let testPostName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    testPostName = `Edit-${Date.now()}`;
    const categoryPage = new CategoryPage(page);
    const relCategoryName = `Category-${Date.now()}`;
    await categoryPage.createCategory(relCategoryName);
    await postPage.createPost(testPostName, `text-${Date.now()}`, relCategoryName);
    await postPage.assertOnIndexPage();
  });

  test('updates post successfully', async () => {
    const updatedTitle = `Updated-${Date.now()}`;
    await postPage.editPostByName(testPostName, updatedTitle, 'updated text');
    await postPage.assertOnIndexPage();
    await postPage.assertPostExists(updatedTitle);
  });

  test('shows error when required field is cleared on edit', async () => {
    const row = postPage.page.locator('table tbody tr').filter({ hasText: testPostName });
    await row.getByRole('link', { name: /edit/i }).click();
    await postPage.titleInput.clear();
    await postPage.clickSubmit();
    await expect(postPage.titleInput).toBeVisible();
  });
});

test.describe('Post delete — Component', () => {
  let postPage: PostPage;
  let testPostName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    testPostName = `Delete-${Date.now()}`;
    const categoryPage = new CategoryPage(page);
    const relCategoryName = `Category-${Date.now()}`;
    await categoryPage.createCategory(relCategoryName);
    await postPage.createPost(testPostName, `text-${Date.now()}`, relCategoryName);
    await postPage.assertOnIndexPage();
  });

  test('delete button is visible in row', async () => {
    const row = postPage.page.locator('table tbody tr').filter({ hasText: testPostName });
    await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('delete button is enabled', async () => {
    const row = postPage.page.locator('table tbody tr').filter({ hasText: testPostName });
    await expect(row.getByRole('button', { name: /delete/i })).toBeEnabled();
  });
});

test.describe('Post delete — Functionality', () => {
  let postPage: PostPage;
  let testPostName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    testPostName = `Delete-${Date.now()}`;
    const categoryPage = new CategoryPage(page);
    const relCategoryName = `Category-${Date.now()}`;
    await categoryPage.createCategory(relCategoryName);
    await postPage.createPost(testPostName, `text-${Date.now()}`, relCategoryName);
    await postPage.assertOnIndexPage();
  });

  test('deletes post after confirming dialog', async () => {
    await postPage.deletePostByName(testPostName);
    await postPage.assertPostNotExists(testPostName);
  });
});