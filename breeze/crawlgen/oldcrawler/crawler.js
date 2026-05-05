import { PlaywrightCrawler, Dataset, RequestQueue } from 'src';

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
    startUrl: 'http://127.0.0.1:8000',
    credentials: {
        email: 'playwright@example.com',
        password: 'playwright'
    },
    // Exclude protected routes during guest phase to prevent premature redirects
    guestExcludePatterns: ['**/dashboard**', '**/profile**', '**/categories**', '**/posts**', '**/logout**'],
    // Exclude destructive actions during auth phase
    authExcludePatterns: ['**/logout**', '**/delete**', '**/?destroy**']
};

// Global state to track and deduplicate route patterns (e.g., /posts/1 and /posts/2 become /posts/[id])
const visitedRoutePatterns = new Set();

function createQueueName(prefix) {
    return `${prefix}-${Date.now()}`;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function getRoutePattern(urlPath) {
    return urlPath.replace(/\/\d+(?=\/|$)/g, '/[id]');
}

async function extractPageData(page, request, routePattern) {
    const pageTitle = await page.title();
    
    const pageData = await page.evaluate(() => {
        const extractForms = () => {
            return Array.from(document.querySelectorAll('form')).map(form => {
                if (form.action.includes('logout')) return null;

                let actionPath = new URL(form.action, window.location.href).pathname;
                actionPath = actionPath.replace(/\/\d+(?=\/|$)/g, '/[id]');

                return {
                    action: actionPath,
                    method: (form.getAttribute('method') || 'GET').toUpperCase(),
                    inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
                        name: input.getAttribute('name'),
                        type: input.getAttribute('type') || input.tagName.toLowerCase(),
                        placeholder: input.getAttribute('placeholder') || null,
                        required: input.hasAttribute('required')
                    }))
                };
            }).filter(Boolean);
        };

        const extractTables = () => {
            return Array.from(document.querySelectorAll('table')).map(table => {
                const headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText.trim());
                const hasActions = table.querySelector('td button, td a[href*="edit"]') !== null;
                return { columns: headers, hasActions };
            });
        };

        const extractActions = () => {
            return Array.from(document.querySelectorAll('button:not([type="submit"]), a')).map(el => {
                const text = el.innerText.trim();
                const href = el.getAttribute('href');
                
                if (text.match(/create|edit|delete|new/i)) {
                    return { 
                        text, 
                        href: href ? href.replace(/\/\d+(?=\/|$)/g, '/[id]') : null, 
                        tag: el.tagName.toLowerCase() 
                    };
                }
                return null;
            }).filter(Boolean);
        };

        return {
            forms: extractForms(),
            tables: extractTables(),
            actions: extractActions()
        };
    });

    return {
        title: pageTitle,
        url: request.url,
        pathname: routePattern,
        forms: pageData.forms,
        components: {
            tables: pageData.tables,
            actions: pageData.actions
        }
    };
}

// ==========================================
// CRAWLER PHASES
// ==========================================
async function runGuestPhase() {
    console.log('PHASE 1: Discovering guest routes');
    const guestQueue = await RequestQueue.open(createQueueName('guest-queue'));

    const crawler = new PlaywrightCrawler({
        requestQueue: guestQueue,
        headless: true,
        maxConcurrency: 1, 
        async requestHandler({ page, request, enqueueLinks, log }) {
            const urlObj = new URL(request.url);
            const routePattern = getRoutePattern(urlObj.pathname);

            if (visitedRoutePatterns.has(routePattern)) return;
            
            log.info(`Extracting: ${urlObj.pathname}`);
            visitedRoutePatterns.add(routePattern);

            const dataset = await extractPageData(page, request, routePattern);
            await Dataset.pushData(dataset);

            await enqueueLinks({
                strategy: 'same-domain',
                exclude: CONFIG.guestExcludePatterns
            });
        }
    });

    await crawler.run([CONFIG.startUrl]);
}

async function runAuthPhase() {
    console.log('\nPHASE 2: Discovering protected routes');
    const authQueue = await RequestQueue.open(createQueueName('auth-queue'));
    let isAuthenticated = false;

    const crawler = new PlaywrightCrawler({
        requestQueue: authQueue,
        headless: true,
        maxConcurrency: 1, 
        async requestHandler({ page, request, enqueueLinks, log }) {
            const urlObj = new URL(request.url);
            const routePattern = getRoutePattern(urlObj.pathname);

            // Handle Authentication
            if (request.url.includes('/login') && !isAuthenticated) {
                log.info('Authenticating to access protected routes');
                await page.fill('input[name="email"]', CONFIG.credentials.email);
                await page.fill('input[name="password"]', CONFIG.credentials.password);
                
                await Promise.all([
                    page.waitForNavigation(),
                    page.click('button[type="submit"]')
                ]);
                
                isAuthenticated = true; 
                log.info('Authentication successful. Enqueuing protected routes');
                
                await enqueueLinks({ strategy: 'same-domain', exclude: ['**/logout**'] });
                return; 
            }

            // Skip if pattern is already documented
            if (visitedRoutePatterns.has(routePattern)) return;
            
            log.info(`Extracting: ${urlObj.pathname}`);
            visitedRoutePatterns.add(routePattern);

            const dataset = await extractPageData(page, request, routePattern);
            await Dataset.pushData(dataset);

            await enqueueLinks({
                strategy: 'same-domain',
                exclude: CONFIG.authExcludePatterns
            });
        }
    });

    await crawler.run([`${CONFIG.startUrl}/login`]);
}

// ==========================================
// MAIN EXECUTION
// ==========================================
(async () => {
    console.log('=== STARTING LOCIDA DISCOVERY ===\n');

    await runGuestPhase();
    await runAuthPhase();

    console.log('\nDiscovery completed. JSON datasets are available in storage/datasets/default');
})();