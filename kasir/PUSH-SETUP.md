# Mengaktifkan push notifikasi

Push latar belakang sudah disiapkan untuk pesanan masuk, pesanan selesai, mode ramai, dan tortilla tersisa 5 pcs atau kurang. Firebase harus mengirim push dari server agar perangkat tetap menerima saat halaman kasir ditutup.

## 1. Pasang VAPID key

Di Firebase Console project `kasir-arsyla-v2`, buka **Project settings → Cloud Messaging → Web configuration**. Public VAPID key sudah terpasang pada `index.html`; jika key di Console berbeda, perbarui konstanta `FCM_VAPID_KEY`. Jangan pernah menaruh private key atau service account di dalam `index.html`.

## 2. Atur Realtime Database

Rules saat ini mengizinkan semua orang membaca dan menulis seluruh isi database agar aplikasi tanpa login dapat dipakai di semua perangkat. Ini juga berarti data dapat diubah oleh siapa saja yang mengetahui alamat database.

## 3. Deploy fungsi server

Dari folder `kasir`, gunakan Firebase CLI dengan akun yang memiliki akses ke project:

```sh
cd functions
npm install
cd ..
firebase deploy --only database,functions
```

Deploy Cloud Functions dapat meminta project menggunakan paket Blaze dan mengaktifkan Cloud Billing. Fungsi memakai identitas layanan Firebase saat berjalan; tidak perlu menaruh kredensial server di browser.

## 4. Host lewat HTTPS dan aktifkan per perangkat

Buka aplikasi melalui HTTPS, beri izin notifikasi browser, lalu aktifkan pengaturan notifikasi pesanan pada setiap perangkat yang ingin menerima push. Token perangkat akan dicatat di `pushTokens`. Browser perlu mendukung Web Push; iPhone/iPad perlu aplikasi ditambahkan ke Home Screen dan izin diberikan dari sana.

Notifikasi sistem saat aplikasi tertutup mengikuti pengaturan suara sistem perangkat. Web Push tidak dapat memutar file MP3 lokal atau menjamin alarm berulang ketika halaman tertutup.
