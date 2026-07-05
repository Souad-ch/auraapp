/* AURA — unified account dashboard (customer / master / admin) */
(function () {
  "use strict";
  const cfg = (typeof AURA_CONFIG !== "undefined" && AURA_CONFIG) || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let sb = null, me = null, myRole = "customer", signupMode = false;

  function show(id) {
    ["#setupNotice", "#authView", "#dashboard"].forEach((s) => { $(s).hidden = true; });
    $(id).hidden = false;
    $("#logoutBtn").hidden = id !== "#dashboard";
  }

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
    if (data.session) { me = data.session.user; await enter(); } else { show("#authView"); }
  }

  /* ---------- Auth ---------- */
  $("#authSwitch").addEventListener("click", (e) => {
    e.preventDefault();
    signupMode = !signupMode;
    $("#authTitle").textContent = signupMode ? "✨ إنشاء حساب" : "🔐 تسجيل الدخول";
    $("#authSubmit").textContent = signupMode ? "إنشاء الحساب" : "دخول";
    $("#fullName").hidden = !signupMode;
    $("#authSwitchTxt").textContent = signupMode ? "لديك حساب؟" : "لا تملك حساباً؟";
    $("#authSwitch").textContent = signupMode ? "سجّل الدخول" : "أنشئ حساباً";
  });

  $("#authSubmit").addEventListener("click", async () => {
    const email = $("#email").value.trim(), pass = $("#password").value;
    const msg = $("#authMsg"); msg.hidden = true;
    if (!email || !pass) { msg.textContent = "املأ الإيميل وكلمة المرور."; msg.hidden = false; return; }
    let res;
    if (signupMode) {
      res = await sb.auth.signUp({ email, password: pass, options: { data: { full_name: $("#fullName").value.trim() } } });
    } else {
      res = await sb.auth.signInWithPassword({ email, password: pass });
    }
    if (res.error) { msg.textContent = "تعذّر: " + res.error.message; msg.hidden = false; return; }
    if (signupMode && !res.data.session) { msg.className = "form-msg ok"; msg.textContent = "تم إنشاء الحساب! سجّل الدخول الآن."; msg.hidden = false; return; }
    me = res.data.user || (res.data.session && res.data.session.user);
    await enter();
  });

  $("#logoutBtn").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });

  async function enter() {
    // load role
    const { data: prof } = await sb.from("profiles").select("role, full_name").eq("id", me.id).single();
    myRole = (prof && prof.role) || "customer";
    show("#dashboard");
    $("#welcome").textContent = "أهلاً " + ((prof && prof.full_name) || "") + " 🌙";
    $("#roleTag").textContent = myRole === "admin" ? "أدمن" : myRole === "master" ? "أستاذ" : "طالب";
    $("#roleLine").textContent = myRole === "admin" ? "لديك صلاحيات الأدمن." : myRole === "master" ? "لوحة الأستاذ — كورساتك وإحصاءاتك." : "لوحتك — كورساتك واشتراكك.";
    $("#custView").hidden = myRole !== "customer";
    $("#masterView").hidden = myRole !== "master";
    $("#adminView").hidden = myRole !== "admin";
    if (myRole === "customer") loadCustomer();
    else if (myRole === "master") loadMaster();
  }

  /* ---------- Customer ---------- */
  async function loadCustomer() {
    // subscription
    const { data: sub } = await sb.from("subscriptions").select("*").eq("user_id", me.id).maybeSingle();
    if (sub && sub.status === "active") {
      $("#subLine").textContent = "باقتك: " + (sub.plan || "Premium") + " — فعّالة ✓";
      $("#subCta").hidden = true;
    } else {
      $("#subLine").textContent = "لا يوجد اشتراك فعّال.";
      if (cfg.subscribeUrl || cfg.whatsapp) {
        $("#subCta").hidden = false;
        $("#subCta").href = cfg.subscribeUrl || waLink("مرحباً AURA، أرغب بالاشتراك في Premium 💎");
      }
    }
    // my courses
    const { data: courses } = await sb.rpc("my_courses");
    const box = $("#myCourses"); box.innerHTML = "";
    if (!courses || !courses.length) { $("#myCoursesEmpty").hidden = false; return; }
    $("#myCoursesEmpty").hidden = true;
    courses.forEach((c) => {
      const el = document.createElement("div");
      el.className = "admin-row";
      el.innerHTML = `<span class="ar-icon">${esc(c.cover || "📘")}</span>
        <span class="ar-main"><strong>${esc(c.title)}</strong><small>${esc(c.description || "")}</small></span>
        <span class="ar-actions"><button class="mini ok">▶ مشاهدة</button></span>`;
      el.querySelector("button").addEventListener("click", () => watch(c.id));
      box.appendChild(el);
    });
  }
  async function watch(cid) {
    const { data } = await sb.rpc("course_content", { cid });
    if (data && data.content_url) window.open(data.content_url, "_blank", "noopener");
    else alert("المحتوى غير متاح.");
  }

  /* ---------- Master ---------- */
  async function loadMaster() {
    const { data: stats } = await sb.rpc("master_stats");
    const s = stats || {};
    $("#masterStats").innerHTML = `
      <div class="stat-box"><strong>${s.my_courses || 0}</strong><span>كورساتي</span></div>
      <div class="stat-box"><strong>${s.course_students || 0}</strong><span>عدد الطلاب</span></div>
      <div class="stat-box"><strong>${s.book_sales || 0}</strong><span>مبيعات الكتب</span></div>`;
    await loadMasterCourses();
  }
  async function loadMasterCourses() {
    const { data } = await sb.from("courses").select("*").eq("owner", me.id).order("created_at", { ascending: false });
    const box = $("#masterCourses"); box.innerHTML = "";
    const sel = $("#grantCourse"); sel.innerHTML = "";
    (data || []).forEach((c) => {
      const el = document.createElement("div");
      el.className = "admin-row";
      el.innerHTML = `<span class="ar-icon">${esc(c.cover || "📘")}</span>
        <span class="ar-main"><strong>${esc(c.title)}</strong><small>${c.price || 0} $</small></span>
        <span class="ar-actions"><button class="mini" data-a="edit">تعديل</button><button class="mini bad" data-a="del">حذف</button></span>`;
      el.querySelector('[data-a="edit"]').addEventListener("click", () => openCourse(c));
      el.querySelector('[data-a="del"]').addEventListener("click", async () => {
        if (!confirm("حذف الكورس؟")) return;
        await sb.from("courses").delete().eq("id", c.id); loadMasterCourses();
      });
      box.appendChild(el);
      const o = document.createElement("option"); o.value = c.id; o.textContent = c.title; sel.appendChild(o);
    });
  }

  let editId = null;
  function openCourse(c) {
    editId = c ? c.id : null;
    $("#cTitle").value = c ? c.title : "";
    $("#cDesc").value = c ? (c.description || "") : "";
    $("#cPrice").value = c ? (c.price || 0) : 0;
    $("#cCover").value = c ? (c.cover || "📘") : "📘";
    $("#cUrl").value = c ? (c.content_url || "") : "";
    $("#courseModal").hidden = false;
  }
  $("#addCourseBtn").addEventListener("click", () => openCourse(null));
  $("#courseClose").addEventListener("click", () => { $("#courseModal").hidden = true; });
  $("#courseForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const row = { owner: me.id, title: $("#cTitle").value.trim(), description: $("#cDesc").value.trim(),
      price: Number($("#cPrice").value) || 0, cover: $("#cCover").value.trim() || "📘", content_url: $("#cUrl").value.trim() };
    const res = editId ? await sb.from("courses").update(row).eq("id", editId) : await sb.from("courses").insert(row);
    if (res.error) { alert("خطأ: " + res.error.message); return; }
    $("#courseModal").hidden = true; loadMasterCourses(); loadMaster();
  });

  $("#grantBtn").addEventListener("click", async () => {
    const email = $("#grantEmail").value.trim(), cid = $("#grantCourse").value;
    const msg = $("#grantMsg"); msg.hidden = true;
    if (!email || !cid) { msg.textContent = "أدخل الإيميل واختر الكورس."; msg.className = "form-msg err"; msg.hidden = false; return; }
    const { data, error } = await sb.rpc("admin_grant", { user_email: email, cid, ptype: "course" });
    if (error) { msg.textContent = "خطأ: " + error.message; msg.className = "form-msg err"; msg.hidden = false; return; }
    const map = { granted: "تم منح الوصول ✓", user_not_found: "لا يوجد مستخدم بهذا الإيميل.", not_allowed: "غير مصرّح." };
    msg.textContent = map[data] || data;
    msg.className = "form-msg " + (data === "granted" ? "ok" : "err"); msg.hidden = false;
  });

  function waLink(t) { return "https://wa.me/" + (cfg.whatsapp || "").replace(/[^\d]/g, "") + "?text=" + encodeURIComponent(t); }

  boot();
})();
