# 🥝 Botanical Flow 🍓

**Botanical Flow**, zaman yönetimini katı bir Pomodoro zamanlayıcısı olmaktan çıkarıp esnek, akıcı ve doğa temalı bir oyunlaştırma deneyimine dönüştüren **Offline-First PWA (Progresif Web Uygulaması)**'dır. 

Masaüstü ve mobil (özellikle iOS/WebKit) cihazlarda %100 uyumlu, yüksek performanslı ve batarya dostu olacak şekilde tasarlanmıştır.

## ✨ Özellikler

*   **Esnek Kredi Sistemi:** Katı "25 dk çalış, 5 dk dinlen" kuralı yerine, ne kadar çalışırsanız o kadar mola kredisi kazanırsınız. Kazandığınız mola kredilerini isterseniz hemen kullanabilir, isterseniz biriktirerek uzun bir molaya çıkabilirsiniz.
*   **İki Farklı Mod:**
    *   🥝 **Kivi Modu:** Yoğun odaklanma ve hızlı dinlenme için ideal (3 dakikalık çalışma = 1 dakika mola).
    *   🍓 **Çilek Modu:** Derin odaklanma ve daha esnek dinlenme için ideal (2 dakikalık çalışma = 1 dakika mola).
*   **Ambient HUD (Ambiyans Modu):** Ekrana çift tıkladığınızda dikkatinizi dağıtmayan, pilden tasarruf eden devasa, karanlık bir ambiyans moduna geçersiniz.
*   **Oyunlaştırma ve Başarımlar (Kanonik Rozetler):** Odaklanma alışkanlıklarınızı analiz eden ve size özel rozetler kazandıran bir "Vitrin" (Showcase). Örneğin: "Gece Nöbeti", "Mükemmel Döngü", "Şafak Vakti".
*   **Isı Haritası (Heatmap):** GitHub katkı grafiği tarzında tasarlanmış, son 30 günlük çalışma yoğunluğunuzu gün gün gösteren büyüme takvimi.
*   **Tamamen Çevrimdışı (Offline-First):** İçerisindeki Service Worker sayesinde, ilk yüklemeden sonra hiçbir internet bağlantısına ihtiyaç duymaz. Tam bir Native uygulama deneyimi sunar.
*   **Veri Güvenliği (ITP Kalkanı):** Verileriniz tarayıcınızın derinliklerinde (IndexedDB) şifreli olarak saklanır. Dilediğiniz zaman tek tıkla JSON olarak dışarı aktarabilir (Yedekleme) ve güvene alabilirsiniz.
*   **Donanım Optimizasyonu:** Safari / WebKit kısıtlamalarına tam uyumlu, Web Audio API ve Haptic Engine (Vibration) entegrasyonu. Uyku modundan çıkışları (WakeLock) sorunsuz idare eder.

## 🛠️ Teknolojiler

*   **Core:** Saf (Vanilla) HTML, CSS, JavaScript (ES6 Modules) - Hiçbir harici Framework (React, Vue) veya kütüphane kullanılmadı. Tam performans.
*   **Stil ve UI:** Glassmorphism, CSS Variables, Hardware-Accelerated Micro-animations.
*   **Depolama:** IndexedDB, LocalStorage.
*   **PWA Altyapısı:** `manifest.json`, Service Worker (`sw.js`).

## 🚀 Kurulum & Çalıştırma

Projeyi yerel makinenizde çalıştırmak çok kolaydır:

1.  Depoyu bilgisayarınıza indirin (clone).
2.  Proje klasörüne gidin.
3.  Dosyaları herhangi bir yerel HTTP sunucusu ile ayağa kaldırın:
    ```bash
    # Python 3 kullanarak
    python3 -m http.server 8000
    
    # Veya Node.js / npx kullanarak
    npx serve .
    ```
4.  Tarayıcınızda `http://localhost:8000` adresine gidin.
5.  Uygulamayı telefonunuza PWA olarak kurmak için, sayfayı mobil tarayıcıda açıp **"Ana Ekrana Ekle (Add to Home Screen)"** butonunu kullanabilirsiniz.

## 📄 Mimari Standartlar

Uygulamanın kalbi, Pub/Sub mantığıyla çalışan `store.js` tarafından kontrol edilir. `setInterval` gibi yöntemlerin zamanla oluşturduğu "drifting" (sapma) sorununu önlemek için zaman takibi mutlak saat (Epoch `Date.now()`) üzerinden matematiksel hesaplamalarla (`accrual.js`) yapılır. Arayüz geçişleri ve DOM manipülasyonu ise orkestratör görevi gören `app.js` üzerinden yönetilir.

---
*Botanical Flow ile her dakika, ektiğiniz bir tohumdur.* 🌱
