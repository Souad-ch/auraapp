/* AURA — cinematic scroll engine (v25)
   Pinned holographic showcase + hero recede + parallax.
   Additive & self-contained: does nothing if the elements/motion are absent. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  var showcase = document.getElementById("showcase");
  var orb = document.querySelector("[data-sc-orb]");
  var bgword = document.querySelector("[data-sc-word]");
  var bar = document.querySelector("[data-sc-bar]");
  var phases = Array.prototype.slice.call(document.querySelectorAll(".sc-phase"));
  var heroInner = document.querySelector(".hero-inner");
  var parallax = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  function update() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var vh = window.innerHeight;

    /* generic parallax layers (opt-in via data-parallax="0.2") */
    for (var i = 0; i < parallax.length; i++) {
      var el = parallax[i];
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.2;
      var r = el.getBoundingClientRect();
      var center = r.top + r.height / 2 - vh / 2;
      el.style.transform = "translate3d(0," + (-center * speed).toFixed(1) + "px,0)";
    }

    /* hero recedes into depth as you scroll past it */
    if (heroInner) {
      var hp = clamp(y / (vh * 0.9), 0, 1);
      heroInner.style.transform = "scale(" + (1 - hp * 0.06).toFixed(3) + ") translateY(" + (hp * 28).toFixed(1) + "px)";
      heroInner.style.opacity = (1 - hp * 0.82).toFixed(3);
    }

    /* pinned holographic showcase — everything reacts to scroll progress */
    if (showcase) {
      var rect = showcase.getBoundingClientRect();
      var total = rect.height - vh;
      if (total > 0 && rect.top <= vh && rect.bottom >= 0) {
        var prog = clamp(-rect.top / total, 0, 1);
        if (orb) orb.style.transform = "rotate(" + (prog * 300).toFixed(1) + "deg) scale(" + (0.9 + prog * 0.45).toFixed(3) + ")";
        if (bgword) bgword.style.transform = "translate(-50%,-50%) translateX(" + ((0.5 - prog) * 140).toFixed(1) + "px)";
        if (bar) bar.style.width = (prog * 100).toFixed(1) + "%";
        var idx = clamp(Math.floor(prog * phases.length), 0, phases.length - 1);
        for (var p = 0; p < phases.length; p++) phases[p].classList.toggle("on", p === idx);
      }
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  if (phases[0]) phases[0].classList.add("on");
  update();
})();
