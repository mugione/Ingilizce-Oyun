/* ===========================================================
   Yönetici Paneli - Gerçek görsel yükleme (base64)
   =========================================================== */

const el = (id) => document.getElementById(id);
let adminPass = sessionStorage.getItem("admin_pass") || "";
let pendingImage = null; // yüklenecek görselin data URL'i
let wordsCache = []; // mevcut kelimeler (kopya kontrolü için)

// Aynı kelime zaten var mı?
function isDuplicate(en) {
  const q = en.trim().toLowerCase();
  return q && wordsCache.some((w) => (w.en || "").toLowerCase() === q);
}

// Kullanıcı İngilizce kelimeyi yazarken anlık uyarı göster
function checkDupLive() {
  const hint = el("dupHint");
  const en = el("f-en").value.trim();
  if (en && isDuplicate(en)) {
    hint.textContent = `⚠️ "${en}" zaten listede var.`;
    hint.className = "dup-hint warn";
  } else if (en) {
    hint.textContent = "✓ Uygun";
    hint.className = "dup-hint ok";
  } else {
    hint.textContent = "";
    hint.className = "dup-hint";
  }
}

const escapeHtml = (s) =>
  String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function showMsg(text, ok = true) {
  const m = el("msg");
  m.textContent = text;
  m.className = "msg show " + (ok ? "ok" : "err");
  setTimeout(() => m.classList.remove("show"), 4000);
}

/* ---------- Görseli küçült + sıkıştır (base64) ---------- */
const MAX_DIM = 400; // en uzun kenar (piksel)
const MAX_B64 = 90000; // ~67 KB'lik güvenli üst sınır (D1 için)

function processImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Görsel açılamadı."));
      img.onload = () => {
        let { width, height } = img;
        // Orantılı küçült
        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height >= width && height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        // Şeffaf PNG'ler için beyaz zemin (JPEG'e çevrilince siyah olmasın)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Boyut sınırının altına inene kadar kaliteyi düşür
        const qualities = [0.85, 0.72, 0.6, 0.5, 0.4];
        let out = null;
        for (const q of qualities) {
          const d = canvas.toDataURL("image/jpeg", q);
          out = d;
          if (d.length <= MAX_B64) break;
        }
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- Dosya seçilince önizleme ---------- */
async function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) {
    pendingImage = null;
    el("previewWrap").style.display = "none";
    return;
  }
  try {
    showMsg("Görsel işleniyor…");
    pendingImage = await processImage(file);
    el("preview").src = pendingImage;
    const kb = Math.round((pendingImage.length * 0.75) / 1024);
    el("previewInfo").textContent = `Hazır ✓ (~${kb} KB olarak kaydedilecek)`;
    el("previewWrap").style.display = "flex";
    el("msg").classList.remove("show");
  } catch (err) {
    pendingImage = null;
    el("previewWrap").style.display = "none";
    showMsg("Görsel işlenemedi: " + err.message, false);
  }
}

/* ---------- Giriş ---------- */
async function login() {
  const pass = el("pass").value;
  const box = el("loginMsg");
  box.classList.remove("show");
  try {
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      adminPass = pass;
      sessionStorage.setItem("admin_pass", pass);
      openPanel();
    } else {
      box.textContent = data.error || "Şifre hatalı.";
      box.classList.add("show");
    }
  } catch {
    box.textContent = "Bağlantı hatası.";
    box.classList.add("show");
  }
}

function openPanel() {
  el("loginBox").style.display = "none";
  el("panelBox").style.display = "block";
  loadWords();
  loadPhrases();
}

function logout() {
  sessionStorage.removeItem("admin_pass");
  adminPass = "";
  el("panelBox").style.display = "none";
  el("loginBox").style.display = "block";
  el("pass").value = "";
}

/* ---------- Kelimeleri listele ---------- */
async function loadWords() {
  try {
    const res = await fetch("/api/words");
    const words = await res.json();
    wordsCache = words;
    el("count").textContent = words.length;
    const tbody = el("wordList");
    tbody.innerHTML = "";
    words.forEach((w) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="wordvis"><img src="/api/words/${w.id}/image" alt="" /></td>
        <td><b>${escapeHtml(w.en)}</b></td>
        <td>${escapeHtml(w.tr)}</td>
        <td><button class="admin-btn danger" data-id="${w.id}">🗑 Sil</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("button[data-id]").forEach((b) => {
      b.onclick = () => del(b.dataset.id);
    });
  } catch {
    showMsg("Kelimeler yüklenemedi.", false);
  }
}

/* ---------- Kelime ekle ---------- */
async function addWord() {
  const en = el("f-en").value.trim();
  const tr = el("f-tr").value.trim();

  if (!en) return showMsg("İngilizce kelime zorunlu.", false);
  if (isDuplicate(en))
    return showMsg(`"${en}" kelimesi zaten var. Farklı bir kelime girin.`, false);
  if (!pendingImage) return showMsg("Lütfen bir görsel seçin.", false);

  el("addBtn").disabled = true;
  try {
    const res = await fetch("/api/words", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPass,
      },
      body: JSON.stringify({ en, tr, image: pendingImage }),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(`"${en}" eklendi ✅`);
      el("f-en").value = "";
      el("f-tr").value = "";
      el("f-file").value = "";
      pendingImage = null;
      el("previewWrap").style.display = "none";
      el("dupHint").textContent = "";
      el("dupHint").className = "dup-hint";
      el("f-en").focus();
      loadWords();
    } else {
      if (res.status === 401) logout();
      showMsg(data.error || "Eklenemedi.", false);
    }
  } catch {
    showMsg("Bağlantı hatası.", false);
  } finally {
    el("addBtn").disabled = false;
  }
}

