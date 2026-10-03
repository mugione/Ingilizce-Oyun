/* ===========================================================
   İngilizce Kelime Oyunu - Cloudflare Worker
   Statik dosyaları (ASSETS) ve /api/* uç noktalarını sunar.
   Görseller D1'de base64 olarak saklanır.
   =========================================================== */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

function isAdmin(request, env) {
  const pass = request.headers.get("X-Admin-Password") || "";
  return env.ADMIN_PASSWORD && pass === env.ADMIN_PASSWORD;
}

// Yalnızca güvenli görsel türleri (SVG kabul edilmez -> XSS riski önlenir)
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_B64_LEN = 700000; // ~525 KB üst sınır (veritabanını korur)

// data:image/...;base64,XXXX  ->  { mime, b64 }
function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const m = dataUrl.match(/^data:([a-zA-Z0-9.+/-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) return null;
  const b64 = m[2].replace(/\s/g, "");
  if (!b64 || b64.length > MAX_B64_LEN) return null;
  return { mime, b64 };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) {
      try {
        // /api/tts?text=apple  -> doğal İngilizce ses (Workers AI)
        if (path === "/api/tts" && request.method === "GET") return tts(url, env, ctx);

        if (path === "/api/words") {
          if (request.method === "GET") return listWords(env);
          if (request.method === "POST") return addWord(request, env);
        }
        // /api/words/:id/image  -> gerçek görsel
        const img = path.match(/^\/api\/words\/(\d+)\/image$/);
        if (img && request.method === "GET") return getImage(env, img[1]);

        // /api/words/:id  -> sil / güncelle
        const m = path.match(/^\/api\/words\/(\d+)$/);
        if (m) {
          if (request.method === "DELETE") return deleteWord(request, env, m[1]);
          if (request.method === "PUT") return updateWord(request, env, m[1]);
        }
        if (path === "/api/players") {
          if (request.method === "GET") return leaderboard(env);
          if (request.method === "POST") return saveScore(request, env);
        }
        // /api/phrases  -> konuşma cümleleri
        if (path === "/api/phrases") {
          if (request.method === "GET") return listPhrases(env);
          if (request.method === "POST") return addPhrase(request, env);
        }
        const ph = path.match(/^\/api\/phrases\/(\d+)$/);
        if (ph && request.method === "DELETE") return deletePhrase(request, env, ph[1]);

        if (path === "/api/admin-login" && request.method === "POST") {
          return adminLogin(request, env);
        }
        return json({ error: "Bulunamadı." }, 404);
      } catch (err) {
        return json({ error: "Sunucu hatası: " + err.message }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};

/* ---------------- Doğal ses (Workers AI) ---------------- */
// Her kelime/cümle bir kez üretilir, sonra önbellekten gelir (kota harcamaz).
// Kotayı korumak için yalnızca veritabanındaki kelime ve cümleler seslendirilir.
const TTS_MODEL = "@cf/deepgram/aura-2-en";
const TTS_SPEAKER = "asteria";

async function tts(url, env, ctx) {
  const text = (url.searchParams.get("text") || "").trim();
  if (!text || text.length > 200) return json({ error: "Geçersiz metin." }, 400);
  if (!env.AI) return json({ error: "AI bağlantısı yok." }, 503);

  const cache = caches.default;
  const cacheKey = new Request(
    `https://tts-cache.enoyun/${TTS_SPEAKER}/${encodeURIComponent(text.toLowerCase())}`
  );
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const known = await env.DB.prepare(
    "SELECT 1 FROM words WHERE lower(en) = lower(?1) UNION SELECT 1 FROM phrases WHERE lower(en) = lower(?1) LIMIT 1"
  )
    .bind(text)
    .first();
  if (!known) return json({ error: "Bu metin oyunda yok." }, 404);

  const out = await env.AI.run(TTS_MODEL, { text, speaker: TTS_SPEAKER, encoding: "mp3" });
  // Model sürümüne göre akış, ikili veri ya da base64 dönebilir
  const body =
    out instanceof ReadableStream || out instanceof ArrayBuffer || out instanceof Uint8Array
      ? out
      : out?.audio
        ? Uint8Array.from(atob(out.audio), (c) => c.charCodeAt(0))
        : null;
  if (!body) return json({ error: "Ses üretilemedi." }, 502);

  const res = new Response(body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

/* ---------------- Kelimeler ---------------- */
// Liste hafif tutulur: base64 görsel gönderilmez, sadece meta bilgiler.
async function listWords(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, en, tr FROM words ORDER BY id DESC"
  ).all();
  return json(results || []);
}

// Görseli ikili (binary) olarak, önbelleklenebilir şekilde döndür
async function getImage(env, id) {
  const row = await env.DB.prepare(
    "SELECT image_data, image_mime FROM words WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!row || !row.image_data) return new Response("Görsel yok", { status: 404 });

  const binary = atob(row.image_data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new Response(bytes, {
    headers: {
      "Content-Type": row.image_mime || "image/jpeg",
      "Cache-Control": "public, max-age=31536000",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function addWord(request, env) {
  if (!isAdmin(request, env)) return json({ error: "Yetkisiz. Admin şifresi hatalı." }, 401);
  const b = await request.json().catch(() => null);
  if (!b) return json({ error: "Geçersiz istek." }, 400);
  const en = (b.en || "").trim();
  const tr = (b.tr || "").trim();
  const parsed = parseDataUrl(b.image);
  if (!en) return json({ error: "İngilizce kelime zorunludur." }, 400);
  if (!parsed) return json({ error: "Geçerli bir görsel yüklemelisiniz." }, 400);

  // Aynı kelime zaten var mı? (büyük/küçük harf duyarsız)
  const exists = await env.DB.prepare("SELECT id FROM words WHERE lower(en) = lower(?)")
    .bind(en)
    .first();
  if (exists) return json({ error: `"${en}" kelimesi zaten ekli.`, code: "duplicate" }, 409);

  const res = await env.DB.prepare(
    "INSERT INTO words (en, tr, image_data, image_mime) VALUES (?, ?, ?, ?)"
  )
    .bind(en, tr, parsed.b64, parsed.mime)
    .run();
  return json({ id: res.meta.last_row_id, en, tr }, 201);
}

async function deleteWord(request, env, id) {
  if (!isAdmin(request, env)) return json({ error: "Yetkisiz. Admin şifresi hatalı." }, 401);
  await env.DB.prepare("DELETE FROM words WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

async function updateWord(request, env, id) {
  if (!isAdmin(request, env)) return json({ error: "Yetkisiz. Admin şifresi hatalı." }, 401);
  const b = await request.json().catch(() => null);
  if (!b) return json({ error: "Geçersiz istek." }, 400);
  const en = (b.en || "").trim();
  const tr = (b.tr || "").trim();
  if (!en) return json({ error: "İngilizce kelime zorunludur." }, 400);

  // Başka bir kayıtta aynı kelime var mı?
  const dup = await env.DB.prepare(
    "SELECT id FROM words WHERE lower(en) = lower(?) AND id <> ?"
  )
    .bind(en, id)
    .first();
  if (dup) return json({ error: `"${en}" kelimesi zaten başka bir kayıtta var.`, code: "duplicate" }, 409);

  const parsed = parseDataUrl(b.image);
  if (parsed) {
    // Yeni görsel de yüklendi
    await env.DB.prepare(
      "UPDATE words SET en = ?, tr = ?, image_data = ?, image_mime = ? WHERE id = ?"
    )
      .bind(en, tr, parsed.b64, parsed.mime, id)
      .run();
  } else {
    // Sadece metin güncelle, görseli koru
    await env.DB.prepare("UPDATE words SET en = ?, tr = ? WHERE id = ?")
      .bind(en, tr, id)
      .run();
  }
  return json({ ok: true });
}

/* ---------------- Oyuncular / Skor ---------------- */
async function leaderboard(env) {
  const { results } = await env.DB.prepare(
    "SELECT name, best_score, total_score, games_played FROM players ORDER BY best_score DESC, total_score DESC LIMIT 10"
  ).all();
  return json(results || []);
}

async function saveScore(request, env) {
  const b = await request.json().catch(() => null);
  if (!b) return json({ error: "Geçersiz istek." }, 400);
  const name = (b.name || "").trim().slice(0, 30);
  const score = Math.max(0, parseInt(b.score, 10) || 0);
  if (!name) return json({ error: "İsim zorunludur." }, 400);

  // Bu oyundan ÖNCEKİ toplam skoru al (seviye atlama tespiti için)
  const before = await env.DB.prepare(
    "SELECT total_score, last_scores FROM players WHERE name = ?"
  )
    .bind(name)
    .first();
  const totalBefore = before ? before.total_score : 0;

  // Temel istatistikleri güncelle (upsert)
  await env.DB.prepare(
    `INSERT INTO players (name, best_score, total_score, games_played, last_scores, updated_at)
     VALUES (?, ?, ?, 1, '[]', datetime('now'))
     ON CONFLICT(name) DO UPDATE SET
       best_score  = MAX(best_score, excluded.best_score),
       total_score = total_score + excluded.total_score,
       games_played = games_played + 1,
       updated_at  = datetime('now')`
  )
    .bind(name, score, score)
    .run();

  // Gelişim geçmişini güncelle (son 12 oyun)
  let history = [];
  try {
    history = JSON.parse((before && before.last_scores) || "[]");
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }
  history.push(score);
  if (history.length > 12) history = history.slice(-12);
  await env.DB.prepare("UPDATE players SET last_scores = ? WHERE name = ?")
    .bind(JSON.stringify(history), name)
    .run();

  const player = await env.DB.prepare(
    "SELECT name, best_score, total_score, games_played, last_scores FROM players WHERE name = ?"
  )
    .bind(name)
    .first();

  return json({ ok: true, player, totalBefore, gained: score });
}

/* ---------------- Admin ---------------- */
async function adminLogin(request, env) {
  const b = await request.json().catch(() => null);
  if (!b) return json({ error: "Geçersiz istek." }, 400);
  if (!env.ADMIN_PASSWORD)
    return json({ error: "Sunucuda ADMIN_PASSWORD tanımlı değil." }, 500);
  if (b.password === env.ADMIN_PASSWORD) return json({ ok: true });
  return json({ error: "Şifre hatalı." }, 401);
}

/* ---------------- Konuşma cümleleri ---------------- */
async function listPhrases(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, en, tr FROM phrases ORDER BY id ASC"
  ).all();
  return json(results || []);
}

async function addPhrase(request, env) {
  if (!isAdmin(request, env)) return json({ error: "Yetkisiz. Admin şifresi hatalı." }, 401);
  const b = await request.json().catch(() => null);
  if (!b) return json({ error: "Geçersiz istek." }, 400);
  const en = (b.en || "").trim();
  const tr = (b.tr || "").trim();
  if (!en) return json({ error: "İngilizce cümle zorunludur." }, 400);

  const exists = await env.DB.prepare("SELECT id FROM phrases WHERE lower(en) = lower(?)")
    .bind(en)
    .first();
  if (exists) return json({ error: `"${en}" zaten ekli.`, code: "duplicate" }, 409);

  const res = await env.DB.prepare("INSERT INTO phrases (en, tr) VALUES (?, ?)")
    .bind(en, tr)
    .run();
  return json({ id: res.meta.last_row_id, en, tr }, 201);
}

async function deletePhrase(request, env, id) {
  if (!isAdmin(request, env)) return json({ error: "Yetkisiz. Admin şifresi hatalı." }, 401);
  await env.DB.prepare("DELETE FROM phrases WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
