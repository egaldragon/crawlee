# Playwright

Project terpusat untuk web crawling dan test generation menggunakan Playwright dan Crawlee.

## Struktur Folder

```
playwright/
├── crawler/              # Crawlee-based web crawler
│   ├── src/
│   ├── dist/
│   ├── storage/         # Data storage
│   ├── package.json
│   └── tsconfig.json
├── testgen/             # Playwright test generator
│   ├── src/
│   ├── dist/
│   ├── tests/           # Generated test outputs
│   ├── package.json
│   └── tsconfig.json
├── storage/             # Data storage bersama
│   ├── datasets/        # Crawled data
│   ├── key_value_stores/
│   └── request_queues/
└── package.json         # Workspace root
```

## Instalasi

```bash
npm install
```

## Penggunaan

### Crawler

```bash
npm run crawler:dev       # Run crawler in development mode
npm run crawler:build     # Build crawler
npm run crawler:start     # Run compiled crawler
```

### Test Generator

```bash
npm run testgen:build     # Build test generator
npm run testgen:generate  # Generate tests from dataset
```

### Build Keduanya

```bash
npm run build
```

## Maintenance

- **Storage Terpusat**: Data crawler dan testgen disimpan di folder `storage/`
- **Independent Modules**: Setiap module memiliki `package.json` sendiri
- **Workspace Management**: Gunakan `npm -w [workspace-name]` untuk menjalankan perintah di workspace tertentu
