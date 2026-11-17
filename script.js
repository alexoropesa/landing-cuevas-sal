/* =========================================================
   Halita · Landing page wiring
   Renders CMS content, binds tabs/filters/accordion/carousel,
   routes every [data-action] button, section tracking (WhatsApp RF-04).
   ========================================================= */
(function () {
  const H = window.Halita;
  const UI = H.UI;
  const { $, $$, icon, esc } = UI;
  let C = H.Store.get();
  const state = { priceType: "adulto", reviewNeed: "all", faqCat: "all", section: "inicio", benefit: "respiratorio" };

  /* ---------- Analytics stub ---------- */
  window.dataLayer = window.dataLayer || [];
  H.track = (event, data) => { window.dataLayer.push({ event, ...data }); };

  /* ---------- Scroller (window on desktop, .app-scroll on mobile) ---------- */
  const appScroll = $("#appScroll");
  H.scroller = () => (UI.isMobile() ? appScroll : window);
  H.scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: UI.reduced() ? "auto" : "smooth", block: "start" });
  };

  /* ---------- Data binding ---------- */
  function get(path) { return path.split(".").reduce((o, k) => (o ? o[k] : undefined), C); }
  function bindText() {
    $$("[data-bind]").forEach((el) => {
      const k = el.dataset.bind;
      let v = get(k);
      if (k === "proof.rating") v = H.fmt.rating(v);
      if (k === "proof.reviews" || k === "proof.sessions") v = H.fmt.num(v);
      if (v != null) el.textContent = v;
    });
  }

  /* ---------- Header: ribbon, promo, offset ---------- */
  const header = $("#siteHeader");
  function renderHeader() {
    $("#demoRibbon").hidden = !C.meta.demo;
    const promoOn = C.promo.active && (!C.promo.until || new Date(C.promo.until + "T23:59:59") >= new Date());
    let dismissed = false;
    try { dismissed = sessionStorage.getItem("halita.promo.dismissed") === C.promo.text; } catch (e) {}
    $("#promoStrip").hidden = !promoOn || dismissed;
    $("#promoText").textContent = C.promo.text + (C.promo.code ? ` · Código ${C.promo.code}` : "");
    $("#promoCta").dataset.plan = C.promo.planId || "";
    requestAnimationFrame(measureHeader);
  }
  function measureHeader() {
    const h = header.offsetHeight + (UI.isMobile() ? 0 : 8);
    document.documentElement.style.setProperty("--header-offset", h + "px");
  }
  $("#promoClose").addEventListener("click", () => {
    try { sessionStorage.setItem("halita.promo.dismissed", C.promo.text); } catch (e) {}
    UI.animate($("#promoStrip"), { opacity: 0 }, { duration: 0.2 }).then(() => { $("#promoStrip").hidden = true; $("#promoStrip").style.opacity = ""; measureHeader(); });
  });
  if (window.ResizeObserver) new ResizeObserver(measureHeader).observe(header);
  window.addEventListener("resize", measureHeader);

  function onScroll() {
    const y = UI.isMobile() ? appScroll.scrollTop : window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  appScroll.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Benefits (RF-03) ---------- */
  UI.tabs($('[data-tabs="benefits"]'), {
    onChange: (tab) => {
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      state.benefit = panel.dataset.need;
      H.track("benefit_tab", { need: state.benefit });
    },
  });
  $$(".ben-panel").forEach((panel) => {
    const list = panel.querySelector(".subtabs");
    list.addEventListener("click", (e) => {
      const t = e.target.closest(".subtab"); if (!t) return;
      $$(".subtab", list).forEach((x) => { x.setAttribute("aria-selected", x === t); x.tabIndex = x === t ? 0 : -1; });
      $$("[data-sub-panel]", panel).forEach((p) => {
        const on = p.dataset.subPanel === t.dataset.sub;
        if (on && p.hidden) { p.hidden = false; UI.animate(p, { opacity: [0, 1], x: [8, 0] }); } else if (!on) p.hidden = true;
      });
    });
    list.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const tabs = $$(".subtab", list); const i = tabs.indexOf(document.activeElement);
      const n = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); n.click();
    });
  });

  /* ---------- Pricing ---------- */
  const check = `<svg class="icon" aria-label="Incluido"><use href="#i-check"/></svg>`;
  function renderPlans() {
    const t = C.sessionTypes.find((x) => x.id === state.priceType);
    $("#priceNote").textContent = t.flat ? `Precio por sala privada (hasta ${t.maxPeople} personas). Sesiones de ${C.business.sessionMinutes} minutos.` : t.id === "infantil" ? `Precio por niño (3–12 años). El adulto acompañante entra gratis.` : `Precio por persona. Sesiones de ${C.business.sessionMinutes} minutos.`;
    $("#planGrid").innerHTML = C.plans.map((p) => {
      const q = H.price(C, p.id, t.id, 1);
      return `<article class="card plan ${p.popular ? "plan--popular" : ""}" role="listitem">
        <div class="plan__head"><div class="stack" style="gap:6px"><h3 class="t-h4">${esc(p.name)}</h3><span class="t-small t-muted">${p.sessions} ${p.sessions > 1 ? "sesiones" : "sesión"} · validez ${esc(p.validity === "—" ? "un uso" : p.validity)}</span></div>
          <span class="badge ${p.popular ? "badge--highlight" : "badge--outline"}">${esc(p.tag)}</span></div>
        <div class="stack" style="gap:6px">
          <div class="plan__price-row"><span class="plan__price" data-price="${p.id}">${H.fmt.eur(q.total)}</span>${q.promoApplied ? `<span class="plan__was">${H.fmt.eur(q.subtotal)}</span>` : ""}</div>
          <span class="plan__per">${p.sessions > 1 ? `${H.fmt.eur(q.total / p.sessions)} por sesión` : "Pago único"}</span>
          ${q.promoApplied ? `<span class="plan__promo"><span class="badge badge--success">−${C.promo.discount}%</span>${esc(C.promo.text.split(":")[0])}</span>` : ""}
        </div>
        <hr class="hr">
        <ul class="plan__features">${p.features.map((f) => `<li>${icon("check")}<span>${esc(f)}</span></li>`).join("")}</ul>
        <button class="btn ${p.popular ? "btn--light" : "btn--primary"} btn--block" type="button" data-action="book" data-plan="${p.id}" data-type="${t.id}">${p.sessions > 1 ? "Elegir " + esc(p.name.replace(" sesiones", "")) : "Reservar sesión de prueba"}</button>
      </article>`;
    }).join("");
    if (UI.isMobile()) { const pop = $(".plan--popular"); if (pop) requestAnimationFrame(() => { const g = $("#planGrid"); g.scrollLeft = pop.offsetLeft - (g.clientWidth - pop.clientWidth) / 2; }); }
    renderCompare();
  }
  function renderCompare() {
    const t = state.priceType;
    const cell = (v) => (v === true ? check : v === false ? '<span class="dash">—</span>' : esc(v));
    $("#compareTable").innerHTML = `<div class="table-wrap"><table class="table table--stack"><thead><tr><th>Incluye</th>${C.plans.map((p) => `<th class="center ${p.popular ? "is-highlight" : ""}">${esc(p.name)}</th>`).join("")}</tr></thead><tbody>
      ${C.compare.map((r) => `<tr><td>${esc(r.label)}</td>${C.plans.map((p) => {
        let v;
        if (r.type === "perSession") v = H.fmt.eur(p.prices[t] / p.sessions);
        else if (r.type === "validity") v = p.validity === "—" ? "Un uso" : p.validity;
        else v = r.values[p.id];
        return `<td class="center ${p.popular ? "is-highlight" : ""}" data-label="${esc(p.name)}">${cell(v)}</td>`;
      }).join("")}</tr>`).join("")}
      <tr><td></td>${C.plans.map((p) => `<td class="center ${p.popular ? "is-highlight" : ""}" data-label=""><button class="btn btn--secondary btn--sm" type="button" data-action="book" data-plan="${p.id}" data-type="${t}">Elegir</button></td>`).join("")}</tr>
      </tbody></table></div>`;
  }
  UI.tabs($("#priceTabs"), { panels: false, onChange: (tab) => { state.priceType = tab.dataset.type; const grid = $("#planGrid"); UI.animate(grid, { opacity: [0.4, 1] }, { duration: 0.35 }); renderPlans(); } });
  $("#compareToggle").addEventListener("click", (e) => {
    const btn = e.currentTarget; const panel = $("#compareTable"); const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    if (!open) { panel.hidden = false; UI.animate(panel, { height: [0, panel.scrollHeight + "px"], opacity: [0, 1] }, { duration: 0.4 }).then(() => (panel.style.height = "")); }
    else UI.animate(panel, { height: [panel.scrollHeight + "px", 0], opacity: 0 }, { duration: 0.3 }).then(() => { panel.hidden = true; panel.style.height = ""; panel.style.opacity = ""; });
  });

  /* ---------- Testimonials ---------- */
  function renderReviewFilters() {
    const pub = C.testimonials.filter((t) => t.published);
    const counts = pub.reduce((a, t) => ((a[t.need] = (a[t.need] || 0) + 1), a), {});
    $("#reviewFilters").innerHTML = [["all", "Todas", pub.length], ...Object.entries(C.needs).filter(([k]) => counts[k]).map(([k, l]) => [k, l, counts[k]])]
      .map(([k, l, n]) => `<button class="chip" type="button" aria-pressed="${state.reviewNeed === k}" data-need="${k}">${esc(l)} <span class="chip__count">${n}</span></button>`).join("");
    $("#ratingStars").innerHTML = UI.stars(C.proof.rating);
  }
  function renderReviews() {
    const list = C.testimonials.filter((t) => t.published && (state.reviewNeed === "all" || t.need === state.reviewNeed));
    $("#reviewTrack").innerHTML = list.length ? list.map((t) => `
      <article class="card review" data-review="${t.id}">
        <div class="review__top"><span class="stars" aria-label="${t.rating} de 5">${UI.stars(t.rating)}</span><span class="badge">${esc(C.needs[t.need] || t.need)}</span></div>
        <p class="review__quote">“${esc(t.text)}”</p>
        ${t.text.length > 180 ? `<button class="review__more" type="button" data-action="review" data-id="${t.id}">Leer completa</button>` : ""}
        <div class="review__foot"><span class="avatar" aria-hidden="true">${esc(UI.initials(t.name))}</span><div class="review__who"><span class="review__name">${esc(t.name)}</span><span class="review__src">${icon("check")}Reseña verificada · ${esc(t.source)}</span></div></div>
      </article>`).join("") : `<div class="empty">No hay opiniones para este filtro todavía.</div>`;
    $("#reviewTrack").scrollLeft = 0;
    UI.$$(".review", $("#reviewTrack")).forEach((r, i) => UI.animate(r, { opacity: [0, 1], y: [10, 0] }, { duration: 0.35, delay: i * 0.04 }));
  }
  $("#reviewFilters").addEventListener("click", (e) => {
    const c = e.target.closest("[data-need]"); if (!c) return;
    state.reviewNeed = c.dataset.need; $$("#reviewFilters .chip").forEach((x) => x.setAttribute("aria-pressed", x === c)); renderReviews();
  });
  const scrollReviews = (dir) => { const tr = $("#reviewTrack"); const card = tr.querySelector(".review"); tr.scrollBy({ left: dir * ((card ? card.offsetWidth : 300) + 20), behavior: UI.reduced() ? "auto" : "smooth" }); };
  $("#revPrev").addEventListener("click", () => scrollReviews(-1));
  $("#revNext").addEventListener("click", () => scrollReviews(1));
  $("#reviewTrack").addEventListener("keydown", (e) => { if (e.key === "ArrowRight") scrollReviews(1); if (e.key === "ArrowLeft") scrollReviews(-1); });
  function renderTicker() {
    const words = ["Respira", "Alergias", "Descanso", "Piel", "Silencio", "Niños", "Sal", "Calma"];
    const row = words.map((w) => `<span>${w}</span>`).join("");
    $("#ticker").innerHTML = row + row;
  }

  /* ---------- FAQ ---------- */
  let faqTabsApi = null;
  function renderFaq() {
    const tabs = $("#faqTabs");
    tabs.innerHTML = `<span class="tabs__indicator" aria-hidden="true"></span>` + [["all", "Todas"], ...Object.entries(C.faqCats)].map(([k, l]) => `<button class="tab" role="tab" aria-selected="${state.faqCat === k}" ${state.faqCat === k ? "" : 'tabindex="-1"'} data-cat="${k}" aria-controls="faqList">${esc(l)}</button>`).join("");
    faqTabsApi = UI.tabs(tabs, { panels: false, onChange: (t) => { state.faqCat = t.dataset.cat; renderFaqList(); } });
    renderFaqList();
  }
  function renderFaqList() {
    const list = C.faqs.filter((f) => state.faqCat === "all" || f.cat === state.faqCat);
    $("#faqList").innerHTML = list.map((f, i) => `
      <div class="acc__item">
        <h3><button class="acc__trigger" type="button" aria-expanded="false" aria-controls="faq-p-${i}" id="faq-t-${i}">${esc(f.q)}<span class="acc__icon">${icon("plus", "icon--sm")}</span></button></h3>
        <div class="acc__panel" id="faq-p-${i}" role="region" aria-labelledby="faq-t-${i}" hidden><div class="acc__body">${f.a.map((p) => `<p>${esc(p)}</p>`).join("")}</div></div>
      </div>`).join("") + `<div class="faq-mobile-help" style="padding-top:var(--sp-6)"><button class="btn btn--secondary btn--block" type="button" data-action="whatsapp" data-wa="faq">${icon("whatsapp")}¿Otra duda? Escríbenos</button></div>`;
  }
  $("#faqList").addEventListener("click", (e) => {
    const t = e.target.closest(".acc__trigger"); if (!t) return;
    const p = document.getElementById(t.getAttribute("aria-controls"));
    const open = t.getAttribute("aria-expanded") === "true";
    t.setAttribute("aria-expanded", String(!open));
    if (!open) { p.hidden = false; UI.animate(p, { height: [0, p.scrollHeight + "px"], opacity: [0, 1] }, { duration: 0.32 }).then(() => (p.style.height = "")); H.track("faq_open", { q: t.textContent.trim() }); }
    else UI.animate(p, { height: [p.scrollHeight + "px", 0], opacity: [1, 0] }, { duration: 0.26 }).then(() => { p.hidden = true; p.style.height = ""; p.style.opacity = ""; });
  });

  /* ---------- Contact ---------- */
  function renderContact() {
    const b = C.business;
    const today = new Date().getDay();
    // group consecutive identical days
    $("#hoursList").innerHTML = C.hours.map((h) => `<div class="${h.day === today ? "is-today" : ""}"><dt>${h.label}</dt><dd>${h.closed ? "Cerrado" : `${h.open} – ${h.close}`}</dd></div>`).join("");
    const st = H.openNow(C);
    const badge = $("#openBadge"); badge.textContent = st.label; badge.className = "badge " + (st.open ? "badge--success" : "");
    const d = 0.006;
    $("#mapFrame").src = `https://www.openstreetmap.org/export/embed.html?bbox=${b.lng - d},${b.lat - d / 2},${b.lng + d},${b.lat + d / 2}&layer=mapnik&marker=${b.lat},${b.lng}`;
    $("#directionsLink").href = `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`;
    $("#directionsLink").innerHTML = `Cómo llegar ${icon("external", "icon--sm")}`;
    $("#directionsLink").style.display = "inline-flex"; $("#directionsLink").style.gap = "4px"; $("#directionsLink").style.alignItems = "center";
    const tel = "tel:" + b.phone.replace(/\s/g, "");
    $("#phoneLink").href = tel; $("#footerPhone").href = tel;
    $("#mailLink").href = "mailto:" + b.email; $("#footerMail").href = "mailto:" + b.email;
  }
  const cform = $("#contactForm");
  UI.liveValidate(cform);
  cform.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!UI.validate(cform)) return;
    const btn = cform.querySelector('[type="submit"]'); btn.setAttribute("aria-busy", "true");
    const fd = new FormData(cform);
    setTimeout(() => {
      H.Store.push("messages", { id: H.uid("MS"), createdAt: new Date().toISOString(), name: fd.get("name"), contact: fd.get("contact"), topic: fd.get("topic"), message: fd.get("message"), read: false });
      H.track("contact_sent", { topic: fd.get("topic") });
      btn.removeAttribute("aria-busy"); cform.reset(); $$(".is-valid", cform).forEach((f) => f.classList.remove("is-valid"));
      cform.hidden = true; const ok = $("#contactSuccess"); ok.hidden = false;
      UI.animate(ok, { opacity: [0, 1], y: [10, 0] }, { duration: 0.4 });
    }, 900);
  });
  $("#contactAgain").addEventListener("click", () => { $("#contactSuccess").hidden = true; cform.hidden = false; cform.querySelector("input").focus(); });

  /* ---------- Gallery ---------- */
  $("#galleryFilters").addEventListener("click", (e) => {
    const c = e.target.closest("[data-filter]"); if (!c) return;
    $$("#galleryFilters .chip").forEach((x) => x.setAttribute("aria-pressed", x === c));
    const f = c.dataset.filter;
    $$("#gallery .gallery__item").forEach((it) => {
      const show = f === "all" || it.dataset.cat === f;
      if (show && it.classList.contains("is-hidden")) { it.classList.remove("is-hidden"); UI.animate(it.firstElementChild, { opacity: [0, 1], scale: [0.97, 1] }, { duration: 0.4 }); }
      else if (!show) it.classList.add("is-hidden");
    });
    H.track("gallery_filter", { filter: f });
  });
  $("#gallery").addEventListener("click", (e) => {
    const b = e.target.closest(".gallery__btn"); if (!b) return;
    const items = $$("#gallery .gallery__item:not(.is-hidden) .gallery__btn");
    lightbox(items, items.indexOf(b));
  });
  function lightbox(items, index) {
    let i = index;
    const m = UI.modal({ title: "Galería", size: "media" });
    m.body.style.padding = "0";
    const render = () => {
      const b = items[i]; const img = b.querySelector("img");
      m.setBody(`<div class="lightbox">
        <span></span>
        <div class="lightbox__stage">
          <figure class="media lightbox__img" data-slot="${esc(b.dataset.slot)}"><img src="${esc(img.getAttribute("src"))}" alt="${esc(img.alt)}"></figure>
          <button class="btn btn--icon btn--light lightbox__nav lightbox__nav--prev" type="button" data-lb="-1" aria-label="Anterior">${icon("chevron-left")}</button>
          <button class="btn btn--icon btn--light lightbox__nav lightbox__nav--next" type="button" data-lb="1" aria-label="Siguiente">${icon("chevron-right")}</button>
        </div>
        <div class="lightbox__caption"><span>${esc(b.dataset.caption)}</span><span class="code">${i + 1} / ${items.length}</span></div>
      </div>`);
      UI.animate(m.body.querySelector(".lightbox__img"), { opacity: [0, 1], scale: [0.98, 1] }, { duration: 0.35 });
    };
    const go = (d) => { i = (i + d + items.length) % items.length; render(); };
    m.el.addEventListener("click", (e) => { const n = e.target.closest("[data-lb]"); if (n) go(+n.dataset.lb); });
    m.el.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); });
    let sx = null;
    m.body.addEventListener("pointerdown", (e) => (sx = e.clientX));
    m.body.addEventListener("pointerup", (e) => { if (sx != null && Math.abs(e.clientX - sx) > 50) go(e.clientX < sx ? 1 : -1); sx = null; });
    render();
  }

  /* ---------- WhatsApp (RF-04): message depends on section ---------- */
  const WA = {
    inicio: { label: "¿Dudas? Escríbenos", msg: () => "Hola, me gustaría información sobre las sesiones de haloterapia." },
    beneficios: { label: "Consulta tu caso", msg: () => `Hola, quiero saber si la haloterapia me puede ayudar con ${{ respiratorio: "mi salud respiratoria", piel: "mi piel", estres: "el estrés y el descanso", ninos: "mis hijos" }[state.benefit] || "mi caso"}.` },
    respiratorio: { msg: () => "Hola, tengo problemas respiratorios (alergia/sinusitis) y quiero saber si la haloterapia es para mí." },
    piel: { msg: () => "Hola, tengo eccema/psoriasis y quería consultar si puedo hacer sesiones de haloterapia." },
    estres: { msg: () => "Hola, busco sesiones de haloterapia para desconectar y dormir mejor. ¿Qué horarios tenéis?" },
    ninos: { msg: () => "Hola, quería información sobre las sesiones infantiles (edades y horarios)." },
    "como-funciona": { label: "¿Cómo es una sesión?", msg: () => "Hola, tengo dudas sobre cómo es una sesión en la cueva de sal." },
    galeria: { label: "Visítanos esta semana", msg: () => "Hola, me encantaría conocer la cueva. ¿Qué horarios tenéis esta semana?" },
    tarifas: { label: "Pregunta por los bonos", msg: () => `Hola, quiero información sobre los bonos (${C.sessionTypes.find((t) => t.id === state.priceType).name.toLowerCase()}).` },
    opiniones: { label: "¿Lo probamos?", msg: () => "Hola, he leído las opiniones y me gustaría probar una sesión." },
    faq: { label: "Pregúntanos", msg: () => "Hola, tengo una pregunta antes de reservar: " },
    contacto: { label: "Escríbenos", msg: () => "Hola, quería hacer una consulta: " },
  };
  function openWhatsApp(key) {
    const k = key || state.section;
    const entry = WA[k] || WA.inicio;
    const url = `https://wa.me/${C.business.whatsapp}?text=${encodeURIComponent(entry.msg())}`;
    H.track("whatsapp_click", { section: k });
    window.open(url, "_blank", "noopener");
  }

  /* ---------- Section tracking (nav, tabbar, header context, FAB) ---------- */
  let io;
  function observeSections() {
    io && io.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id; state.section = id;
        $("#navContext").textContent = en.target.dataset.section;
        $$(".nav__links a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
        const tabMap = { inicio: "inicio", beneficios: "beneficios", tarifas: "tarifas" };
        $$(".tabbar__item[data-tab]").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === (tabMap[id] || "more")));
        const lbl = (WA[id] && WA[id].label) || WA.inicio.label;
        const el = $("#waLabel");
        if (el.textContent !== lbl) UI.animate(el, { opacity: [1, 0] }, { duration: 0.12 }).then(() => { el.textContent = lbl; UI.animate(el, { opacity: [0, 1] }, { duration: 0.2 }); });
      });
    }, { root: UI.isMobile() ? appScroll : null, rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    $$("[data-section]").forEach((s) => io.observe(s));
  }
  UI.mqMobile.addEventListener("change", () => { observeSections(); measureHeader(); renderPlans(); });

  /* ---------- Secondary sheets: more, menu, legal, review ---------- */
  function moreSheet() {
    const m = UI.modal({ title: "Más" });
    const items = [["como-funciona", "vent", "Cómo funciona"], ["galeria", "layers", "Galería"], ["opiniones", "star", "Opiniones"], ["faq", "help", "Preguntas"], ["contacto", "map-pin", "Contacto"]];
    m.setBody(`<div class="more-grid">${items.map(([id, ic, l]) => `<a class="more-item" href="#${id}" data-scroll>${icon(ic)}${l}</a>`).join("")}
      <button class="more-item" type="button" data-action="gift">${icon("gift")}Regalar</button></div>
      <div class="stack" style="margin-top:20px;gap:8px">
        <button class="btn btn--secondary btn--block" type="button" data-action="lead">${icon("book")}Guía de respiración gratis</button>
        <a class="btn btn--ghost btn--block" href="tel:${C.business.phone.replace(/\s/g, "")}">${icon("phone")}Llamar ${esc(C.business.phone)}</a>
      </div>`);
  }
  function menuDrawer() {
    const m = UI.modal({ title: "Menú", drawer: true });
    m.setBody(`<nav class="menu-links">${[["beneficios", "Beneficios"], ["como-funciona", "Cómo funciona"], ["galeria", "Galería"], ["tarifas", "Tarifas"], ["opiniones", "Opiniones"], ["faq", "Preguntas frecuentes"], ["contacto", "Contacto"]].map(([id, l]) => `<a href="#${id}" data-scroll>${l}${icon("arrow-right")}</a>`).join("")}</nav>`);
    m.setFoot(`<button class="btn btn--secondary" type="button" data-action="gift">${icon("gift")}Regalar</button><div class="modal__foot-actions"><button class="btn btn--primary" type="button" data-action="book">Reservar sesión</button></div>`);
  }
  const LEGAL = {
    privacidad: ["Política de privacidad", `<p>Responsable: ${esc(C.business.name)}. Finalidad: gestionar reservas, consultas y, si lo aceptas, enviarte la guía y comunicaciones ocasionales.</p><h4>Base legal</h4><p>Ejecución del contrato (reservas) y consentimiento (guía y comunicaciones). Puedes retirarlo en cualquier momento.</p><h4>Tus derechos</h4><p>Acceso, rectificación, supresión, oposición y portabilidad escribiendo a ${esc(C.business.email)}.</p><p class="t-small t-muted">Texto provisional: debe revisarlo un asesor legal antes de publicar.</p>`],
    condiciones: ["Condiciones de reserva", `<p>Puedes cambiar o cancelar tu sesión sin coste hasta 24 h antes. Con menos antelación, la sesión se considera consumida (o se descuenta del bono).</p><h4>Bonos</h4><p>Bono 5: validez 3 meses. Bono 10: validez 6 meses. Son nominativos, aunque se pueden compartir según el plan.</p><h4>Salud</h4><p>Al reservar declaras no tener contraindicaciones o haberlo consultado con tu médico. La haloterapia es complementaria y no sustituye ningún tratamiento.</p><p class="t-small t-muted">Texto provisional: debe revisarlo un asesor legal antes de publicar.</p>`],
    cookies: ["Cookies", `<p>Esta web usa almacenamiento local del navegador para recordar tus preferencias (por ejemplo, si has cerrado el aviso de promoción). No usa cookies de terceros con fines publicitarios.</p><p>El mapa lo sirve OpenStreetMap.</p>`],
  };

  /* ---------- Global action router ---------- */
  document.addEventListener("click", (e) => {
    const scrollLink = e.target.closest("a[data-scroll]");
    if (scrollLink) {
      const id = scrollLink.getAttribute("href").slice(1);
      e.preventDefault();
      if (scrollLink.dataset.faqCat && faqTabsApi) { const t = faqTabsApi.tabs.find((x) => x.dataset.cat === scrollLink.dataset.faqCat); t && faqTabsApi.select(t); }
      const inModal = scrollLink.closest(".modal, .drawer");
      if (inModal) { UI.closeAll(); setTimeout(() => H.scrollTo(id), 300); } else H.scrollTo(id);
      history.replaceState(null, "", "#" + id);
      return;
    }
    const a = e.target.closest("[data-action]");
    if (!a) return;
    const act = a.dataset.action;
    if (act === "legal" || a.tagName === "A") e.preventDefault();
    const fromModal = a.closest(".modal, .drawer");
    const run = (fn) => (fromModal && act !== "legal" && act !== "review" ? (UI.closeAll(), setTimeout(fn, 320)) : fn());
    switch (act) {
      case "book": run(() => H.Flows.booking({ plan: a.dataset.plan || undefined, type: a.dataset.type || undefined })); break;
      case "gift": run(() => H.Flows.gift()); break;
      case "lead": run(() => H.Flows.lead()); break;
      case "whatsapp": openWhatsApp(a.dataset.wa); break;
      case "more": moreSheet(); break;
      case "menu": menuDrawer(); break;
      case "legal": { const [t, body] = LEGAL[a.dataset.doc] || LEGAL.privacidad; UI.modal({ title: t, body: `<div class="legal t-muted">${body}</div>` }); break; }
      case "review": { const r = C.testimonials.find((x) => x.id === a.dataset.id); if (r) UI.modal({ title: "Opinión", body: `<div class="review-full"><span class="stars">${UI.stars(r.rating)}</span><p class="review-full__text">“${esc(r.text)}”</p><div class="review__foot"><span class="avatar">${esc(UI.initials(r.name))}</span><div class="review__who"><span class="review__name">${esc(r.name)}</span><span class="review__src">${icon("check")}Reseña verificada · ${esc(r.source)} · ${esc(C.needs[r.need])}</span></div></div></div>`, foot: `<button class="btn btn--primary btn--block" type="button" data-action="book">Reservar mi sesión</button>` }); break; }
    }
  });

  /* ---------- Render all ---------- */
  function renderAll(content) {
    if (content) C = content;
    bindText();
    renderHeader();
    renderPlans();
    renderReviewFilters();
    renderReviews();
    renderFaq();
    renderContact();
  }
  renderAll();
  renderTicker();
  $("#year").textContent = new Date().getFullYear();
  H.Store.subscribe((c) => { renderAll(c); UI.toast("Contenido actualizado", "info"); });
  UI.initMedia();
  UI.bindPress();
  UI.bindHoverLift();
  observeSections();
  onScroll();

  // Deep links: #reservar opens booking
  if (location.hash === "#reservar") H.Flows.booking({});
  else if (location.hash && document.getElementById(location.hash.slice(1))) setTimeout(() => H.scrollTo(location.hash.slice(1)), 200);
})();
