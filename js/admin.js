/* =========================================================
   Halita · Admin CMS (RF-05)
   Client-side panel: edits a draft of the content store and
   saves to localStorage (read live by the public site).
   ========================================================= */
(function () {
  const H = window.Halita;
  const UI = H.UI;
  const { $, $$, icon, esc } = UI;

  const AUTH_KEY = "halita.admin.session";
  const VIEWS = {
    resumen: "Resumen", actividad: "Actividad", precios: "Precios y bonos", promociones: "Promociones",
    horarios: "Horarios", testimonios: "Testimonios", ajustes: "Ajustes",
  };
  let saved = H.Store.get();
  let draft = clone(saved);
  let current = "resumen";
  let activityTab = "bookings";

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  const dirty = () => JSON.stringify(draft) !== JSON.stringify(saved);
  function markDirty() {
    const bar = $("#savebar");
    const d = dirty();
    if (d && bar.hidden) { bar.hidden = false; UI.animate(bar, { opacity: [0, 1], y: [16, 0] }, { duration: 0.3 }); }
    else if (!d) bar.hidden = true;
  }
  function save() {
    H.Store.save(draft);
    saved = H.Store.get(); draft = clone(saved);
    markDirty(); UI.toast("Cambios guardados · la web ya los muestra");
    renderChrome(); render();
  }
  function discard() { draft = clone(saved); markDirty(); render(); UI.toast("Cambios descartados", "info"); }

  /* ---------- Auth (demo gate, not security) ---------- */
  const authed = () => { try { return sessionStorage.getItem(AUTH_KEY) === "1"; } catch (e) { return false; } };
  function showApp() { $("#login").hidden = true; $("#shell").hidden = false; route(); }
  function showLogin() { $("#shell").hidden = true; $("#login").hidden = false; $("#lg-pass").focus(); }
  const lf = $("#loginForm");
  UI.liveValidate(lf);
  lf.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!UI.validate(lf)) return;
    const ok = $("#lg-email").value.trim().toLowerCase() === "demo@halita.es" && $("#lg-pass").value === "halita";
    const f = $("#lg-pass").closest(".field");
    f.classList.toggle("is-invalid", !ok);
    if (!ok) { UI.animate(lf, { x: [0, -8, 8, -4, 4, 0] }, { duration: 0.4 }); return; }
    try { sessionStorage.setItem(AUTH_KEY, "1"); } catch (err) {}
    showApp();
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-logout]")) {
      if (dirty() && !confirm("Tienes cambios sin guardar. ¿Salir igualmente?")) return;
      try { sessionStorage.removeItem(AUTH_KEY); } catch (err) {}
      showLogin();
    }
    if (e.target.closest("[data-save]")) save();
    if (e.target.closest("[data-discard]")) discard();
    if (e.target.closest("[data-more]")) moreSheet();
  });

  /* ---------- Routing ---------- */
  function route() {
    const v = (location.hash || "#resumen").slice(1);
    current = VIEWS[v] ? v : "resumen";
    renderChrome();
    render();
  }
  window.addEventListener("hashchange", route);
  window.addEventListener("beforeunload", (e) => { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });

  function renderChrome() {
    $$("[data-view]").forEach((a) => { if (a.dataset.view === current) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $("#viewTitle").textContent = VIEWS[current];
    $("#crumb").textContent = VIEWS[current];
    $("#adminDemo").hidden = !saved.meta.demo;
    const unread = H.Store.list("messages").filter((m) => !m.read).length;
    const uc = $("#unreadCount"); uc.hidden = !unread; uc.textContent = unread;
    document.title = `${VIEWS[current]} · Panel ${saved.business.name}`;
    const actions = {
      resumen: `<button class="btn btn--secondary btn--sm" type="button" data-export>${icon("download")}<span>Exportar JSON</span></button><a class="btn btn--primary btn--sm" href="index.htm" target="_blank" rel="noopener">${icon("external")}<span>Ver web</span></a>`,
      actividad: `<button class="btn btn--secondary btn--sm" type="button" data-csv>${icon("download")}<span>Exportar CSV</span></button>`,
      testimonios: `<button class="btn btn--primary btn--sm" type="button" data-add-review>${icon("plus")}<span>Añadir testimonio</span></button>`,
      ajustes: `<button class="btn btn--secondary btn--sm" type="button" data-import>${icon("upload")}<span>Importar</span></button><button class="btn btn--secondary btn--sm" type="button" data-export>${icon("download")}<span>Exportar</span></button>`,
    };
    $("#topActions").innerHTML = actions[current] || "";
  }

  function render() {
    const view = $("#view");
    view.innerHTML = ({ resumen, actividad, precios, promociones, horarios, testimonios, ajustes })[current]();
    UI.animate(view, { opacity: [0, 1], y: [8, 0] }, { duration: 0.3 });
    view.focus({ preventScroll: true });
    if (current === "actividad") bindActivity();
  }

  /* ---------- Views ---------- */
  function resumen() {
    const b = H.Store.list("bookings"), l = H.Store.list("leads"), m = H.Store.list("messages"), g = H.Store.list("gifts");
    const revenue = b.filter((x) => x.status !== "cancelada").reduce((s, x) => s + (x.total || 0), 0) + g.reduce((s, x) => s + (x.value || 0), 0);
    const d = H.Store.defaults();
    const checks = [
      ["Dirección y teléfono reales", saved.business.address !== d.business.address && saved.business.phone !== d.business.phone],
      ["Número de WhatsApp real", saved.business.whatsapp !== d.business.whatsapp],
      ["Valoración y nº de reseñas verificables", saved.proof.reviews !== d.proof.reviews || saved.proof.rating !== d.proof.rating],
      ["Testimonios reales con permiso", saved.testimonials.some((t) => !d.testimonials.find((x) => x.id === t.id))],
      ["Precios revisados", JSON.stringify(saved.plans) !== JSON.stringify(d.plans)],
      ["Modo demo desactivado", !saved.meta.demo],
    ];
    return `
      <div class="kpis">
        <div class="card kpi"><span class="kpi__label">${icon("calendar", "icon--sm")}Reservas</span><span class="kpi__value">${b.length}</span><span class="kpi__hint">en este navegador</span></div>
        <div class="card kpi"><span class="kpi__label">${icon("tag", "icon--sm")}Ingresos simulados</span><span class="kpi__value">${H.fmt.eur(revenue)}</span><span class="kpi__hint">reservas + tarjetas regalo</span></div>
        <div class="card kpi"><span class="kpi__label">${icon("book", "icon--sm")}Leads (guía)</span><span class="kpi__value">${l.length}</span><span class="kpi__hint">descargas de la guía</span></div>
        <div class="card kpi"><span class="kpi__label">${icon("mail", "icon--sm")}Mensajes sin leer</span><span class="kpi__value">${m.filter((x) => !x.read).length}</span><span class="kpi__hint">de ${m.length} recibidos</span></div>
      </div>
      <div class="panel">
        <div class="panel__head"><div><h2>Antes de publicar</h2><p>Sustituye los datos de ejemplo por datos reales y verificables.</p></div><span class="badge ${checks.every((c) => c[1]) ? "badge--success" : ""}">${checks.filter((c) => c[1]).length}/${checks.length}</span></div>
        <div class="panel__body"><ul class="checklist">${checks.map(([t, ok]) => `<li class="${ok ? "is-done" : ""}"><span class="dot">${ok ? icon("check", "icon--sm") : ""}</span>${t}</li>`).join("")}</ul></div>
      </div>
      <div class="panel">
        <div class="panel__head"><div><h2>Últimas reservas</h2><p>Las 5 más recientes</p></div><a class="btn btn--ghost btn--sm" href="#actividad">Ver todas</a></div>
        ${bookingsTable(b.slice(0, 5), false)}
      </div>`;
  }

  function bookingsTable(list, actions = true) {
    if (!list.length) return `<div class="empty">${icon("calendar", "icon--lg")}<span>Aún no hay reservas. Haz una prueba desde la web.</span></div>`;
    return `<div class="table-wrap"><table class="table table--stack"><thead><tr><th>Código</th><th>Cliente</th><th>Fecha</th><th>Sesión</th><th class="num">Total</th><th>Estado</th>${actions ? "<th></th>" : ""}</tr></thead><tbody>
      ${list.map((x) => `<tr><td data-label="Código"><span class="code">${esc(x.id)}</span></td><td data-label="Cliente">${esc(x.name)}<br><span class="t-small t-muted">${esc(x.email)}</span></td><td data-label="Fecha">${esc(x.date)} · ${esc(x.time)}</td><td data-label="Sesión">${esc(x.planName)} · ${esc(x.typeId)}${x.flat ? "" : " × " + x.people}</td><td class="num" data-label="Total">${H.fmt.eur(x.total)}</td>
      <td data-label="Estado"><span class="badge ${x.status === "cancelada" ? "badge--danger" : "badge--success"}">${esc(x.status)}</span> ${x.paid ? '<span class="badge">Pagado</span>' : '<span class="badge">En centro</span>'}</td>
      ${actions ? `<td data-label=""><button class="btn btn--ghost btn--sm" type="button" data-toggle-booking="${esc(x.id)}">${x.status === "cancelada" ? "Reactivar" : "Cancelar"}</button></td>` : ""}</tr>`).join("")}
    </tbody></table></div>`;
  }

  function actividad() {
    const lists = { bookings: H.Store.list("bookings"), leads: H.Store.list("leads"), messages: H.Store.list("messages"), gifts: H.Store.list("gifts") };
    const tabs = [["bookings", "Reservas"], ["messages", "Mensajes"], ["leads", "Leads"], ["gifts", "Tarjetas regalo"]];
    let body = "";
    if (activityTab === "bookings") body = bookingsTable(lists.bookings);
    if (activityTab === "leads") body = lists.leads.length ? `<div class="table-wrap"><table class="table table--stack"><thead><tr><th>Nombre</th><th>Email</th><th>Interés</th><th>Fecha</th></tr></thead><tbody>${lists.leads.map((x) => `<tr><td data-label="Nombre">${esc(x.name)}</td><td data-label="Email">${esc(x.email)}</td><td data-label="Interés"><span class="badge">${esc(x.goal)}</span></td><td data-label="Fecha">${new Date(x.createdAt).toLocaleString("es-ES")}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">${icon("book", "icon--lg")}Sin descargas de la guía todavía.</div>`;
    if (activityTab === "messages") body = lists.messages.length ? `<div class="table-wrap"><table class="table table--stack"><thead><tr><th></th><th>De</th><th>Motivo</th><th>Mensaje</th><th>Fecha</th></tr></thead><tbody>${lists.messages.map((x) => `<tr style="cursor:pointer" data-open-msg="${esc(x.id)}"><td data-label="">${x.read ? "" : '<span class="badge badge--highlight">Nuevo</span>'}</td><td data-label="De">${esc(x.name)}<br><span class="t-small t-muted">${esc(x.contact)}</span></td><td data-label="Motivo">${esc(x.topic)}</td><td data-label="Mensaje">${esc(x.message.slice(0, 60))}${x.message.length > 60 ? "…" : ""}</td><td data-label="Fecha">${new Date(x.createdAt).toLocaleDateString("es-ES")}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">${icon("mail", "icon--lg")}No hay mensajes.</div>`;
    if (activityTab === "gifts") body = lists.gifts.length ? `<div class="table-wrap"><table class="table table--stack"><thead><tr><th>Código</th><th>Para</th><th>De</th><th class="num">Valor</th><th>Entrega</th><th>Estado</th></tr></thead><tbody>${lists.gifts.map((x) => `<tr><td data-label="Código"><span class="code">${esc(x.code)}</span></td><td data-label="Para">${esc(x.to)}<br><span class="t-small t-muted">${esc(x.toEmail)}</span></td><td data-label="De">${esc(x.from)}</td><td class="num" data-label="Valor">${H.fmt.eur(x.value)}</td><td data-label="Entrega">${x.when === "now" ? "Inmediata" : esc(x.date)}</td><td data-label="Estado"><span class="badge ${x.redeemed ? "" : "badge--success"}">${x.redeemed ? "Canjeada" : "Activa"}</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">${icon("gift", "icon--lg")}No se han vendido tarjetas regalo.</div>`;
    return `<div class="tabs" role="tablist" id="actTabs"><span class="tabs__indicator" aria-hidden="true"></span>${tabs.map(([k, l]) => `<button class="tab" role="tab" aria-selected="${activityTab === k}" data-act="${k}" ${activityTab === k ? "" : 'tabindex="-1"'}>${l} <span class="chip__count">${lists[k].length}</span></button>`).join("")}</div>
      <div class="panel">${body}</div>`;
  }
  function bindActivity() {
    UI.tabs($("#actTabs"), { panels: false, onChange: (t) => { if (activityTab !== t.dataset.act) { activityTab = t.dataset.act; render(); } } });
  }

  function precios() {
    const types = draft.sessionTypes;
    return `
      <div class="panel">
        <div class="panel__head"><div><h2>Tarifas por tipo de sesión</h2><p>Precio total del plan. Adulto e infantil: por persona. Privada: por sala.</p></div></div>
        <div class="table-wrap"><table class="table table--stack"><thead><tr><th>Plan</th>${types.map((t) => `<th class="num">${esc(t.name)}</th>`).join("")}<th></th></tr></thead><tbody>
          ${draft.plans.map((p, i) => `<tr><td data-label="Plan"><b class="t-strong" style="font-weight:500">${esc(p.name)}</b> ${p.popular ? '<span class="badge badge--highlight">Destacado</span>' : ""}<br><span class="t-small t-muted">${p.sessions} ses. · ${esc(p.validity)}</span></td>
            ${types.map((t) => `<td class="num" data-label="${esc(t.name)}"><input class="input cell-input" type="number" min="0" step="1" value="${p.prices[t.id]}" data-price="${i}:${t.id}" aria-label="${esc(p.name)} ${esc(t.name)}"> €</td>`).join("")}
            <td data-label=""><button class="btn btn--ghost btn--sm" type="button" data-edit-plan="${i}">${icon("edit")}Editar</button></td></tr>`).join("")}
        </tbody></table></div>
      </div>
      <p class="t-small t-muted row" style="flex-wrap:nowrap;gap:8px">${icon("info", "icon--sm")} Al guardar, la web actualiza al momento las tarjetas de precios, la tabla comparativa y el importe del flujo de reserva.</p>`;
  }

  function promociones() {
    const p = draft.promo;
    return `
      <div class="panel">
        <div class="panel__head"><div><h2>Promoción de temporada</h2><p>Se muestra en la franja superior de la web y descuenta el plan elegido.</p></div><label class="switch"><input type="checkbox" data-bind-check="promo.active" ${p.active ? "checked" : ""} aria-label="Promoción activa"></label></div>
        <div class="panel__body">
          <div class="field"><label class="field__label" for="pr-text">Texto</label><input class="input" id="pr-text" data-bind-input="promo.text" value="${esc(p.text)}" maxlength="80"></div>
          <div class="form-row">
            <div class="field"><label class="field__label" for="pr-plan">Plan con descuento</label><select class="select" id="pr-plan" data-bind-input="promo.planId">${draft.plans.map((x) => `<option value="${x.id}" ${x.id === p.planId ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div>
            <div class="field"><label class="field__label" for="pr-disc">Descuento (%)</label><input class="input" id="pr-disc" type="number" min="0" max="90" data-bind-input="promo.discount" data-num value="${p.discount}"></div>
          </div>
          <div class="form-row">
            <div class="field"><label class="field__label" for="pr-code">Código (también válido en cualquier plan)</label><input class="input" id="pr-code" data-bind-input="promo.code" value="${esc(p.code)}" style="text-transform:uppercase"></div>
            <div class="field"><label class="field__label" for="pr-until">Válida hasta</label><input class="input" id="pr-until" type="date" data-bind-input="promo.until" value="${esc(p.until)}"></div>
          </div>
          <div class="stack" style="gap:8px"><span class="field__label">Vista previa</span>
            <div class="promo-preview"><div class="promo-preview__strip" id="promoPreview"></div><div class="promo-preview__page"></div></div></div>
        </div>
      </div>`;
  }

  function horarios() {
    return `
      <div class="panel">
        <div class="panel__head"><div><h2>Horario de apertura</h2><p>Las sesiones empiezan cada hora. La última empieza ${draft.business.sessionMinutes} min antes del cierre.</p></div></div>
        <div class="panel__body" style="gap:0">
          ${draft.hours.map((h, i) => `<div class="hours-row ${h.closed ? "is-closed" : ""}"><b class="t-strong" style="font-weight:500">${h.label}</b>
            <label class="row t-small t-muted" style="gap:8px"><span class="switch"><input type="checkbox" data-hour-open="${i}" ${h.closed ? "" : "checked"} aria-label="Abierto ${h.label}"></span>${h.closed ? "Cerrado" : "Abierto"}</label>
            <input class="input" type="time" data-hour="${i}:open" value="${h.open}" ${h.closed ? "disabled" : ""} aria-label="Apertura ${h.label}">
            <input class="input" type="time" data-hour="${i}:close" value="${h.close}" ${h.closed ? "disabled" : ""} aria-label="Cierre ${h.label}"></div>`).join("")}
        </div>
      </div>
      <div class="panel">
        <div class="panel__head"><div><h2>Capacidad y sesiones</h2></div></div>
        <div class="panel__body">
          <div class="form-row">
            <div class="field"><label class="field__label" for="hr-cap">Plazas por sesión</label><input class="input" id="hr-cap" type="number" min="1" max="30" data-bind-input="business.capacity" data-num value="${draft.business.capacity}"></div>
            <div class="field"><label class="field__label" for="hr-min">Duración (min)</label><input class="input" id="hr-min" type="number" min="15" max="120" step="5" data-bind-input="business.sessionMinutes" data-num value="${draft.business.sessionMinutes}"></div>
          </div>
          <div class="field"><label class="field__label" for="hr-kids">Horas de inicio de sesiones infantiles</label><input class="input" id="hr-kids" data-kids value="${esc(draft.kidsSlots.join(", "))}"><span class="field__help">Separadas por comas (HH:MM). Los sábados todas las horas admiten sesiones infantiles.</span></div>
        </div>
      </div>`;
  }

  function testimonios() {
    const list = draft.testimonials;
    return `<div class="panel">
      <div class="panel__head"><div><h2>${list.length} testimonios</h2><p>Publica solo opiniones reales con permiso de la persona.</p></div></div>
      ${list.length ? `<div class="table-wrap"><table class="table table--stack"><thead><tr><th>Persona</th><th>Necesidad</th><th>Valoración</th><th>Texto</th><th class="center">Publicado</th><th></th></tr></thead><tbody>
      ${list.map((t, i) => `<tr><td data-label="Persona"><div class="row" style="gap:10px"><span class="avatar">${esc(UI.initials(t.name))}</span>${esc(t.name)}</div></td><td data-label="Necesidad"><span class="badge">${esc(draft.needs[t.need] || t.need)}</span></td><td data-label="Valoración"><span class="stars" style="color:var(--rating)">${UI.stars(t.rating)}</span></td><td data-label="Texto" class="t-muted">${esc(t.text.slice(0, 70))}…</td>
        <td class="center" data-label="Publicado"><span class="switch"><input type="checkbox" data-pub="${i}" ${t.published ? "checked" : ""} aria-label="Publicado"></span></td>
        <td data-label=""><div class="row" style="gap:4px"><button class="btn btn--icon btn--ghost btn--sm" type="button" data-edit-review="${i}" aria-label="Editar">${icon("edit")}</button><button class="btn btn--icon btn--ghost btn--sm" type="button" data-del-review="${i}" aria-label="Eliminar">${icon("trash")}</button></div></td></tr>`).join("")}
      </tbody></table></div>` : `<div class="empty">${icon("quote", "icon--lg")}No hay testimonios.<button class="btn btn--primary btn--sm" type="button" data-add-review>${icon("plus")}Añadir</button></div>`}
    </div>`;
  }

  function ajustes() {
    const b = draft.business, p = draft.proof;
    const f = (label, path, val, extra = "") => `<label class="field"><span class="field__label">${label}</span><input class="input" data-bind-input="${path}" value="${esc(val)}" ${extra}></label>`;
    return `
      <div class="panel"><div class="panel__head"><div><h2>Negocio</h2><p>Aparece en cabecera, contacto, pie y mensajes.</p></div></div>
        <div class="panel__body">
          <div class="setting"><div class="setting__label"><b>Identidad</b><span>Nombre comercial</span></div><div class="stack">${f("Nombre", "business.name", b.name)}</div></div>
          <div class="setting"><div class="setting__label"><b>Contacto</b><span>Teléfono, WhatsApp (solo dígitos con prefijo de país, sin “+”) y email</span></div><div class="stack">${f("Teléfono", "business.phone", b.phone)}${f("WhatsApp", "business.whatsapp", b.whatsapp, 'inputmode="numeric"')}${f("Email", "business.email", b.email, 'type="email"')}</div></div>
          <div class="setting"><div class="setting__label"><b>Ubicación</b><span>Dirección exacta y coordenadas para el mapa</span></div><div class="stack">${f("Dirección", "business.address", b.address)}${f("CP y ciudad", "business.city", b.city)}<div class="form-row">${f("Latitud", "business.lat", b.lat, 'data-num inputmode="decimal"')}${f("Longitud", "business.lng", b.lng, 'data-num inputmode="decimal"')}</div></div></div>
        </div></div>
      <div class="panel"><div class="panel__head"><div><h2>Prueba social</h2><p>Solo cifras verificables (p. ej. tu ficha de Google).</p></div></div>
        <div class="panel__body"><div class="form-row">${f("Valoración media", "proof.rating", p.rating, 'type="number" step="0.1" min="0" max="5" data-num')}${f("Nº de reseñas", "proof.reviews", p.reviews, 'type="number" min="0" data-num')}</div><div class="form-row">${f("Fuente", "proof.source", p.source)}${f("Sesiones realizadas", "proof.sessions", p.sessions, 'type="number" min="0" data-num')}</div></div></div>
      <div class="panel"><div class="panel__head"><div><h2>Modo demo</h2><p>Muestra la franja “datos de ejemplo” en la web.</p></div><label class="switch"><input type="checkbox" data-bind-check="meta.demo" ${draft.meta.demo ? "checked" : ""} aria-label="Modo demo"></label></div></div>
      <div class="panel danger-zone"><div class="panel__head"><div><h2>Restablecer</h2><p>Vuelve a los datos de ejemplo. No borra reservas ni mensajes.</p></div><button class="btn btn--secondary btn--sm" type="button" data-reset style="--_fg:var(--danger)">${icon("trash")}Restablecer</button></div></div>`;
  }

  /* ---------- Editing (delegated) ---------- */
  function setPath(obj, path, val) { const ks = path.split("."); let o = obj; ks.slice(0, -1).forEach((k) => (o = o[k])); o[ks[ks.length - 1]] = val; }
  function promoPreview() {
    const el = $("#promoPreview"); if (!el) return;
    el.innerHTML = draft.promo.active ? `<span class="badge badge--highlight">Temporada</span><span>${esc(draft.promo.text)}${draft.promo.code ? " · Código " + esc(draft.promo.code) : ""}</span><u>Aprovechar</u>` : `<span style="opacity:.6">Promoción desactivada: no se muestra la franja</span>`;
  }
  const view = $("#view");
  view.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.bindInput) { let v = t.value; if (t.dataset.num !== undefined) v = v === "" ? 0 : +v; if (t.dataset.bindInput === "promo.code") v = v.toUpperCase(); setPath(draft, t.dataset.bindInput, v); }
    if (t.dataset.price) { const [i, type] = t.dataset.price.split(":"); draft.plans[+i].prices[type] = Math.max(0, +t.value || 0); }
    if (t.dataset.hour) { const [i, k] = t.dataset.hour.split(":"); draft.hours[+i][k] = t.value; }
    if (t.dataset.kids !== undefined) draft.kidsSlots = t.value.split(",").map((s) => s.trim()).filter((s) => /^\d{2}:\d{2}$/.test(s));
    promoPreview(); markDirty();
  });
  view.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.bindCheck) { setPath(draft, t.dataset.bindCheck, t.checked); promoPreview(); }
    if (t.dataset.hourOpen) { draft.hours[+t.dataset.hourOpen].closed = !t.checked; render(); }
    if (t.dataset.pub) draft.testimonials[+t.dataset.pub].published = t.checked;
    markDirty();
  });
  document.addEventListener("click", (e) => {
    const el = e.target;
    const ep = el.closest("[data-edit-plan]"); if (ep) return planDrawer(+ep.dataset.editPlan);
    const er = el.closest("[data-edit-review]"); if (er) return reviewDrawer(+er.dataset.editReview);
    if (el.closest("[data-add-review]")) return reviewDrawer(-1);
    const dr = el.closest("[data-del-review]"); if (dr) return confirmDialog("¿Eliminar testimonio?", `Se quitará “${draft.testimonials[+dr.dataset.delReview].name}” de la web al guardar.`, "Eliminar", () => { draft.testimonials.splice(+dr.dataset.delReview, 1); markDirty(); render(); });
    const tb = el.closest("[data-toggle-booking]"); if (tb) { const l = H.Store.list("bookings").map((b) => (b.id === tb.dataset.toggleBooking ? { ...b, status: b.status === "cancelada" ? "confirmada" : "cancelada" } : b)); H.Store.setList("bookings", l); UI.toast("Reserva actualizada"); return render(); }
    const om = el.closest("[data-open-msg]"); if (om) return messageDrawer(om.dataset.openMsg);
    if (el.closest("[data-export]")) { UI.download(`halita-contenido-${H.fmt.iso(new Date())}.json`, JSON.stringify(saved, null, 2), "application/json"); return; }
    if (el.closest("[data-import]")) return $("#importFile").click();
    if (el.closest("[data-csv]")) return exportCsv();
    if (el.closest("[data-reset]")) return confirmDialog("¿Restablecer contenido?", "Se perderán precios, horarios, promociones y testimonios personalizados.", "Restablecer", () => { H.Store.reset(); saved = H.Store.get(); draft = clone(saved); markDirty(); renderChrome(); render(); UI.toast("Contenido restablecido"); });
    const at = el.closest("#actTabs [data-act]"); if (at && at.dataset.act !== activityTab) { activityTab = at.dataset.act; render(); }
  });
  $("#importFile").addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { const data = JSON.parse(r.result); if (!data.plans || !data.business) throw new Error("x"); draft = data; markDirty(); render(); UI.toast("Importado. Revisa y guarda."); } catch (err) { UI.toast("Archivo no válido", "x"); } e.target.value = ""; };
    r.readAsText(file);
  });
  function exportCsv() {
    const key = activityTab; const rows = H.Store.list(key);
    if (!rows.length) { UI.toast("No hay datos que exportar", "info"); return; }
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(";")].concat(rows.map((r) => cols.map((c) => `"${String(r[c] == null ? "" : r[c]).replace(/"/g, '""')}"`).join(";"))).join("\n");
    UI.download(`halita-${key}-${H.fmt.iso(new Date())}.csv`, "﻿" + csv, "text/csv");
  }

  /* ---------- Drawers & dialogs ---------- */
  function planDrawer(i) {
    const p = draft.plans[i];
    const d = UI.modal({ title: `Editar ${p.name}`, drawer: true });
    d.setBody(`<form class="form" id="planForm" novalidate>
      <div class="field"><label class="field__label" for="pl-name">Nombre</label><input class="input" id="pl-name" name="name" required value="${esc(p.name)}"><span class="field__error">Obligatorio.</span></div>
      <div class="form-row"><div class="field"><label class="field__label" for="pl-tag">Etiqueta</label><input class="input" id="pl-tag" name="tag" value="${esc(p.tag)}"></div><div class="field"><label class="field__label" for="pl-val">Validez</label><input class="input" id="pl-val" name="validity" value="${esc(p.validity)}"></div></div>
      <div class="field"><label class="field__label" for="pl-ses">Nº de sesiones</label><input class="input" id="pl-ses" name="sessions" type="number" min="1" required value="${p.sessions}"><span class="field__error">Mínimo 1.</span></div>
      <div class="field"><label class="field__label" for="pl-feat">Incluye <span class="opt">Una línea por punto</span></label><textarea class="textarea" id="pl-feat" name="features" rows="5">${esc(p.features.join("\n"))}</textarea></div>
      <label class="check"><input type="checkbox" name="popular" ${p.popular ? "checked" : ""}><span>Destacar como “Más popular” (solo uno)</span></label>
    </form>`);
    d.setFoot(`<button class="btn btn--ghost" type="button" data-close>Cancelar</button><div class="modal__foot-actions"><button class="btn btn--primary" type="button" data-apply>Aplicar</button></div>`);
    d.foot.querySelector("[data-apply]").addEventListener("click", () => {
      const f = d.body.querySelector("#planForm"); if (!UI.validate(f)) return;
      const fd = new FormData(f);
      Object.assign(p, { name: fd.get("name"), tag: fd.get("tag"), validity: fd.get("validity"), sessions: Math.max(1, +fd.get("sessions")), features: String(fd.get("features")).split("\n").map((s) => s.trim()).filter(Boolean) });
      if (fd.get("popular")) draft.plans.forEach((x, k) => (x.popular = k === i)); else p.popular = false;
      d.close(); markDirty(); render();
    });
  }
  function reviewDrawer(i) {
    const isNew = i < 0;
    const t = isNew ? { id: "t" + Date.now().toString(36), name: "", need: "alergia", rating: 5, source: "Google", published: true, date: H.fmt.iso(new Date()), text: "" } : draft.testimonials[i];
    const d = UI.modal({ title: isNew ? "Nuevo testimonio" : "Editar testimonio", drawer: true });
    d.setBody(`<form class="form" id="revForm" novalidate>
      <div class="alert">${icon("info")}<span>Usa solo opiniones reales y con permiso de la persona. Recomendado: nombre + inicial del apellido.</span></div>
      <div class="field"><label class="field__label" for="rv-name">Nombre</label><input class="input" id="rv-name" name="name" required value="${esc(t.name)}"><span class="field__error">Obligatorio.</span></div>
      <div class="form-row"><div class="field"><label class="field__label" for="rv-need">Necesidad</label><select class="select" id="rv-need" name="need">${Object.entries(draft.needs).map(([k, l]) => `<option value="${k}" ${k === t.need ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>
      <div class="field"><label class="field__label" for="rv-rating">Valoración</label><select class="select" id="rv-rating" name="rating">${[5, 4, 3, 2, 1].map((n) => `<option ${n === t.rating ? "selected" : ""}>${n}</option>`).join("")}</select></div></div>
      <div class="form-row"><div class="field"><label class="field__label" for="rv-src">Fuente</label><input class="input" id="rv-src" name="source" value="${esc(t.source)}"></div><div class="field"><label class="field__label" for="rv-date">Fecha</label><input class="input" id="rv-date" name="date" type="date" value="${esc(t.date)}"></div></div>
      <div class="field"><label class="field__label" for="rv-text">Texto</label><textarea class="textarea" id="rv-text" name="text" rows="5" required minlength="20">${esc(t.text)}</textarea><span class="field__error">Mínimo 20 caracteres.</span></div>
      <label class="check"><input type="checkbox" name="published" ${t.published ? "checked" : ""}><span>Publicar en la web</span></label>
    </form>`);
    d.setFoot(`<button class="btn btn--ghost" type="button" data-close>Cancelar</button><div class="modal__foot-actions"><button class="btn btn--primary" type="button" data-apply>${isNew ? "Añadir" : "Aplicar"}</button></div>`);
    UI.liveValidate(d.body.querySelector("#revForm"));
    d.foot.querySelector("[data-apply]").addEventListener("click", () => {
      const f = d.body.querySelector("#revForm"); if (!UI.validate(f)) return;
      const fd = new FormData(f);
      Object.assign(t, { name: fd.get("name"), need: fd.get("need"), rating: +fd.get("rating"), source: fd.get("source"), date: fd.get("date"), text: fd.get("text"), published: !!fd.get("published") });
      if (isNew) draft.testimonials.unshift(t);
      d.close(); markDirty(); render();
    });
  }
  function messageDrawer(id) {
    const list = H.Store.list("messages"); const m = list.find((x) => x.id === id); if (!m) return;
    m.read = true; H.Store.setList("messages", list); renderChrome();
    const isMail = UI.validators.email(m.contact);
    const d = UI.modal({ title: m.topic, drawer: true, onClose: () => current === "actividad" && render() });
    d.setBody(`<div class="stack" style="gap:16px"><div class="row"><span class="avatar">${esc(UI.initials(m.name))}</span><div><b class="t-strong" style="font-weight:500">${esc(m.name)}</b><p class="t-small t-muted">${esc(m.contact)} · ${new Date(m.createdAt).toLocaleString("es-ES")}</p></div></div><p style="white-space:pre-wrap;color:var(--text-strong)">${esc(m.message)}</p></div>`);
    d.setFoot(`<button class="btn btn--ghost" type="button" data-close>Cerrar</button><div class="modal__foot-actions"><a class="btn btn--primary" href="${isMail ? "mailto:" + esc(m.contact) : "https://wa.me/" + esc(m.contact.replace(/\D/g, ""))}" target="_blank" rel="noopener">Responder</a></div>`);
  }
  function confirmDialog(title, text, cta, onOk) {
    const d = UI.modal({ title, body: `<p class="t-muted">${esc(text)}</p>`, foot: `<button class="btn btn--ghost" type="button" data-close>Cancelar</button><div class="modal__foot-actions"><button class="btn btn--primary" type="button" data-ok style="--_bg:var(--danger);--_bd:var(--danger)">${esc(cta)}</button></div>` });
    d.foot.querySelector("[data-ok]").addEventListener("click", () => { d.close(); onOk(); });
  }
  function moreSheet() {
    const d = UI.modal({ title: "Más" });
    d.setBody(`<nav class="side__nav" style="gap:4px">${[["promociones", "megaphone", "Promociones"], ["testimonios", "quote", "Testimonios"], ["ajustes", "settings", "Ajustes"]].map(([v, ic, l]) => `<a href="#${v}" data-close style="height:48px">${icon(ic)}<span>${l}</span></a>`).join("")}
      <a href="index.htm" target="_blank" rel="noopener" style="height:48px">${icon("external")}<span>Ver la web</span></a><button type="button" data-logout data-close style="height:48px;display:flex;align-items:center;gap:12px;padding:0 12px;color:var(--text-muted)">${icon("logout")}<span>Cerrar sesión</span></button></nav>`);
  }

  /* ---------- Boot ---------- */
  UI.bindPress();
  window.addEventListener("storage", () => { saved = H.Store.get(); if (!dirty()) draft = clone(saved); if (!$("#shell").hidden) { renderChrome(); if (current === "actividad" || current === "resumen") render(); } });
  if (authed()) showApp(); else showLogin();
  // promo preview after render
  const obs = new MutationObserver(promoPreview); obs.observe(view, { childList: true });
})();
