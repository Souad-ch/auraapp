/* AURA — application logic */
(function () {
  "use strict";

  const cfg = (typeof AURA_CONFIG !== "undefined" && AURA_CONFIG) || window.AURA_CONFIG || {};
  let lang = localStorage.getItem("aura_lang") || "ar";
  let currentMaster = null; // for booking form

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const t = (k) => (I18N[lang] && I18N[lang][k]) || k;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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
    $$("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.getAttribute("data-i18n-ph")); });
    $("#langToggle").textContent = lang === "ar" ? "EN" : "ع";
    renderCourses();
    renderMasters();
    renderTimeSlots();
    setupSupportLinks();
    refreshZodiac();
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
    const prem = $("#premiumBtn"); if (prem) prem.href = waLink(t("wa_premium_msg"));
  }

  /* ---------- Share helper ---------- */
  async function share(title, text) {
    const url = (cfg.site || location.href).split("#")[0];
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch (e) { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast(t("copied"));
    } catch (e) { /* ignore */ }
  }
  function toast(msg) {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("show");
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  /* ---------- Daily energy ---------- */
  function todayKey() { return new Date().toISOString().slice(0, 10); }
  function seedFromDate() {
    const d = new Date(); return d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  }
  function pick(arr, offset) { return arr[(seedFromDate() + offset) % arr.length]; }

  let lastDaily = { msg: "", number: "", color: "", element: "" };
  function revealDaily() {
    const msg = pick(DAILY.messages[lang], 0);
    const color = pick(DAILY.colors[lang], 1);
    const element = pick(DAILY.elements[lang], 2);
    const number = ((seedFromDate() % 9) + 1);
    lastDaily = { msg, number, color: color[0], element };

    $("#dailyMessage").textContent = msg;
    $("#dailyNumber").textContent = number;
    $("#dailyColor").textContent = color[0];
    $("#dailyColorDot").style.background = color[1];
    $("#dailyElement").textContent = element;

    $("#dailyFront").hidden = true;
    $("#dailyBack").hidden = false;
    updateStreak();
    refreshZodiac();
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
  $("#shareDaily").addEventListener("click", () => {
    const text = `${t("share_daily_title")} — ${lastDaily.msg} (${t("stat_number")}: ${lastDaily.number})`;
    share(t("share_daily_title"), text);
  });
  if (localStorage.getItem("aura_last") === todayKey()) {
    revealDaily();
  } else {
    const c = parseInt(localStorage.getItem("aura_streak") || "0", 10);
    if (c > 0) { $("#streakCount").textContent = c; $("#streakBox").hidden = false; }
  }

  /* ---------- Zodiac ---------- */
  function refreshZodiac() {
    const bd = localStorage.getItem("aura_birth");
    if (!bd) { $("#zodiacSet").hidden = false; $("#zodiacResult").hidden = true; return; }
    const [y, m, d] = bd.split("-").map(Number);
    const z = zodiacFor(m, d);
    $("#zodiacSign").textContent = `${t("your_sign")}: ${z[lang]}`;
    $("#zodiacNote").textContent = z.note[lang];
    $("#zodiacSet").hidden = true;
    $("#zodiacResult").hidden = false;
    $("#birthDate").value = bd;
  }
  $("#birthSave").addEventListener("click", () => {
    const v = $("#birthDate").value;
    if (!v) return;
    localStorage.setItem("aura_birth", v);
    refreshZodiac();
  });

  /* ---------- Cards ---------- */
  let lastCard = null;
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
    lastCard = card;
    $$(".tcard").forEach((c) => { if (c !== el) c.classList.add("dim"); });
    el.classList.add("flipped");
    el.querySelector(".tcard-inner").innerHTML = `<span class="tcard-face">${card.sym}</span>`;
    $("#cardName").textContent = card.name[lang];
    $("#cardMeaning").textContent = card.meaning[lang];
    const res = $("#cardResult");
    res.hidden = false;
    setTimeout(() => res.scrollIntoView({ behavior: "smooth", block: "nearest" }), 250);
  }
  $("#reshuffleBtn").addEventListener("click", renderDeck);
  $("#shareCard").addEventListener("click", () => {
    if (!lastCard) return;
    const text = `${t("share_card_title")} — ${lastCard.name[lang]}: ${lastCard.meaning[lang]}`;
    share(t("share_card_title"), text);
  });
  renderDeck();

  /* ---------- Courses ---------- */
  function renderCourses() {
    const grid = $("#coursesGrid"); if (!grid) return;
    grid.innerHTML = "";
    (cfg.courses || []).forEach((c) => {
      const card = document.createElement("div");
      card.className = "tile";
      card.innerHTML = `
        <div class="tile-icon">${esc(c.icon || "📘")}</div>
        <h3 class="tile-title">${esc(c.title[lang])}</h3>
        <p class="tile-desc">${esc(c.desc[lang])}</p>
        <div class="tile-foot">
          <span class="price">${esc(c.price[lang])}</span>
          <button class="btn btn-primary btn-sm">${esc(t("subscribe"))}</button>
        </div>`;
      card.querySelector("button").addEventListener("click", () => openCourse(c));
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
        <div class="avatar">${esc(m.avatar || "🌟")}</div>
        <h3 class="tile-title">${esc(m.name[lang])}</h3>
        <p class="tile-specialty">${esc(m.specialty[lang])}</p>
        <p class="tile-desc">${esc(m.services[lang])}</p>
        <button class="btn btn-ghost btn-sm">${esc(t("book"))}</button>`;
      card.querySelector("button").addEventListener("click", () => openBooking(m));
      grid.appendChild(card);
    });
  }
  function renderTimeSlots() {
    const sel = $("#bkTime"); if (!sel) return;
    const slots = cfg.timeSlots || [];
    sel.innerHTML = `<option value="">${t("book_choose")}</option>` +
      slots.map((s) => `<option value="${s}">${s}</option>`).join("");
  }

  /* ---------- Modal: course subscription ---------- */
  function openCourse(course) {
    const name = course.title[lang];
    currentMaster = null;
    $("#modalTitle").textContent = t("course_modal_title");
    $("#modalBody").textContent = `${t("course_modal_body")} «${name}».`;
    $("#bookingForm").hidden = true;
    $("#modalWhatsapp").href = waLink(`${t("wa_course_msg")} ${name}`);
    $("#modalWhatsapp").hidden = false;
    setupPayment(course.amount, name);
    showModal();
  }

  /* ---------- Modal: session booking ---------- */
  function openBooking(master) {
    currentMaster = master;
    $("#modalTitle").textContent = t("master_modal_title");
    $("#modalBody").textContent = `${t("master_modal_body")} «${master.name[lang]}».`;
    $("#bookingForm").hidden = false;
    $("#formMsg").hidden = true;
    $("#bkName").value = ""; $("#bkContact").value = ""; $("#bkDate").value = ""; $("#bkTime").value = "";
    $("#bkDate").min = todayKey();
    $("#modalWhatsapp").hidden = true; // booking uses confirm button; WhatsApp built on submit
    setupPayment(master.sessionPrice, master.name[lang]);
    showModal();
  }

  /* Choose direct PayPal buttons (if client id set) or fallback paypal.me link */
  function setupPayment(amount, label) {
    const box = $("#paypalBox");
    box.innerHTML = ""; box.hidden = true;
    if (cfg.paypalClientId && amount > 0) {
      $("#modalPaypal").hidden = true;
      renderPaypal(amount, label);
    } else {
      $("#modalPaypal").href = cfg.paypal || "#";
      $("#modalPaypal").hidden = false;
    }
  }

  $("#bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#bkName").value.trim();
    const contact = $("#bkContact").value.trim();
    const date = $("#bkDate").value;
    const time = $("#bkTime").value;
    const msgEl = $("#formMsg");
    if (!name || !contact || !date || !time) {
      msgEl.textContent = t("book_fill"); msgEl.className = "form-msg err"; msgEl.hidden = false; return;
    }
    const m = currentMaster;
    // Save to Supabase if configured (best-effort, non-blocking failure)
    await saveBooking({
      master_id: m ? m.id : "", master_name: m ? m.name.en : "",
      service: m ? m.specialty.en : "", customer_name: name,
      customer_contact: contact, session_date: date, session_time: time
    });
    msgEl.textContent = t("book_success"); msgEl.className = "form-msg ok"; msgEl.hidden = false;
    // Open WhatsApp with full booking details
    const mname = m ? m.name[lang] : "";
    const details = `${t("wa_master_msg")} ${mname}\n👤 ${name}\n📞 ${contact}\n📅 ${date}\n⏰ ${time}`;
    window.open(waLink(details), "_blank", "noopener");
  });

  /* ---------- Supabase (optional) ---------- */
  let _sb = null, _sbLoading = null;
  function loadSupabase() {
    if (_sb) return Promise.resolve(_sb);
    const sc = cfg.supabase || {};
    if (!sc.url || !sc.anonKey) return Promise.resolve(null);
    if (_sbLoading) return _sbLoading;
    _sbLoading = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = () => { _sb = window.supabase.createClient(sc.url, sc.anonKey); resolve(_sb); };
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
    return _sbLoading;
  }
  async function saveBooking(row) {
    try {
      const sb = await loadSupabase();
      if (!sb) return;
      await sb.from("bookings").insert(row);
    } catch (e) { /* fall back silently to WhatsApp */ }
  }

  /* Load courses & masters from Supabase (overrides config defaults when present) */
  function fmtPrice(amount, l) { const n = Number(amount) || 0; return l === "ar" ? `${n} $` : `$${n}`; }
  function normCourse(r) {
    return { id: r.id, icon: r.icon || "📘", amount: Number(r.amount) || 0,
      title: { ar: r.title_ar, en: r.title_en || r.title_ar },
      desc: { ar: r.desc_ar || "", en: r.desc_en || r.desc_ar || "" },
      price: { ar: fmtPrice(r.amount, "ar"), en: fmtPrice(r.amount, "en") } };
  }
  function normMaster(r) {
    return { id: r.id, avatar: r.avatar || "🌟", sessionPrice: Number(r.session_price) || 0,
      name: { ar: r.name_ar, en: r.name_en || r.name_ar },
      specialty: { ar: r.specialty_ar || "", en: r.specialty_en || r.specialty_ar || "" },
      services: { ar: r.services_ar || "", en: r.services_en || r.services_ar || "" } };
  }
  async function hydrateFromSupabase() {
    const sb = await loadSupabase();
    if (!sb) return;
    try {
      const [cs, ms] = await Promise.all([
        sb.from("courses").select("*").eq("active", true).order("sort"),
        sb.from("masters").select("*").eq("active", true).order("sort")
      ]);
      if (cs.data && cs.data.length) { cfg.courses = cs.data.map(normCourse); renderCourses(); }
      if (ms.data && ms.data.length) { cfg.masters = ms.data.map(normMaster); renderMasters(); }
    } catch (e) { /* keep config defaults */ }
  }

  /* ---------- PayPal direct checkout (optional) ---------- */
  let _ppLoading = null;
  function loadPaypal() {
    if (window.paypal) return Promise.resolve(window.paypal);
    if (!cfg.paypalClientId) return Promise.resolve(null);
    if (_ppLoading) return _ppLoading;
    _ppLoading = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(cfg.paypalClientId)}&currency=${cfg.currency || "USD"}`;
      s.onload = () => resolve(window.paypal || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
    return _ppLoading;
  }
  async function renderPaypal(amount, label) {
    const box = $("#paypalBox");
    const pp = await loadPaypal();
    if (!pp) { $("#modalPaypal").href = cfg.paypal || "#"; $("#modalPaypal").hidden = false; return; }
    box.hidden = false;
    pp.Buttons({
      style: { color: "gold", shape: "pill", label: "pay" },
      createOrder: (data, actions) => actions.order.create({
        purchase_units: [{ description: `AURA — ${label}`, amount: { value: String(amount) } }]
      }),
      onApprove: (data, actions) => actions.order.capture().then(() => {
        box.innerHTML = `<p class="form-msg ok">${t("pay_success")}</p>`;
      })
    }).render(box).catch(() => {
      $("#modalPaypal").href = cfg.paypal || "#"; $("#modalPaypal").hidden = false;
    });
  }

  /* ---------- Generic modal controls ---------- */
  function showModal() { $("#modal").hidden = false; document.body.style.overflow = "hidden"; }
  function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; }
  $("#modalClose").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- AdSense (optional) ---------- */
  function initAds() {
    const a = cfg.adsense || {};
    if (!a.client) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${a.client}`;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
    mountAd("#adTop", "#adBoxTop", a.client, a.slotTop);
    mountAd("#adBottom", "#adBoxBottom", a.client, a.slotBottom);
  }
  function mountAd(slotSel, boxSel, client, slot) {
    if (!slot) return;
    const wrap = $(slotSel), box = $(boxSel);
    box.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    wrap.hidden = false;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }

  /* ---------- PWA install ---------- */
  let deferredPrompt = null;
  const banner = $("#installBanner");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferredPrompt = e;
    if (!localStorage.getItem("aura_install_dismissed")) banner.hidden = false;
  });
  async function doInstall() {
    if (!deferredPrompt) {
      alert(lang === "ar"
        ? "على آيفون: اضغط زر المشاركة ⬆️ ثم «إضافة إلى الشاشة الرئيسية»."
        : "On iPhone: tap Share ⬆️ then “Add to Home Screen”.");
      return;
    }
    deferredPrompt.prompt(); await deferredPrompt.userChoice;
    deferredPrompt = null; banner.hidden = true;
  }
  $("#installBtn").addEventListener("click", doInstall);
  $("#installBtnHero").addEventListener("click", doInstall);
  $("#installClose").addEventListener("click", () => {
    banner.hidden = true; localStorage.setItem("aura_install_dismissed", "1");
  });
  window.addEventListener("appinstalled", () => { banner.hidden = true; });

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  applyLang();
  initAds();
  hydrateFromSupabase();
})();
