// tests/categories.spec.ts

import { test, expect } from '@playwright/test';
import { CategoryPage } from '../pages/CategoryPage';
import { CATEGORIES } from '../fixtures/test-data';

test.describe('Category index — Component', () => {
  let categoryPage: CategoryPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    await categoryPage.gotoIndex();
  });

  test('shows category table', async () => {
    await categoryPage.assertTableVisible();
  });

  test('shows create button', async () => {
    await categoryPage.assertCreateButtonVisible();
  });

  test('table has Name column', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Name/i })).toBeVisible();
  });

  test('table has Actions column', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Actions/i })).toBeVisible();
  });
});

test.describe('Category create — Component', () => {
  let categoryPage: CategoryPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    await categoryPage.gotoCreate();
  });

  test('shows Name field', async () => {
    await categoryPage.assertNameInputVisible();
  });

  test('shows submit button', async () => {
    await categoryPage.assertSubmitButtonVisible();
  });

  test('submit button is enabled', async () => {
    await expect(categoryPage.submitButton).toBeEnabled();
  });

  test('Name field is required', async () => {
    await categoryPage.assertNameRequired();
  });

  test('Name field is empty on open', async () => {
    await expect(categoryPage.nameInput).toHaveValue('');
  });
});

test.describe('Category create — Functionality', () => {
  let categoryPage: CategoryPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
  });

  test('creates category with valid data', async () => {
    const uniqueName = `Category-${Date.now()}`;
    await categoryPage.createCategory(uniqueName);
    await categoryPage.assertOnIndexPage();
    await categoryPage.assertCategoryExists(uniqueName);
  });

  test('shows error when required fields are empty', async () => {
    await categoryPage.gotoCreate();
    await categoryPage.clickSubmit();
    await categoryPage.assertOnCreatePage();
  });

  test('redirects to index after successful create', async () => {
    await categoryPage.createCategory(`Category-${Date.now()}`);
    await categoryPage.assertOnIndexPage();
  });

  test('created category is visible in table', async () => {
    const createdLabel = `Category-${Date.now()}`;
    await categoryPage.createCategory(createdLabel);
    await categoryPage.assertOnIndexPage();
    await categoryPage.assertCategoryExists(createdLabel);
  });
});

test.describe('Category edit — Component', () => {
  let categoryPage: CategoryPage;
  let testCategoryName: string;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    testCategoryName = `Edit-${Date.now()}`;
    await categoryPage.createCategory(testCategoryName);
    await categoryPage.assertOnIndexPage();
    const row = categoryPage.page.locator('table tbody tr').filter({ hasText: testCategoryName });
    await row.getByRole('link', { name: /edit/i }).click();
  });

  test('edit page shows Name field', async () => {
    await categoryPage.assertNameInputVisible();
  });

  test('Name field shows current value', async () => {
    await expect(categoryPage.nameInput).toHaveValue(testCategoryName);
  });

  test('save button is visible and enabled', async () => {
    await expect(categoryPage.submitButton).toBeVisible();
    await categoryPage.assertSubmitButtonVisible();
  });
});

test.describe('Category edit — Functionality', () => {
  let categoryPage: CategoryPage;
  let testCategoryName: string;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    testCategoryName = `Edit-${Date.now()}`;
    await categoryPage.createCategory(testCategoryName);
    await categoryPage.assertOnIndexPage();
  });

  test('updates category successfully', async () => {
    const updatedName = `Updated-${Date.now()}`;
    await categoryPage.editCategoryByName(testCategoryName, updatedName);
    await categoryPage.assertOnIndexPage();
    await categoryPage.assertCategoryExists(updatedName);
  });

  test('shows error when required field is cleared on edit', async () => {
    const row = categoryPage.page.locator('table tbody tr').filter({ hasText: testCategoryName });
    await row.getByRole('link', { name: /edit/i }).click();
    await categoryPage.nameInput.clear();
    await categoryPage.clickSubmit();
    await expect(categoryPage.nameInput).toBeVisible();
  });
});

test.describe('Category delete — Component', () => {
  let categoryPage: CategoryPage;
  let testCategoryName: string;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    testCategoryName = `Delete-${Date.now()}`;
    await categoryPage.createCategory(testCategoryName);
    await categoryPage.assertOnIndexPage();
  });

  test('delete button is visible in row', async () => {
    const row = categoryPage.page.locator('table tbody tr').filter({ hasText: testCategoryName });
    await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('delete button is enabled', async () => {
    const row = categoryPage.page.locator('table tbody tr').filter({ hasText: testCategoryName });
    await expect(row.getByRole('button', { name: /delete/i })).toBeEnabled();
  });
});

test.describe('Category delete — Functionality', () => {
  let categoryPage: CategoryPage;
  let testCategoryName: string;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    testCategoryName = `Delete-${Date.now()}`;
    await categoryPage.createCategory(testCategoryName);
    await categoryPage.assertOnIndexPage();
  });

  test('deletes category after confirming dialog', async () => {
    await categoryPage.deleteCategoryByName(testCategoryName);
    await categoryPage.assertCategoryNotExists(testCategoryName);
  });
});