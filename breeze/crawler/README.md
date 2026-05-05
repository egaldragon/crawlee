# Modular Playwright Crawler

A TypeScript-based modular web crawler built with Crawlee and Playwright for automated discovery of web application routes and page structures.

## Project Structure

```
crawler/
├── src/
│   ├── index.ts          # Main entry point
│   ├── types.ts          # Type definitions
│   ├── config.ts         # Configuration management
│   ├── utils.ts          # Utility functions
│   ├── auth.ts           # Authentication logic
│   ├── extractor.ts      # Page data extraction
│   └── phases.ts         # Crawler phases (guest and auth)
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## File Descriptions

### `src/index.ts`
Main entry point that orchestrates the entire crawling process:
- Initializes storage directories
- Loads configuration
- Executes guest and authenticated phases
- Reports completion

### `src/types.ts`
TypeScript type definitions for:
- Form inputs and data structures
- Page components (tables, actions)
- Extracted page data
- Crawler configuration
- Request and session data

### `src/config.ts`
Configuration management:
- Default crawler settings
- Environment variable overrides
- Seed paths for guest and authenticated crawling
- URL patterns to exclude from crawling
- Helper function to merge custom overrides

### `src/utils.ts`
Utility functions:
- `createQueueName()` - Generate unique queue names with timestamps
- `normalizePathname()` - Normalize URLs by replacing IDs with `[id]` placeholders
- `toAbsoluteUrl()` - Convert relative paths to absolute URLs
- `clearDefaultDataset()` - Clean previous crawl data
- `ensureStorageDirectories()` - Create required storage directories

### `src/auth.ts`
Authentication utilities:
- `authenticate()` - Handle user login
- `isAuthenticated()` - Verify authentication status

### `src/extractor.ts`
Page data extraction functions:
- `extractPageData()` - Main extraction function that collects forms, tables, and actions
- `getPageTitle()` - Safely get page title
- `extractPageContent()` - Extract text content from pages

Uses client-side JavaScript evaluation to extract:
- Form data (inputs, selects, textareas with labels)
- Table structures (columns, actions)
- Action links (create, edit, delete, etc.)

### `src/phases.ts`
Crawler phase implementations:
- `runGuestPhase()` - Discover publicly accessible routes
- `runAuthPhase()` - Discover authenticated-only routes
- Manages visited route tracking to avoid duplicates

## Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd crawler
npm install
```

### Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Configuration

Configure the crawler using environment variables:

```bash
# Set the target application URL
export START_URL="http://127.0.0.1:8000"

# Set test credentials
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="password123"

# Run with browser visible (headless=true by default)
export HEADLESS="false"
```

### Custom Configuration

Edit `src/config.ts` to modify default paths and patterns:

```typescript
guestSeedPaths: ['/', '/login', '/register'],
protectedSeedPaths: ['/dashboard', '/profile'],
guestExcludePatterns: ['**/logout**'],
authExcludePatterns: ['**/delete**'],
```

## Usage

### Development Mode
```bash
npm run dev
```
Compiles TypeScript and runs the crawler immediately.

### Production Mode
```bash
npm run build
npm start
```

## Output

The crawler generates JSON datasets in `storage/datasets/default/`:

Each entry contains:
- `title` - Page title
- `url` - Full page URL
- `pathname` - Requested path
- `effectivePathname` - Normalized path (IDs replaced with `[id]`)
- `phase` - 'guest' or 'auth'
- `forms` - Array of form structures
- `components.tables` - Array of table structures
- `components.actions` - Array of action links

## How It Works

### Phase 1: Guest Discovery
1. Starts from configured guest seed paths
2. Crawls all linked pages (same domain)
3. Extracts forms, tables, and actions
4. Follows links while respecting exclusion patterns

### Phase 2: Authenticated Discovery
1. Authenticates using configured credentials
2. Crawls protected seed paths
3. Extracts data from authenticated-only pages
4. Maintains session cookies across requests

## Key Features

✅ **Modular Architecture** - Clean separation of concerns
✅ **TypeScript** - Full type safety
✅ **Configurable** - Environment-based configuration
✅ **Normalization** - Consistent path normalization
✅ **Deduplication** - Prevents duplicate route extraction
✅ **Session Management** - Handles authentication
✅ **Form Extraction** - Collects form structures
✅ **Action Discovery** - Identifies CRUD operations

## Extending the Crawler

### Add Custom Extractors
Create new functions in `src/extractor.ts`:

```typescript
export async function extractCustomData(page: Page): Promise<CustomData> {
  // Extract custom data
}
```

### Add New Phases
Add functions to `src/phases.ts`:

```typescript
export async function runCustomPhase(config: CrawlerConfig): Promise<void> {
  // Custom crawling logic
}
```

### Modify Configuration
Update `src/config.ts` or use environment variables.

## Troubleshooting

### Authentication fails
- Verify credentials in `.env` file
- Check login form selectors match your application
- Ensure cookies are being persisted

### Routes not discovered
- Check `guestSeedPaths` and `protectedSeedPaths`
- Review `guestExcludePatterns` - may be too restrictive
- Look for JavaScript-generated links

### No data output
- Verify storage directories exist
- Check browser is closing properly
- Review Crawlee logs for errors

## Dependencies

- **crawlee** - Web crawling framework
- **playwright** - Browser automation
- **typescript** - Language support
- **@types/node** - Node.js type definitions

## License

MIT
