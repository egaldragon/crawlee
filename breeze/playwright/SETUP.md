# Playwright - Setup Guide

## Struktur Baru

Folder `playwright` sekarang adalah workspace terpusat untuk semua komponen Playwright:

```
playwright/
├── crawler/              # Crawlee-based crawler (TypeScript)
├── testgen/              # Playwright test generator (TypeScript)
├── storage/              # Data storage terpusat (symlink di crawler)
├── package.json          # Workspace root dengan npm workspaces
├── README.md
└── .gitignore
```

## Fitur Utama

### 1. **Storage Terpusat**
- Data dari crawler disimpan di `storage/datasets/`
- Testgen membaca dari lokasi yang sama
- Symlink di crawler mengarah ke storage terpusat
- Path referensi: `../storage/datasets/default`

### 2. **NPM Workspaces**
Kelola kedua module dari satu tempat:

```bash
# Build keduanya
npm run build

# Install dependencies untuk semua workspace
npm install

# Jalankan command di workspace tertentu
npm -w crawler run dev
npm -w testgen run generate
```

### 3. **Independent Build & Runtime**
- Setiap module punya `package.json` dan `tsconfig.json` sendiri
- Dapat dijalankan secara independen atau melalui workspace

## Migrasi dari Setup Lama

Jika sudah ada data di setup lama:

```bash
# Copy data dari crawler lama ke storage terpusat
cp -r breeze/crawler/storage/datasets/* breeze/playwright/storage/datasets/
cp -r breeze/crawler/storage/key_value_stores/* breeze/playwright/storage/key_value_stores/
cp -r breeze/crawler/storage/request_queues/* breeze/playwright/storage/request_queues/
```

## Development Workflow

### Menggunakan Crawler

```bash
cd breeze/playwright

# Install dependencies
npm install

# Development mode
npm run crawler:dev

# Build saja
npm run crawler:build

# Jalankan hasil build
npm run crawler:start
```

### Menggunakan Test Generator

```bash
cd breeze/playwright

# Build testgen
npm run testgen:build

# Generate tests dari dataset
npm run testgen:generate
# atau
npm -w testgen run generate
```

## Maintenance Tips

1. **Dependencies Bersama**: Jika ada library yang digunakan kedua module, pertimbangkan untuk install di root `package.json`
2. **Storage Cleanup**: Data besar di `storage/` bisa di-gitignore tapi tracked dengan `.gitkeep`
3. **Update Paths**: Jika ingin move folder, pastikan update symlink dan path referensi
4. **Backward Compatibility**: Folder lama (`breeze/crawler`, `breeze/testgen`) bisa dihapus setelah migrasi sukses

## Troubleshooting

### Symlink tidak berfungsi (Windows)
Jika di Windows, gunakan copy folder daripada symlink:
```bash
rm crawler/storage
xcopy ..\storage .\crawler\storage\ /E /I
```

### Dependency issues
```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### Dataset tidak ditemukan
Pastikan struktur storage sudah sesuai:
```
storage/
├── datasets/
│   ├── default/  (← testgen cari di sini)
│   └── .gitkeep
├── key_value_stores/
│   └── .gitkeep
└── request_queues/
    └── .gitkeep
```
