/* =========================================================
   Halita · Shared UI runtime (site + admin)
   Modal/bottom-sheet manager, tabs, validation, toasts, media fallback.
   Motion One owns every animation in this file (never GSAP).
   ========================================================= */
(function () {
  const H = (window.Halita = window.Halita || {});
  const mqMobile = window.matchMedia("(max-width: 809px)");
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const EASE = [0.22, 1, 0.36, 1];

  const UI = (H.UI = {
    isMobile: () => mqMobile.matches,
    reduced: () => mqReduce.matches,
    mqMobile,
    EASE,
  });

  /* ---------- tiny helpers ---------- */
  UI.$ = (s, r = document) => r.querySelector(s);
  UI.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  UI.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  UI.icon = (name, cls = "") => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  UI.stars = (n) => Array.from({ length: 5 }, (_, i) => `<svg class="icon icon--fill" style="opacity:${i < Math.round(n) ? 1 : 0.25}" aria-hidden="true"><use href="#i-star"/></svg>`).join("");
  UI.initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  /* ---------- Motion wrapper (no-op when unavailable / reduced) ---------- */
  UI.animate = function (el, keyframes, opts = {}) {
    if (!el) return Promise.resolve();
    const M = window.Motion;
    if (!M || !M.animate || UI.reduced()) {
      // jump to final state
      Object.entries(keyframes).forEach(([k, v]) => {
        const end = Array.isArray(v) ? v[v.length - 1] : v;
        if (k === "x" || k === "y" || k === "scale") return; // transforms cleared by caller
        el.style[k] = typeof end === "number" && k !== "opacity" ? end + "px" : end;
      });
      return Promise.resolve();
    }
    const a = M.animate(el, keyframes, { duration: 0.28, ease: EASE, ...opts });
    if (a && a.finished) return a.finished.catch(() => {});
    if (a && typeof a.then === "function") return new Promise((r) => a.then(r, r));
    return Promise.resolve();
  };

  /* ---------- Press feedback (Motion) for all buttons ---------- */
  UI.bindPress = function (root = document) {
    root.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".btn, .chip, .tab, .choice, .slot, .cal__day, .amount, .tabbar__item, .fab, .qty__btn, .more-item");
      if (!el || el.disabled || UI.reduced() || !window.Motion) return;
      UI.animate(el, { scale: 0.97 }, { duration: 0.12 });
      const up = () => { UI.animate(el, { scale: 1 }, { duration: 0.22 }); el.removeEventListener("pointerup", up); el.removeEventListener("pointerleave", up); };
      el.addEventListener("pointerup", up); el.addEventListener("pointerleave", up);
    }, { passive: true });
  };

  /* ---------- Hover lift for interactive cards (Motion owns .card y) ---------- */
  UI.bindHoverLift = function (root = document, selector = ".card--interactive, .plan, .review") {
    if (!window.matchMedia("(hover: hover)").matches) return;
    root.addEventListener("pointerover", (e) => {
      const el = e.target.closest(selector);
      if (!el || el.__lift) return;
      el.__lift = true;
      UI.animate(el, { y: -3 }, { duration: 0.24 });
      const leave = (ev) => { if (el.contains(ev.relatedTarget)) return; el.__lift = false; UI.animate(el, { y: 0 }, { duration: 0.3 }); el.removeEventListener("pointerout", leave); };
      el.addEventListener("pointerout", leave);
    });
  };

  /* ---------- Toasts ---------- */
  UI.toast = function (msg, icon = "check") {
    const host = document.getElementById("toasts");
    if (!host) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `${UI.icon(icon)}<span>${UI.esc(msg)}</span>`;
    host.appendChild(t);
    UI.animate(t, { opacity: [0, 1], y: [12, 0] }, { duration: 0.3 });
    setTimeout(() => UI.animate(t, { opacity: 0, y: 8 }, { duration: 0.25 }).then(() => t.remove()), 3800);
  };

  /* ---------- Media fallback (missing generated image → designed placeholder) ---------- */
  UI.initMedia = function (root = document) {
    UI.$$(".media img", root).forEach((img) => {
      const fig = img.closest(".media");
      const fail = () => fig && fig.classList.add("is-empty");
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fail();
      img.addEventListener("error", fail, { once: true });
      img.addEventListener("load", () => fig && fig.classList.remove("is-empty"), { once: true });
    });
  };

  /* ---------- Modal / bottom-sheet manager ---------- */
  const stack = [];
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  UI.modal = function (opts) {
    const o = Object.assign({ title: "", size: "", className: "", body: "", foot: "", drawer: false, labelledBy: null, onClose: null }, opts);
    const root = document.createElement("div");
    root.className = `${o.drawer ? "drawer" : "modal"} ${o.size ? "modal--" + o.size : ""} ${o.className}`.trim();
    const titleId = "mt-" + Math.random().toString(36).slice(2, 8);
    root.innerHTML = `
      <div class="modal__backdrop" data-close></div>
      <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <span class="modal__handle" aria-hidden="true"></span>
        <div class="modal__head"><h2 class="modal__title" id="${titleId}"></h2><button class="close-btn" type="button" data-close aria-label="Cerrar">${UI.icon("x")}</button></div>
        <div class="modal__body"></div>
        <div class="modal__foot" hidden></div>
      </div>`;
    document.body.appendChild(root);
    const panel = root.querySelector(".modal__panel");
    const backdrop = root.querySelector(".modal__backdrop");
    const api = {
      el: root, panel,
      body: root.querySelector(".modal__body"),
      foot: root.querySelector(".modal__foot"),
      head: root.querySelector(".modal__head"),
      setTitle(t) { root.querySelector(".modal__title").textContent = t; return api; },
      setBody(html) { if (typeof html === "string") api.body.innerHTML = html; else { api.body.innerHTML = ""; api.body.appendChild(html); } UI.initMedia(api.body); return api; },
      setFoot(html) { api.foot.hidden = !html; api.foot.innerHTML = html || ""; return api; },
      close,
    };
    api.setTitle(o.title);
    if (o.body) api.setBody(o.body);
    if (o.foot) api.setFoot(o.foot);

    const returnFocus = document.activeElement;
    let closing = false;

    function enter() {
      const mobile = UI.isMobile();
      UI.animate(backdrop, { opacity: [0, 1] }, { duration: 0.3 });
      if (o.drawer && !mobile) UI.animate(panel, { x: ["100%", "0%"] }, { duration: 0.45 });
      else if (mobile) UI.animate(panel, { y: ["100%", "0%"] }, { duration: 0.45 });
      else UI.animate(panel, { opacity: [0, 1], y: [24, 0], scale: [0.98, 1] }, { duration: 0.4 });
    }
    function close(reason) {
      if (closing) return;
      closing = true;
      const mobile = UI.isMobile();
      const idx = stack.indexOf(api); if (idx > -1) stack.splice(idx, 1);
      const out = o.drawer && !mobile ? { x: "100%" } : mobile ? { y: "100%" } : { opacity: 0, y: 16, scale: 0.98 };
      UI.animate(backdrop, { opacity: 0 }, { duration: 0.25 });
      UI.animate(panel, out, { duration: 0.28, ease: [0.65, 0, 0.35, 1] }).then(() => {
        root.remove();
        if (!stack.length) document.documentElement.classList.remove("has-modal");
        if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
        if (o.onClose) o.onClose(reason);
      });
    }

    root.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close("dismiss"); });
    root.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        const f = UI.$$(FOCUSABLE, panel).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Bottom-sheet drag to dismiss (mobile)
    const dragZone = api.head;
    let startY = 0, dy = 0, dragging = false, t0 = 0;
    dragZone.addEventListener("pointerdown", (e) => {
      if (!UI.isMobile() || e.target.closest("button")) return;
      dragging = true; startY = e.clientY; dy = 0; t0 = performance.now();
      dragZone.setPointerCapture(e.pointerId);
    });
    dragZone.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      panel.style.transform = `translateY(${dy}px)`;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      const v = dy / Math.max(1, performance.now() - t0);
      if (dy > 120 || v > 0.6) { close("drag"); }
      else { panel.style.transform = ""; UI.animate(panel, { y: [dy, 0] }, { type: "spring", stiffness: 420, damping: 36 }); }
    };
    dragZone.addEventListener("pointerup", endDrag);
    dragZone.addEventListener("pointercancel", endDrag);

    stack.push(api);
    document.documentElement.classList.add("has-modal");
    enter();
    requestAnimationFrame(() => {
      const target = panel.querySelector("[autofocus]") || panel.querySelector(".modal__body " + FOCUSABLE) || panel.querySelector(".close-btn");
      target && target.focus({ preventScroll: true });
    });
    return api;
  };
  UI.closeAll = () => stack.slice().forEach((m) => m.close("all"));
  // Esc closes the top-most dialog even when focus was lost after a content swap
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !stack.length) return;
    e.preventDefault();
    stack[stack.length - 1].close("esc");
  });
  // Keep focus inside the top-most dialog
  document.addEventListener("focusin", (e) => {
    if (!stack.length) return;
    const top = stack[stack.length - 1];
    if (!top.el.contains(e.target)) top.panel.querySelector(".close-btn").focus({ preventScroll: true });
  });

  /* ---------- Tabs (ARIA + sliding indicator via Motion) ---------- */
  UI.tabs = function (list, { onChange, panels = true } = {}) {
    if (!list) return;
    const tabs = UI.$$('[role="tab"]', list);
    const indicator = list.querySelector(".tabs__indicator");
    function moveIndicator(tab, instant) {
      if (!indicator || !tab) return;
      const kf = { x: tab.offsetLeft - 0, width: tab.offsetWidth + "px" };
      if (instant || !window.Motion || UI.reduced()) { indicator.style.width = kf.width; indicator.style.transform = `translateX(${kf.x}px)`; return; }
      UI.animate(indicator, kf, { duration: 0.35 });
    }
    function select(tab, focus) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        if (panels) {
          const p = document.getElementById(t.getAttribute("aria-controls"));
          if (p) {
            if (on && p.hidden) { p.hidden = false; UI.animate(p, { opacity: [0, 1], y: [10, 0] }, { duration: 0.4 }); }
            else if (!on) p.hidden = true;
          }
        }
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: UI.reduced() ? "auto" : "smooth" });
      moveIndicator(tab);
      onChange && onChange(tab);
    }
    list.addEventListener("click", (e) => { const t = e.target.closest('[role="tab"]'); if (t && list.contains(t)) select(t); });
    list.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let n = null;
      if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") n = tabs[0];
      if (e.key === "End") n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
    const current = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
    requestAnimationFrame(() => moveIndicator(current, true));
    window.addEventListener("resize", () => moveIndicator(tabs.find((t) => t.getAttribute("aria-selected") === "true"), true));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator(tabs.find((t) => t.getAttribute("aria-selected") === "true"), true));
    return { select: (t) => select(t), tabs };
  };

  /* ---------- Validation ---------- */
  const RX = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    phone: /^\+?[\d\s().-]{9,}$/,
  };
  function luhn(num) {
    const s = num.replace(/\D/g, ""); if (s.length < 13) return false;
    let sum = 0, alt = false;
    for (let i = s.length - 1; i >= 0; i--) { let n = +s[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; }
    return sum % 10 === 0;
  }
  UI.validators = {
    email: (v) => RX.email.test(v.trim()),
    phone: (v) => RX.phone.test(v.trim()),
    contact: (v) => RX.email.test(v.trim()) || RX.phone.test(v.trim()),
    card: (v) => luhn(v),
    expiry: (v) => { const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/); if (!m) return false; const mm = +m[1], yy = 2000 + +m[2]; if (mm < 1 || mm > 12) return false; const end = new Date(yy, mm, 0, 23, 59); return end >= new Date(); },
    cvc: (v) => /^\d{3,4}$/.test(v.trim()),
  };
  UI.validateField = function (input) {
    const field = input.closest(".field, .check");
    let ok = true;
    const v = input.type === "checkbox" ? input.checked : input.value;
    if (input.required && (input.type === "checkbox" ? !v : !String(v).trim())) ok = false;
    if (ok && input.minLength > 0 && String(v).trim().length < input.minLength && String(v).length) ok = false;
    const rule = input.dataset.validate || (input.type === "email" ? "email" : input.type === "tel" ? "phone" : null);
    if (ok && rule && String(v).trim() && UI.validators[rule]) ok = UI.validators[rule](String(v));
    if (field) {
      field.classList.toggle("is-invalid", !ok);
      field.classList.toggle("is-valid", ok && input.type !== "checkbox" && !!String(v).trim() && input.tagName !== "SELECT");
    }
    input.setAttribute("aria-invalid", String(!ok));
    return ok;
  };
  UI.validate = function (form) {
    const inputs = UI.$$("input, select, textarea", form).filter((i) => !i.disabled && i.offsetParent !== null);
    let first = null;
    inputs.forEach((i) => { if (!UI.validateField(i) && !first) first = i; });
    if (first) first.focus();
    return !first;
  };
  UI.liveValidate = function (form) {
    form.addEventListener("blur", (e) => { if (e.target.matches("input, select, textarea") && (e.target.value || e.target.closest(".is-invalid"))) UI.validateField(e.target); }, true);
    form.addEventListener("input", (e) => { if (e.target.closest(".is-invalid, .is-valid")) UI.validateField(e.target); });
    form.addEventListener("change", (e) => { if (e.target.type === "checkbox") UI.validateField(e.target); });
  };
  // Input masks
  UI.masks = function (root) {
    root.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.mask === "card") t.value = t.value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
      if (t.dataset.mask === "expiry") { let d = t.value.replace(/\D/g, "").slice(0, 4); if (d.length >= 3) d = d.slice(0, 2) + "/" + d.slice(2); t.value = d; }
      if (t.dataset.mask === "cvc") t.value = t.value.replace(/\D/g, "").slice(0, 4);
    });
  };

  /* ---------- Download helper ---------- */
  UI.download = function (filename, content, type) {
    const blob = new Blob([content], { type: type || "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  UI.copy = function (text) {
    const done = () => UI.toast("Copiado al portapapeles");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove(); done(); }
  };

  /* ---------- Number tween (Motion) ---------- */
  UI.tweenNumber = function (el, to, { format = (n) => n, duration = 0.5 } = {}) {
    const from = parseFloat(el.dataset.val || "0") || 0;
    el.dataset.val = to;
    const M = window.Motion;
    if (!M || !M.animate || UI.reduced() || from === to) { el.textContent = format(to); return; }
    M.animate(from, to, { duration, ease: EASE, onUpdate: (v) => { el.textContent = format(Math.round(v)); } });
  };
})();
