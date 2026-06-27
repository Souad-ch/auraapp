/* AURA — application logic */
(function () {
  "use strict";

  const cfg = window.AURA_CONFIG || {};
  let lang = localStorage.getItem("aura_lang") || "ar";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const t = (k) => (I18N[lang] && I18N[lang][k]) || k;

  /* ---------- Stars ---------- */
  (function stars() {
    const box = $("#stars");
    if (!box) return;
    let html = "";
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * 100, y = Math.random() * 100;
      const s = Math.random() * 2 + 1, d = (Math.random() * 4).toFixed(2);
      html += `<span class="star" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${d}s"></span>`;
    }
    box.innerHTML = html;
  })();

  /* ---------- Language ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.getAttribute("data-i18n")); });
    $("#langToggle").textContent = lang === "ar" ? "EN" : "ع";
    renderCourses();
    renderMasters();
    setupSupportLinks();
  }
  $("#langToggle").addEventListener("click", () => {
    lang = lang === "ar" ? "en" : "ar";
    localStorage.setItem("aura_lang", lang);
    applyLang();
  });

  /* ---------- WhatsApp helper ---------- */
  function waLink(msg) {
    const num = (cfg.whatsapp || "").replace(/[^\d]/g, "");
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  function setupSupportLinks() {
    const wa = $("#whatsappBtn"); if (wa) wa.href = waLink(t("wa_general_msg"));
    const tech = $("#techBtn"); if (tech) tech.href = waLink(t("wa_tech_msg"));
  }

  /* ---------- Daily energy ---------- */
  function todayKey() { return new Date().toISOString().slice(0, 10); }
  function seedFromDate() {
    const d = new Date(); return d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  }
  function pick(arr, offset) { return arr[(seedFromDate() + offset) % arr.length]; }

  function revealDaily() {
    const msg = pick(DAILY.messages[lang], 0);
    const color = pick(DAILY.colors[lang], 1);
    const element = pick(DAILY.elements[lang], 2);
    const number = ((seedFromDate() % 9) + 1);

    $("#dailyMessage").textContent = msg;
    $("#dailyNumber").textContent = number;
    $("#dailyColor").textContent = color[0];
    $("#dailyColorDot").style.background = color[1];
    $("#dailyElement").textContent = element;

    $("#dailyFront").hidden = true;
    $("#dailyBack").hidden = false;
    updateStreak();
  }

  function updateStreak() {
    const today = todayKey();
    let last = localStorage.getItem("aura_last");
    let count = parseInt(localStorage.getItem("aura_streak") || "0", 10);
    if (last !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yest = y.toISOString().slice(0, 10);
      count = last === yest ? count + 1 : 1;
      localStorage.setItem("aura_streak", String(count));
      localStorage.setItem("aura_last", today);
    }
    $("#streakCount").textContent = count;
    $("#streakBox").hidden = false;
  }

  $("#revealBtn").addEventListener("click", revealDaily);
  // Auto-show if already revealed today
  if (localStorage.getItem("aura_last") === todayKey()) {
    revealDaily();
  } else {
    const c = parseInt(localStorage.getItem("aura_streak") || "0", 10);
    if (c > 0) { $("#streakCount").textContent = c; $("#streakBox").hidden = false; }
  }

  /* ---------- Cards ---------- */
  function renderDeck() {
    const deck = $("#cardDeck");
    $("#cardResult").hidden = true;
    deck.innerHTML = "";
    const idx = [...Array(CARDS.length).keys()].sort(() => Math.random() - 0.5).slice(0, 5);
    idx.forEach((i) => {
      const el = document.createElement("button");
      el.className = "tcard";
      el.innerHTML = `<span class="tcard-inner"><span class="tcard-back">✦</span></span>`;
      el.addEventListener("click", () => drawCard(el, CARDS[i]));
      deck.appendChild(el);
    });
  }
  function drawCard(el, card) {
    if (el.classList.contains("flipped")) return;
    $$(".tcard").forEach((c) => { if (c !== el) c.classList.add("dim"); });
    el.classList.add("flipped");
    el.querySelector(".tcard-inner").innerHTML =
      `<span class="tcard-face">${card.sym}</span>`;
    $("#cardName").textContent = card.name[lang];
    $("#cardMeaning").textContent = card.meaning[lang];
    const res = $("#cardResult");
    res.hidden = false;
    setTimeout(() => res.scrollIntoView({ behavior: "smooth", block: "nearest" }), 250);
  }
  $("#reshuffleBtn").addEventListener("click", renderDeck);
  renderDeck();

  /* ---------- Courses ---------- */
  function renderCourses() {
    const grid = $("#coursesGrid"); if (!grid) return;
    grid.innerHTML = "";
    (cfg.courses || []).forEach((c) => {
      const card = document.createElement("div");
      card.className = "tile";
      card.innerHTML = `
        <div class="tile-icon">${c.icon || "📘"}</div>
        <h3 class="tile-title">${c.title[lang]}</h3>
        <p class="tile-desc">${c.desc[lang]}</p>
        <div class="tile-foot">
          <span class="price">${c.price[lang]}</span>
          <button class="btn btn-primary btn-sm">${t("subscribe")}</button>
        </div>`;
      card.querySelector("button").addEventListener("click", () =>
        openModal("course", c.title[lang]));
      grid.appendChild(card);
    });
  }

  /* ---------- Masters ---------- */
  function renderMasters() {
    const grid = $("#mastersGrid"); if (!grid) return;
    grid.innerHTML = "";
    (cfg.masters || []).forEach((m) => {
      const card = document.createElement("div");
      card.className = "tile tile-master";
      card.innerHTML = `
        <div class="avatar">${m.avatar || "🌟"}</div>
        <h3 class="tile-title">${m.name[lang]}</h3>
        <p class="tile-specialty">${m.specialty[lang]}</p>
        <p class="tile-desc">${m.services[lang]}</p>
        <button class="btn btn-ghost btn-sm">${t("book")}</button>`;
      card.querySelector("button").addEventListener("click", () =>
        openModal("master", m.name[lang]));
      grid.appendChild(card);
    });
  }

  /* ---------- Modal ---------- */
  function openModal(type, name) {
    const isCourse = type === "course";
    $("#modalTitle").textContent = isCourse ? t("course_modal_title") : t("master_modal_title");
    $("#modalBody").textContent = `${isCourse ? t("course_modal_body") : t("master_modal_body")} «${name}».`;
    const waMsg = (isCourse ? t("wa_course_msg") : t("wa_master_msg")) + ` ${name}`;
    $("#modalWhatsapp").href = waLink(waMsg);
    $("#modalPaypal").href = cfg.paypal || "#";
    $("#modal").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; }
  $("#modalClose").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- PWA install ---------- */
  let deferredPrompt = null;
  const banner = $("#installBanner");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!localStorage.getItem("aura_install_dismissed")) banner.hidden = false;
  });
  async function doInstall() {
    if (!deferredPrompt) {
      alert(lang === "ar"
        ? "على آيفون: اضغط زر المشاركة ⬆️ ثم «إضافة إلى الشاشة الرئيسية»."
        : "On iPhone: tap Share ⬆️ then “Add to Home Screen”.");
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner.hidden = true;
  }
  $("#installBtn").addEventListener("click", doInstall);
  $("#installBtnHero").addEventListener("click", doInstall);
  $("#installClose").addEventListener("click", () => {
    banner.hidden = true;
    localStorage.setItem("aura_install_dismissed", "1");
  });
  window.addEventListener("appinstalled", () => { banner.hidden = true; });

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  applyLang();
})();
