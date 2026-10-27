/* ==========================================================================
   METİN SESLENDİRME & KARAOKE OKUMA UYGULAMASI (EDİTÖRYAL YAYIN BİÇİMİ PDF)
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
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchInfoBar = document.getElementById("searchInfoBar");
  const searchResultCount = document.getElementById("searchResultCount");
  const otherTopicSuggestions = document.getElementById("otherTopicSuggestions");
  const focusActiveBtn = document.getElementById("focusActiveBtn");
  const printPdfBtn = document.getElementById("printPdfBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const speedSelect = document.getElementById("speedSelect");
  const themeSelect = document.getElementById("themeSelect");
  const fontSizeSelect = document.getElementById("fontSizeSelect");
  const autoScrollCheck = document.getElementById("autoScrollCheck");
  const progressSlider = document.getElementById("progressSlider");
  const currentTimeLabel = document.getElementById("currentTimeLabel");
  const totalTimeLabel = document.getElementById("totalTimeLabel");
  const currentTopicTitle = document.getElementById("currentTopicTitle");

  // Özel İstenen Sıralama
  const topicOrder = ["genelbilgiler", "mevduat", "yatirim", "bireysel", "odemesistemleri"];

  // Uygulama Durumu
  let appData = {};
  let currentTopicId = "genelbilgiler";
  let activeParagraphIndex = -1;
  let isUserScrolling = false;
  let isAutoScrolling = false;
  let scrollTimeout = null;
  let isMuted = false;

  // TÜRKÇE HARF BÜYÜTME/KÜÇÜLTME (CASING) DÜZELTME YARDIMCISI
  function turkishNormalize(str) {
    if (!str) return "";
    return str
      .replace(/İ/g, "i")
      .replace(/I/g, "ı")
      .replace(/Ğ/g, "ğ")
      .replace(/Ü/g, "ü")
      .replace(/Ş/g, "ş")
      .replace(/Ö/g, "ö")
      .replace(/Ç/g, "ç")
      .toLocaleLowerCase("tr");
  }

  // 1. TEMA YÖNETİMİ
  const themeIcons = {
    light: "☀️",
    sepya: "📜",
    dark: "🌙"
  };

  let currentTheme = localStorage.getItem("theme") || "light";
  if (!themeIcons[currentTheme]) {
    currentTheme = "light";
  }
  setTheme(currentTheme);

  function setTheme(theme) {
    if (!themeIcons[theme]) theme = "light";
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    if (themeToggleBtn) {
      themeToggleBtn.textContent = themeIcons[theme] || "☀️";
    }
    if (themeSelect) {
      themeSelect.value = theme;
    }
  }

  themeToggleBtn.addEventListener("click", () => {
    const themeCycle = ["light", "sepya", "dark"];
    const currentIndex = themeCycle.indexOf(currentTheme);
    const nextTheme = themeCycle[(currentIndex + 1) % themeCycle.length];
    setTheme(nextTheme);
  });

  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => setTheme(e.target.value));
  }

  // METİN BOYUTU YÖNETİMİ
  const savedFontSize = localStorage.getItem("fontSize") || "16.5px";
  document.documentElement.style.setProperty("--para-font-size", savedFontSize);
  if (fontSizeSelect) {
    fontSizeSelect.value = savedFontSize;
    fontSizeSelect.addEventListener("change", (e) => {
      const newSize = e.target.value;
      document.documentElement.style.setProperty("--para-font-size", newSize);
      localStorage.setItem("fontSize", newSize);
    });
  }

  // 2. ÖDÜLLÜ EDİTÖRYAL YAYINCILIK DÜZEYİNDE ŞIK PDF ÇIKTISI ENGINE (html2pdf.js)
  if (printPdfBtn) {
    printPdfBtn.addEventListener("click", () => {
      generatePdf();
    });
  }

  function generatePdf() {
    const topic = appData[currentTopicId];
    if (!topic) return;

    printPdfBtn.textContent = "⏳";

    const todayStr = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

    // Ödüllü Editoryal Yayıncılık Şablonu (Apple & Akademik Yayıncılık Disiplini)
    // - Numaralandırma Yok, Orijinal İçerik %100 Birebir Korunur.
    // - Kutu, Gölge, Abartılı Şeritler Yok. Mükemmel Tipografi, Satır Aralığı ve Marjin Dengesi.
    const pdfContainer = document.createElement("div");
    pdfContainer.style.width = "780px";
    pdfContainer.style.padding = "40px 48px";
    pdfContainer.style.fontFamily = "Georgia, 'Times New Roman', 'SF Pro Text', serif";
    pdfContainer.style.color = "#0f172a";
    pdfContainer.style.backgroundColor = "#ffffff";

    // Üst Kapak Başlığı
    const headerHtml = `
      <div style="margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 20px;">
          <span style="font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #0284c7; text-transform: uppercase;">SESLİ NOTLAR DİJİTAL AKADEMİK YAYINLARI</span>
          <span style="font-size: 11px; color: #64748b; font-style: italic;">${todayStr}</span>
        </div>
        <h1 style="font-size: 28px; font-weight: 800; font-family: 'SF Pro Display', -apple-system, sans-serif; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.02em; line-height: 1.25;">${topic.title}</h1>
        <div style="width: 48px; height: 3px; background-color: #0284c7; border-radius: 2px;"></div>
      </div>
    `;

    // Editoryal Paragraflar (Sıfır Kutu, Sıfır Numaralandırma, Mükemmel Tipografi)
    let paragraphsHtml = '<div style="display: flex; flex-direction: column; gap: 16px;">';
    topic.paragraphs.forEach((p, idx) => {
      const isLead = idx === 0;
      paragraphsHtml += `
        <p style="font-size: ${isLead ? '15px' : '13.5px'}; line-height: 1.8; color: ${isLead ? '#0f172a' : '#1e293b'}; text-align: justify; margin: 0; page-break-inside: avoid; text-indent: ${isLead ? '0' : '1.5em'};">
          ${p.text}
        </p>
      `;
    });
    paragraphsHtml += '</div>';

    // Alt Bilgi
    const footerHtml = `
      <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; font-size: 10px; font-family: sans-serif; color: #94a3b8;">
        <span>Sesli Notlar Eğitim Serisi</span>
        <span>https://alikocmersin.github.io/vakif/</span>
      </div>
    `;

    pdfContainer.innerHTML = headerHtml + paragraphsHtml + footerHtml;

    const opt = {
      margin: 12,
      filename: `${topic.title.replace(/\s+/g, '_')}_Ders_Notlari.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== "undefined") {
      html2pdf().set(opt).from(pdfContainer).save().then(() => {
        printPdfBtn.textContent = "📄";
      }).catch((err) => {
        console.error("PDF oluşturma hatası:", err);
        printPdfBtn.textContent = "📄";
        window.print();
      });
    } else {
      window.print();
      printPdfBtn.textContent = "📄";
    }
  }

  // 3. AYARLAR MODAL PANELSİ
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

  // 4. VERİ YÜKLEME (data.json)
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

  // 5. KONU NAVİGASYON
  function initNavigation() {
    topicsNav.innerHTML = "";

    const availableKeys = topicOrder.filter(key => appData[key]);
    Object.keys(appData).forEach(key => {
      if (!availableKeys.includes(key)) availableKeys.push(key);
    });

    availableKeys.forEach((topicId) => {
      const topic = appData[topicId];
      const btn = document.createElement("button");
      btn.className = `topic-btn ${topicId === currentTopicId ? "active" : ""}`;
      btn.dataset.id = topicId;
      btn.innerHTML = `<span>${topic.icon}</span> <span>${topic.title}</span>`;
      btn.addEventListener("click", () => {
        if (currentTopicId !== topicId) {
          clearSearch();
          loadTopic(topicId);
        }
      });
      topicsNav.appendChild(btn);
    });
  }

  // 6. KONU YÜKLEME
  function loadTopic(topicId) {
    const wasPlaying = !audioPlayer.paused;

    currentTopicId = topicId;
    activeParagraphIndex = -1;

    document.querySelectorAll(".topic-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.id === topicId);
    });

    const topic = appData[topicId];
    if (!topic) return;

    currentTopicTitle.textContent = topic.title;

    audioPlayer.src = `audio/${topicId}.mp3`;
    audioPlayer.load();

    renderParagraphs(topic.paragraphs);
    setupMediaSessionHandlers();
    updateLockScreenMetadata(topic.title, "Hazırlanıyor...");

    if (wasPlaying) {
      audioPlayer.play().catch((e) => console.log("Otomatik konu geçişi oynatma uyarısı:", e));
    }

    updatePlayButtonState();
  }

  function updateLockScreenMetadata(topicTitle, paragraphText) {
    if ("mediaSession" in navigator) {
      const displayText = paragraphText || topicTitle;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: displayText,
        artist: topicTitle,
        album: "Sesli Notlar",
        artwork: [
          { src: "https://img.icons8.com/color/512/bank-building.png", sizes: "512x512", type: "image/png" }
        ]
      });
    }
  }

  function setupMediaSessionHandlers() {
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", () => {
          audioPlayer.play();
          updatePlayButtonState();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          audioPlayer.pause();
          updatePlayButtonState();
        });
        navigator.mediaSession.setActionHandler("seekbackward", () => {
          safeSeekAudio(audioPlayer.currentTime - 10);
        });
        navigator.mediaSession.setActionHandler("seekforward", () => {
          safeSeekAudio(audioPlayer.currentTime + 10);
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          switchTopicByOffset(-1);
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          switchTopicByOffset(1);
        });
      } catch (e) {
        console.log("MediaSession eylem atama uyarısı:", e);
      }
    }
  }

  function switchTopicByOffset(offset) {
    const keys = topicOrder.filter(k => appData[k]);
    const currentIndex = keys.indexOf(currentTopicId);
    if (currentIndex !== -1) {
      let targetIndex = (currentIndex + offset + keys.length) % keys.length;
      loadTopic(keys[targetIndex]);
    }
  }

  function renderParagraphs(paragraphs) {
    contentArea.innerHTML = "";
    paragraphs.forEach((p) => {
      const card = document.createElement("div");
      card.className = "paragraph-card";
      card.dataset.index = p.index;
      card.dataset.start = p.start;
      card.dataset.end = p.end;
      card.dataset.rawText = p.text;
      card.textContent = p.text;

      card.addEventListener("click", () => {
        if (searchInput.value.trim() !== "") {
          clearSearch(false);
        }

        safeSeekAudio(p.start);
        if (audioPlayer.paused) {
          audioPlayer.play().catch((e) => console.log("Oynatma engellendi:", e));
        }
        highlightParagraph(p.index, true);
      });

      contentArea.appendChild(card);
    });
  }

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

  // 7. SESE GÖRE PARAGRAF VURGULAMA
  audioPlayer.addEventListener("timeupdate", () => {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration || 1;

    progressSlider.value = (currentTime / duration) * 100;
    currentTimeLabel.textContent = formatTime(currentTime);
    totalTimeLabel.textContent = formatTime(duration);

    if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: audioPlayer.playbackRate,
          position: currentTime
        });
      } catch (e) {}
    }

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

    checkActiveVisibility();
  });

  function highlightParagraph(index, forceScroll = false) {
    activeParagraphIndex = index;
    const cards = document.querySelectorAll(".paragraph-card");
    const currentTopic = appData[currentTopicId];

    cards.forEach((card) => {
      const cardIndex = parseInt(card.dataset.index, 10);
      if (cardIndex === index) {
        card.classList.add("active-reading");

        const paragraphText = card.dataset.rawText || card.textContent;
        if (currentTopic) {
          updateLockScreenMetadata(currentTopic.title, paragraphText);
        }

        if ((autoScrollCheck.checked && !isUserScrolling) || forceScroll) {
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

  function checkActiveVisibility() {
    const activeCard = document.querySelector(".paragraph-card.active-reading");
    if (!activeCard) {
      focusActiveBtn.style.display = "none";
      return;
    }

    const rect = activeCard.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

    if (!isVisible && !audioPlayer.paused) {
      focusActiveBtn.style.display = "block";
    } else {
      focusActiveBtn.style.display = "none";
    }
  }

  focusActiveBtn.addEventListener("click", () => {
    if (activeParagraphIndex !== -1) {
      highlightParagraph(activeParagraphIndex, true);
    }
  });

  // 8. KULLANICI KAYDIRMA SENKRONİZASYONU
  window.addEventListener("scroll", () => {
    if (isAutoScrolling) return;

    isUserScrolling = true;
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      isUserScrolling = false;
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

  // 9. GELİŞMİŞ ARAMA
  searchInput.addEventListener("input", (e) => {
    performSearch(e.target.value);
  });

  clearSearchBtn.addEventListener("click", () => {
    clearSearch(true);
  });

  function performSearch(query) {
    const rawQuery = query.trim();
    const normQuery = turkishNormalize(rawQuery);

    if (!normQuery) {
      clearSearch(false);
      return;
    }

    clearSearchBtn.style.display = "block";
    searchInfoBar.style.display = "flex";

    const cards = document.querySelectorAll(".paragraph-card");
    let currentTopicMatchCount = 0;
    let firstMatchedCard = null;

    cards.forEach((card) => {
      const rawText = card.dataset.rawText || card.textContent;
      const normText = turkishNormalize(rawText);

      if (normText.includes(normQuery)) {
        card.classList.remove("hidden");
        currentTopicMatchCount++;

        if (!firstMatchedCard) {
          firstMatchedCard = card;
        }

        const regex = new RegExp(`(${escapeRegExp(rawQuery)})`, "gi");
        card.innerHTML = rawText.replace(regex, "<mark>$1</mark>");
      } else {
        card.classList.add("hidden");
        card.innerHTML = rawText;
      }
    });

    searchResultCount.textContent = `${currentTopicMatchCount} sonuç bulundu (${appData[currentTopicId].title})`;

    if (firstMatchedCard) {
      isAutoScrolling = true;
      firstMatchedCard.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => { isAutoScrolling = false; }, 500);
    }

    checkOtherTopicsSearch(normQuery);
  }

  function checkOtherTopicsSearch(normQuery) {
    otherTopicSuggestions.innerHTML = "";
    Object.keys(appData).forEach((topicId) => {
      if (topicId === currentTopicId) return;

      const topic = appData[topicId];
      const matchCount = topic.paragraphs.filter((p) => turkishNormalize(p.text).includes(normQuery)).length;

      if (matchCount > 0) {
        const chip = document.createElement("button");
        chip.className = "suggestion-chip";
        chip.textContent = `${topic.title}: ${matchCount} sonuç -> Git`;
        chip.addEventListener("click", () => {
          const queryVal = searchInput.value;
          loadTopic(topicId);
          searchInput.value = queryVal;
          performSearch(queryVal);
        });
        otherTopicSuggestions.appendChild(chip);
      }
    });
  }

  function clearSearch(resetRender = true) {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    searchInfoBar.style.display = "none";
    otherTopicSuggestions.innerHTML = "";

    const cards = document.querySelectorAll(".paragraph-card");
    cards.forEach((card) => {
      card.classList.remove("hidden");
      if (card.dataset.rawText) {
        card.textContent = card.dataset.rawText;
      }
    });
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // 10. OYNAT / BEKLE KONTROLÜ
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
      playText.textContent = "Bekle";
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

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

    if (e.code === "Space") {
      e.preventDefault();
      playToggleBtn.click();
    } else if (e.code === "ArrowLeft") {
      safeSeekAudio(audioPlayer.currentTime - 5);
    } else if (e.code === "ArrowRight") {
      safeSeekAudio(audioPlayer.currentTime + 5);
    }
  });

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
});
