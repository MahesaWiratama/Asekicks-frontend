# Asekicks Admin

Dashboard admin produk toko sepatu **Asekicks** untuk tugas *BAB IV – Integrasi React dengan REST API Laravel* (React + Axios + React Query + React Hot Toast + Context API).

Pemilik: I Gede Mahesa Wiratama (2415101023) – Ilmu Komputer, Undiksha.

## Cara menjalankan

Butuh Node.js 18+.

```bash
npm install
```

Pilih salah satu backend:

### A. Backend Laravel milik kamu (asekicks-laravel-api)

```bash
# di folder Laravel
composer install
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve             # http://127.0.0.1:8000
```

### B. API tiruan (tanpa Laravel, untuk mencoba cepat)

```bash
npm run api                   # http://127.0.0.1:8000/api
```

Jangan jalankan A dan B bersamaan, keduanya memakai port 8000.

### Menjalankan frontend

```bash
npm run dev                   # http://localhost:5173
```

Login memakai akun dari seeder Laravel (API tiruan memakai akun yang sama):

| Peran | Email | Password |
|---|---|---|
| Admin | `test@example.com` | `password` |

Bila alamat API berbeda, salin `.env.example` menjadi `.env` lalu ubah `VITE_API_URL`, dan restart `npm run dev`.

`npm run test:api` (saat API tiruan menyala) menjalankan 18 pengujian otomatis untuk API tiruan.

## Fitur

- **Login admin** (token Sanctum disimpan di localStorage, dikirim otomatis lewat interceptor Axios) dan **Logout**.
- **CRUD produk**: tambah, ubah, hapus (dengan konfirmasi toast), upload gambar.
- **Relasi kategori**: dropdown diisi dari `GET /categories`.
- **Search & Filter**: pilih kategori + kata kunci, tombol **Cari** (juga tombol Reset).
- **Pagination**: Sebelumnya / nomor halaman / Berikutnya, 5 produk per halaman.
- Validasi dari server (422) tampil di bawah tiap field.

## Struktur

```
server/            API tiruan (tanpa dependensi) + smoke test + foto sepatu
src/utils/         apiClient (Axios + interceptor), auth, ProductContext (useContext), format, pagination
src/components/    ProductSearchBar, Pagination, RequireAuth, confirmDeleteToast, ProductFormFields
src/layouts/       AdminLayout (sidebar + Logout + Outlet)
src/pages/         Login
src/pages/adminpages/  AdminDashboard, ProductForm, ProductEdit, AboutPage
```

## Kontrak API (sesuai asekicks-laravel-api)

| Aksi | Request | Akses |
|---|---|---|
| Login | `POST /login` (email, password) -> `{ token, user }` | publik |
| Daftar produk | `GET /products?page=1&per_page=5&category_id=1&search=nike` -> `{ data, meta }` | publik |
| Detail | `GET /products/:id` -> `{ data }` | publik |
| Kategori | `GET /categories` -> `[ { category_id, category } ]` | publik |
| Tambah | `POST /products` (multipart, field `img` untuk gambar) | token admin |
| Ubah | `POST /products/:id?_method=PUT` (multipart), harus 200 | token admin |
| Hapus | `DELETE /products/:id` | token admin |
| Logout | `POST /logout` | token |
| Validasi gagal | status 422, `{ message, errors: { field: [pesan] } }` | |

## Kesesuaian dengan 4.4 Evaluasi

| Poin | Di mana |
|---|---|
| Memahami Axios | `src/utils/apiClient.js` (baseURL, header, interceptor token) |
| UseContext pada ProductContext | `src/utils/ProductContext.jsx`, dibungkus di `src/main.jsx` |
| Modul CRUD | `ProductContext.jsx`, `AdminDashboard`, `ProductForm`, `ProductEdit` |
| Fitur search + pagination | `ProductSearchBar.jsx`, `Pagination.jsx`, `AdminDashboard.jsx` |

## Catatan

- React Query yang dipakai versi 5, sehingga invalidasi cache ditulis `invalidateQueries({ queryKey: ['products'] })` (modul memakai bentuk array versi 4).
- Styling memakai CSS biasa (bukan Tailwind) agar proyek mudah dijalankan.
- Bila muncul "blocked by CORS policy" di Console browser, periksa pengaturan CORS Laravel (`config/cors.php`, `paths` memuat `api/*`).
