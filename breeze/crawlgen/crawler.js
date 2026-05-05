import fs from 'fs';
import path from 'path';
import { PlaywrightCrawler, Dataset, RequestQueue } from 'crawlee';

const CONFIG = {
    startUrl: process.env.START_URL || 'http://127.0.0.1:8000',
    credentials: {
        email: process.env.TEST_EMAIL || 'playwright@example.com',
        password: process.env.TEST_PASSWORD || 'playwright',
    },
    headless: process.env.HEADLESS !== 'false',
    guestSeedPaths: ['/', '/login', '/register', '/forgot-password'],
    protectedSeedPaths: ['/dashboard', '/profile', '/categories', '/categories/create', '/posts', '/posts/create'],
    guestExcludePatterns: ['**/logout**', '**/dashboard**', '**/profile**', '**/categories**', '**/posts**'],
    authExcludePatterns: ['**/logout**', '**/delete**', '**/?destroy**'],
};

const visitedRoutePatterns = new Set();

function createQueueName(prefix) {
    return `${prefix}-${Date.now()}`;
}

function normalizePathname(pathname) {
    if (!pathname || pathname === '/') return '/';
    let normalized = pathname.replace(/\/\d+(?=\/|$)/g, '/[id]').replace(/\/$/, '');
    if (!normalized.startsWith('/')) normalized = `/${normalized}`;
    return normalized || '/';
}

function toAbsoluteUrl(pathname) {
    return new URL(pathname, CONFIG.startUrl).toString();
}

function clearDefaultDataset() {
    const datasetPath = path.resolve('./storage/datasets/default');
    fs.rmSync(datasetPath, { recursive: true, force: true });
}

async function authenticate(page, log) {
    if (!page.url().includes('/login')) {
        await page.goto(toAbsoluteUrl('/login'), { waitUntil: 'domcontentloaded' });
    }

    log.info('Authenticating session');
    await page.fill('input[name="email"]', CONFIG.credentials.email);
    await page.fill('input[name="password"]', CONFIG.credentials.password);

    await Promise.all([
        page.waitForURL(/\/dashboard|\/login/, { timeout: 15000 }),
        page.click('button[type="submit"]'),
    ]);

    const isAuthenticated = page.url().includes('/dashboard');
    if (!isAuthenticated) {
        log.warning(`Auth did not reach /dashboard. Current URL: ${page.url()}`);
    }
    return isAuthenticated;
}

async function extractPageData(page, request, requestedPathname, phase) {
    const effectivePathname = normalizePathname(new URL(page.url()).pathname);
    const pageTitle = await page.title();

    const pageData = await page.evaluate(() => {
        const normalizePath = (value) => {
            if (!value) return null;
            return value.replace(/\/\d+(?=\/|$)/g, '/[id]').replace(/\/$/, '') || '/';
        };

        const toLabel = (el) => {
            const id = el.getAttribute('id');
            if (id) {
                const byFor = document.querySelector(`label[for="${id}"]`);
                if (byFor?.textContent?.trim()) return byFor.textContent.trim();
            }

            const wrapped = el.closest('label');
            if (wrapped?.textContent?.trim()) return wrapped.textContent.trim();

            const ariaLabel = el.getAttribute('aria-label');
            if (ariaLabel?.trim()) return ariaLabel.trim();

            const placeholder = el.getAttribute('placeholder');
            if (placeholder?.trim()) return placeholder.trim();

            const name = el.getAttribute('name');
            if (name?.trim()) return name.replace(/[_-]/g, ' ').trim();

            return el.tagName.toLowerCase();
        };

        const forms = Array.from(document.querySelectorAll('form'))
            .map((form) => {
                if ((form.action || '').includes('logout')) return null;

                const action = normalizePath(new URL(form.action || window.location.href, window.location.href).pathname);
                const method = (form.getAttribute('method') || 'GET').toUpperCase();

                const inputs = Array.from(form.querySelectorAll('input, select, textarea')).map((input) => {
                    const tag = input.tagName.toLowerCase();
                    const type = input.getAttribute('type') || tag;

                    return {
                        name: input.getAttribute('name') || null,
                        label: toLabel(input),
                        type,
                        tag,
                        placeholder: input.getAttribute('placeholder') || null,
                        required: input.hasAttribute('required'),
                    };
                });

                return { action, method, inputs };
            })
            .filter(Boolean);

        const tables = Array.from(document.querySelectorAll('table')).map((table) => {
            const columns = Array.from(table.querySelectorAll('th'))
                .map((th) => th.textContent?.trim() || '')
                .filter(Boolean);
            const hasActions = !!table.querySelector('a[href*="edit"], button, form button');
            return { columns, hasActions };
        });

        const actions = Array.from(document.querySelectorAll('a, button'))
            .map((el) => {
                const text = (el.textContent || '').trim();
                if (!text) return null;
                const href = el.tagName.toLowerCase() === 'a' ? el.getAttribute('href') : null;
                const absHref = href ? new URL(href, window.location.href).pathname : null;

                if (!/create|new|edit|delete|save|submit/i.test(text) && !(absHref && /create|edit/.test(absHref))) {
                    return null;
                }

                return {
                    text,
                    tag: el.tagName.toLowerCase(),
                    href: absHref ? normalizePath(absHref) : null,
                };
            })
            .filter(Boolean);

        return { forms, tables, actions };
    });

    return {
        title: pageTitle,
        url: request.url,
        pathname: requestedPathname,
        effectivePathname,
        phase,
        forms: pageData.forms,
        components: {
            tables: pageData.tables,
            actions: pageData.actions,
        },
    };
}

