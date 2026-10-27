/* ==========================================================================
   METİN SESLENDİRME & KARAOKE OKUMA UYGULAMASI (STABİL & HATA ENGELLEMELİ)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Öğeleri
  const topicsNav = document.getElementById("topicsNav");
  const contentArea = document.getElementById("contentArea");
  const audioPlayer = document.getElementById("audioPlayer");
  const playToggleBtn = document.getElementById("playToggleBtn");
  const playIcon = document.getElementById("playIcon");
  const playText = document.getElementById("playText");
  const muteBtn = document.getElementById("muteBtn");
  const searchInput = document.getElementById("searchInput");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const speedSelect = document.getElementById("speedSelect");
  const autoScrollCheck = document.getElementById("autoScrollCheck");
  const progressSlider = document.getElementById("progressSlider");
  const currentTimeLabel = document.getElementById("currentTimeLabel");
  const totalTimeLabel = document.getElementById("totalTimeLabel");
  const currentTopicTitle = document.getElementById("currentTopicTitle");

  // Uygulama Durumu (State)
  let appData = {};
  let currentTopicId = "mevduat";
  let activeParagraphIndex = -1;
  let isUserScrolling = false;
  let isAutoScrolling = false;
  let scrollTimeout = null;
  let isMuted = false;

  // 1. TEMA YÖNETİMİ
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    themeToggleBtn.textContent = newTheme === "dark" ? "☀️" : "🌙";
  });

  // 2. AYARLAR MODAL YÖNETİMİ
  settingsBtn.addEventListener("click", () => settingsModal.classList.add("active"));
  closeModalBtn.addEventListener("click", () => settingsModal.classList.remove("active"));
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove("active");
  });

  speedSelect.addEventListener("change", (e) => {
    try {
      audioPlayer.playbackRate = parseFloat(e.target.value);
    } catch (err) {
      console.warn("Hız değiştirme hatası:", err);
    }
  });

  // 3. VERİ YÜKLEME
  fetch("data.json")
    .then((res) => res.json())
    .then((data) => {
      appData = data;
      initNavigation();
      loadTopic(currentTopicId);
    })
    .catch((err) => {
      console.error("Veri yükleme hatası:", err);
      contentArea.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">
        ⚠️ Konu verisi yüklenemedi. Lütfen sayfayı yenileyiniz.
      </div>`;
    });

  // 4. KONU KATALOG BUTONLARI
  function initNavigation() {
    topicsNav.innerHTML = "";
    Object.keys(appData).forEach((topicId) => {
      const topic = appData[topicId];
      const btn = document.createElement("button");
      btn.className = `topic-btn ${topicId === currentTopicId ? "active" : ""}`;
      btn.dataset.id = topicId;
      btn.innerHTML = `<span>${topic.icon}</span> <span>${topic.title}</span>`;
      btn.addEventListener("click", () => {
        if (currentTopicId !== topicId) {
          loadTopic(topicId);
        }
      });
      topicsNav.appendChild(btn);
    });
  }

  // 5. KONU YÜKLEME İŞLEMİ
  function loadTopic(topicId) {
    currentTopicId = topicId;
    activeParagraphIndex = -1;

    document.querySelectorAll(".topic-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.id === topicId);
    });

    const topic = appData[topicId];
    if (!topic) return;

    currentTopicTitle.textContent = topic.title;

    // MP3 Yükle
    audioPlayer.src = `audio/${topicId}.mp3`;
    audioPlayer.load();

    // Metin Kartları
    contentArea.innerHTML = "";
    topic.paragraphs.forEach((p) => {
      const card = document.createElement("div");
      card.className = "paragraph-card";
      card.dataset.index = p.index;
      card.dataset.start = p.start;
      card.dataset.end = p.end;
      card.textContent = p.text;

      // Paragraf Tıklama
      card.addEventListener("click", () => {
        safeSeekAudio(p.start);
        if (audioPlayer.paused) {
          audioPlayer.play().catch((e) => console.log("Oynatma engellendi:", e));
        }
        highlightParagraph(p.index);
      });

      contentArea.appendChild(card);
    });

    searchInput.value = "";
    updatePlayButtonState();
  }

  // Güvenli Ses Sarma Fonksiyonu (Hataları Önler)
  function safeSeekAudio(seconds) {
    if (isNaN(seconds) || seconds < 0) return;
    try {
      const duration = audioPlayer.duration || Infinity;
      const targetTime = Math.min(Math.max(0, seconds), duration);
      audioPlayer.currentTime = targetTime;
    } catch (e) {
      console.warn("Ses sarma hatası önlendi:", e);
    }
  }

  // 6. SESE GÖRE PARAGRAF VURGULAMA & KARAOKE TAKİBİ
  audioPlayer.addEventListener("timeupdate", () => {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration || 1;

    progressSlider.value = (currentTime / duration) * 100;
    currentTimeLabel.textContent = formatTime(currentTime);
    totalTimeLabel.textContent = formatTime(duration);

    if (!appData[currentTopicId]) return;

    const paragraphs = appData[currentTopicId].paragraphs;
    let foundIndex = -1;

    for (let i = 0; i < paragraphs.length; i++) {
      if (currentTime >= paragraphs[i].start && currentTime <= paragraphs[i].end) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1 && foundIndex !== activeParagraphIndex) {
      highlightParagraph(foundIndex);
    }
  });

  function highlightParagraph(index) {
    activeParagraphIndex = index;
    const cards = document.querySelectorAll(".paragraph-card");

    cards.forEach((card) => {
      const cardIndex = parseInt(card.dataset.index, 10);
      if (cardIndex === index) {
        card.classList.add("active-reading");

        if (autoScrollCheck.checked && !isUserScrolling) {
          isAutoScrolling = true;
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            isAutoScrolling = false;
          }, 500);
        }
      } else {
        card.classList.remove("active-reading");
      }
    });
  }

  // 7. KULLANICI MOUSE / DOKUNMATİK KAYDIRMA HATA ENGELLEMELİ SENKRONİZASYON
  window.addEventListener("scroll", () => {
    // Otomatik kaydırma esnasında döngüye girmesini engelle
    if (isAutoScrolling) return;

    isUserScrolling = true;
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      isUserScrolling = false;

      // Sadece ses çalarken ve kaydırma durduğunda senkronize et
      if (!audioPlayer.paused && audioPlayer.readyState >= 2) {
        syncAudioToViewport();
      }
    }, 300);
  });

  function syncAudioToViewport() {
    const cards = document.querySelectorAll(".paragraph-card:not(.hidden)");
    if (!cards.length) return;

    let closestCard = null;
    let minDistance = Infinity;
    const viewportCenter = window.innerHeight / 2;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - cardCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestCard = card;
      }
    });

    if (closestCard && closestCard.dataset.start) {
      const startSec = parseFloat(closestCard.dataset.start);
      if (!isNaN(startSec) && Math.abs(audioPlayer.currentTime - startSec) > 3) {
        safeSeekAudio(startSec);
      }
    }
  }

  // 8. OYNAT / SESSİZE AL (BAŞLAT / DURAKLAT)
  playToggleBtn.addEventListener("click", () => {
    if (audioPlayer.paused) {
      audioPlayer.play().catch((e) => console.log("Oynatma hatası:", e));
    } else {
      audioPlayer.pause();
    }
    updatePlayButtonState();
  });

  function updatePlayButtonState() {
    if (audioPlayer.paused) {
      playIcon.textContent = "▶️";
      playText.textContent = "Başlat";
    } else {
      playIcon.textContent = "⏸️";
      playText.textContent = "Sessize Al";
    }
  }

  audioPlayer.addEventListener("play", updatePlayButtonState);
  audioPlayer.addEventListener("pause", updatePlayButtonState);

  muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    audioPlayer.muted = isMuted;
    muteBtn.textContent = isMuted ? "🔇" : "🔊";
  });

  progressSlider.addEventListener("input", (e) => {
    const duration = audioPlayer.duration || 1;
    safeSeekAudio((e.target.value / 100) * duration);
  });

  // 9. ARAMA ÇUBUĞU FİLTRELEME
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    const cards = document.querySelectorAll(".paragraph-card");

    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      if (!query || text.includes(query)) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  });

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
});
