# UI Parity Report

Tanggal audit: 13 Oktober 2026.

## Frozen source

| File | SHA-256 |
|---|---|
| `frontend/public/original-body.html` | `22C4EB8EF286AB24EF952DAD4DEC8A6361FAA91E4825CBE2C4ED586F382FB054` |
| `frontend/public/prototype-original.js` | `53D456BED57F6B6549F39073A010C2D3790D6603E58362A70635F8FCBBB7B60B` |
| `frontend/public/prototype-extras.js` | `BE3EDDAC7DB7421B9A5C6397C0C4497D1D01F4505F40DD53F7807912FC08EAE5` |
| `frontend/src/styles/prototype.css` | `4F352C80A6B434316A0434B7C44B7541C79987CB7618C70ED5F69AB02AD69D6C` |

`scripts/check-source-integrity.py` menyatakan CSS prototype tidak berubah, 28 route tersedia, dan tidak ada Docker Compose.

Playwright memeriksa halaman login pada 1920x1080, 1440x900, 1280x800, 1024x768, 768x1024, 390x844, dan 375x812. Suite juga memastikan CRM tetap memakai inline editing/toolbar native tanpa generic modal, export memulai download browser nyata, serta Settings mempertahankan visual grid native saat state disimpan.

Adapter React/API hanya menghubungkan event dan data. Perbaikan fixture email dilakukan pada salinan state runtime, bukan pada HTML, JavaScript, atau CSS prototype.

## Batas klaim

Belum ada baseline image dan pixel-diff otomatis, sehingga status yang dibuktikan adalah source integrity, route visibility, native interaction retention, dan multi-viewport smoke—not pixel-perfect screenshot equivalence.
