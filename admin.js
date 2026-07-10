/* AURA — admin control panel (Supabase platform schema) */
(function () {
  "use strict";
  const cfg = (typeof AURA_CONFIG !== "undefined" && AURA_CONFIG) || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let sb = null, me = null;

  /* ---------- Edit-modal field definitions (match platform tables) ---------- */
  const FIELDS = {
    courses: [
      { k: "cover", label: "أيقونة (إيموجي)", type: "text", def: "📘" },
      { k: "title", label: "عنوان الكورس", type: "text", req: true },
      { k: "description", label: "وصف مختصر", type: "textarea" },
      { k: "price", label: "السعر ($)", type: "number" },
      { k: "content_url", label: "🎬 فيديو الكورس", type: "video" },
      { k: "published", label: "ظاهر على الموقع", type: "checkbox", def: true }
    ],
    teachers: [
      { k: "avatar", label: "أيقونة (إيموجي)", type: "text", def: "🌟" },
      { k: "name", label: "اسم الأستاذ", type: "text", req: true },
      { k: "specialty", label: "التخصص", type: "text" },
      { k: "services", label: "الخدمات", type: "text" },
      { k: "session_price", label: "سعر الجلسة ($)", type: "number" },
      { k: "sort", label: "الترتيب", type: "number" },
      { k: "published", label: "ظاهر على الموقع", type: "checkbox", def: true }
    ],
    books: [
      { k: "cover", label: "أيقونة (إيموجي)", type: "text", def: "📖" },
      { k: "title", label: "عنوان الكتاب", type: "text", req: true },
      { k: "description", label: "وصف مختصر", type: "textarea" },
      { k: "price", label: "السعر ($)", type: "number" },
      { k: "file_url", label: "رابط ملف الكتاب (PDF/Payhip)", type: "text" },
      { k: "published", label: "ظاهر على الموقع", type: "checkbox", def: true }
    ]
  };

  /* ---------- Section texts editable from the panel ---------- */
  const TEXTS = [
    { k: "hero_headline", label: "عنوان الهيرو الرئيسي" },
    { k: "hero_desc", label: "وصف الهيرو" },
    { k: "services_title", label: "عنوان قسم الخدمات" },
    { k: "services_lead", label: "وصف قسم الخدمات" },
    { k: "courses_title", label: "عنوان قسم الكورسات" },
    { k: "courses_lead", label: "وصف قسم الكورسات" },
    { k: "masters_title", label: "عنوان قسم الأساتذة" },
    { k: "masters_lead", label: "وصف قسم الأساتذة" },
    { k: "price_title", label: "عنوان قسم الأسعار" },
    { k: "cta_title", label: "عنوان دعوة الإجراء" },
    { k: "cta_text", label: "نص دعوة الإجراء" },
    { k: "support_title", label: "عنوان قسم الدعم" },
    { k: "support_lead", label: "وصف قسم الدعم" }
  ];

  /* ---------- Boot ---------- */
  function loadSdk() {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = resolve; s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
  function show(sel) {
    ["#setupNotice", "#loginView", "#dashboard"].forEach((s) => { $(s).hidden = true; });
    $(sel).hidden = false;
    $("#logoutBtn").hidden = sel !== "#dashboard";
  }
  async function boot() {
    const sc = cfg.supabase || {};
    if (!sc.url || !sc.anonKey) { show("#setupNotice"); return; }
    await loadSdk();
    if (!window.supabase) { show("#setupNotice"); return; }
    sb = window.supabase.createClient(sc.url, sc.anonKey);
    const { data } = await sb.auth.getSession();
    if (data.session) { me = data.session.user; await gate(); } else { show("#loginView"); }
  }

  async function gate() {
    // verify admin role before showing the dashboard
    const { data: prof } = await sb.from("profiles").select("role").eq("id", me.id).single();
    if (!prof || prof.role !== "admin") {
      show("#loginView");
      const msg = $("#loginMsg");
      msg.textContent = "هذا الحساب ليس أدمن. سجّلي دخول بحساب الأدمن.";
      msg.hidden = false;
      await sb.auth.signOut();
      return;
    }
    enterDashboard();
  }

  /* ---------- Auth ---------- */
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#loginMsg"); msg.hidden = true;
    const { data, error } = await sb.auth.signInWithPassword({
      email: $("#email").value.trim(), password: $("#password").value
    });
    if (error) { msg.textContent = "تعذّر الدخول: " + (error.message || "تأكدي من البيانات."); msg.hidden = false; return; }
    me = data.user; await gate();
  });
  $("#logoutBtn").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });

  async function enterDashboard() {
    show("#dashboard");
    renderTexts();
    await Promise.all([loadBookings(), loadList("courses"), loadList("teachers"), loadList("books"), loadTexts()]);
  }

  /* ---------- Tabs ---------- */
  $$(".tab").forEach((tab) => tab.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.remove("active"));
    tab.classList.add("active");
    $$(".tab-panel").forEach((p) => { p.hidden = true; });
    $(`#panel-${tab.dataset.tab}`).hidden = false;
  }));

  /* ---------- Bookings ---------- */
  async function loadBookings() {
    const { data, error } = await sb.from("bookings").select("*").order("created_at", { ascending: false });
    const tbody = $("#bookingsTable tbody"); tbody.innerHTML = "";
    if (error || !data || !data.length) { $("#bookingsEmpty").hidden = false; $("#bookingsTable").hidden = true; return; }
    $("#bookingsEmpty").hidden = true; $("#bookingsTable").hidden = false;
    data.forEach((b) => {
      const when = b.session_date
        ? esc(b.session_date) + (b.session_time ? " · " + esc(b.session_time) : "")
        : (b.created_at ? new Date(b.created_at).toLocaleDateString("ar") : "—");
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${when}</td>
        <td>${esc(b.master_name || b.service || "—")}</td>
        <td>${esc(b.customer_name || "—")}</td>
        <td>${esc(b.customer_contact || "—")}</td>
        <td><span class="badge badge-${esc(b.status)}">${statusLabel(b.status)}</span></td>
        <td class="row-actions">
          <button class="mini ok" data-id="${b.id}" data-st="confirmed">تأكيد</button>
          <button class="mini bad" data-id="${b.id}" data-st="cancelled">إلغاء</button>
        </td>`;
      tbody.appendChild(tr);
    });
    $$("#bookingsTable .mini").forEach((btn) => btn.addEventListener("click", async () => {
      await sb.from("bookings").update({ status: btn.dataset.st }).eq("id", btn.dataset.id);
      loadBookings();
    }));
  }
  function statusLabel(s) { return s === "confirmed" ? "مؤكّد" : s === "cancelled" ? "ملغى" : "قيد الانتظار"; }

  /* ---------- Courses / Teachers / Books list ---------- */
  const LIST_BOX = { courses: "#coursesList", teachers: "#teachersList", books: "#booksList" };
  const ORDER = { courses: ["created_at", false], teachers: ["sort", true], books: ["created_at", false] };
  async function loadList(table) {
    const [col, asc] = ORDER[table];
    const { data } = await sb.from(table).select("*").order(col, { ascending: asc });
    const box = $(LIST_BOX[table]); box.innerHTML = "";
    if (!data || !data.length) {
      box.innerHTML = `<p class="muted empty">لا يوجد بعد — اضغطي زر الإضافة بالأعلى.</p>`;
      return;
    }
    data.forEach((row) => {
      const icon = table === "teachers" ? row.avatar : row.cover;
      const title = table === "teachers" ? row.name : row.title;
      const sub = table === "teachers"
        ? (row.specialty || "") + (row.session_price ? ` · ${row.session_price}$` : "")
        : `${row.price || 0} $`;
      const el = document.createElement("div");
      el.className = "admin-row" + (row.published === false ? " inactive" : "");
      el.innerHTML = `
        <span class="ar-icon">${esc(icon || "•")}</span>
        <span class="ar-main"><strong>${esc(title) || "—"}</strong><small>${esc(sub)}</small></span>
        <span class="ar-actions">
          <button class="mini" data-act="edit">تعديل</button>
          <button class="mini bad" data-act="del">حذف</button>
        </span>`;
      el.querySelector('[data-act="edit"]').addEventListener("click", () => openEdit(table, row));
      el.querySelector('[data-act="del"]').addEventListener("click", async () => {
        if (!confirm("تأكيد الحذف؟")) return;
        const { error } = await sb.from(table).delete().eq("id", row.id);
        if (error) { alert("تعذّر الحذف: " + error.message); return; }
        loadList(table);
      });
      box.appendChild(el);
    });
  }
  $$("[data-add]").forEach((btn) => btn.addEventListener("click", () => openEdit(btn.dataset.add, null)));

  /* ---------- Edit modal (generic) ---------- */
  const TITLES = { courses: "كورس", teachers: "أستاذ", books: "كتاب" };
  let editState = { table: null, id: null };
  function openEdit(table, row) {
    editState = { table, id: row ? row.id : null };
    $("#editTitle").textContent = (row ? "تعديل " : "إضافة ") + TITLES[table];
    const form = $("#editForm"); form.innerHTML = "";
    FIELDS[table].forEach((f) => {
      const has = row && row[f.k] != null;
      const val = has ? row[f.k] : (f.def != null ? f.def : (f.type === "checkbox" ? true : ""));
      const wrap = document.createElement("label"); wrap.className = "admin-field";
      if (f.type === "checkbox") {
        wrap.innerHTML = `<span>${f.label}</span><input type="checkbox" data-k="${f.k}" ${val ? "checked" : ""}/>`;
      } else if (f.type === "textarea") {
        wrap.innerHTML = `<span>${f.label}</span><textarea class="field" data-k="${f.k}">${esc(String(val))}</textarea>`;
      } else if (f.type === "video") {
        const cur = has && row[f.k] ? `<small class="muted">الحالي: ${/^https?:/i.test(row[f.k]) ? esc(row[f.k]) : "ملف مرفوع ✓"}</small>` : "";
        wrap.innerHTML = `<span>${f.label}</span>
          <input type="file" class="field" data-file="1" accept="video/*"/>
          <input type="text" class="field" data-k="${f.k}" placeholder="أو رابط فيديو https://..." value="${esc(/^https?:/i.test(String(val)) ? String(val) : "")}"/>
          ${cur}`;
      } else {
        wrap.innerHTML = `<span>${f.label}</span><input type="${f.type}" class="field" data-k="${f.k}" value="${esc(String(val))}" ${f.req ? "required" : ""}/>`;
      }
      form.appendChild(wrap);
    });
    const msg = document.createElement("p"); msg.className = "form-msg"; msg.id = "editMsg"; msg.hidden = true;
    form.appendChild(msg);
    const submit = document.createElement("button");
    submit.type = "submit"; submit.className = "btn btn-primary btn-block"; submit.textContent = "حفظ";
    form.appendChild(submit);
    $("#editModal").hidden = false;
  }

  $("#editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const { table, id } = editState;
    const btn = $("#editForm button[type=submit]"), msg = $("#editMsg");
    if (msg) msg.hidden = true;
    btn.disabled = true; const orig = btn.textContent; btn.textContent = "جارٍ الحفظ...";
    try {
      const payload = {};
      $$("#editForm [data-k]").forEach((el) => {
        const k = el.dataset.k;
        if (el.type === "checkbox") payload[k] = el.checked;
        else if (el.type === "number") payload[k] = el.value === "" ? 0 : Number(el.value);
        else payload[k] = el.value.trim();
      });
      // video upload for courses
      const fileEl = $("#editForm [data-file]");
      if (fileEl && fileEl.files[0]) {
        btn.textContent = "جارٍ رفع الفيديو... ⏳";
        const file = fileEl.files[0];
        const safe = file.name.replace(/[^\w.\-]/g, "_");
        const path = me.id + "/" + Date.now() + "-" + safe;
        const up = await sb.storage.from("course-videos").upload(path, file, { upsert: false });
        if (up.error) { fail(msg, "خطأ رفع الفيديو: " + up.error.message); return; }
        payload.content_url = path;
      }
      if (table !== "teachers") payload.owner = payload.owner || me.id;
      // drop empty content_url so we don't wipe an existing upload
      if (table === "courses" && !payload.content_url && !(fileEl && fileEl.files[0]) && id) delete payload.content_url;
      const res = id ? await sb.from(table).update(payload).eq("id", id) : await sb.from(table).insert(payload);
      if (res.error) { fail(msg, "خطأ في الحفظ: " + res.error.message); return; }
      $("#editModal").hidden = true;
      loadList(table);
    } finally {
      btn.disabled = false; btn.textContent = orig;
    }
  });
  function fail(msg, txt) { if (msg) { msg.className = "form-msg err"; msg.textContent = txt; msg.hidden = false; } else alert(txt); }
  $("#editClose").addEventListener("click", () => { $("#editModal").hidden = true; });
  $("#editModal").addEventListener("click", (e) => { if (e.target.id === "editModal") $("#editModal").hidden = true; });

  /* ---------- Section texts ---------- */
  function renderTexts() {
    const box = $("#textsList"); if (!box || box.dataset.built) return;
    box.dataset.built = "1"; box.innerHTML = "";
    TEXTS.forEach((tx) => {
      const el = document.createElement("div");
      el.className = "admin-card text-row"; el.style.marginBottom = "14px";
      el.innerHTML = `
        <strong style="display:block;margin-bottom:8px">${esc(tx.label)}</strong>
        <label class="admin-field"><span>عربي</span><textarea class="field" data-tk="${tx.k}" data-l="ar"></textarea></label>
        <label class="admin-field"><span>English</span><textarea class="field" data-tk="${tx.k}" data-l="en" dir="ltr"></textarea></label>
        <button class="btn btn-primary btn-sm" data-save="${tx.k}">حفظ</button>
        <span class="form-msg ok" data-ok="${tx.k}" hidden>تم الحفظ ✓</span>`;
      box.appendChild(el);
    });
    $$("[data-save]").forEach((btn) => btn.addEventListener("click", async () => {
      const key = btn.dataset.save;
      const ar = $(`textarea[data-tk="${key}"][data-l="ar"]`).value;
      const en = $(`textarea[data-tk="${key}"][data-l="en"]`).value;
      btn.disabled = true;
      const { error } = await sb.from("site_content").upsert({ key, value_ar: ar, value_en: en, updated_at: new Date().toISOString() });
      btn.disabled = false;
      const ok = $(`[data-ok="${key}"]`);
      if (error) { ok.className = "form-msg err"; ok.textContent = "خطأ: " + error.message; }
      else { ok.className = "form-msg ok"; ok.textContent = "تم الحفظ ✓"; }
      ok.hidden = false; setTimeout(() => { ok.hidden = true; }, 2500);
    }));
  }
  async function loadTexts() {
    const { data } = await sb.from("site_content").select("*");
    (data || []).forEach((r) => {
      const ar = $(`textarea[data-tk="${r.key}"][data-l="ar"]`);
      const en = $(`textarea[data-tk="${r.key}"][data-l="en"]`);
      if (ar) ar.value = r.value_ar || "";
      if (en) en.value = r.value_en || "";
    });
  }

  boot();
})();
