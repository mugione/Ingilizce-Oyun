<div align="center">

# 🎈 İngilizce Kelime Oyunu 🎈

### 🦁 🍎 🚗 6 yaş çocuklar için sesli, görselli İngilizce öğrenme oyunu 🌈 🐶 ⭐

*Sesi dinle • Doğru resmi bul • Puan kazan • Bölüm atla!*

<br>

![Platform](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Database](https://img.shields.io/badge/D1-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![AI](https://img.shields.io/badge/Workers_AI-Doğal_Ses-8b5cf6?style=for-the-badge&logo=cloudflare&logoColor=white)
![Kelime](https://img.shields.io/badge/Kelime-230%2B-22c55e?style=for-the-badge)
![Yaş](https://img.shields.io/badge/Yaş-6%2B-7c4dff?style=for-the-badge)

<br>

### 🌐 [**▶ OYUNU AÇ**](https://enoyun.mlakin.workers.dev/) &nbsp;•&nbsp; [⚙️ Yönetici Paneli](https://enoyun.mlakin.workers.dev/admin.html)

</div>

---

## ✨ Özellikler

| | Özellik | Açıklama |
|:--:|:--|:--|
| 🎯 | **İki mod** | Girişte seçim: 🖼️ **Kelime Oyunu** (resimli) veya 🗣️ **Sorular & Konuşma** (sesli cümleler) |
| 🗣️ | **Konuşma modu** | "What is your name?" gibi basit cümleleri sesli okur; **İleri** ile sonrakine geçilir (30+ cümle) |
| 🎙️ | **Doğal yapay zeka sesi** | Kelimeler ve cümleler **Cloudflare Workers AI** (Deepgram Aura-2) ile anadili İngilizce olan biri gibi okunur — her cihazda aynı, net ve sıcak ses |
| ⚡ | **Anında ses** | Her kelimenin sesi **bir kez** üretilir, sonra önbellekten gelir; sıradaki kelime önceden yüklenir |
| 🛟 | **Yedek ses** | Yapay zeka sesine ulaşılamazsa tarayıcının İngilizce sesi otomatik devreye girer — oyun hiç sessiz kalmaz |
| 🖼️ | **Gerçek görseller** | 230+ gerçek fotoğraf; küçültülüp **base64** olarak veritabanında saklanır |
| 🔤 | **Çift dilli etiket** | Resmin altında İngilizce kelime + küçük parantezle **Türkçesi** *(elma)* |
| 🎲 | **Karışık sorular** | Her oyunda 230+ kelimelik havuzdan **rastgele 20 soru** |
| 👨‍👩‍👧‍👦 | **Zengin konular** | Hayvanlar, meyveler, eşyalar, araçlar, **vücut bölümleri** ve **aile bireyleri** |
| 🏆 | **Bölüm sistemi** | Her **300 ⭐**'da yeni bölüm açılır — konfetili kutlama |
| 📈 | **Gelişim takibi** | İlk-denemede-doğru, en yüksek skor, oyun sayısı ve son oyunların grafiği |
| 👶 | **Okuma gerektirmez** | Çocuk sadece adını yazıp oynar; resimlerin altında kelime de yazılı |
| 📱 | **Responsive** | Telefon, tablet, bilgisayar — pencereye tam sığar, kaydırma çubuğu yok |
| 📲 | **Ana ekrana ekle** | Telefon/tablette "Ana ekrana eklemek ister misin?" sorar; uygulama gibi açılır (PWA + çevrimdışı) |
| 🔒 | **Yönetici paneli** | Şifreyle kelime ekle/sil; **kopya kelime kontrolü** ile |

---

## 🎮 Nasıl Oynanır?

```
1. 👶  Çocuk adını yazar  ▶ Oyna
2. 🔊  Kelime doğal bir sesle okunur ("apple")
3. 🖼️  4 resimden doğrusuna dokunur
4. ⭐  Doğru → puan!  (ilk denemede +10, sonra +5)
5. 🎉  20 soru sonunda: skor, gelişim grafiği ve bölüm ilerlemesi
```

> 💡 **Puan & Bölüm:** Her 300 yıldızda yeni bir bölüm açılır. Oyun sonunda hangi
> bölümde olduğun, bir sonrakine ne kadar kaldığın ve gelişim grafiğin gösterilir.

---

## 🧩 Yönetici Paneli

<table>
<tr><td>

**Kelime eklemek için:**
1. `/admin.html` adresine git
2. Şifreyle giriş yap
3. İngilizce kelime + (Türkçe) yaz
4. Bilgisayardan **gerçek bir görsel** seç
5. **Kaydet** ✅

</td><td>

**Akıllı kontroller:**
- 🖼️ Görsel otomatik ~400px'e küçültülür (JPEG)
- ⚠️ Aynı kelime varsa **anında uyarır** ve eklemez
- 🗑️ İstenmeyen kelime tek tıkla silinir

</td></tr>
</table>

---

## 🎙️ Doğal Ses (Workers AI)

Oyun, kelimeleri tarayıcının robotik sesi yerine **yapay zekayla üretilmiş doğal bir İngilizce sesle** okur.

```
🔊 Kelime istenir ──► ⚡ Önbellekte var mı?
                         │
              ┌──────────┴──────────┐
            Evet                  Hayır
              │                     │
              ▼                     ▼
     Anında çalınır      Kelime oyunda kayıtlı mı?
      (kota: 0)                     │
                          ┌─────────┴─────────┐
                        Evet                Hayır
                          │                   │
                          ▼                   ▼
              🎙️ Aura-2 sesi üretir     ⛔ Reddedilir
              → önbelleğe alınır        (kota korunur)
              → çalınır
```

| | Özellik | Ayrıntı |
|:--:|:--|:--|
| 🗣️ | **Model** | `@cf/deepgram/aura-2-en` — ses: **Asteria** (sıcak, net kadın sesi) |
| 🐢 | **Çocuk hızı** | Ses `0.85` hızında çalınır, perde (pitch) korunur |
| 💾 | **Önbellek** | Üretilen ses Cloudflare önbelleğinde ve tarayıcıda 1 yıl saklanır |
| 📱 | **Mobil uyumlu** | İlk dokunuşta ses kilidi açılır; böylece mobil tarayıcılar sonraki otomatik okumalara izin verir |
| 📴 | **Çevrimdışı** | Dinlenen sesler service worker ile saklanır, internetsiz de çalınır |
| 🛡️ | **Kota koruması** | Yalnızca veritabanındaki kelime ve cümleler seslendirilir; dışarıdan rastgele metin okutulamaz |

> 💰 **Maliyet:** Cloudflare'in ücretsiz planı günde **10.000 Neuron** verir. 230+ kelime ve
> 30+ cümlenin tamamını seslendirmek bunun altında kalır ve **yalnızca bir kez** harcanır —
> sonrasında sesler önbellekten gelir. Yeni kelime ekledikçe sadece o kelimenin sesi üretilir.

<details>
<summary><b>🎚️ Sesi değiştirmek istersen</b></summary>

<br>

`src/index.js` içindeki `TTS_SPEAKER` değerini değiştirip yeniden yayınla:

```js
const TTS_SPEAKER = "asteria"; // luna, thalia, helena, athena, hera, apollo, orion ...
```

Aura-2'nin 40 İngilizce sesi vardır. Ses değişince önbellek anahtarı da değiştiği için
kelimeler yeni sesle bir kez daha üretilir.

</details>

---

## 🏗️ Teknoloji

```
┌──────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                    │
│  ┌───────────────┐        ┌────────────────────────┐     │
│  │  Statik site  │        │      /api/*  (JS)      │     │
│  │ index / admin │◄──────►│  kelime · skor · ses   │     │
│  └───────────────┘        └─────┬─────────────┬────┘     │
│                                 ▼             ▼          │
│                   ┌──────────────────┐  ┌──────────────┐ │
│                   │  D1 (SQLite DB)  │  │  Workers AI  │ │
│                   │ words · players  │  │  Aura-2 ses  │ │
│                   └──────────────────┘  └──────┬───────┘ │
│                                                ▼         │
│                                   ┌───────────────────┐  │
│                                   │ Önbellek (1 kez   │  │
│                                   │ üret, hep çal)    │  │
│                                   └───────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 📂 Proje Yapısı

```
enoyun/
├── 📁 public/                # Görünen kısım (statik)
│   ├── 🎮 index.html         # Oyun
│   ├── ⚙️ admin.html         # Yönetici paneli
│   ├── 🧠 game.js            # Oyun mantığı (seviye, gelişim, doğal ses + yedek)
│   ├── 🛠️ admin.js           # Kelime ekleme/silme + kopya kontrolü
│   └── 🎨 style.css          # Renkli, responsive tasarım
├── 📁 src/
│   └── ⚡ index.js           # Worker: /api/* + doğal ses + statik sunum
├── 🗄️ schema.sql             # Tablolar (words, players)
├── ⚙️ wrangler.toml          # Worker + D1 + Workers AI + assets ayarı
└── 📦 package.json
```

### 🔌 API Uç Noktaları

| Yol | Metot | Ne yapar |
|:--|:--:|:--|
| `/api/words` | `GET` | Kelimeleri listeler |
| `/api/words` | `POST` | Kelime ekler (admin, kopya kontrollü) |
| `/api/words/:id` | `PUT` / `DELETE` | Günceller / siler (admin) |
| `/api/words/:id/image` | `GET` | Görseli sunar (önbellekli) |
| `/api/players` | `GET` | Skor tablosu |
| `/api/players` | `POST` | Skoru + gelişim geçmişini kaydeder |
| `/api/phrases` | `GET` | Konuşma cümlelerini listeler |
| `/api/phrases` | `POST` | Cümle ekler (admin, kopya kontrollü) |
| `/api/phrases/:id` | `DELETE` | Cümle siler (admin) |
| `/api/admin-login` | `POST` | Yönetici şifresini doğrular |
| `/api/tts?text=apple` | `GET` | Kelimenin/cümlenin doğal sesini MP3 olarak döndürür (önbellekli, yalnızca kayıtlı metinler) |

---

## 🔑 Yönetici Şifresi

Şifre kodda **tutulmaz**; Cloudflare'de bir **secret (gizli değişken)** olarak saklanır.
Kendi şifrenizi belirlemek için:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

> Cloudflare panelinden de: **Workers & Pages → enoyun → Settings → Variables → `ADMIN_PASSWORD`**
>
> Yerel testte proje kökündeki `.dev.vars` dosyasına `ADMIN_PASSWORD=...` yazın (bu dosya `.gitignore`'dadır, repoya girmez).

---

## 🚀 Yeniden Yayınlama

```bash
npm install            # ilk sefer
npx wrangler login     # veya CLOUDFLARE_API_TOKEN
npm run deploy         # = wrangler deploy
```

## 🗄️ Veritabanı Komutları

```bash
# Şemayı uzak veritabanına uygula (DİKKAT: kelimeleri sıfırlar)
npm run db:remote

# Örnek: bir oyuncuyu silme
npx wrangler d1 execute kelime-oyunu --remote \
  --command "DELETE FROM players WHERE name='Test';"
```

## 💻 Yerel Test

```bash
npx wrangler d1 execute kelime-oyunu --local --file=schema.sql
npm run dev            # .dev.vars içine ADMIN_PASSWORD ekleyin
```

> 🎙️ **Doğal ses yerelde de çalışır**, ama Workers AI her zaman Cloudflare hesabına bağlanır:
> önce `npx wrangler login` yapın. Yerel testte üretilen sesler de günlük kotadan düşer.

---

## 🎨 Özelleştirme İpuçları

- 🖼️ **Daha net görseller:** Wikipedia'dan gelen bazı fotoğraflar kolaj/anatomik olabilir.
  6 yaş için **tek nesneli, sade** fotoğraflar en iyisidir — admin panelinden değiştirebilirsiniz.
- 🎯 **Kelime havuzu:** İstediğiniz kadar kelime ekleyip çıkarabilirsiniz (en az 4 olmalı).
- 🎚️ **Bölüm eşiği:** `public/game.js` içindeki `LEVEL_STEP` (varsayılan 300) değeriyle ayarlanır.
- ❓ **Soru sayısı:** Yine `game.js` içindeki `QUESTIONS_PER_GAME` (varsayılan 20).
- 🎙️ **Ses ve hız:** Ses için `src/index.js` → `TTS_SPEAKER`; okuma hızı için `game.js` → `player.playbackRate` (varsayılan 0.85).

---

## 🔒 Güvenlik

Bu depo **herkese açık yayınlanabilir**. Kod içinde gizli bilgi tutulmaz:

- ✅ Yönetici şifresi kodda değil, **Cloudflare secret** olarak saklanır (`ADMIN_PASSWORD`).
- ✅ API anahtarları/token repoya **girmez** (`.dev.vars` ve `.wrangler/` `.gitignore`'dadır).
- ✅ `wrangler.toml` içindeki `database_id` gizli değildir — sadece bir kimliktir; erişim için
  yine hesabınıza ait token gerekir.
- ✅ Yapay zeka **API anahtarı gerektirmez** — Worker, Workers AI'a Cloudflare'in iç bağlantısıyla
  (`[ai]` binding) erişir. Kodu alan biri kendi hesabında çalıştırır, sizin kotanızı kullanamaz.
- ✅ `/api/tts` yalnızca veritabanında kayıtlı kelime/cümleleri seslendirir; rastgele metinle
  kotanın tüketilmesi engellenir.
- ✅ Tüm veritabanı sorguları **parametreli** (SQL injection'a kapalı); kullanıcı metni ekranda
  **kaçışlanır** (XSS'e karşı); görseller yalnızca güvenli türlerde (JPEG/PNG/WebP/GIF) kabul edilir.

**Kendi kopyanızı kurarken:**
1. `ADMIN_PASSWORD`'ü güçlü bir değerle **kendiniz** belirleyin (`wrangler secret put`).
2. Deploy için kullandığınız Cloudflare API token'ını iş bitince **silin/yenileyin**.

> ℹ️ Bilinçli tasarım gereği: kelime listesi ve skor gönderme herkese açıktır (oyunun çalışması için).
> Bu bir **aile içi eğitim uygulamasıdır**; kişisel/hassas veri toplamaz. Herkese açık, yüksek
> trafikli bir ortam hedefliyorsanız yönetici uçlarına hız sınırı (rate limit) eklemeniz önerilir.

---

<div align="center">

### 🌟 İyi eğlenceler ve iyi öğrenmeler! 🌟

*❤️ ile hazırlandı*

</div>
