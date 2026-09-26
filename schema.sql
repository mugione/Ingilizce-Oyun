-- ============================================================
--  İngilizce Kelime Oyunu - Cloudflare D1 Veritabanı Şeması
--  (Gerçek görseller base64 olarak saklanır)
-- ============================================================

-- Kelimeler tablosu
DROP TABLE IF EXISTS words;
CREATE TABLE words (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  en         TEXT NOT NULL,               -- İngilizce kelime (sesli okunan + doğru cevap)
  tr         TEXT,                         -- Türkçe anlamı (resmin altında ipucu olarak da kullanılabilir)
  image_data TEXT NOT NULL,               -- Görselin base64 verisi (data: ön eki olmadan)
  image_mime TEXT NOT NULL DEFAULT 'image/jpeg', -- Görsel türü (image/jpeg, image/png, image/webp)
  created_at TEXT DEFAULT (datetime('now'))
);

-- Oyuncular tablosu
DROP TABLE IF EXISTS players;
CREATE TABLE players (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL UNIQUE,
  best_score   INTEGER DEFAULT 0,          -- En yüksek skor
  total_score  INTEGER DEFAULT 0,          -- Toplam kazanılan puan
  games_played INTEGER DEFAULT 0,          -- Oynanan oyun sayısı
  last_scores  TEXT DEFAULT '[]',          -- Son oyunların skorları (gelişim grafiği için, JSON)
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

-- Konuşma soruları / cümleleri (sesli sorulur, görsel gerekmez)
DROP TABLE IF EXISTS phrases;
CREATE TABLE phrases (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  en         TEXT NOT NULL,               -- İngilizce cümle/soru (sesli okunur)
  tr         TEXT,                         -- Türkçe karşılığı (altta gösterilir)
  created_at TEXT DEFAULT (datetime('now'))
);

-- Not: Başlangıç kelimeleri artık yönetici panelinden gerçek görsel
-- yüklenerek eklenir. (Emoji kullanılmaz.)
