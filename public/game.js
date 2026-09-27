/* ===========================================================
   İngilizce Kelime Oyunu - Oyun Mantığı
   =========================================================== */

const QUESTIONS_PER_GAME = 20;
const LEVEL_STEP = 300; // her bölüm için gereken toplam yıldız

// Toplam yıldıza göre bölüm/seviye bilgisi
function levelInfo(total) {
  total = Math.max(0, total | 0);
  const level = Math.floor(total / LEVEL_STEP) + 1;
  const into = total % LEVEL_STEP;
  return { level, into, need: LEVEL_STEP, pct: Math.round((into / LEVEL_STEP) * 100) };
}

const el = (id) => document.getElementById(id);
const screens = {
  login: el("screen-login"),
  game: el("screen-game"),
  result: el("screen-result"),
  talk: el("screen-talk"),
};
function show(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

let allWords = [];
let questions = [];
let current = 0;
let score = 0;
let firstTryCount = 0;
let playerName = "";
let triedWrong = false;
let locked = false;
let pendingTimer = null; // sıradaki soruya geçiş zamanlayıcısı

/* ---------- Sesli okuma (Web Speech API) ---------- */
let enVoice = null;

// En kaliteli İNGİLİZCE sesi seçer (Türkçe sesle okunmasını engeller)
function pickVoice() {
  if (!window.speechSynthesis) return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return; // henüz yüklenmedi

  // Sadece İngilizce sesler
  const en = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));

  // Bilinen doğal/net İngilizce sesleri öncele
  const prefer = [
    "Google US English",
    "Google UK English Female",
    "Google UK English Male",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Jenny Online (Natural) - English (United States)",
    "Samantha",
    "Karen",
    "Daniel",
    "Microsoft Zira - English (United States)",
    "Microsoft David - English (United States)",
  ];
  for (const name of prefer) {
    const v = en.find((x) => x.name === name);
    if (v) {
      enVoice = v;
      return;
    }
  }
  // Aksi halde herhangi bir en-US, yoksa herhangi bir İngilizce ses
  enVoice =
    en.find((v) => /en[-_]US/i.test(v.lang)) || en[0] || enVoice || null;
}

if (window.speechSynthesis) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

function speak(text) {
  if (!window.speechSynthesis || !text) return;
  speechSynthesis.cancel();
  if (!enVoice) pickVoice(); // ilk seferde ses hazır değilse tekrar dene
  const u = new SpeechSynthesisUtterance(text);
  u.voice = enVoice || null;
  u.lang = enVoice ? enVoice.lang : "en-US";
  u.rate = 0.75; // çocuk için net ve yavaş
  u.pitch = 1.05;
  u.volume = 1;
  speechSynthesis.speak(u);
}

