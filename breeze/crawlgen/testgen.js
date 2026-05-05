#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function flag(args, name) {
        const i = args.indexOf(name);
        return i !== -1 ? args[i + 1] : undefined;
}

function extractPositionalArgs(args) {
    const noValueFlags = new Set(['--no-workflow', '--help', '-h']);
    const positional = [];

    for (let i = 0; i < args.length; i += 1) {
        const token = args[i];

        if (token.startsWith('--') || token === '-h') {
            if (!noValueFlags.has(token) && i + 1 < args.length && !args[i + 1].startsWith('--')) {
                i += 1;
            }
            continue;
        }

        positional.push(token);
    }

    return positional;
}

function normalizePathname(pathname) {
        if (!pathname || pathname === '/') return '/';
        return pathname.replace(/\/\d+(?=\/|$)/g, '/[id]').replace(/\/$/, '') || '/';
}

function toWords(value) {
        return value.replace(/[_-]/g, ' ').trim();
}

function capitalize(value) {
        return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function singularize(name) {
        if (name.endsWith('ies')) return `${name.slice(0, -3)}y`;
        if (name.endsWith('s')) return name.slice(0, -1);
        return name;
}

function toClassName(resourceName) {
        return capitalize(singularize(resourceName));
}

function toConstName(resourceName) {
        return resourceName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

function toFieldProp(name) {
        const safe = name.replace(/[^a-zA-Z0-9_]/g, '_');
        return `${safe.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}Input`;
}

function escapeSingle(value) {
        return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function uniqueByName(inputs) {
        const map = new Map();
        for (const input of inputs) {
                if (!input?.name) continue;
                if (input.name === '_token' || input.name === '_method') continue;
                if (!map.has(input.name)) map.set(input.name, input);
        }
        return Array.from(map.values());
}

function sampleValue(input, variant = 'valid') {
        const lowerName = (input.name || '').toLowerCase();
        const type = (input.type || '').toLowerCase();

        if (variant === 'empty') return '';
        if (lowerName.includes('email') || type === 'email') return variant === 'updated' ? 'updated@example.com' : 'sample@example.com';
        if (lowerName.includes('password') || type === 'password') return variant === 'updated' ? 'playwright1234' : 'playwright';
        if (lowerName.includes('title')) return variant === 'updated' ? 'Updated Title' : 'Sample Title';
        if (lowerName.includes('name')) return variant === 'updated' ? 'Updated Name' : 'Sample Name';
        if (lowerName.includes('text') || type === 'textarea') return variant === 'updated' ? 'Updated text value.' : 'Sample text value.';
        if (type === 'number') return variant === 'updated' ? '99' : '10';
        if (type === 'date') return '2026-01-01';
        return variant === 'updated' ? 'Updated Value' : 'Sample Value';
}

function loadDatasets(datasetDir) {
        const files = fs.existsSync(datasetDir)
                ? fs.readdirSync(datasetDir).filter((f) => f.endsWith('.json')).sort()
                : [];

        const byPath = new Map();
        for (const fileName of files) {
                const filePath = path.join(datasetDir, fileName);
                const raw = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(raw);
                if (!data || Array.isArray(data) || typeof data !== 'object') continue;
                if (!data.pathname) continue;

                const pathname = normalizePathname(data.pathname);
                byPath.set(pathname, { ...data, pathname });
        }
        return byPath;
}

function analyzeDatasets(byPath) {
        const authPaths = ['/login', '/register', '/dashboard', '/profile'];
        const reservedRoots = new Set(['login', 'register', 'dashboard', 'profile', 'forgot-password', 'reset-password']);

        const allPaths = Array.from(byPath.keys());

        const resourceRoots = allPaths
                .filter((p) => /^\/[^/]+$/.test(p))
                .map((p) => p.slice(1))
                .filter((root) => !reservedRoots.has(root));

        const resources = Array.from(new Set(resourceRoots)).map((name) => {
                const indexPath = `/${name}`;
                const createPath = `/${name}/create`;
                const indexData = byPath.get(indexPath);
                const createData = byPath.get(createPath);

                const sourceForms = (createData?.forms?.length ? createData.forms : indexData?.forms) || [];
                const primaryForm = sourceForms.find((f) => Array.isArray(f.inputs) && f.inputs.length > 0) || { inputs: [] };
                const fields = uniqueByName(primaryForm.inputs || []);

                const tableColumns = indexData?.components?.tables?.[0]?.columns || [];
                const className = toClassName(name);

                return {
                        name,
                        className,
                        indexPath,
                        createPath,
                        fields,
                        tableColumns,
                        hasCreatePage: Boolean(createData),
                };
        });

        return {
                hasAuth: authPaths.some((p) => byPath.has(p)),
                hasProfile: byPath.has('/profile'),
                hasDashboard: byPath.has('/dashboard'),
                resources,
        };
}

function generateBasePage() {
        return `// pages/BasePage.ts

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
`;
}

function generateLoginPage() {
        return `// pages/LoginPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly rememberMeCheckbox: Locator;
    readonly submitButton: Locator;
    readonly forgotPasswordLink: Locator;
    readonly registerLink: Locator;

    constructor(page: Page) {
        super(page);
        const form = page.locator('form').first();
        this.emailInput = form.locator('input[name="email"]');
        this.passwordInput = form.locator('input[name="password"]');
        this.rememberMeCheckbox = form.locator('input[name="remember"]');
        this.submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
        this.forgotPasswordLink = page.locator('a[href*="forgot-password"], a[href*="reset-password"]').first();
        this.registerLink = page.locator('a[href*="/register"]').first();
    }

    async goto(): Promise<void> { await this.navigate('/login'); }

    async login(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async fillEmail(value: string): Promise<void> { await this.emailInput.fill(value); }
    async fillPassword(value: string): Promise<void> { await this.passwordInput.fill(value); }
    async clickSubmit(): Promise<void> { await this.submitButton.click(); }

    async assertOnLoginPage(): Promise<void> {
        await this.assertURL(/\\/login/);
        await expect(this.submitButton).toBeVisible();
    }
}
`;
}

function generateRegisterPage() {
        return `// pages/RegisterPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly submitButton: Locator;
    readonly loginLink: Locator;

    constructor(page: Page) {
        super(page);
        const form = page.locator('form').first();
        this.nameInput = form.locator('input[name="name"]');
        this.emailInput = form.locator('input[name="email"]');
        this.passwordInput = form.locator('input[name="password"]');
        this.confirmPasswordInput = form.locator('input[name="password_confirmation"]');
        this.submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
        this.loginLink = page.locator('a[href*="/login"]').first();
    }

    async goto(): Promise<void> { await this.navigate('/register'); }

    async register(name: string, email: string, password: string, confirmPassword = password): Promise<void> {
        await this.nameInput.fill(name);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.confirmPasswordInput.fill(confirmPassword);
        await this.submitButton.click();
    }

    async clickSubmit(): Promise<void> { await this.submitButton.click(); }

    async assertOnRegisterPage(): Promise<void> {
        await this.assertURL(/\\/register/);
        await expect(this.submitButton).toBeVisible();
    }
}
`;
}

function generateDashboardPage() {
        return `// pages/DashboardPage.ts

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
`;
}

function generateProfilePage() {
        return `// pages/ProfilePage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly saveProfileButton: Locator;
    readonly currentPasswordInput: Locator;
    readonly newPasswordInput: Locator;
    readonly confirmNewPasswordInput: Locator;
    readonly savePasswordButton: Locator;
    readonly deleteAccountButton: Locator;

    constructor(page: Page) {
        super(page);
        this.nameInput = page.locator('input[name="name"]').first();
        this.emailInput = page.locator('input[name="email"]').first();
        this.saveProfileButton = page.locator('button[type="submit"], input[type="submit"]').first();
        this.currentPasswordInput = page.locator('input[name="current_password"]').first();
        this.newPasswordInput = page.locator('input[name="password"]').nth(1);
        this.confirmNewPasswordInput = page.locator('input[name="password_confirmation"]').first();
        this.savePasswordButton = page.locator('button[type="submit"], input[type="submit"]').nth(1);
        this.deleteAccountButton = page.locator('button[data-confirm], form[action*="delete"] button[type="submit"], button[type="submit"][form*="delete"]').first();
    }

    async goto(): Promise<void> { await this.navigate('/profile'); }

    async updateName(name: string): Promise<void> {
        await this.nameInput.clear();
        await this.nameInput.fill(name);
        await this.saveProfileButton.click();
    }

    async updateEmail(email: string): Promise<void> {
        await this.emailInput.clear();
        await this.emailInput.fill(email);
        await this.saveProfileButton.click();
    }

    async updateProfile(name: string, email: string): Promise<void> {
        await this.nameInput.clear();
        await this.nameInput.fill(name);
        await this.emailInput.clear();
        await this.emailInput.fill(email);
        await this.saveProfileButton.click();
    }

    async updatePassword(current: string, next: string, confirm: string): Promise<void> {
        await this.currentPasswordInput.fill(current);
        await this.newPasswordInput.fill(next);
        await this.confirmNewPasswordInput.fill(confirm);
        await this.savePasswordButton.click();
    }

    async assertOnProfilePage(): Promise<void> {
        await this.assertURLContains('profile');
        await expect(this.nameInput).toBeVisible();
    }
}
`;
}

function generateResourcePage(resource) {
        const subject = resource.className;
        const subjectLower = subject.toLowerCase();

        const fieldDeclarations = resource.fields.map((f) => `  readonly ${toFieldProp(f.name)}: Locator;`).join('\n');
        const fieldCtorInit = resource.fields.map((f) => `    this.${toFieldProp(f.name)} = page.locator('[name="${escapeSingle(f.name)}"]').first();`).join('\n');

        const fillMethods = resource.fields.map((f) => {
                const prop = toFieldProp(f.name);
                const label = capitalize(toWords(f.name));
                if ((f.type || '').toLowerCase() === 'select') {
                        return `  async fill${capitalize(prop.replace(/Input$/, ''))}(value: string): Promise<void> {\n    await this.${prop}.selectOption({ label: value });\n  }`;
                }
                if ((f.type || '').toLowerCase() === 'checkbox') {
                        return `  async fill${capitalize(prop.replace(/Input$/, ''))}(value: string): Promise<void> {\n    if (value === 'true') await this.${prop}.check();\n    else await this.${prop}.uncheck();\n  }`;
                }
                return `  async fill${capitalize(prop.replace(/Input$/, ''))}(value: string): Promise<void> {\n    await this.${prop}.fill(value);\n  }`;
        }).join('\n\n');

        const createFillLines = resource.fields.map((f) => {
                const propName = capitalize(toFieldProp(f.name).replace(/Input$/, ''));
                return `    if (data['${escapeSingle(f.name)}'] !== undefined) await this.fill${propName}(data['${escapeSingle(f.name)}']);`;
        }).join('\n');

        const assertFieldMethods = resource.fields.map((f) => {
                const prop = toFieldProp(f.name);
                const name = capitalize(toWords(f.name));
                const requiredAssertion = f.required
                        ? `\n  async assert${name.replace(/\s+/g, '')}Required(): Promise<void> {\n    await expect(this.${prop}).toHaveAttribute('required');\n  }`
                        : '';

                return `  async assert${name.replace(/\s+/g, '')}Visible(): Promise<void> {\n    await expect(this.${prop}).toBeVisible();\n  }${requiredAssertion}`;
        }).join('\n\n');

        return `// pages/${subject}Page.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ${subject}Page extends BasePage {
    readonly createButton: Locator;
    readonly ${resource.name}Table: Locator;
    readonly tableRows: Locator;
${fieldDeclarations ? `${fieldDeclarations}\n` : ''}  readonly submitButton: Locator;

    constructor(page: Page) {
        super(page);
        this.createButton = page.locator('a[href*="/create"], a[href$="create"], a[href*="/new"]').first();
        this.${resource.name}Table = page.locator('table').first();
        this.tableRows = page.locator('table tbody tr');
${fieldCtorInit ? `${fieldCtorInit}\n` : ''}    this.submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
    }

    async gotoIndex(): Promise<void> { await this.navigate('${resource.indexPath}'); }
    async gotoCreate(): Promise<void> { await this.navigate('${resource.createPath}'); }
    async clickSubmit(): Promise<void> { await this.submitButton.click(); }

${fillMethods ? `${fillMethods}\n\n` : ''}  async create${subject}(data: Record<string, string>): Promise<void> {
        await this.gotoCreate();
${createFillLines}
        await this.clickSubmit();
    }

    async edit${subject}ByName(current: string, data: Record<string, string>): Promise<void> {
        const row = this.page.locator('table tbody tr').filter({ hasText: current });
        await row.locator('a[href*="/edit"], a[href*="edit"]').first().click();
${resource.fields.map((f) => {
        const call = `fill${capitalize(toFieldProp(f.name).replace(/Input$/, ''))}`;
        return `    if (data['${escapeSingle(f.name)}'] !== undefined) {\n      await this.${toFieldProp(f.name)}.clear();\n      await this.${call}(data['${escapeSingle(f.name)}']);\n    }`;
}).join('\n')}
        await this.clickSubmit();
    }

    async delete${subject}ByName(name: string): Promise<void> {
        const row = this.page.locator('table tbody tr').filter({ hasText: name });
        this.page.once('dialog', (d) => d.accept());
        await row.locator('form button[type="submit"], button[data-action*="delete"], button[type="submit"]').first().click();
    }

    async assertOnIndexPage(): Promise<void> {
        await this.assertURLContains('${resource.name}');
        await expect(this.${resource.name}Table).toBeVisible();
    }

    async assertOnCreatePage(): Promise<void> {
        await this.assertURLContains('${resource.name}/create');
${resource.fields[0] ? `    await expect(this.${toFieldProp(resource.fields[0].name)}).toBeVisible();` : '    await expect(this.submitButton).toBeVisible();'}
    }

    async assert${subject}Exists(value: string): Promise<void> {
        await expect(this.page.locator('table').getByText(value)).toBeVisible();
    }

    async assert${subject}NotExists(value: string): Promise<void> {
        await expect(this.page.locator('table').getByText(value)).not.toBeVisible();
    }

    async assertTableVisible(): Promise<void> {
        await expect(this.${resource.name}Table).toBeVisible();
    }

    async assertCreateButtonVisible(): Promise<void> {
        await expect(this.createButton).toBeVisible();
    }

${assertFieldMethods ? `${assertFieldMethods}\n\n` : ''}  async assertSubmitButtonVisible(): Promise<void> {
        await expect(this.submitButton).toBeVisible();
    }

    async getRowCount(): Promise<number> {
        return this.tableRows.count();
    }
}
`;
}

function generateAuthSetupSpec() {
        return `// tests/auth.setup.ts

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

    const isOnDashboard = /\\/dashboard/.test(page.url());
    if (!isOnDashboard) {
        const registerPage = new RegisterPage(page);
        await registerPage.goto();
        await registerPage.register(TEST_USER.name, TEST_USER.email, TEST_USER.password);
        await loginPage.goto();
        await loginPage.login(TEST_USER.email, TEST_USER.password);
    }

    await expect(page).toHaveURL(/\\/dashboard/);
    const authDir = path.join(process.cwd(), '.auth');
    fs.mkdirSync(authDir, { recursive: true });
    await page.context().storageState({ path: path.join(authDir, 'user.json') });
});
`;
}

function generateAuthSpec() {
        return `// tests/auth.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TEST_USER } from '../fixtures/test-data';

test.describe('Login page — Component', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('shows email field', async () => { await expect(loginPage.emailInput).toBeVisible(); });
    test('shows password field', async () => { await expect(loginPage.passwordInput).toBeVisible(); });
    test('shows submit button', async () => { await expect(loginPage.submitButton).toBeEnabled(); });
    test('email field is type email', async () => { await expect(loginPage.emailInput).toHaveAttribute('type', 'email'); });
    test('password field is type password', async () => { await expect(loginPage.passwordInput).toHaveAttribute('type', 'password'); });
});

test.describe('Login page — Functionality', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('shows error for wrong credentials', async () => {
        await loginPage.login('wrong@email.com', 'wrongpassword');
        await loginPage.assertOnLoginPage();
    });

    test('stays on login page when form is empty', async () => {
        await loginPage.clickSubmit();
        await loginPage.assertOnLoginPage();
    });
});

test.describe('Register page — Component', () => {
    let registerPage: RegisterPage;

    test.beforeEach(async ({ page }) => {
        registerPage = new RegisterPage(page);
        await registerPage.goto();
    });

    test('shows name field', async () => { await expect(registerPage.nameInput).toBeVisible(); });
    test('shows email field', async () => { await expect(registerPage.emailInput).toBeVisible(); });
    test('shows password field', async () => { await expect(registerPage.passwordInput).toBeVisible(); });
    test('shows confirm password field', async () => { await expect(registerPage.confirmPasswordInput).toBeVisible(); });
});

test.describe('Dashboard — Component', () => {
    let dashboardPage: DashboardPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        await loginPage.goto();
        await loginPage.login(TEST_USER.email, TEST_USER.password);
        await dashboardPage.assertOnDashboard();
    });

    test('shows dashboard heading', async () => { await dashboardPage.assertWelcomeVisible(); });
});
`;
}

function generateProfileSpec() {
        return `// tests/profile.spec.ts

import { test, expect } from '@playwright/test';
import { ProfilePage } from '../pages/ProfilePage';
import { TEST_USER } from '../fixtures/test-data';

test.describe('Profile page — Component', () => {
    let profilePage: ProfilePage;

    test.beforeEach(async ({ page }) => {
        profilePage = new ProfilePage(page);
        await profilePage.goto();
    });

    test('shows name field', async () => { await expect(profilePage.nameInput).toBeVisible(); });
    test('shows email field', async () => { await expect(profilePage.emailInput).toBeVisible(); });
    test('shows save profile button', async () => { await expect(profilePage.saveProfileButton).toBeVisible(); });
    test('email field shows logged-in user email', async () => { await expect(profilePage.emailInput).toHaveValue(TEST_USER.email); });
});

test.describe('Profile page — Functionality', () => {
    let profilePage: ProfilePage;

    test.beforeEach(async ({ page }) => {
        profilePage = new ProfilePage(page);
        await profilePage.goto();
    });

    test('save button is enabled', async () => {
        await expect(profilePage.saveProfileButton).toBeEnabled();
    });
});
`;
}

function generateResourceSpec(resource) {
        const className = resource.className;
        const constName = toConstName(resource.name);
        const fixtureKey = singularize(resource.name);
        const titleField = resource.fields.find((f) => /name|title/i.test(f.name)) || resource.fields[0];

        const fieldComponentTests = resource.fields.map((f) => {
                const clean = capitalize(toWords(f.name)).replace(/\s+/g, '');
                return `  test('shows ${capitalize(toWords(f.name))} field', async () => {\n    await ${fixtureKey}Page.assert${clean}Visible();\n  });`;
        }).join('\n\n');

        const requiredTests = resource.fields
                .filter((f) => f.required)
                .map((f) => `  test('${capitalize(toWords(f.name))} field is required', async () => {\n    await expect(${fixtureKey}Page.${toFieldProp(f.name)}).toHaveAttribute('required');\n  });`)
                .join('\n\n');

        const tableColumnTests = (resource.tableColumns || [])
                .filter(Boolean)
                .map((col) => `  test('table has ${escapeSingle(col)} column', async ({ page }) => {\n    await expect(page.locator('table th').filter({ hasText: /${escapeSingle(col)}/i })).toBeVisible();\n  });`)
                .join('\n\n');

        const createData = titleField
            ? `const createLabel = \`${capitalize(singularize(resource.name))}-\${Date.now()}\`;\n    const payload = { ...${constName}.valid, ${titleField.name}: createLabel };`
            : `const payload = { ...${constName}.valid };`;

        const updatedData = titleField
            ? `const updatedLabel = \`Updated-\${Date.now()}\`;\n    await ${fixtureKey}Page.edit${className}ByName(createLabel, { ...${constName}.updated, ${titleField.name}: updatedLabel });\n    await ${fixtureKey}Page.assert${className}Exists(updatedLabel);`
            : `await ${fixtureKey}Page.edit${className}ByName('', { ...${constName}.updated });`;

        return `// tests/${resource.name}.spec.ts

import { test, expect } from '@playwright/test';
import { ${className}Page } from '../pages/${className}Page';
import { ${constName} } from '../fixtures/test-data';

test.describe('${className} index — Component', () => {
    let ${fixtureKey}Page: ${className}Page;

    test.beforeEach(async ({ page }) => {
        ${fixtureKey}Page = new ${className}Page(page);
        await ${fixtureKey}Page.gotoIndex();
    });

    test('shows ${singularize(resource.name)} table', async () => {
        await ${fixtureKey}Page.assertTableVisible();
    });

    test('shows create button', async () => {
        await ${fixtureKey}Page.assertCreateButtonVisible();
    });

${tableColumnTests || `  test('table exists', async ({ page }) => {\n    await expect(page.locator('table')).toBeVisible();\n  });`}
});

test.describe('${className} create — Component', () => {
    let ${fixtureKey}Page: ${className}Page;

    test.beforeEach(async ({ page }) => {
        ${fixtureKey}Page = new ${className}Page(page);
        await ${fixtureKey}Page.gotoCreate();
    });

${fieldComponentTests || `  test('shows submit button', async () => {\n    await ${fixtureKey}Page.assertSubmitButtonVisible();\n  });`}

    test('shows submit button', async () => {
        await ${fixtureKey}Page.assertSubmitButtonVisible();
    });

    test('submit button is enabled', async () => {
        await expect(${fixtureKey}Page.submitButton).toBeEnabled();
    });

${requiredTests || `  test('form can be submitted', async () => {\n    await expect(${fixtureKey}Page.submitButton).toBeVisible();\n  });`}
});

test.describe('${className} create — Functionality', () => {
    let ${fixtureKey}Page: ${className}Page;

    test.beforeEach(async ({ page }) => {
        ${fixtureKey}Page = new ${className}Page(page);
    });

    test('creates ${singularize(resource.name)} with valid data', async () => {
        ${createData}
        await ${fixtureKey}Page.create${className}(payload);
        await ${fixtureKey}Page.assertOnIndexPage();
${titleField ? `    await ${fixtureKey}Page.assert${className}Exists(${titleField.name === 'name' || titleField.name === 'title' ? 'createLabel' : `payload['${titleField.name}']`});` : ''}
    });

    test('shows error when required fields are empty', async () => {
        await ${fixtureKey}Page.create${className}({ ...${constName}.empty });
        await ${fixtureKey}Page.assertOnCreatePage();
    });

    test('redirects to index after successful create', async () => {
        await ${fixtureKey}Page.create${className}({ ...${constName}.valid });
        await ${fixtureKey}Page.assertOnIndexPage();
    });
});

test.describe('${className} edit — Component', () => {
    let ${fixtureKey}Page: ${className}Page;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        ${fixtureKey}Page = new ${className}Page(page);
        createLabel = \`${capitalize(singularize(resource.name))}-\${Date.now()}\`;
        await ${fixtureKey}Page.create${className}({ ...${constName}.valid, ${titleField ? `${titleField.name}: createLabel` : ''} });
        await ${fixtureKey}Page.assertOnIndexPage();
        const row = ${fixtureKey}Page.page.locator('table tbody tr').filter({ hasText: createLabel });
        await row.getByRole('link', { name: /edit/i }).click();
    });

${titleField ? `  test('edit page shows ${capitalize(toWords(titleField.name))} field', async () => {\n    await expect(${fixtureKey}Page.${toFieldProp(titleField.name)}).toBeVisible();\n  });` : `  test('edit page opens form', async () => {\n    await expect(${fixtureKey}Page.submitButton).toBeVisible();\n  });`}

    test('save button is visible and enabled', async () => {
        await expect(${fixtureKey}Page.submitButton).toBeVisible();
        await expect(${fixtureKey}Page.submitButton).toBeEnabled();
    });
});

test.describe('${className} edit — Functionality', () => {
    let ${fixtureKey}Page: ${className}Page;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        ${fixtureKey}Page = new ${className}Page(page);
        createLabel = \`${capitalize(singularize(resource.name))}-\${Date.now()}\`;
        await ${fixtureKey}Page.create${className}({ ...${constName}.valid, ${titleField ? `${titleField.name}: createLabel` : ''} });
        await ${fixtureKey}Page.assertOnIndexPage();
    });

    test('updates ${singularize(resource.name)} successfully', async () => {
        ${updatedData}
    });
});

test.describe('${className} delete — Component', () => {
    let ${fixtureKey}Page: ${className}Page;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        ${fixtureKey}Page = new ${className}Page(page);
        createLabel = \`${capitalize(singularize(resource.name))}-\${Date.now()}\`;
        await ${fixtureKey}Page.create${className}({ ...${constName}.valid, ${titleField ? `${titleField.name}: createLabel` : ''} });
        await ${fixtureKey}Page.assertOnIndexPage();
    });

    test('delete button is visible in row', async () => {
        const row = ${fixtureKey}Page.page.locator('table tbody tr').filter({ hasText: createLabel });
        await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
    });
});

test.describe('${className} delete — Functionality', () => {
    let ${fixtureKey}Page: ${className}Page;
    let createLabel: string;

    test.beforeEach(async ({ page }) => {
        ${fixtureKey}Page = new ${className}Page(page);
        createLabel = \`${capitalize(singularize(resource.name))}-\${Date.now()}\`;
        await ${fixtureKey}Page.create${className}({ ...${constName}.valid, ${titleField ? `${titleField.name}: createLabel` : ''} });
        await ${fixtureKey}Page.assertOnIndexPage();
    });

    test('deletes ${singularize(resource.name)} after confirming dialog', async () => {
        await ${fixtureKey}Page.delete${className}ByName(createLabel);
        await ${fixtureKey}Page.assert${className}NotExists(createLabel);
    });
});
`;
}

function generateFixtures(resources, opts) {
        const resourceBlocks = resources.map((resource) => {
                const valid = resource.fields.map((f) => `    ${f.name}: '${escapeSingle(sampleValue(f, 'valid'))}',`).join('\n');
                const updated = resource.fields.map((f) => `    ${f.name}: '${escapeSingle(sampleValue(f, 'updated'))}',`).join('\n');
                const empty = resource.fields.map((f) => `    ${f.name}: '',`).join('\n');

                return `export const ${toConstName(resource.name)} = {\n  valid: {\n${valid}\n  },\n  updated: {\n${updated}\n  },\n  empty: {\n${empty}\n  },\n};`;
        }).join('\n\n');

        const routeResources = resources.map((resource) => `  ${resource.name}: { index: '${resource.indexPath}', create: '${resource.createPath}' },`).join('\n');

        return `// fixtures/test-data.ts

export const TEST_USER = {
    name: '${escapeSingle(opts.testUser.name)}',
    email: '${escapeSingle(opts.testUser.email)}',
    password: '${escapeSingle(opts.testUser.password)}',
};

${resourceBlocks}

export const ROUTES = {
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
    profile: '/profile',
${routeResources ? `${routeResources}` : ''}
};
`;
}

function generatePlaywrightConfig(opts, hasAuth) {
        const setupProject = hasAuth
                ? `,
        {
            name: 'setup',
            testMatch: /auth.setup.ts/,
            fullyParallel: false,
            use: { ...devices['Desktop Chrome'], storageState: undefined },
        }`
                : '';

        const authProject = hasAuth
                ? `,
        {
            name: 'auth',
            testMatch: /auth.spec.ts/,
            dependencies: ['setup'],
            use: { ...devices['Desktop Chrome'], storageState: undefined },
        }`
                : '';

        const chromiumProject = hasAuth
                ? `,
        {
            name: 'chromium',
            testIgnore: [/auth.setup.ts/, /auth.spec.ts/],
            dependencies: ['setup'],
            use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
        }`
                : `,
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        }`;

        return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? '50%' : undefined,
    reporter: [['html'], ['json', { outputFile: 'playwright-report/report.json' }], ['list']],

    use: {
        baseURL: process.env.BASE_URL ?? '${escapeSingle(opts.baseUrl)}',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        headless: true,
    },

    projects: [${setupProject}${authProject}${chromiumProject}
    ],
});
`;
}

function generatePackageJson() {
        return JSON.stringify({
                name: 'testgen',
                version: '1.0.0',
                description: 'Playwright Test Generator (from Crawlee dataset)',
                scripts: {
                        test: 'playwright test',
                        'test:headed': 'playwright test --headed',
                        'test:ui': 'playwright test --ui',
                        'test:report': 'playwright show-report',
                },
                devDependencies: {
                        '@playwright/test': '1.58.2',
                        typescript: '^5.4.0',
                        '@types/node': '^20.0.0',
                },
        }, null, 2) + '\n';
}

function generateTsConfig() {
        return JSON.stringify({
                compilerOptions: {
                        target: 'ES2020',
                        module: 'NodeNext',
                        moduleResolution: 'NodeNext',
                        strict: true,
                        esModuleInterop: true,
                        skipLibCheck: true,
                        forceConsistentCasingInFileNames: true,
                        types: ['node', '@playwright/test'],
                        outDir: 'dist',
                },
                include: ['tests/**/*.ts', 'pages/**/*.ts', 'fixtures/**/*.ts', 'playwright.config.ts'],
        }, null, 2) + '\n';
}

function generateGiteaWorkflow(opts) {
        return `name: Playwright UI Test

on:
    push:
        branches: [${opts.gitea.branch}]
    pull_request:
        branches: [${opts.gitea.branch}]

jobs:
    playwright:
        runs-on: ubuntu-latest
        container:
            image: ${opts.gitea.playwrightImage}
            options: >-
                --add-host host.docker.internal:host-gateway
                --mount type=volume,source=${opts.gitea.npmCacheVolume},target=/root/.npm

        steps:
            - name: Checkout
                uses: actions/checkout@v4

            - name: Install deps
                run: npm ci

            - name: Run tests
                env:
                    BASE_URL: http://${opts.gitea.appHost}
                run: npx playwright test
`;
}

function printHelp() {
        console.log(`
testgen.js — Generate Playwright tests from Crawlee dataset

USAGE:
    node testgen.js [dataset-dir] [output-dir] [options]

OPTIONS:
    --base-url            App URL for local test runs  (default: http://localhost:8000)
    --email               Test user email              (default: playwright@example.com)
    --password            Test user password           (default: playwright)
    --user-name           Test user display name       (default: Test User)

    --gitea-server-url    Gitea server URL             (default: http://gitea:3000)
    --gitea-app-host      Laravel app host in CI job   (default: 127.0.0.1:8000)
    --gitea-image         Playwright Docker image      (default: mcr.microsoft.com/playwright:v1.58.2-jammy)
    --gitea-branch        CI trigger branch            (default: main)
    --gitea-cache-vol     npm cache volume name        (default: playwright-npm-cache)
    --no-workflow         Skip .gitea/workflows generation
`);
}

function main() {
        const startTime = Date.now();
        const args = process.argv.slice(2);
    const scriptFile = fileURLToPath(import.meta.url);
    const scriptDir = path.dirname(scriptFile);

        if (args.includes('--help') || args.includes('-h')) {
                printHelp();
                process.exit(0);
        }

    const positionalArgs = extractPositionalArgs(args);
    const datasetDir = positionalArgs[0] ? path.resolve(positionalArgs[0]) : path.join(scriptDir, 'storage', 'datasets', 'default');
    const outputDir = positionalArgs[1] ? path.resolve(positionalArgs[1]) : path.join(scriptDir, 'playwright-tests');

        const opts = {
        baseUrl: flag(args, '--base-url') || 'http://host.docker.internal:8000',
                testUser: {
                        email: flag(args, '--email') || 'playwright@example.com',
                        password: flag(args, '--password') || 'playwright',
                        name: flag(args, '--user-name') || 'Test User',
                },
                gitea: {
                        enabled: !args.includes('--no-workflow'),
                        serverUrl: flag(args, '--gitea-server-url') || 'http://gitea:3000',
            appHost: flag(args, '--gitea-app-host') || 'host.docker.internal:8000',
                        playwrightImage: flag(args, '--gitea-image') || 'mcr.microsoft.com/playwright:v1.58.2-jammy',
            branch: flag(args, '--gitea-branch') || 'playwright',
                        npmCacheVolume: flag(args, '--gitea-cache-vol') || 'playwright-npm-cache',
                },
        };

        console.log('\nPlaywright Test Generator v1.0.0\n');
        console.log('Analysing Crawlee dataset...');
        console.log(`  ✓ Source : ${path.resolve(datasetDir)}`);
        console.log(`  ✓ Target : ${path.resolve(outputDir)}\n`);

        const byPath = loadDatasets(datasetDir);
        const analysis = analyzeDatasets(byPath);

        fs.rmSync(outputDir, { recursive: true, force: true });
        const dirs = [outputDir, 'fixtures', 'pages', 'tests'].map((d) => (d === outputDir ? d : path.join(outputDir, d)));
        if (opts.gitea.enabled) dirs.push(path.join(outputDir, '.gitea', 'workflows'));
        dirs.forEach((d) => fs.mkdirSync(d, { recursive: true }));

        const written = {
                pages: [],
                tests: [],
                config: [],
                workflow: [],
        };

        const write = (relPath, content) => {
                fs.writeFileSync(path.join(outputDir, relPath), content, 'utf8');
                if (relPath.startsWith('pages/')) written.pages.push(relPath);
                else if (relPath.startsWith('tests/')) written.tests.push(relPath);
                else if (relPath.startsWith('.gitea/')) written.workflow.push(relPath);
                else written.config.push(relPath);
        };

        write('playwright.config.ts', generatePlaywrightConfig(opts, analysis.hasAuth));
        write('package.json', generatePackageJson());
        write('tsconfig.json', generateTsConfig());
        write('fixtures/test-data.ts', generateFixtures(analysis.resources, opts));

        write('pages/BasePage.ts', generateBasePage());
        if (analysis.hasAuth) {
                write('pages/LoginPage.ts', generateLoginPage());
                write('pages/RegisterPage.ts', generateRegisterPage());
                write('pages/DashboardPage.ts', generateDashboardPage());
                write('tests/auth.setup.ts', generateAuthSetupSpec());
                write('tests/auth.spec.ts', generateAuthSpec());
        }

        if (analysis.hasProfile) {
                write('pages/ProfilePage.ts', generateProfilePage());
                write('tests/profile.spec.ts', generateProfileSpec());
        }

        for (const resource of analysis.resources) {
                write(`pages/${resource.className}Page.ts`, generateResourcePage(resource));
                write(`tests/${resource.name}.spec.ts`, generateResourceSpec(resource));
        }

        if (opts.gitea.enabled) {
                write('.gitea/workflows/playwright.yml', generateGiteaWorkflow(opts));
        }

        if (written.pages.length > 0) {
                console.log('Generating Page Objects...');
                written.pages.forEach((f) => console.log(`  ✓ ${f}`));
                console.log('');
        }

        if (written.tests.length > 0) {
                console.log('Generating Test Specs...');
                written.tests.forEach((f) => console.log(`  ✓ ${f}`));
                console.log('');
        }

        if (written.config.length > 0) {
                console.log('Generating Playwright Configuration...');
                written.config.forEach((f) => console.log(`  ✓ ${f}`));
                console.log('');
        }

        if (written.workflow.length > 0) {
                console.log('Generating Gitea CI/CD Workflow...');
                written.workflow.forEach((f) => console.log(`  ✓ ${f}`));
                console.log('');
        }

        const totalFiles = Object.values(written).flat().length;
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`Done in ${elapsedSec}s. ${totalFiles} artifacts generated successfully.\n`);

        console.log('Next Steps:');
        console.log('  1. Install dependencies');
        console.log(`     $ cd ${outputDir} && npm install\n`);
        console.log('  2. Run UI functional tests locally');
        console.log(`     $ BASE_URL=${opts.baseUrl} npx playwright test\n`);
        console.log('  3. Commit and push to Gitea');
        console.log('     $ git init && git add .');
        console.log('     $ git commit -m "test(ui): add playwright tests"');
        console.log('     $ git remote add origin <gitea-repo-url>');
        console.log(`     $ git push -u origin ${opts.gitea.branch}\n`);

        console.log('Test Credentials:');
        console.log(`  Email    : ${opts.testUser.email}`);
        console.log(`  Password : ${opts.testUser.password}\n`);
}

main();