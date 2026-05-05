# Testgen (TypeScript)

Generates Playwright tests from Crawlee datasets.

## Usage

```bash
cd /home/ubuntu/crawlee/breeze/testgen
npm install
npm run build
node dist/index.js
```

By default it reads datasets from:

```
../crawler/storage/datasets/default
```

You can override paths:

```bash
node dist/index.js /path/to/dataset /path/to/output --base-url http://localhost:8000
```