/* ---------- Yardımcılar ---------- */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function visualHTML(word) {
  // Gerçek görsel D1'den (base64) sunulur; tarayıcı önbelleğe alır
  return `<img src="/api/words/${word.id}/image" alt="" draggable="false" />`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

/* ---------- Kelimeleri yükle ---------- */
async function loadWords() {
  try {
    const res = await fetch("/api/words");
    allWords = await res.json();
  } catch {
    allWords = [];
  }
}

/* ---------- Soruları oluştur ---------- */
function buildQuestions() {
  const usable = allWords.filter((w) => w.en);
  const pool = shuffle(usable);
  const count = Math.min(QUESTIONS_PER_GAME, pool.length);
  questions = [];
  for (let i = 0; i < count; i++) {
    const correct = pool[i];
    // Yanlış şıklar: doğru olandan farklı 3 kelime
    const distractors = shuffle(usable.filter((w) => w.id !== correct.id)).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    questions.push({ correct, options });
  }
}

/* ---------- Bir soruyu göster ---------- */
function renderQuestion() {
  locked = false;
  triedWrong = false;
  el("feedback").textContent = "";
  const q = questions[current];

  el("qcount").textContent = `${current + 1} / ${questions.length}`;
  el("progressbar").style.width = `${(current / questions.length) * 100}%`;
  el("score").textContent = `⭐ ${score}`;

  const box = el("options");
  box.innerHTML = "";
  q.options.forEach((opt) => {
    const div = document.createElement("div");
    div.className = "option";
    const trLabel = opt.tr
      ? `<span class="opt-tr">(${escapeHtml(opt.tr)})</span>`
      : "";
    div.innerHTML = `<div class="opt-visual">${visualHTML(opt)}</div><div class="opt-label">${escapeHtml(opt.en)}${trLabel}</div>`;
    div.onclick = () => choose(div, opt, q.correct);
    box.appendChild(div);
  });

  // Kelimeyi otomatik seslendir
  setTimeout(() => speak(q.correct.en), 350);
}

/* ---------- Cevap seçildiğinde ---------- */
function choose(div, opt, correct) {
  if (locked) return;
  if (opt.id === correct.id) {
    locked = true;
    div.classList.add("correct");
    if (!triedWrong) firstTryCount++;
    const gained = triedWrong ? 5 : 10;
    score += gained;
    el("score").textContent = `⭐ ${score}`;
    el("feedback").textContent = pickPraise() + ` +${gained}`;
    speak(correct.en);
    confettiBurst();
    pendingTimer = setTimeout(next, 1300);
  } else {
    triedWrong = true;
    div.classList.add("wrong");
    div.onclick = null;
    el("feedback").textContent = "Tekrar dene! 💪";
  }
}

const praises = ["Harika! 🎉", "Bravo! 🌟", "Süper! 👏", "Aferin! 🥳", "Çok iyi! 🚀"];
const pickPraise = () => praises[Math.floor(Math.random() * praises.length)];

/* ---------- Sonraki soru / bitiş ---------- */
function next() {
  // Oyundan çıkıldıysa (başa dönüldüyse) ilerleme
  if (!screens.game.classList.contains("active")) return;
  current++;
  if (current >= questions.length) {
    finish();
  } else {
    renderQuestion();
  }
}

// Oyunu bırakıp giriş ekranına dön
function exitGame() {
  if (pendingTimer) clearTimeout(pendingTimer);
  if (window.speechSynthesis) speechSynthesis.cancel();
  show("login");
}

async function finish() {
  el("progressbar").style.width = "100%";
  const maxScore = questions.length * 10;
  const ratio = maxScore ? score / maxScore : 0;
  el("finalScore").textContent = `⭐ ${score}`;
  if (ratio >= 0.9) {
    el("resultEmoji").textContent = "🏆";
    el("resultText").textContent = "Muhteşemsin! Bir şampiyon gibisin!";
  } else if (ratio >= 0.6) {
    el("resultEmoji").textContent = "🌟";
    el("resultText").textContent = "Çok güzel oynadın!";
  } else {
    el("resultEmoji").textContent = "🙂";
    el("resultText").textContent = "Güzel deneme! Tekrar oynayalım mı?";
  }
  el("stAcc").textContent = `${firstTryCount}/${questions.length}`;

  show("result");
  confettiBurst(120);

  const data = await saveScore();
  renderProgress(data);
  loadBoard();
}

/* ---------- Skor kaydet ---------- */
async function saveScore() {
  try {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: playerName, score }),
    });
    return await res.json();
  } catch {
    return null;
  }
}

/* ---------- Seviye + istatistik + gelişim ---------- */
function renderProgress(data) {
  // Sunucudan yanıt gelmese bile bu oyunun verisiyle en azından bir şey göster
  const p = (data && data.player) || {};
  const totalAfter = p.total_score != null ? p.total_score : score;
  const totalBefore =
    data && typeof data.totalBefore === "number" ? data.totalBefore : totalAfter - score;

  const after = levelInfo(totalAfter);
  const before = levelInfo(totalBefore);

  el("levelBadge").textContent = `Bölüm ${after.level}`;
  el("levelBar").style.width = after.pct + "%";
  el("levelNext").textContent = `Bölüm ${after.level + 1} için ${after.need - after.into}⭐`;

  const banner = el("levelUpBanner");
  if (after.level > before.level) {
    banner.textContent = `🎉 Tebrikler! Bölüm ${after.level}'e geçtin!`;
    banner.hidden = false;
    setTimeout(() => confettiBurst(160), 300);
  } else {
    banner.hidden = true;
  }

  el("stBest").textContent = p.best_score != null ? p.best_score : score;
  el("stGames").textContent = p.games_played != null ? p.games_played : 1;
  el("stTotal").textContent = totalAfter;

  let hist = [];
  try {
    hist = JSON.parse(p.last_scores || "[]");
    if (!Array.isArray(hist)) hist = [];
  } catch {
    hist = [];
  }
  if (!hist.length) hist = [score];
  renderChart(hist);
}

function renderChart(hist) {
  const chart = el("chart");
  chart.innerHTML = "";
  const maxScore = QUESTIONS_PER_GAME * 10; // 200
  hist.forEach((s, i) => {
    const col = document.createElement("div");
    col.className = "bar-col";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = Math.max(8, Math.round((s / maxScore) * 100)) + "%";
    if (i === hist.length - 1) bar.classList.add("last");
    bar.title = s + " ⭐";
    col.appendChild(bar);
    chart.appendChild(col);
  });
}