async function runGuestPhase() {
    console.log('PHASE 1: Discovering guest routes');
    const guestQueue = await RequestQueue.open(createQueueName('guest-queue'));

    for (const pathItem of CONFIG.guestSeedPaths) {
        await guestQueue.addRequest({ url: toAbsoluteUrl(pathItem), uniqueKey: `guest:${normalizePathname(pathItem)}` });
    }

    const crawler = new PlaywrightCrawler({
        requestQueue: guestQueue,
        headless: CONFIG.headless,
        maxConcurrency: 1,
        async requestHandler({ page, request, enqueueLinks, log }) {
            const requestedPathname = normalizePathname(new URL(request.url).pathname);

            if (visitedRoutePatterns.has(requestedPathname)) return;

            log.info(`Extracting guest route: ${requestedPathname}`);
            visitedRoutePatterns.add(requestedPathname);

            const dataset = await extractPageData(page, request, requestedPathname, 'guest');
            await Dataset.pushData(dataset);

            await enqueueLinks({
                strategy: 'same-domain',
                exclude: CONFIG.guestExcludePatterns,
            });
        },
    });

    await crawler.run();
}

async function runAuthPhase() {
    console.log('\nPHASE 2: Discovering protected routes');
    const authQueue = await RequestQueue.open(createQueueName('auth-queue'));

    await authQueue.addRequest({ url: toAbsoluteUrl('/login'), uniqueKey: 'auth:/login', userData: { loginStep: true } });
    for (const pathItem of CONFIG.protectedSeedPaths) {
        await authQueue.addRequest({
            url: toAbsoluteUrl(pathItem),
            uniqueKey: `auth:${normalizePathname(pathItem)}`,
            userData: { requiresAuth: true },
        });
    }

    const crawler = new PlaywrightCrawler({
        requestQueue: authQueue,
        headless: CONFIG.headless,
        maxConcurrency: 1,
        useSessionPool: true,
        sessionPoolOptions: { maxPoolSize: 1 },
        persistCookiesPerSession: true,
        preNavigationHooks: [
            async ({ page, log, session }) => {
                session.userData = session.userData || {};
                if (!session.userData.authenticated) {
                    session.userData.authenticated = await authenticate(page, log);
                }
            }
        ],
        async requestHandler({ page, request, log }) {
            const requestedPathname = normalizePathname(new URL(request.url).pathname);
            const effectivePathname = normalizePathname(new URL(page.url()).pathname);

            if (request.userData.requiresAuth && effectivePathname === '/login') {
                log.warning(`Skipping ${requestedPathname}: still redirected to /login`);
                return;
            }

            if (visitedRoutePatterns.has(requestedPathname)) return;

            log.info(`Extracting auth route: ${requestedPathname}`);
            visitedRoutePatterns.add(requestedPathname);

            const dataset = await extractPageData(page, request, requestedPathname, 'auth');
            await Dataset.pushData(dataset);
        },
    });

    await crawler.run();
}

(async () => {
    console.log('=== STARTING PLAYWRIGHT DISCOVERY ===\n');
    clearDefaultDataset();

    await runGuestPhase();
    await runAuthPhase();

    console.log('\nDiscovery completed. JSON datasets are available in storage/datasets/default');
})();