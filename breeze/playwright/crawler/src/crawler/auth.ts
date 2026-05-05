import type { Page } from 'playwright';
import { CrawlerConfig } from '../extract/types.js';
import type { Logger } from '../extract/types.js';
import { toAbsoluteUrl } from '../core/utils.js';

export async function authenticate(
  page: Page,
  config: CrawlerConfig,
  log: Logger
): Promise<boolean> {
  if (!page.url().includes('/login')) {
    await page.goto(toAbsoluteUrl('/login', config), {
      waitUntil: 'domcontentloaded',
    });
  }

  log.info('Authenticating session');
  await page.fill('input[name="email"]', config.credentials.email);
  await page.fill('input[name="password"]', config.credentials.password);

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