/* ---------- Kelime sil ---------- */
async function del(id) {
  if (!confirm("Bu kelime silinsin mi?")) return;
  try {
    const res = await fetch(`/api/words/${id}`, {
      method: "DELETE",
      headers: { "X-Admin-Password": adminPass },
    });
    const data = await res.json();
    if (res.ok) {
      showMsg("Silindi.");
      loadWords();
    } else {
      if (res.status === 401) logout();
      showMsg(data.error || "Silinemedi.", false);
    }
  } catch {
    showMsg("Bağlantı hatası.", false);
  }
}

/* ===========================================================
   Konuşma soruları yönetimi
   =========================================================== */
let phrasesCache = [];

function isPhraseDup(en) {
  const q = en.trim().toLowerCase();
  return q && phrasesCache.some((p) => (p.en || "").toLowerCase() === q);
}
function checkPhraseDupLive() {
  const hint = el("pDupHint");
  const en = el("p-en").value.trim();
  if (en && isPhraseDup(en)) {
    hint.textContent = "⚠️ Bu cümle zaten var.";
    hint.className = "dup-hint warn";
  } else if (en) {
    hint.textContent = "✓ Uygun";
    hint.className = "dup-hint ok";
  } else {
    hint.textContent = "";
    hint.className = "dup-hint";
  }
}

async function loadPhrases() {
  try {
    const res = await fetch("/api/phrases");
    const list = await res.json();
    phrasesCache = list;
    el("pcount").textContent = list.length;
    const tbody = el("phraseList");
    tbody.innerHTML = "";
    list.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>${escapeHtml(p.en)}</b></td>
        <td>${escapeHtml(p.tr)}</td>
        <td><button class="admin-btn danger" data-id="${p.id}">🗑 Sil</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("button[data-id]").forEach((b) => {
      b.onclick = () => delPhrase(b.dataset.id);
    });
  } catch {
    showMsg("Sorular yüklenemedi.", false);
  }
}

async function addPhrase() {
  const en = el("p-en").value.trim();
  const tr = el("p-tr").value.trim();
  if (!en) return showMsg("İngilizce cümle zorunlu.", false);
  if (isPhraseDup(en)) return showMsg(`"${en}" zaten var.`, false);

  el("addPhraseBtn").disabled = true;
  try {
    const res = await fetch("/api/phrases", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Password": adminPass },
      body: JSON.stringify({ en, tr }),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(`"${en}" eklendi ✅`);
      el("p-en").value = "";
      el("p-tr").value = "";
      el("pDupHint").textContent = "";
      el("pDupHint").className = "dup-hint";
      el("p-en").focus();
      loadPhrases();
    } else {
      if (res.status === 401) logout();
      showMsg(data.error || "Eklenemedi.", false);
    }
  } catch {
    showMsg("Bağlantı hatası.", false);
  } finally {
    el("addPhraseBtn").disabled = false;
  }
}

async function delPhrase(id) {
  if (!confirm("Bu soru silinsin mi?")) return;
  try {
    const res = await fetch(`/api/phrases/${id}`, {
      method: "DELETE",
      headers: { "X-Admin-Password": adminPass },
    });
    const data = await res.json();
    if (res.ok) {
      showMsg("Silindi.");
      loadPhrases();
    } else {
      if (res.status === 401) logout();
      showMsg(data.error || "Silinemedi.", false);
    }
  } catch {
    showMsg("Bağlantı hatası.", false);
  }
}

/* ---------- Olaylar ---------- */
el("loginBtn").onclick = login;
el("pass").addEventListener("keydown", (e) => e.key === "Enter" && login());
el("addBtn").onclick = addWord;
el("logoutBtn").onclick = logout;
el("f-file").addEventListener("change", onFileChange);
el("f-en").addEventListener("input", checkDupLive);
el("addPhraseBtn").onclick = addPhrase;
el("p-en").addEventListener("input", checkPhraseDupLive);
el("p-tr").addEventListener("keydown", (e) => e.key === "Enter" && addPhrase());

if (adminPass) openPanel();
