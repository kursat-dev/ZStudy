# StudyFlow (ZStudy) 🎓

**StudyFlow (ZStudy)**, öğrencilerin ve kendi kendine öğrenenlerin çalışma verimliliğini artırmak amacıyla geliştirilmiş yapay zeka destekli bir mobil eğitim uygulamasıdır. Kullanıcıların videolar üzerinden öğrenmelerini, otomatik oluşturulan çalışma kartlarıyla (flashcards) pekiştirmelerini ve quizlerle kendilerini test etmelerini sağlar.

Proje, **React Native (Expo)** tabanlı bir mobil uygulama ve **Node.js (Express) & MongoDB** tabanlı bir backend servisinden oluşmaktadır.

---

## 🌟 Özellikler

- **🔐 Güvenli Kimlik Doğrulama (Authentication):**
  - Kullanıcı kayıt ve giriş işlemleri (JWT tabanlı oturum yönetimi).
  - API katmanında Rate Limiting ile brute-force saldırılarına karşı koruma.
- **📱 Modern ve Akıcı Mobil Arayüz (UI/UX):**
  - React Native ve Expo Router ile geliştirilmiş, native hissiyatlı sayfa geçişleri.
  - Alt sekme yapısı (Dashboard, Library, Profile).
- **📺 Video Tabanlı Öğrenme:**
  - Eğitim videolarını doğrudan uygulama içerisinden izleme ve yönetme.
- **🗂️ Flashcard (Çalışma Kartları):**
  - Öğrenilen konuları interaktif çalışma kartlarıyla tekrar etme özelliği.
- **📝 Quiz Sistemi:**
  - Konu pekiştirmeye yönelik testler ve quiz ekranı.
- **🎨 Gelişmiş Tema Seçenekleri:**
  - Koyu (Dark) ve Açık (Light) tema desteği ve yönetimi (`useColorScheme`).

---

## 🛠️ Kullanılan Teknolojiler

### Mobil Frontend (Klasör: `mobile`)
- **Framework:** React Native, Expo (`v54`)
- **Routing:** Expo Router (`v6`)
- **Dil:** TypeScript
- **Stil & İkonlar:** Expo Symbols, `@expo/vector-icons`
- **Navigasyon:** `@react-navigation/bottom-tabs`

### Backend API (Klasör: `backend`)
- **Platform:** Node.js
- **Çatı (Framework):** Express.js
- **Veritabanı:** MongoDB (Mongoose)
- **Güvenlik:** `bcryptjs` (şifreleme), `jsonwebtoken` (JWT), `express-rate-limit`, `cors`
- **Deployment:** Vercel için yapılandırılmış (`vercel.json`)

---

## 🚀 Kurulum ve Çalıştırma

Projeyi bilgisayarınızda yerel olarak çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

### 1. Backend Kurulumu

Dizine gidin, bağımlılıkları yükleyin ve `.env` dosyanızı oluşturun:

```bash
cd backend
npm install
cp .env.example .env
```

`.env` dosyası içerisine kendi değişkenlerinizi (örn. `MONGO_URI`, `JWT_SECRET`, `PORT=3000`) tanımlamayı unutmayın. Sonrasında sunucuyu başlatın:

```bash
# Geliştirme modunda başlatmak için:
npm run dev

# veya normal başlatmak için:
npm start
```
*Backend varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.*

### 2. Mobil (Frontend) Kurulumu

Farklı bir terminal penceresinde mobil uygulama dizinine geçin ve bağımlılıkları yükleyin:

```bash
cd mobile
npm install
```

Expo geliştirme sunucusunu başlatın:

```bash
npm start
```
Bu adımı tamamladıktan sonra, konsolda beliren QR kodu telefonunuzdaki **Expo Go** uygulaması ile okutarak projeyi test edebilir veya `i` (iOS Simulator), `a` (Android Emulator) tuşlarına basarak bilgisayarınızdaki emülatörlerde açabilirsiniz.

---

## 📂 Proje Yapısı

```text
ZStudy/
├── backend/
│   ├── api/               # API Router dosyaları (auth, videos)
│   ├── lib/               # Yardımcı fonksiyonlar, Veritabanı ve Middleware yapılandırmaları
│   ├── models/            # MongoDB Veri Modelleri (User.js, Video.js)
│   ├── index.js           # Express Sunucu Ana Giriş Noktası
│   └── vercel.json        # Vercel Dağıtım Konfigürasyonu
│
├── mobile/
│   ├── app/               # Ekranlar ve Expo Router Yapısı
│   │   ├── (auth)/        # Sign-in ve Sign-up ekranları
│   │   ├── (tabs)/        # Alt menü sekmeleri (Dashboard, Library, Profile)
│   │   ├── flashcards/    # Flashcard Pratik Ekranı
│   │   ├── quiz/          # Quiz Ekranı
│   │   └── video/         # Video İzleme Ekranı
│   ├── components/        # Tekrar Kullanılabilir UI Bileşenleri
│   ├── constants/         # Tema Renkleri ve Uygulama Sabitleri
│   ├── contexts/          # React Context (Örn: AuthContext)
│   ├── hooks/             # Özel React Hook'ları (useColorScheme vb.)
│   ├── services/          # Backend API İstekleri (api.ts)
│   └── types/             # TypeScript Arayüzleri
│
└── README.md
```

## 🤝 Katkıda Bulunma
Her türlü katkıya açığız. Lütfen bir Pull Request (PR) göndermeden önce uygulanacak değişikliği bir Issue açarak belirtiniz.