/* ===========================================================
   Ana ekrana ekle (PWA) — "Eklemek ister misin?" şeridi
   =========================================================== */

// Service worker'ı kaydet (kurulabilirlik için gerekli)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

(function () {
  const bar = document.getElementById("installBar");
  const iosHelp = document.getElementById("iosHelp");
  if (!bar) return;

  let deferredPrompt = null;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const dismissed = () => {
    try {
      return localStorage.getItem("a2hs_dismissed") === "1";
    } catch {
      return false;
    }
  };
  const setDismissed = () => {
    try {
      localStorage.setItem("a2hs_dismissed", "1");
    } catch {}
  };

  const showBar = () => {
    if (!dismissed() && !isStandalone) bar.hidden = false;
  };
  const hideBar = () => {
    bar.hidden = true;
  };

  // Android / Chrome / Edge / masaüstü Chrome
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showBar();
  });

  // iOS Safari: beforeinstallprompt yok -> şeridi biz gösteririz
  if (isIOS && !isStandalone && !dismissed()) {
    setTimeout(showBar, 1200);
  }

  // Kurulum tamamlandı
  window.addEventListener("appinstalled", () => {
    hideBar();
    setDismissed();
  });

  // "Evet"
  const yes = document.getElementById("installYes");
  const no = document.getElementById("installNo");
  const iosClose = document.getElementById("iosHelpClose");

  if (yes)
    yes.onclick = async () => {
      hideBar();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        try {
          await deferredPrompt.userChoice;
        } catch {}
        deferredPrompt = null;
        setDismissed();
      } else if (isIOS && iosHelp) {
        iosHelp.hidden = false; // iPhone/iPad: adımları göster
      }
    };
  if (no)
    no.onclick = () => {
      hideBar();
      setDismissed();
    };
  if (iosClose)
    iosClose.onclick = () => {
      iosHelp.hidden = true;
    };

  // Oyun/konuşma başlayınca şeridi gizle (ekranı kapatmasın)
  ["startBtn", "startTalkBtn"].forEach((id) => {
    const b = document.getElementById(id);
    if (b) b.addEventListener("click", hideBar);
  });
})();
