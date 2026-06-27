/* AURA — admin dashboard logic (Supabase) */
(function () {
  "use strict";
  const cfg = (typeof AURA_CONFIG !== "undefined" && AURA_CONFIG) || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  let sb = null;

  /* Field definitions for the edit modal */
  const FIELDS = {
    courses: [
      { k: "icon", label: "أيقونة (إيموجي)", type: "text" },
      { k: "title_ar", label: "العنوان (عربي)", type: "text", req: true },
      { k: "title_en", label: "العنوان (إنجليزي)", type: "text" },
      { k: "desc_ar", label: "الوصف (عربي)", type: "textarea" },
      { k: "desc_en", label: "الوصف (إنجليزي)", type: "textarea" },
      { k: "amount", label: "السعر (رقم)", type: "number" },
      { k: "sort", label: "الترتيب", type: "number" },
      { k: "active", label: "مُفعّل", type: "checkbox" }
    ],
    masters: [
      { k: "avatar", label: "أيقونة (إيموجي)", type: "text" },
      { k: "name_ar", label: "الاسم (عربي)", type: "text", req: true },
      { k: "name_en", label: "الاسم (إنجليزي)", type: "text" },
      { k: "specialty_ar", label: "التخصص (عربي)", type: "text" },
      { k: "specialty_en", label: "التخصص (إنجليزي)", type: "text" },
      { k: "services_ar", label: "الخدمات (عربي)", type: "text" },
      { k: "services_en", label: "الخدمات (إنجليزي)", type: "text" },
      { k: "session_price", label: "سعر الجلسة (رقم)", type: "number" },
      { k: "sort", label: "الترتيب", type: "number" },
      { k: "active", label: "مُفعّل", type: "checkbox" }
    ]
  };

  /* ---------- Boot ---------- */
  function loadSdk() {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = resolve; s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
  async function boot() {
    const sc = cfg.supabase || {};
    if (!sc.url || !sc.anonKey) { show("#setupNotice"); return; }
    await loadSdk();
    if (!window.supabase) { show("#setupNotice"); return; }
    sb = window.supabase.createClient(sc.url, sc.anonKey);
    const { data } = await sb.auth.getSession();
    if (data.session) enterDashboard(); else show("#loginView");
  }
  function show(sel) {
    ["#setupNotice", "#loginView", "#dashboard"].forEach((s) => { $(s).hidden = true; });
    $(sel).hidden = false;
    $("#logoutBtn").hidden = sel !== "#dashboard";
  }

  /* ---------- Auth ---------- */
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#loginMsg"); msg.hidden = true;
    const { error } = await sb.auth.signInWithPassword({
      email: $("#email").value.trim(), password: $("#password").value
    });
    if (error) { msg.textContent = "تعذّر الدخول: " + (error.message || "تأكدي من الإيميل وكلمة المرور."); msg.hidden = false; return; }
    enterDashboard();
  });
  $("#logoutBtn").addEventListener("click", async () => { await sb.auth.signOut(); show("#loginView"); });

  async function enterDashboard() {
    show("#dashboard");
    await Promise.all([loadBookings(), loadList("courses"), loadList("masters")]);
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
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.session_date || (b.created_at ? new Date(b.created_at).toLocaleDateString() : "—")}</td>
        <td>${b.session_time || "—"}</td>
        <td>${esc(b.master_name) || ""}</td>
        <td>${esc(b.customer_name) || ""}</td>
        <td>${esc(b.customer_contact) || ""}</td>
        <td><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></td>
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

  /* ---------- Courses / Masters list ---------- */
  async function loadList(table) {
    const { data } = await sb.from(table).select("*").order("sort");
    const box = $(`#${table === "courses" ? "courses" : "masters"}List`);
    box.innerHTML = "";
    (data || []).forEach((row) => {
      const title = table === "courses" ? row.title_ar : row.name_ar;
      const sub = table === "courses" ? `${row.amount || 0} $` : (row.specialty_ar || "");
      const icon = table === "courses" ? row.icon : row.avatar;
      const el = document.createElement("div");
      el.className = "admin-row" + (row.active ? "" : " inactive");
      el.innerHTML = `
        <span class="ar-icon">${icon || "•"}</span>
        <span class="ar-main"><strong>${esc(title) || "—"}</strong><small>${esc(sub)}</small></span>
        <span class="ar-actions">
          <button class="mini" data-act="edit">تعديل</button>
          <button class="mini bad" data-act="del">حذف</button>
        </span>`;
      el.querySelector('[data-act="edit"]').addEventListener("click", () => openEdit(table, row));
      el.querySelector('[data-act="del"]').addEventListener("click", async () => {
        if (!confirm("تأكيد الحذف؟")) return;
        await sb.from(table).delete().eq("id", row.id); loadList(table);
      });
      box.appendChild(el);
    });
  }
  $("#addCourse").addEventListener("click", () => openEdit("courses", null));
  $("#addMaster").addEventListener("click", () => openEdit("masters", null));

  /* ---------- Edit modal ---------- */
  let editState = { table: null, id: null };
  function openEdit(table, row) {
    editState = { table, id: row ? row.id : null };
    $("#editTitle").textContent = (row ? "تعديل" : "إضافة") + (table === "courses" ? " كورس" : " أستاذ");
    const form = $("#editForm"); form.innerHTML = "";
    FIELDS[table].forEach((f) => {
      const val = row ? (row[f.k] != null ? row[f.k] : "") : (f.type === "checkbox" ? true : "");
      const wrap = document.createElement("label"); wrap.className = "admin-field";
      if (f.type === "checkbox") {
        wrap.innerHTML = `<span>${f.label}</span><input type="checkbox" data-k="${f.k}" ${val ? "checked" : ""}/>`;
      } else if (f.type === "textarea") {
        wrap.innerHTML = `<span>${f.label}</span><textarea class="field" data-k="${f.k}">${esc(String(val))}</textarea>`;
      } else {
        wrap.innerHTML = `<span>${f.label}</span><input type="${f.type}" class="field" data-k="${f.k}" value="${esc(String(val))}" ${f.req ? "required" : ""}/>`;
      }
      form.appendChild(wrap);
    });
    const submit = document.createElement("button");
    submit.type = "submit"; submit.className = "btn btn-primary btn-block"; submit.textContent = "حفظ";
    form.appendChild(submit);
    $("#editModal").hidden = false;
  }
  $("#editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {};
    $$("#editForm [data-k]").forEach((el) => {
      const k = el.dataset.k;
      if (el.type === "checkbox") payload[k] = el.checked;
      else if (el.type === "number") payload[k] = el.value === "" ? 0 : Number(el.value);
      else payload[k] = el.value.trim();
    });
    const { table, id } = editState;
    const res = id
      ? await sb.from(table).update(payload).eq("id", id)
      : await sb.from(table).insert(payload);
    if (res.error) { alert("خطأ في الحفظ: " + res.error.message); return; }
    $("#editModal").hidden = true;
    loadList(table);
  });
  $("#editClose").addEventListener("click", () => { $("#editModal").hidden = true; });
  $("#editModal").addEventListener("click", (e) => { if (e.target.id === "editModal") $("#editModal").hidden = true; });

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  boot();
})();
