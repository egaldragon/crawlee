// tests/posts.spec.ts

import { test, expect } from '@playwright/test';
import { PostPage } from '../pages/PostPage';
import { POSTS } from '../fixtures/test-data';

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

  test('table has Category column', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Category/i })).toBeVisible();
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
    await postPage.assertTitleVisible();
  });

  test('shows Text field', async () => {
    await postPage.assertTextVisible();
  });

  test('shows Category id field', async () => {
    await postPage.assertCategoryidVisible();
  });

    test('shows submit button', async () => {
        await postPage.assertSubmitButtonVisible();
    });

    test('submit button is enabled', async () => {
        await expect(postPage.submitButton).toBeEnabled();
    });

  test('Title field is required', async () => {
    await expect(postPage.titleInput).toHaveAttribute('required');
  });
});

test.describe('Post create — Functionality', () => {
    let postPage: PostPage;

    test.beforeEach(async ({ page }) => {
        postPage = new PostPage(page);
    });

    test('creates post with valid data', async () => {
        const createLabel = `Post-${Date.now()}`;
    const payload = { ...POSTS.valid, title: createLabel };
        await postPage.createPost(payload);
        await postPage.assertOnIndexPage();
    await postPage.assertPostExists(createLabel);
    });

    test('shows error when required fields are empty', async () => {
        await postPage.createPost({ ...POSTS.empty });
        await postPage.assertOnCreatePage();
    });

    test('redirects to index after successful create', async () => {
        await postPage.createPost({ ...POSTS.valid });
        await postPage.assertOnIndexPage();
    });
});

test.describe('Post edit — Component', () => {
    let postPage: PostPage;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        postPage = new PostPage(page);
        createLabel = `Post-${Date.now()}`;
        await postPage.createPost({ ...POSTS.valid, title: createLabel });
        await postPage.assertOnIndexPage();
        const row = postPage.page.locator('table tbody tr').filter({ hasText: createLabel });
        await row.getByRole('link', { name: /edit/i }).click();
    });

  test('edit page shows Title field', async () => {
    await expect(postPage.titleInput).toBeVisible();
  });

    test('save button is visible and enabled', async () => {
        await expect(postPage.submitButton).toBeVisible();
        await expect(postPage.submitButton).toBeEnabled();
    });
});

test.describe('Post edit — Functionality', () => {
    let postPage: PostPage;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        postPage = new PostPage(page);
        createLabel = `Post-${Date.now()}`;
        await postPage.createPost({ ...POSTS.valid, title: createLabel });
        await postPage.assertOnIndexPage();
    });

    test('updates post successfully', async () => {
        const updatedLabel = `Updated-${Date.now()}`;
    await postPage.editPostByName(createLabel, { ...POSTS.updated, title: updatedLabel });
    await postPage.assertPostExists(updatedLabel);
    });
});

test.describe('Post delete — Component', () => {
    let postPage: PostPage;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        postPage = new PostPage(page);
        createLabel = `Post-${Date.now()}`;
        await postPage.createPost({ ...POSTS.valid, title: createLabel });
        await postPage.assertOnIndexPage();
    });

    test('delete button is visible in row', async () => {
        const row = postPage.page.locator('table tbody tr').filter({ hasText: createLabel });
        await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
    });
});

test.describe('Post delete — Functionality', () => {
    let postPage: PostPage;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        postPage = new PostPage(page);
        createLabel = `Post-${Date.now()}`;
        await postPage.createPost({ ...POSTS.valid, title: createLabel });
        await postPage.assertOnIndexPage();
    });

    test('deletes post after confirming dialog', async () => {
        await postPage.deletePostByName(createLabel);
        await postPage.assertPostNotExists(createLabel);
    });
});
