# 🚀 Smart Trading Journal & Compound Planner Pro

Aplikasi **Trading Journal & Compound Growth Planner** dengan tampilan **Mobile-First App**, dilengkapi kalkulator Lot Dinamis, Analisa Otomatis 05:00 AM, Cloud Sync Firebase Firestore, Deployment Otomatis ke Google Cloud Run, dan Sistem Auto-Update APK Android.

---

## 🌟 Fitur Utama

1. **Compound Interest Growth Planner**:
   - Atur **Modal Awal** (USD / IDR).
   - Fitur **Deposit Rutin Bulanan** dengan tanggal yang bisa ditentukan (misal tanggal 25 tiap bulan).
   - Target **Profit Bulanan & Target Harian**.
   - Simulasi proyeksi pertumbuhan modal hingga 12 / 24 / 36 bulan ke depan.

2. **Dynamic Lot Sizing & Risk Management Engine**:
   - Sistem otomatis menghitung ukuran **Lot Ideal** berdasarkan modal saat ini, persentase risiko per trade, dan jarak Stop Loss (SL).
   - **Tangga Milestone Lot (Step-Up & Step-Down)**: Memberi tahu kapan lot harus dinaikkan saat modal bertumbuh, dan kapan harus diturunkan saat terjadi drawdown untuk melindungi modal.
   - Peringatan *Over-lot* instan jika entry melebihi toleransi risiko.

3. **Trade Journal Entry System**:
   - Catat Pair (XAUUSD, EURUSD, GBPUSD, BTCUSD, US30, NAS100, dll), Buy/Sell, Entry Price, SL, TP, Volume Lot, dan Realized PnL.
   - Tag Evaluasi Psikologi (Disciplined, FOMO, Revenge Trade, Greedy, Early Exit, dll).
   - Catatan strategi & preview screenshot chart.

4. **05:00 AM Automated Coaching & Analysis Engine**:
   - Otomatis mengevaluasi seluruh riwayat trading harian setiap jam **05:00 AM**.
   - Memberikan evaluasi:
     - 🛡️ **Apa yang harus dipertahankan** (Konsistensi SL, disiplin lot, akurasi setup).
     - ⚠️ **Apa yang harus diimprove** (Deteksi FOMO, over-lot, perbaikan Risk-Reward).
     - ⚖️ **Arahan Lot Hari Ini** (Maintain, Step-Up, atau Step-Down).
   - In-app notification center & sound chimes.

5. **Firebase Firestore Database**:
   - Sinkronisasi real-time ke Cloud Firestore.
   - Tersedia offline fallback (LocalStorage) sehingga aplikasi langsung dapat digunakan tanpa konfigurasi awal yang rumit.

6. **GitHub CI/CD & Android Live Auto-Update**:
   - **Push ke GitHub -> Auto Deploy ke Google Cloud Run** (Website otomatis terupdate).
   - **Over-The-Air (OTA) Live Sync**: Perubahan fitur di GitHub langsung ter-update di aplikasi Android tanpa perlu install ulang.
   - **GitHub Action APK Builder**: Otomatis membuild APK rilis saat membuat release tag.

---

## 🛠️ Panduan Menjalankan di Lokal

### 1. Install & Jalankan Dev Server
```bash
# Install dependencies
npm install

# Jalankan server lokal
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🌐 Panduan Upload ke GitHub & Auto Deploy ke Google Cloud Run

1. **Inisialisasi Git & Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit Trading Journal & Compound Planner Pro"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/trading-journal-app.git
   git push -u origin main
   ```

2. **Setup Secrets di Repository GitHub (`Settings -> Secrets and variables -> Actions`)**:
   - `GCP_PROJECT_ID`: ID Project Google Cloud Anda.
   - `GCP_SA_KEY`: JSON Service Account Key Google Cloud dengan permission `Cloud Run Admin` dan `Artifact Registry Writer`.

Setiap kali Anda melakukan `git push origin main`, GitHub Actions di `.github/workflows/deploy-cloudrun.yml` akan otomatis membuild Docker image dan mendeploy website ke Google Cloud Run!

---

## 📱 Panduan Kompilasi Menjadi File APK Android & Auto-Update

### Opsi A: Kompilasi Otomatis via GitHub Actions (Rekomendasi)
1. Buat tag rilis baru di Git:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions (`.github/workflows/build-android-apk.yml`) akan otomatis membuild file `.apk` dan melampirkannya di halaman **Releases** repository GitHub Anda.

### Opsi B: Kompilasi Manual di Komputer Lokal
1. Build web bundle:
   ```bash
   npm run build
   ```
2. Tambahkan platform Android via Capacitor:
   ```bash
   npx @capacitor/cli add android
   npx @capacitor/cli sync android
   ```
3. Buka project di Android Studio untuk generate APK:
   ```bash
   npx @capacitor/cli open android
   ```
   Di Android Studio: Pilih menu **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.

---

## 🔄 Cara Kerja Live Auto-Update Android

1. **Over-The-Air (OTA) Mode**:
   Pada file `capacitor.config.ts`, Anda dapat mengarahkan `server.url` ke URL live website Google Cloud Run Anda (contoh: `https://trading-journal-app-xxxx.a.run.app`). Dengan konfigurasi ini, setiap kali Anda push update ke GitHub dan Cloud Run selesai mendeploy, aplikasi Android di HP pengguna akan **langsung terupdate secara otomatis seketika**.
2. **In-App APK Updater**:
   Aplikasi membaca file `version.json` setiap kali dibuka. Jika ada versi rilis baru di GitHub, aplikasi akan menampilkan pop-up notifikasi pembaruan dengan tombol 1-klik untuk memperbarui.
