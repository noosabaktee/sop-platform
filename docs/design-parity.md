# Design parity contract

**Sumber kebenaran:** `frontend/public/reference/prototype.html`, salinan persis `prototype(2).html`.

- CSS `frontend/src/styles/prototype.css` sama byte-for-byte dengan CSS yang diekstrak dari sumber.
- Markup semua halaman disajikan dari `frontend/public/original-body.html` tanpa render ulang tabel.
- Semua native DOM interactions dieksekusi kembali dari `frontend/public/prototype-original.js` dan `prototype-extras.js`. Perubahan script dibatasi pada konektor state grid ke PostgreSQL.
- Tidak ada library komponen visual baru atau styling UI tambahan kecuali loading progress bar.
- Screenshot pixel-diff yang sesungguhnya **belum lulus/dijalankan**; kebetulan sama CSS saja tidak menjamin pixel parity runtime. Perlu 7 viewport dan dark mode/scroll/subtab/selected/drawer.