/* ---------- Skor tablosu ---------- */
async function loadBoard() {
  try {
    const res = await fetch("/api/players");
    const players = await res.json();
    const board = el("board");
    board.innerHTML = "";
    (players || []).slice(0, 5).forEach((p, i) => {
      const li = document.createElement("li");
      if (p.name === playerName) li.classList.add("me");
      const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
      li.innerHTML = `<span><span class="rank">${medal}</span>${escapeHtml(p.name)}</span><span>⭐ ${p.best_score}</span>`;
      board.appendChild(li);
    });
  } catch {}
}

/* ---------- Oyunu başlat ---------- */
async function startGame() {
  const name = el("name").value.trim();
  if (!name) {
    el("name").focus();
    el("name").style.borderColor = "#ef4444";
    return;
  }
  playerName = name.slice(0, 20);
  localStorage.setItem("kelime_isim", playerName);
  el("hi").textContent = `👋 ${playerName}`;

  // Sesi ilk dokunuşta uyandır (mobil tarayıcılar için)
  if (window.speechSynthesis) speak(" ");

  await loadWords();
  const usable = allWords.filter((w) => w.en);
  if (usable.length < 4) {
    alert("Oyun için en az 4 kelime gerekiyor. Lütfen yönetici panelinden kelime ekleyin.");
    return;
  }
  score = 0;
  current = 0;
  firstTryCount = 0;
  buildQuestions();
  show("game");
  renderQuestion();
}

/* ===========================================================
   Konuşma / Sorular modu (flashcard)
   =========================================================== */
let phrases = [];
let talkIndex = 0;

async function loadPhrases() {
  try {
    const res = await fetch("/api/phrases");
    phrases = await res.json();
  } catch {
    phrases = [];
  }
}

async function startTalk() {
  const name = el("name").value.trim();
  if (!name) {
    el("name").focus();
    el("name").style.borderColor = "#ef4444";
    return;
  }
  playerName = name.slice(0, 20);
  localStorage.setItem("kelime_isim", playerName);
  el("talkHi").textContent = `👋 ${playerName}`;
  if (window.speechSynthesis) speak(" ");
  await loadPhrases();
  if (!phrases.length) {
    alert("Henüz soru eklenmemiş. Yönetici panelinden ekleyebilirsiniz.");
    return;
  }
  phrases = shuffle(phrases); // her açılışta karışık sırayla gelsin
  talkIndex = 0;
  show("talk");
  renderPhrase();
}

function renderPhrase() {
  const p = phrases[talkIndex];
  el("talkCount").textContent = `${talkIndex + 1} / ${phrases.length}`;
  el("talkProgress").style.width = `${((talkIndex + 1) / phrases.length) * 100}%`;
  el("talkEn").textContent = p.en;
  el("talkTr").textContent = p.tr || "";
  el("talkPrev").disabled = talkIndex === 0;
  el("talkNext").textContent = talkIndex === phrases.length - 1 ? "🎉 Bitti" : "İleri ➡";
  setTimeout(() => speak(p.en), 250);
}

function talkNext() {
  if (talkIndex >= phrases.length - 1) {
    confettiBurst(120);
    show("login");
    return;
  }
  talkIndex++;
  renderPhrase();
}
function talkPrev() {
  if (talkIndex > 0) {
    talkIndex--;
    renderPhrase();
  }
}

/* ---------- Olaylar ---------- */
el("startBtn").onclick = startGame;
el("startTalkBtn").onclick = startTalk;
el("talkSpeaker").onclick = () => speak(phrases[talkIndex]?.en || "");
el("talkNext").onclick = talkNext;
el("talkPrev").onclick = talkPrev;
el("talkExit").onclick = () => show("login");
el("name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") startGame();
});
el("speaker").onclick = () => speak(questions[current]?.correct.en || "");
el("gameExit").onclick = exitGame;
el("playAgain").onclick = startGame;
el("changeName").onclick = (e) => {
  e.preventDefault();
  show("login");
  el("name").value = "";
  el("name").focus();
};

// Kayıtlı ismi hatırla
const saved = localStorage.getItem("kelime_isim");
if (saved) el("name").value = saved;

/* ===========================================================
   Basit Konfeti
   =========================================================== */
const canvas = el("confetti");
const ctx = canvas.getContext("2d");
let confetti = [];
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);
const COLORS = ["#ff7eb3", "#ffd23f", "#4ade80", "#18b6ff", "#7c4dff", "#ff5f8f"];
function confettiBurst(n = 60) {
  for (let i = 0; i < n; i++) {
    confetti.push({
      x: innerWidth / 2,
      y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * 360,
      life: 100,
    });
  }
}
function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confetti = confetti.filter((c) => c.life > 0);
  confetti.forEach((c) => {
    c.vy += 0.4;
    c.x += c.vx;
    c.y += c.vy;
    c.rot += 8;
    c.life--;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate((c.rot * Math.PI) / 180);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
    ctx.restore();
  });
  requestAnimationFrame(tick);
}
tick();
