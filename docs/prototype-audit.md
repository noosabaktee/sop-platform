# Audit Prototype SOP

Sumber: `prototype(2).html` (28 halaman). CSS disalin tanpa perubahan nilai. Konten tab yang dihasilkan prototype JS diekstrak dari browser untuk 24 route; empat route akhir menggunakan markup asli tetapi konten tab dinamis belum sepenuhnya dimigrasi.

| Route | Tab captured | Tabel | Aksi |
|---|---:|---:|---:|
| `/overview` | 0 | 2 | 83 |
| `/my-workspace` | 9 | 9 | 92 |
| `/dashboard` | 7 | 7 | 198 |
| `/crm-sales` | 7 | 14 | 166 |
| `/business-development` | 10 | 20 | 205 |
| `/quotation` | 11 | 21 | 162 |
| `/sales` | 7 | 7 | 61 |
| `/projects` | 17 | 17 | 91 |
| `/purchase` | 7 | 7 | 61 |
| `/inventory` | 9 | 9 | 67 |
| `/finance` | 3 | 3 | 49 |
| `/reports` | 12 | 12 | 76 |
| `/management` | 12 | 12 | 76 |
| `/master-data` | 13 | 13 | 79 |
| `/document-management` | 11 | 2 | 73 |
| `/document-template` | 8 | 4 | 64 |
| `/email-communication` | 15 | 0 | 85 |
| `/omnichannel` | 12 | 0 | 76 |
| `/whatsapp-integration` | 12 | 0 | 40 |
| `/general-meeting-rups` | 15 | 0 | 85 |
| `/workflow-approval` | 7 | 1 | 62 |
| `/corporate` | 7 | 0 | 47 |
| `/ai-assistant` | 15 | 0 | 40 |
| `/data-intelligence` | 12 | 7 | 41 |
| `/integrations` | 11 | 11 | 46 |
| `/security-audit` | 7 | 6 | 44 |
| `/settings` | 12 | 2 | 48 |
| `/login` | 3 | 0 | 0 |

## Komponen dan interaksi

`frontend/src/page-registry.json` memuat tab dan inventaris semua atribut `data-action`. Handler lama tidak dipindahkan secara utuh; fungsi yang belum diganti API didokumentasikan di `feature-matrix.md`.

## Data fixture

`backend/database/seeders/data/prototype_seed.json` adalah hasil ekstraksi snapshot yang disimpan untuk referensi migration/seeder. Sebagian snapshot tidak memiliki isi tabel karena baris prototype sudah dihapus saat capture; seeder menggunakan contoh data yang terhubung.
