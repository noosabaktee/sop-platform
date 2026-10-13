# Fresh install dan diagnosis login (Windows PowerShell, tanpa Docker)

## 1. PostgreSQL
Buat database **baru dan kosong** `sop_platform` melalui pgAdmin/psql. Pastikan `DB_USERNAME` dan `DB_PASSWORD` di `backend/.env` adalah kredensial PostgreSQL yang benar.

## 2. Laravel
```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
# Edit .env: DB_DATABASE=sop_platform, DB_USERNAME=postgres, DB_PASSWORD=<password kamu>
php artisan config:clear
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Saat login, cek bahwa backend menjawab `http://127.0.0.1:8000/up`.

## 3. Vite
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Isi **frontend/.env** dengan `VITE_API_BASE_URL=` kosong untuk instalasi lokal. Vite meneruskan `/api` dan `/sanctum` otomatis. Jika telanjur diisi `http://127.0.0.1:8000/api`, versi ini sekarang menghapus `/api` ganda; tetap dianjurkan kosong agar cookie Sanctum konsisten.

Buka alamat `http://127.0.0.1:5173/#/login` secara konsisten. Hindari berpindah antara `localhost` dan `127.0.0.1` ketika memeriksa cookie browser.

Akun development yang dibuat oleh `DatabaseSeeder`: `admin@sop.local`; password bawaan `ChangeMe-2026!` (atau nilai env `SOP_SEED_PASSWORD` jika kamu mengubahnya *sebelum* seeding). Password untuk development ini **wajib diganti** sebelum menggunakan lingkungan yang dapat diakses pihak lain.

## 4. Jika gagal login
Di Chrome DevTools > Network:
- `GET /sanctum/csrf-cookie` harus 204 dan menghasilkan cookie XSRF.
- `POST /api/login` harus 200 (jika 422: password/email salah; 419: cookie/CSRF; 500: log Laravel atau SQL; `ERR_CONNECTION_REFUSED`: Laravel tidak berjalan).
- `GET /api/v1/me` harus 200 setelah login.

Gunakan `php artisan route:list --path=api` dan periksa `backend/storage/logs/laravel.log`. Cek `.env` sudah diedit dan jalankan `php artisan config:clear` setelah mengubahnya.

### Menguji pengguna yang memang ter-seed
```powershell
php artisan tinker
# User::where('email','admin@sop.local')->first(['id','email','is_active','role']);
```
Jangan mengirim password atau APP_KEY ke chat. Jangan menggunakan `migrate:fresh` kecuali database target boleh dihapus.

## 5. Pengujian tahap 2–5 (database uji terpisah)
1. Buat database `sop_platform_test` terpisah.
2. Salin `backend/.env.testing.example` menjadi `backend/.env.testing` dan isi koneksinya (jangan gunakan DB kerja).
3. Jalankan `scripts/verify-stage-2-5.ps1` dari folder root. Skrip menolak DB yang namanya bukan `sop_platform_test`.
4. Uji lewat browser dan Playwright setelah API dan UI running; pengujian sintaks saja bukan pengujian end-to-end.
