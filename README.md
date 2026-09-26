<div align="center">

# 🎈 İngilizce Kelime Oyunu 🎈

### 🦁 🍎 🚗 6 yaş çocuklar için sesli, görselli İngilizce öğrenme oyunu 🌈 🐶 ⭐

*Sesi dinle • Doğru resmi bul • Puan kazan • Bölüm atla!*

<br>

![Platform](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Database](https://img.shields.io/badge/D1-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Kelime](https://img.shields.io/badge/Kelime-230%2B-22c55e?style=for-the-badge)
![Yaş](https://img.shields.io/badge/Yaş-6%2B-7c4dff?style=for-the-badge)

<br>

### 🌐 [**▶ OYUNU AÇ**](https://enoyun.mlakin.workers.dev/) &nbsp;•&nbsp; [⚙️ Yönetici Paneli](https://enoyun.mlakin.workers.dev/admin.html)

</div>

---

## ✨ Özellikler

| | Özellik | Açıklama |
|:--:|:--|:--|
| 🔊 | **Sesli telaffuz** | Tarayıcının İngilizce sesi kelimeyi net ve yavaş okur (ekstra dosya yok) |
| 🖼️ | **Gerçek görseller** | 230+ gerçek fotoğraf; küçültülüp **base64** olarak veritabanında saklanır |
| 🔤 | **Çift dilli etiket** | Resmin altında İngilizce kelime + küçük parantezle **Türkçesi** *(elma)* |
| 🎲 | **Karışık sorular** | Her oyunda 230+ kelimelik havuzdan **rastgele 20 soru** |
| 👨‍👩‍👧‍👦 | **Zengin konular** | Hayvanlar, meyveler, eşyalar, araçlar, **vücut bölümleri** ve **aile bireyleri** |
| 🏆 | **Bölüm sistemi** | Her **300 ⭐**'da yeni bölüm açılır — konfetili kutlama |
| 📈 | **Gelişim takibi** | İlk-denemede-doğru, en yüksek skor, oyun sayısı ve son oyunların grafiği |
| 👶 | **Okuma gerektirmez** | Çocuk sadece adını yazıp oynar; resimlerin altında kelime de yazılı |
| 📱 | **Responsive** | Telefon, tablet, bilgisayar — pencereye tam sığar, kaydırma çubuğu yok |
| 🔒 | **Yönetici paneli** | Şifreyle kelime ekle/sil; **kopya kelime kontrolü** ile |

---

## 🎮 Nasıl Oynanır?

```
1. 👶  Çocuk adını yazar  ▶ Oyna
2. 🔊  Kelime sesli okunur ("apple")
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

## 🏗️ Teknoloji

```
┌─────────────────────────────────────────────────┐
│              Cloudflare Workers                   │
│  ┌───────────────┐        ┌───────────────────┐  │
│  │  Statik site  │        │   /api/*  (JS)    │  │
│  │ index / admin │◄──────►│  kelime · skor    │  │
│  └───────────────┘        └─────────┬─────────┘  │
│                                     ▼             │
│                          ┌────────────────────┐  │
│                          │   D1 (SQLite DB)   │  │
│                          │ words · players    │  │
│                          └────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 📂 Proje Yapısı

```
enoyun/
├── 📁 public/                # Görünen kısım (statik)
│   ├── 🎮 index.html         # Oyun
│   ├── ⚙️ admin.html         # Yönetici paneli
│   ├── 🧠 game.js            # Oyun mantığı (seviye, gelişim, ses)
│   ├── 🛠️ admin.js           # Kelime ekleme/silme + kopya kontrolü
│   └── 🎨 style.css          # Renkli, responsive tasarım
├── 📁 src/
│   └── ⚡ index.js           # Worker: /api/* + statik sunum
├── 🗄️ schema.sql             # Tablolar (words, players)
├── ⚙️ wrangler.toml          # Worker + D1 + assets ayarı
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
| `/api/admin-login` | `POST` | Yönetici şifresini doğrular |

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

---

## 🎨 Özelleştirme İpuçları

- 🖼️ **Daha net görseller:** Wikipedia'dan gelen bazı fotoğraflar kolaj/anatomik olabilir.
  6 yaş için **tek nesneli, sade** fotoğraflar en iyisidir — admin panelinden değiştirebilirsiniz.
- 🎯 **Kelime havuzu:** İstediğiniz kadar kelime ekleyip çıkarabilirsiniz (en az 4 olmalı).
- 🎚️ **Bölüm eşiği:** `public/game.js` içindeki `LEVEL_STEP` (varsayılan 300) değeriyle ayarlanır.
- ❓ **Soru sayısı:** Yine `game.js` içindeki `QUESTIONS_PER_GAME` (varsayılan 20).

---

## 🔒 Güvenlik

Bu depo **herkese açık yayınlanabilir**. Kod içinde gizli bilgi tutulmaz:

- ✅ Yönetici şifresi kodda değil, **Cloudflare secret** olarak saklanır (`ADMIN_PASSWORD`).
- ✅ API anahtarları/token repoya **girmez** (`.dev.vars` ve `.wrangler/` `.gitignore`'dadır).
- ✅ `wrangler.toml` içindeki `database_id` gizli değildir — sadece bir kimliktir; erişim için
  yine hesabınıza ait token gerekir.
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
