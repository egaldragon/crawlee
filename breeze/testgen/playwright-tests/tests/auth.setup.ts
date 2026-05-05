// tests/auth.setup.ts

import * as fs from 'fs';
import * as path from 'path';
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { TEST_USER } from '../fixtures/test-data';

setup('authenticate and cache storage state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    const isOnDashboard = /\/dashboard/.test(page.url());
    if (!isOnDashboard) {
        const registerPage = new RegisterPage(page);
        await registerPage.goto();
        await registerPage.register(TEST_USER.name, TEST_USER.email, TEST_USER.password);
        await loginPage.goto();
        await loginPage.login(TEST_USER.email, TEST_USER.password);
    }

    await expect(page).toHaveURL(/\/dashboard/);
    const authDir = path.join(process.cwd(), '.auth');
    fs.mkdirSync(authDir, { recursive: true });
    await page.context().storageState({ path: path.join(authDir, 'user.json') });
});
