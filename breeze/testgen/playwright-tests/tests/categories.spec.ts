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
    await categoryPage.assertNameVisible();
  });

    test('shows submit button', async () => {
        await categoryPage.assertSubmitButtonVisible();
    });

    test('submit button is enabled', async () => {
        await expect(categoryPage.submitButton).toBeEnabled();
    });

  test('Name field is required', async () => {
    await expect(categoryPage.nameInput).toHaveAttribute('required');
  });
});

test.describe('Category create — Functionality', () => {
    let categoryPage: CategoryPage;

    test.beforeEach(async ({ page }) => {
        categoryPage = new CategoryPage(page);
    });

    test('creates category with valid data', async () => {
        const createLabel = `Category-${Date.now()}`;
    const payload = { ...CATEGORIES.valid, name: createLabel };
        await categoryPage.createCategory(payload);
        await categoryPage.assertOnIndexPage();
    await categoryPage.assertCategoryExists(createLabel);
    });

    test('shows error when required fields are empty', async () => {
        await categoryPage.createCategory({ ...CATEGORIES.empty });
        await categoryPage.assertOnCreatePage();
    });

    test('redirects to index after successful create', async () => {
        await categoryPage.createCategory({ ...CATEGORIES.valid });
        await categoryPage.assertOnIndexPage();
    });
});

test.describe('Category edit — Component', () => {
    let categoryPage: CategoryPage;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        categoryPage = new CategoryPage(page);
        createLabel = `Category-${Date.now()}`;
        await categoryPage.createCategory({ ...CATEGORIES.valid, name: createLabel });
        await categoryPage.assertOnIndexPage();
        const row = categoryPage.page.locator('table tbody tr').filter({ hasText: createLabel });
        await row.getByRole('link', { name: /edit/i }).click();
    });

  test('edit page shows Name field', async () => {
    await expect(categoryPage.nameInput).toBeVisible();
  });

    test('save button is visible and enabled', async () => {
        await expect(categoryPage.submitButton).toBeVisible();
        await expect(categoryPage.submitButton).toBeEnabled();
    });
});

test.describe('Category edit — Functionality', () => {
    let categoryPage: CategoryPage;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        categoryPage = new CategoryPage(page);
        createLabel = `Category-${Date.now()}`;
        await categoryPage.createCategory({ ...CATEGORIES.valid, name: createLabel });
        await categoryPage.assertOnIndexPage();
    });

    test('updates category successfully', async () => {
        const updatedLabel = `Updated-${Date.now()}`;
    await categoryPage.editCategoryByName(createLabel, { ...CATEGORIES.updated, name: updatedLabel });
    await categoryPage.assertCategoryExists(updatedLabel);
    });
});

test.describe('Category delete — Component', () => {
    let categoryPage: CategoryPage;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        categoryPage = new CategoryPage(page);
        createLabel = `Category-${Date.now()}`;
        await categoryPage.createCategory({ ...CATEGORIES.valid, name: createLabel });
        await categoryPage.assertOnIndexPage();
    });

    test('delete button is visible in row', async () => {
        const row = categoryPage.page.locator('table tbody tr').filter({ hasText: createLabel });
        await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
    });
});

test.describe('Category delete — Functionality', () => {
    let categoryPage: CategoryPage;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        categoryPage = new CategoryPage(page);
        createLabel = `Category-${Date.now()}`;
        await categoryPage.createCategory({ ...CATEGORIES.valid, name: createLabel });
        await categoryPage.assertOnIndexPage();
    });

    test('deletes category after confirming dialog', async () => {
        await categoryPage.deleteCategoryByName(createLabel);
        await categoryPage.assertCategoryNotExists(createLabel);
    });
});
