/* =========================================================
   Halita · Conversion flows
   RF-01 Booking (3 steps) · RF-02 simulated payment · Gift card · Lead magnet
   ========================================================= */
(function () {
  const H = (window.Halita = window.Halita || {});
  const UI = H.UI;
  const { icon, esc } = UI;
  const F = (H.Flows = {});

  const stepsMarkup = (labels, current) => `
    <div class="flow__steps-desktop steps" aria-label="Progreso">
      ${labels.map((l, i) => `
        ${i ? '<span class="steps__sep" aria-hidden="true"></span>' : ""}
        <span class="steps__item ${i + 1 === current ? "is-active" : i + 1 < current ? "is-done" : ""}" ${i + 1 === current ? 'aria-current="step"' : ""}>
          <span class="steps__dot">${i + 1 < current ? icon("check", "icon--sm") : i + 1}</span>${l}
        </span>`).join("")}
    </div>
    <div class="flow__steps-mobile">
      <div class="row" style="justify-content:space-between"><span class="t-small t-muted">Paso ${current} de ${labels.length}</span><span class="t-small t-strong">${labels[current - 1]}</span></div>
      <div class="progress"><div class="progress__bar" style="width:${(current / labels.length) * 100}%"></div></div>
    </div>`;

  const cardFields = (prefix) => `
    <div class="card-fields">
      <div class="field"><label class="field__label" for="${prefix}-cn">Número de tarjeta</label><div class="field__control"><input class="input" id="${prefix}-cn" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" data-mask="card" data-validate="card" required></div><span class="field__error">Revisa el número de tarjeta.</span></div>
      <div class="form-row">
        <div class="field"><label class="field__label" for="${prefix}-ce">Caducidad</label><div class="field__control"><input class="input" id="${prefix}-ce" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" data-mask="expiry" data-validate="expiry" required></div><span class="field__error">Fecha no válida.</span></div>
        <div class="field"><label class="field__label" for="${prefix}-cv">CVC</label><div class="field__control"><input class="input" id="${prefix}-cv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" data-mask="cvc" data-validate="cvc" required></div><span class="field__error">3 o 4 dígitos.</span></div>
      </div>
      <p class="secure-note">${icon("lock", "icon--sm")}Pago simulado en esta fase. No se realiza ningún cargo. Prueba con 4242 4242 4242 4242.</p>
    </div>`;

  function swapStep(container, render) {
    const main = container.querySelector(".flow__main") || container;
    const dir = 1;
    return UI.animate(main, { opacity: 0, x: -12 * dir }, { duration: 0.16 }).then(() => {
      render();
      const m2 = container.querySelector(".flow__main") || container;
      m2.scrollTop = 0;
      UI.animate(m2, { opacity: [0, 1], x: [12 * dir, 0] }, { duration: 0.3 });
    });
  }

  /* =======================================================
     BOOKING
     ======================================================= */
  F.booking = function (preset = {}) {
    const C = H.Store.get();
    const s = {
      step: 1,
      typeId: preset.type || "adulto",
      people: 1,
      planId: preset.plan || "single",
      monthOffset: 0,
      date: null,
      time: null,
      form: {},
      pay: "card",
      code: "",
      codeApplied: null, // {kind:'promo'|'gift', value, label}
    };
    if (!C.plans.find((p) => p.id === s.planId)) s.planId = C.plans[0].id;

    const modal = UI.modal({ title: "Reservar sesión", size: "lg", className: "modal--flow", onClose: () => H.track && H.track("booking_close", { step: s.step }) });
    modal.body.innerHTML = `<div class="flow"><div class="flow__main"></div><aside class="flow__aside" aria-label="Resumen"></aside></div>`;
    const main = modal.body.querySelector(".flow__main");
    const aside = modal.body.querySelector(".flow__aside");
    UI.masks(modal.body);

    const type = () => C.sessionTypes.find((t) => t.id === s.typeId);
    function quote() {
      const q = H.price(C, s.planId, s.typeId, s.people);
      let extra = 0, label = "";
      if (s.codeApplied) {
        if (s.codeApplied.kind === "promo" && !q.promoApplied) { extra = Math.round(q.subtotal * (C.promo.discount / 100) * 100) / 100; label = `Código ${C.promo.code}`; }
        if (s.codeApplied.kind === "gift") { extra = Math.min(q.total, s.codeApplied.value); label = "Tarjeta regalo"; }
      }
      return { ...q, extra, extraLabel: label, final: Math.max(0, q.total - extra) };
    }

    /* ---------- Summary (aside + foot) ---------- */
    function renderSummary() {
      const q = quote();
      const t = type();
      aside.innerHTML = `
        <figure class="media summary__media" data-slot="how-session.jpg"><img src="assets/img/how-session.jpg" alt=""></figure>
        <div class="summary">
          <span class="summary__title">Tu reserva</span>
          <p class="t-h4" style="font-size:20px">${esc(q.plan.name)}</p>
          <dl>
            <div class="kv"><dt>Tipo</dt><dd>${esc(t.name)}</dd></div>
            <div class="kv"><dt>Personas</dt><dd>${t.flat ? "Hasta " + t.maxPeople : s.people}</dd></div>
            <div class="kv"><dt>Fecha</dt><dd>${s.date ? cap(H.fmt.date(s.date, { weekday: "short", day: "numeric", month: "short" })) : "—"}</dd></div>
            <div class="kv"><dt>Hora</dt><dd>${s.time || "—"}</dd></div>
            <div class="kv"><dt>Duración</dt><dd>${C.business.sessionMinutes} min</dd></div>
            ${q.plan.sessions > 1 ? `<div class="kv"><dt>Sesiones del bono</dt><dd>${q.plan.sessions}</dd></div>` : ""}
          </dl>
          ${q.discount ? `<div class="kv" style="color:var(--success)"><dt style="color:inherit">Promoción</dt><dd style="color:inherit">−${H.fmt.eur(q.discount)}</dd></div>` : ""}
          ${q.extra ? `<div class="kv" style="color:var(--success)"><dt style="color:inherit">${esc(q.extraLabel)}</dt><dd style="color:inherit">−${H.fmt.eur(q.extra)}</dd></div>` : ""}
          <div class="summary__total"><span>Total</span><strong class="t-num">${H.fmt.eur(q.final)}</strong></div>
        </div>
        <p class="secure-note">${icon("shield", "icon--sm")}Cambios gratis hasta 24 h antes.</p>`;
      UI.initMedia(aside);
      renderFoot(q);
    }
    function renderFoot(q) {
      q = q || quote();
      const t = type();
      const can = canNext();
      const nextLabel = s.step === 3 ? (s.pay === "card" ? `Pagar ${H.fmt.eur(q.final)}` : "Confirmar reserva") : "Siguiente";
      modal.setFoot(`
        <div class="foot-total"><strong>${H.fmt.eur(q.final)}</strong><span>${esc(q.plan.name)} · ${t.flat ? "sala privada" : s.people + (s.people > 1 ? " personas" : " persona")}</span></div>
        <div class="modal__foot-actions">
          ${s.step > 1 ? `<button class="btn btn--ghost" type="button" data-back>Atrás</button>` : ""}
          <button class="btn btn--primary" type="button" data-next ${can ? "" : 'aria-disabled="true"'}>${nextLabel}${s.step < 3 ? icon("arrow-right") : ""}</button>
        </div>`);
    }
    function canNext() {
      if (s.step === 1) return !!s.planId && !!s.typeId;
      if (s.step === 2) return !!s.date && !!s.time;
      return true;
    }

    /* ---------- Step 1 · Sesión ---------- */
    function step1() {
      const t = type();
      main.innerHTML = `
        ${stepsMarkup(["Sesión", "Fecha y hora", "Datos y pago"], 1)}
        <div class="flow__section">
          <span class="flow__label">Tipo de sesión</span>
          <div class="choices choices--3" role="radiogroup" aria-label="Tipo de sesión">
            ${C.sessionTypes.map((x) => `
              <button type="button" class="choice" role="radio" aria-checked="${x.id === s.typeId}" data-type="${x.id}">
                <span class="choice__title"><span class="row" style="gap:8px">${icon(x.icon)}${esc(x.name)}</span><span class="choice__tick"></span></span>
                <span class="choice__meta">${esc(x.desc)}</span>
              </button>`).join("")}
          </div>
        </div>
        <div class="flow__section">
          ${t.flat
            ? `<div class="flow__row"><div><span class="flow__label">Sala privada</span><span class="t-small t-muted">Precio cerrado para hasta ${t.maxPeople} personas</span></div>${icon("users")}</div>`
            : `<div class="flow__row"><div><span class="flow__label">${s.typeId === "infantil" ? "Niños" : "Personas"}</span><span class="t-small t-muted">${s.typeId === "infantil" ? "Un adulto acompañante entra gratis" : "Máximo " + t.maxPeople + " por reserva"}</span></div>
                <div class="qty"><button class="qty__btn" type="button" data-qty="-1" aria-label="Quitar persona" ${s.people <= 1 ? "disabled" : ""}>${icon("minus", "icon--sm")}</button><span class="qty__val" aria-live="polite">${s.people}</span><button class="qty__btn" type="button" data-qty="1" aria-label="Añadir persona" ${s.people >= t.maxPeople ? "disabled" : ""}>${icon("plus", "icon--sm")}</button></div></div>`}
        </div>
        <div class="flow__section">
          <span class="flow__label">Plan <small>Precio ${t.flat ? "por sala" : "por persona"}</small></span>
          <div class="choices" role="radiogroup" aria-label="Plan">
            ${C.plans.map((p) => {
              const q = H.price(C, p.id, s.typeId, 1);
              return `<button type="button" class="choice" role="radio" aria-checked="${p.id === s.planId}" data-plan="${p.id}">
                <span class="choice__title"><span class="row" style="gap:8px">${esc(p.name)} ${p.popular ? '<span class="badge badge--highlight">Más popular</span>' : ""}${q.promoApplied ? `<span class="badge badge--success">−${C.promo.discount}%</span>` : ""}</span>
                <span class="row" style="gap:10px"><span class="t-num t-strong">${H.fmt.eur(q.total)}</span><span class="choice__tick"></span></span></span>
                <span class="choice__meta">${p.sessions > 1 ? `${H.fmt.eur(q.perSession)} por sesión · validez ${esc(p.validity)}` : "Ideal para conocer la cueva"}</span>
              </button>`;
            }).join("")}
          </div>
        </div>`;
      renderSummary();
    }

    /* ---------- Step 2 · Fecha y hora ---------- */
    function step2() {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const base = new Date(today.getFullYear(), today.getMonth() + s.monthOffset, 1);
      const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      const lead = (base.getDay() + 6) % 7; // Monday first
      const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 60);
      let cells = "";
      for (let i = 0; i < lead; i++) cells += `<span></span>`;
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(base.getFullYear(), base.getMonth(), d);
        const hours = C.hours.find((h) => h.day === date.getDay());
        const avail = hours && !hours.closed && date >= today && date <= maxDate && H.availability(C, date, s.typeId).some((x) => !x.disabled);
        const sel = s.date && H.fmt.iso(s.date) === H.fmt.iso(date);
        cells += `<button type="button" class="cal__day ${H.fmt.iso(date) === H.fmt.iso(today) ? "is-today" : ""}" data-day="${H.fmt.iso(date)}" aria-pressed="${!!sel}" ${avail ? "" : "disabled"} aria-label="${cap(H.fmt.date(date))}${avail ? "" : ", sin disponibilidad"}">${d}</button>`;
      }
      let slotsHtml = `<div class="empty">${icon("calendar", "icon--lg")}<span>Elige un día para ver los horarios disponibles.</span></div>`;
      if (s.date) {
        const slots = H.availability(C, s.date, s.typeId);
        if (!slots.some((x) => !x.disabled)) {
          slotsHtml = `<div class="empty">${icon("clock", "icon--lg")}<span>No quedan horarios ese día.</span></div>`;
        } else {
          const groups = ["Mañana", "Tarde"].map((g) => {
            const list = slots.filter((x) => x.period === g);
            if (!list.length) return "";
            return `<div class="slots-group"><span class="slots-group__label">${icon(g === "Mañana" ? "sun" : "sunset", "icon--sm")}${g}</span>
              <div class="slots">${list.map((x) => `<button type="button" class="slot" data-time="${x.time}" aria-pressed="${s.time === x.time}" ${x.disabled ? "disabled" : ""}>${x.time}${!x.disabled && x.left <= 3 && s.typeId !== "privada" ? `<small>Quedan ${x.left}</small>` : ""}</button>`).join("")}</div></div>`;
          }).join("");
          slotsHtml = groups;
        }
      }
      main.innerHTML = `
        ${stepsMarkup(["Sesión", "Fecha y hora", "Datos y pago"], 2)}
        <div class="flow__section cal">
          <div class="cal__head">
            <span class="cal__month">${cap(H.fmt.date(base, { month: "long", year: "numeric" }))}</span>
            <div class="row" style="gap:4px">
              <button class="btn btn--icon btn--ghost btn--sm" type="button" data-month="-1" aria-label="Mes anterior" ${s.monthOffset <= 0 ? "disabled" : ""}>${icon("chevron-left")}</button>
              <button class="btn btn--icon btn--ghost btn--sm" type="button" data-month="1" aria-label="Mes siguiente" ${s.monthOffset >= 2 ? "disabled" : ""}>${icon("chevron-right")}</button>
            </div>
          </div>
          <div class="cal__grid">${["L", "M", "X", "J", "V", "S", "D"].map((d) => `<span class="cal__dow">${d}</span>`).join("")}${cells}</div>
        </div>
        <div class="flow__section">
          <span class="flow__label">Horario <small>${C.business.sessionMinutes} min · ${s.typeId === "infantil" ? "horarios infantiles" : s.typeId === "privada" ? "sala completa" : "grupos de " + C.business.capacity}</small></span>
          ${slotsHtml}
        </div>
        ${H.price(C, s.planId, s.typeId, 1).plan.sessions > 1 ? `<div class="alert">${icon("info")}<span>Esta es la primera sesión de tu bono. Las siguientes las reservas cuando quieras desde tu email de confirmación o por WhatsApp.</span></div>` : ""}`;
      renderSummary();
    }

    /* ---------- Step 3 · Datos y pago ---------- */
    function step3() {
      const f = s.form;
      main.innerHTML = `
        ${stepsMarkup(["Sesión", "Fecha y hora", "Datos y pago"], 3)}
        <form class="form" id="bkForm" novalidate>
          <div class="flow__section">
            <span class="flow__label">Tus datos</span>
            <div class="field"><label class="field__label" for="bk-name">Nombre y apellidos</label><div class="field__control"><input class="input" id="bk-name" name="name" autocomplete="name" required value="${esc(f.name || "")}"></div><span class="field__error">Escribe tu nombre.</span></div>
            <div class="form-row">
              <div class="field"><label class="field__label" for="bk-email">Email</label><div class="field__control"><input class="input" id="bk-email" name="email" type="email" autocomplete="email" required value="${esc(f.email || "")}"></div><span class="field__error">Email no válido.</span></div>
              <div class="field"><label class="field__label" for="bk-phone">Teléfono</label><div class="field__control"><input class="input" id="bk-phone" name="phone" type="tel" autocomplete="tel" required placeholder="+34" value="${esc(f.phone || "")}"></div><span class="field__error">Teléfono no válido.</span></div>
            </div>
            <div class="field"><label class="field__label" for="bk-notes">¿Algo que debamos saber? <span class="opt">Opcional</span></label><div class="field__control"><textarea class="textarea" id="bk-notes" name="notes" rows="2" placeholder="Edad de los niños, asma, embarazo…">${esc(f.notes || "")}</textarea></div></div>
            <label class="check"><input type="checkbox" name="health" required ${f.health ? "checked" : ""}><span>Confirmo que no tengo <button type="button" class="link" data-contra>contraindicaciones</button> o que lo he consultado con mi médico.</span></label>
            <div class="alert" data-contra-list hidden>${icon("info")}<span>${esc(C.faqs[0].a[0])}</span></div>
          </div>
          <div class="flow__section">
            <span class="flow__label">Pago</span>
            <div class="pay-methods" role="radiogroup" aria-label="Método de pago">
              <button type="button" class="choice" role="radio" aria-checked="${s.pay === "card"}" data-pay="card"><span class="choice__title"><span class="row" style="gap:8px">${icon("card")}Tarjeta</span><span class="choice__tick"></span></span><span class="choice__meta">Paga ahora y asegura tu plaza</span></button>
              <button type="button" class="choice" role="radio" aria-checked="${s.pay === "center"}" data-pay="center"><span class="choice__title"><span class="row" style="gap:8px">${icon("store")}En el centro</span><span class="choice__tick"></span></span><span class="choice__meta">Paga al llegar, en efectivo o tarjeta</span></button>
            </div>
            <div data-card ${s.pay === "card" ? "" : "hidden"}>${cardFields("bk")}</div>
            <div class="field">
              <label class="field__label" for="bk-code">Código promocional o de tarjeta regalo <span class="opt">Opcional</span></label>
              <div class="row" style="flex-wrap:nowrap"><div class="field__control" style="flex:1"><input class="input" id="bk-code" placeholder="Ej. ${esc(C.promo.code || "REGALO")}" value="${esc(s.code)}" style="text-transform:uppercase"></div><button type="button" class="btn btn--secondary" data-apply>Aplicar</button></div>
              <span class="field__help" data-code-msg>${s.codeApplied ? `${icon("check", "icon--sm")} ${esc(s.codeApplied.label)} aplicado` : ""}</span>
            </div>
            <label class="check"><input type="checkbox" name="terms" required ${f.terms ? "checked" : ""}><span>Acepto las <a href="#" data-action="legal" data-doc="condiciones">condiciones de reserva</a> y la <a href="#" data-action="legal" data-doc="privacidad">política de privacidad</a>.</span></label>
          </div>
        </form>`;
      const form = main.querySelector("#bkForm");
      UI.liveValidate(form);
      form.addEventListener("input", () => { const fd = new FormData(form); ["name", "email", "phone", "notes"].forEach((k) => (s.form[k] = fd.get(k))); });
      form.addEventListener("change", (e) => { if (e.target.name === "health" || e.target.name === "terms") s.form[e.target.name] = e.target.checked; });
      form.addEventListener("submit", (e) => { e.preventDefault(); next(); });
      renderSummary();
    }

    function applyCode() {
      const input = main.querySelector("#bk-code");
      const msg = main.querySelector("[data-code-msg]");
      const v = (input.value || "").trim().toUpperCase();
      s.code = v;
      if (!v) { s.codeApplied = null; msg.textContent = ""; renderSummary(); return; }
      if (C.promo.active && v === String(C.promo.code).toUpperCase()) {
        s.codeApplied = { kind: "promo", value: C.promo.discount, label: `Código ${C.promo.code} (−${C.promo.discount} %)` };
      } else {
        const g = H.Store.list("gifts").find((x) => x.code === v && !x.redeemed);
        if (g) s.codeApplied = { kind: "gift", value: g.value, label: `Tarjeta regalo de ${H.fmt.eur(g.value)}`, id: g.id };
        else s.codeApplied = null;
      }
      const field = input.closest(".field");
      field.classList.toggle("is-invalid", !s.codeApplied);
      msg.innerHTML = s.codeApplied ? `${icon("check", "icon--sm")} ${esc(s.codeApplied.label)} aplicado` : `<span style="color:var(--danger)">Código no válido o caducado.</span>`;
      if (s.codeApplied) UI.toast("Código aplicado");
      renderSummary();
    }

    /* ---------- Done ---------- */
    function done(booking) {
      const t = type();
      modal.setTitle("Reserva confirmada");
      modal.body.innerHTML = `
        <div class="done" style="padding:var(--sp-6)">
          <div class="done__icon">${icon("check")}</div>
          <div class="stack" style="gap:8px;justify-items:center"><h3 class="t-h3">¡Te esperamos!</h3><p class="t-muted" style="max-width:420px">Hemos enviado la confirmación a <b class="t-strong">${esc(booking.email)}</b>. Llega 10 minutos antes con ropa cómoda.</p></div>
          <div class="done__ticket">
            <div class="row" style="justify-content:space-between"><span class="summary__title">Código</span><span class="code t-strong">${booking.id}</span></div>
            <hr class="hr" style="margin:12px 0">
            <dl>
              <div class="kv"><dt>Fecha</dt><dd>${cap(H.fmt.date(new Date(booking.date + "T12:00")))}</dd></div>
              <div class="kv"><dt>Hora</dt><dd>${booking.time} · ${C.business.sessionMinutes} min</dd></div>
              <div class="kv"><dt>Sesión</dt><dd>${esc(t.name)} · ${t.flat ? "sala privada" : booking.people + " pers."}</dd></div>
              <div class="kv"><dt>Plan</dt><dd>${esc(booking.planName)}</dd></div>
              <div class="kv"><dt>Total</dt><dd>${H.fmt.eur(booking.total)} · ${booking.pay === "card" ? "Pagado" : "Pago en el centro"}</dd></div>
            </dl>
          </div>
          <div class="done__actions">
            <button class="btn btn--primary" type="button" data-ics>${icon("calendar")}Añadir al calendario</button>
            <button class="btn btn--secondary" type="button" data-share>${icon("whatsapp")}Compartir</button>
            <button class="btn btn--ghost" type="button" data-close>Cerrar</button>
          </div>
        </div>`;
      modal.setFoot("");
      UI.animate(modal.body.querySelector(".done__icon"), { scale: [0.6, 1], opacity: [0, 1] }, { type: "spring", stiffness: 380, damping: 18 });
      modal.body.querySelector("[data-ics]").addEventListener("click", () => {
        const [y, m, d] = booking.date.split("-");
        const [hh, mm] = booking.time.split(":");
        const start = `${y}${m}${d}T${hh}${mm}00`;
        const endD = new Date(+y, +m - 1, +d, +hh, +mm + C.business.sessionMinutes);
        const end = `${endD.getFullYear()}${String(endD.getMonth() + 1).padStart(2, "0")}${String(endD.getDate()).padStart(2, "0")}T${String(endD.getHours()).padStart(2, "0")}${String(endD.getMinutes()).padStart(2, "0")}00`;
        const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Halita//Reservas//ES", "BEGIN:VEVENT", `UID:${booking.id}@halita`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`, `DTSTART:${start}`, `DTEND:${end}`,
          `SUMMARY:Sesión de haloterapia · ${C.business.name}`, `LOCATION:${C.business.address}\\, ${C.business.city}`, `DESCRIPTION:Código ${booking.id}. Llega 10 min antes con ropa cómoda.`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
        UI.download(`reserva-${booking.id}.ics`, ics, "text/calendar");
      });
      modal.body.querySelector("[data-share]").addEventListener("click", () => {
        const msg = `He reservado una sesión de haloterapia en ${C.business.name} el ${H.fmt.date(new Date(booking.date + "T12:00"))} a las ${booking.time}. ¿Te vienes?`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      });
    }

    /* ---------- Navigation ---------- */
    function render() { [null, step1, step2, step3][s.step](); }
    function next() {
      if (!canNext()) {
        UI.toast(s.step === 2 ? (s.date ? "Elige una hora" : "Elige un día") : "Completa este paso", "info");
        return;
      }
      if (s.step < 3) { s.step++; swapStep(modal.body, render); return; }
      const form = main.querySelector("#bkForm");
      if (!UI.validate(form)) { UI.toast("Revisa los campos marcados", "info"); return; }
      const btn = modal.foot.querySelector("[data-next]");
      btn.setAttribute("aria-busy", "true");
      const q = quote();
      setTimeout(() => {
        const t = type();
        const booking = H.Store.push("bookings", {
          id: H.uid("HL"), createdAt: new Date().toISOString(), status: "confirmada",
          date: H.fmt.iso(s.date), time: s.time, typeId: s.typeId, flat: !!t.flat, people: t.flat ? t.maxPeople : s.people,
          planId: s.planId, planName: q.plan.name, total: q.final, pay: s.pay, paid: s.pay === "card",
          name: s.form.name, email: s.form.email, phone: s.form.phone, notes: s.form.notes || "", code: s.codeApplied ? s.code : "",
        });
        if (s.codeApplied && s.codeApplied.kind === "gift") {
          const gifts = H.Store.list("gifts").map((g) => (g.id === s.codeApplied.id ? { ...g, redeemed: true } : g));
          H.Store.setList("gifts", gifts);
        }
        H.track && H.track("booking_confirmed", { plan: s.planId, type: s.typeId, total: q.final });
        swapStep(modal.body, () => done(booking));
      }, 1200);
    }

    modal.el.addEventListener("click", (e) => {
      const el = e.target;
      const choice = el.closest("[data-type]");
      if (choice && main.contains(choice)) {
        s.typeId = choice.dataset.type;
        const t = type(); s.people = Math.min(s.people, t.maxPeople); s.time = null;
        step1(); return;
      }
      const plan = el.closest("[data-plan]");
      if (plan && main.contains(plan)) { s.planId = plan.dataset.plan; step1(); return; }
      const qty = el.closest("[data-qty]");
      if (qty) { const t = type(); s.people = Math.max(1, Math.min(t.maxPeople, s.people + +qty.dataset.qty)); step1(); return; }
      const mo = el.closest("[data-month]");
      if (mo) { s.monthOffset += +mo.dataset.month; step2(); return; }
      const day = el.closest("[data-day]");
      if (day) { s.date = new Date(day.dataset.day + "T00:00:00"); s.time = null; step2(); const sl = main.querySelector(".slots"); sl && sl.scrollIntoView({ block: "nearest", behavior: "smooth" }); return; }
      const slot = el.closest("[data-time]");
      if (slot) { s.time = slot.dataset.time; UI.$$(".slot", main).forEach((b) => b.setAttribute("aria-pressed", b === slot)); renderSummary(); return; }
      const pay = el.closest("[data-pay]");
      if (pay) { s.pay = pay.dataset.pay; UI.$$("[data-pay]", main).forEach((b) => b.setAttribute("aria-checked", b === pay)); const c = main.querySelector("[data-card]"); c.hidden = s.pay !== "card"; if (!c.hidden) UI.animate(c, { opacity: [0, 1], y: [-6, 0] }); renderFoot(); return; }
      if (el.closest("[data-apply]")) { applyCode(); return; }
      if (el.closest("[data-contra]")) { const l = main.querySelector("[data-contra-list]"); l.hidden = !l.hidden; return; }
      if (el.closest("[data-next]")) { next(); return; }
      if (el.closest("[data-back]")) { s.step--; swapStep(modal.body, render); return; }
    });

    // If preset plan is the promo plan, nudge
    render();
    H.track && H.track("booking_open", preset);
    return modal;
  };

  /* =======================================================
     GIFT CARD
     ======================================================= */
  F.gift = function () {
    const C = H.Store.get();
    const s = { step: 1, mode: "amount", amount: 50, custom: "", planId: "bono5", design: "sand", to: "", toEmail: "", from: "", msg: "", when: "now", date: "", buyer: "" };
    const modal = UI.modal({ title: "Tarjeta regalo", size: "lg", className: "modal--flow" });
    modal.body.innerHTML = `<div class="flow"><div class="flow__main"></div><aside class="flow__aside" aria-label="Vista previa"></aside></div>`;
    const main = modal.body.querySelector(".flow__main");
    const aside = modal.body.querySelector(".flow__aside");
    UI.masks(modal.body);

    const value = () => (s.mode === "amount" ? (s.custom ? +s.custom : s.amount) : H.price(C, s.planId, "adulto", 1).total);
    const valueLabel = () => (s.mode === "amount" ? H.fmt.eur(value() || 0) : C.plans.find((p) => p.id === s.planId).name);
    const cardHtml = (big) => `
      <div class="giftcard is-static giftcard--${s.design === "navy" ? "navy" : s.design === "ink" ? "ink" : "sand"}" style="${big ? "max-width:420px" : ""}${s.design === "navy" ? ";border:1px solid var(--border-hairline)" : ""}">
        <span class="giftcard__brand">${icon("logo")}${esc(C.business.name)}</span>
        <span class="giftcard__msg">${s.to ? "Para " + esc(s.to) : ""}${s.msg ? " · “" + esc(s.msg.slice(0, 60)) + (s.msg.length > 60 ? "…" : "") + "”" : ""}</span>
        <span class="giftcard__amount t-num">${esc(valueLabel())}</span>
        <span class="giftcard__label code">Tarjeta regalo${s.from ? " · de " + esc(s.from) : ""}</span>
      </div>`;
    function renderAside() {
      aside.innerHTML = `<span class="summary__title">Vista previa</span>${cardHtml()}<div class="summary"><div class="kv"><dt>Validez</dt><dd>12 meses</dd></div><div class="kv"><dt>Entrega</dt><dd>${s.when === "now" ? "Inmediata por email" : s.date ? cap(H.fmt.date(new Date(s.date + "T09:00"), { day: "numeric", month: "long" })) : "Programada"}</dd></div><div class="summary__total"><span>Total</span><strong class="t-num">${H.fmt.eur(value() || 0)}</strong></div></div>`;
      const ok = canNext();
      modal.setFoot(`<div class="foot-total"><strong>${H.fmt.eur(value() || 0)}</strong><span>Tarjeta regalo digital</span></div>
        <div class="modal__foot-actions">${s.step > 1 ? '<button class="btn btn--ghost" type="button" data-back>Atrás</button>' : ""}<button class="btn btn--primary" type="button" data-next ${ok ? "" : 'aria-disabled="true"'}>${s.step === 3 ? "Pagar " + H.fmt.eur(value() || 0) : "Siguiente"}${s.step < 3 ? icon("arrow-right") : ""}</button></div>`);
    }
    function canNext() { if (s.step === 1) return value() >= 20; return true; }

    function step1() {
      main.innerHTML = `${stepsMarkup(["Importe", "Personaliza", "Pago"], 1)}
        <div class="subtabs" role="tablist" aria-label="Tipo de regalo">
          <button class="subtab" role="tab" aria-selected="${s.mode === "amount"}" data-mode="amount">Importe libre</button>
          <button class="subtab" role="tab" aria-selected="${s.mode === "plan"}" data-mode="plan">Regalar un bono</button>
        </div>
        ${s.mode === "amount" ? `
          <div class="flow__section">
            <span class="flow__label">Elige un importe</span>
            <div class="amounts" role="radiogroup" aria-label="Importe">${[30, 50, 80, 120].map((a) => `<button type="button" class="amount" role="radio" aria-checked="${!s.custom && s.amount === a}" data-amount="${a}">${a} €</button>`).join("")}</div>
            <div class="field"><label class="field__label" for="gf-custom">Otro importe <span class="opt">Mín. 20 €</span></label><div class="field__control"><input class="input" id="gf-custom" inputmode="numeric" placeholder="Ej. 65" value="${esc(s.custom)}"></div></div>
          </div>` : `
          <div class="flow__section">
            <span class="flow__label">Elige un bono <small>Precio adulto</small></span>
            <div class="choices" role="radiogroup" aria-label="Bono">${C.plans.map((p) => `<button type="button" class="choice" role="radio" aria-checked="${s.planId === p.id}" data-gplan="${p.id}"><span class="choice__title">${esc(p.name)}<span class="row" style="gap:10px"><span class="t-num">${H.fmt.eur(H.price(C, p.id, "adulto", 1).total)}</span><span class="choice__tick"></span></span></span><span class="choice__meta">${p.sessions} ${p.sessions > 1 ? "sesiones" : "sesión"} de ${C.business.sessionMinutes} min</span></button>`).join("")}</div>
          </div>`}`;
      renderAside();
    }
    function step2() {
      main.innerHTML = `${stepsMarkup(["Importe", "Personaliza", "Pago"], 2)}
        <div class="flow__section">
          <span class="flow__label">Diseño</span>
          <div class="designs" role="radiogroup" aria-label="Diseño" style="grid-template-columns:repeat(3,1fr)">
            ${[["sand", "Arena"], ["navy", "Blanco"], ["ink", "Noche"]].map(([k, l]) => `<button type="button" class="design-opt" role="radio" aria-checked="${s.design === k}" data-design="${k}"><span class="design-opt__swatch design-opt__swatch--${k}"></span><span>${l}</span></button>`).join("")}
          </div>
        </div>
        <form class="form" id="gfForm" novalidate>
          <div class="form-row">
            <div class="field"><label class="field__label" for="gf-to">Para</label><div class="field__control"><input class="input" id="gf-to" name="to" required value="${esc(s.to)}" placeholder="Nombre"></div><span class="field__error">¿A quién se lo regalas?</span></div>
            <div class="field"><label class="field__label" for="gf-from">De</label><div class="field__control"><input class="input" id="gf-from" name="from" required value="${esc(s.from)}" placeholder="Tu nombre"></div><span class="field__error">Escribe tu nombre.</span></div>
          </div>
          <div class="field"><label class="field__label" for="gf-email">Email de quien la recibe</label><div class="field__control"><input class="input" id="gf-email" name="toEmail" type="email" required value="${esc(s.toEmail)}"></div><span class="field__error">Email no válido.</span></div>
          <div class="field"><label class="field__label" for="gf-msg">Mensaje <span class="opt" data-count>${s.msg.length}/160</span></label><div class="field__control"><textarea class="textarea" id="gf-msg" name="msg" maxlength="160" rows="3" placeholder="Para que respires hondo un rato…">${esc(s.msg)}</textarea></div></div>
          <div class="flow__section">
            <span class="flow__label">Entrega</span>
            <div class="pay-methods" role="radiogroup" aria-label="Entrega">
              <button type="button" class="choice" role="radio" aria-checked="${s.when === "now"}" data-when="now"><span class="choice__title">Ahora<span class="choice__tick"></span></span><span class="choice__meta">Se envía al pagar</span></button>
              <button type="button" class="choice" role="radio" aria-checked="${s.when === "date"}" data-when="date"><span class="choice__title">Programar<span class="choice__tick"></span></span><span class="choice__meta">Elige el día</span></button>
            </div>
            <div class="field" data-when-date ${s.when === "date" ? "" : "hidden"}><label class="field__label" for="gf-date">Fecha de envío</label><div class="field__control"><input class="input" type="date" id="gf-date" name="date" min="${H.fmt.iso(new Date())}" value="${esc(s.date)}" ${s.when === "date" ? "required" : ""}></div><span class="field__error">Elige una fecha.</span></div>
          </div>
        </form>`;
      const form = main.querySelector("#gfForm");
      UI.liveValidate(form);
      form.addEventListener("input", (e) => {
        const t = e.target; if (t.name) s[t.name] = t.value;
        if (t.name === "msg") main.querySelector("[data-count]").textContent = `${t.value.length}/160`;
        renderAside();
      });
      renderAside();
    }
    function step3() {
      main.innerHTML = `${stepsMarkup(["Importe", "Personaliza", "Pago"], 3)}
        <div class="flow__steps-mobile" style="justify-items:center">${cardHtml()}</div>
        <form class="form" id="gpForm" novalidate>
          <div class="field"><label class="field__label" for="gp-buyer">Tu email (recibo)</label><div class="field__control"><input class="input" id="gp-buyer" type="email" name="buyer" required value="${esc(s.buyer)}"></div><span class="field__error">Email no válido.</span></div>
          ${cardFields("gp")}
          <label class="check"><input type="checkbox" required><span>Acepto las <a href="#" data-action="legal" data-doc="condiciones">condiciones</a>. La tarjeta es válida 12 meses y no es reembolsable.</span></label>
        </form>`;
      const form = main.querySelector("#gpForm");
      UI.liveValidate(form);
      form.addEventListener("input", (e) => { if (e.target.name === "buyer") s.buyer = e.target.value; });
      renderAside();
    }
    function done(g) {
      modal.setTitle("Tarjeta regalo lista");
      modal.body.innerHTML = `<div class="done" style="padding:var(--sp-6)">
        <div class="done__icon">${icon("gift")}</div>
        <div class="stack" style="gap:8px;justify-items:center"><h3 class="t-h3">¡Regalo enviado!</h3><p class="t-muted" style="max-width:440px">${g.when === "now" ? `${esc(g.to)} la recibirá ahora en <b class="t-strong">${esc(g.toEmail)}</b>.` : `Se enviará a ${esc(g.toEmail)} el ${H.fmt.date(new Date(g.date + "T09:00"), { day: "numeric", month: "long" })}.`} Te mandamos el recibo a ${esc(g.buyer)}.</p></div>
        ${cardHtml(true)}
        <div class="done__ticket" style="text-align:center"><span class="summary__title">Código de canje</span><p class="code t-h4" style="margin-top:6px">${g.code}</p></div>
        <div class="done__actions"><button class="btn btn--primary" type="button" data-copy>${icon("tag")}Copiar código</button><button class="btn btn--secondary" type="button" data-dl>${icon("download")}Descargar tarjeta</button><button class="btn btn--ghost" type="button" data-close>Cerrar</button></div>
      </div>`;
      modal.setFoot("");
      modal.body.querySelector("[data-copy]").addEventListener("click", () => UI.copy(g.code));
      modal.body.querySelector("[data-dl]").addEventListener("click", () => {
        const bg = s.design === "ink" ? "#3A2419" : s.design === "navy" ? "#FFFFFF" : "url(#g)";
        const fg = s.design === "navy" ? "#2A1A12" : "#FFFFFF";
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="625" viewBox="0 0 1000 625"><defs><radialGradient id="g" cx="30%" cy="20%" r="120%"><stop offset="0" stop-color="#F6C9A0"/><stop offset=".38" stop-color="#E59A6B"/><stop offset=".7" stop-color="#A9583A"/><stop offset="1" stop-color="#4A2318"/></radialGradient></defs><rect width="1000" height="625" rx="56" fill="${bg}" stroke="#0000001a"/><text x="64" y="110" font-family="Golos Text, Arial" font-size="44" fill="${fg}">${esc(C.business.name)}</text><text x="64" y="300" font-family="Golos Text, Arial" font-size="30" fill="${fg}" opacity=".85">${esc(g.to ? "Para " + g.to : "")}</text><text x="64" y="345" font-family="Golos Text, Arial" font-size="24" fill="${fg}" opacity=".75">${esc(g.msg.slice(0, 70))}</text><text x="64" y="500" font-family="Golos Text, Arial" font-size="96" fill="${fg}" letter-spacing="-4">${esc(g.label)}</text><text x="64" y="570" font-family="monospace" font-size="24" fill="${fg}" opacity=".75">TARJETA REGALO · ${g.code}</text></svg>`;
        UI.download(`tarjeta-regalo-${g.code}.svg`, svg, "image/svg+xml");
      });
    }
    function render() { [null, step1, step2, step3][s.step](); }
    function next() {
      if (s.step === 1) { if (!canNext()) { UI.toast("El importe mínimo es 20 €", "info"); return; } }
      if (s.step === 2) { const f = main.querySelector("#gfForm"); if (!UI.validate(f)) return; }
      if (s.step < 3) { s.step++; swapStep(modal.body, render); return; }
      const f = main.querySelector("#gpForm"); if (!UI.validate(f)) return;
      const btn = modal.foot.querySelector("[data-next]"); btn.setAttribute("aria-busy", "true");
      setTimeout(() => {
        const g = H.Store.push("gifts", { id: H.uid("GF"), code: "REGALO-" + Math.random().toString(36).slice(2, 7).toUpperCase(), createdAt: new Date().toISOString(), value: value(), label: valueLabel(), mode: s.mode, planId: s.mode === "plan" ? s.planId : null, design: s.design, to: s.to, toEmail: s.toEmail, from: s.from, msg: s.msg, when: s.when, date: s.date, buyer: s.buyer, redeemed: false });
        H.track && H.track("gift_purchased", { value: g.value });
        swapStep(modal.body, () => done(g));
      }, 1200);
    }
    modal.el.addEventListener("click", (e) => {
      const el = e.target;
      const m = el.closest("[data-mode]"); if (m) { s.mode = m.dataset.mode; step1(); return; }
      const a = el.closest("[data-amount]"); if (a) { s.amount = +a.dataset.amount; s.custom = ""; step1(); return; }
      const p = el.closest("[data-gplan]"); if (p) { s.planId = p.dataset.gplan; step1(); return; }
      const d = el.closest("[data-design]"); if (d) { s.design = d.dataset.design; UI.$$("[data-design]", main).forEach((b) => b.setAttribute("aria-checked", b === d)); renderAside(); return; }
      const w = el.closest("[data-when]"); if (w) { s.when = w.dataset.when; UI.$$("[data-when]", main).forEach((b) => b.setAttribute("aria-checked", b === w)); const df = main.querySelector("[data-when-date]"); df.hidden = s.when !== "date"; df.querySelector("input").required = s.when === "date"; renderAside(); return; }
      if (el.closest("[data-next]")) { next(); return; }
      if (el.closest("[data-back]")) { s.step--; swapStep(modal.body, render); }
    });
    modal.el.addEventListener("input", (e) => { if (e.target.id === "gf-custom") { s.custom = e.target.value.replace(/\D/g, ""); e.target.value = s.custom; UI.$$("[data-amount]", main).forEach((b) => b.setAttribute("aria-checked", !s.custom && +b.dataset.amount === s.amount)); renderAside(); } });
    render();
    return modal;
  };

  /* =======================================================
     LEAD MAGNET (guía)
     ======================================================= */
  F.lead = function () {
    const modal = UI.modal({ title: "Guía de bienestar respiratorio" });
    modal.setBody(`
      <div class="stack" style="gap:20px">
        <div class="row" style="gap:14px;flex-wrap:nowrap"><div class="lead-card__icon">${icon("book", "icon--lg")}</div><p class="t-small t-muted">7 ejercicios sencillos de respiración, consejos para tu primera sesión y una pauta semanal por objetivo. Es gratis.</p></div>
        <form class="form" id="leadForm" novalidate>
          <div class="field"><label class="field__label" for="ld-name">Nombre</label><div class="field__control"><input class="input" id="ld-name" name="name" required autocomplete="given-name"></div><span class="field__error">Escribe tu nombre.</span></div>
          <div class="field"><label class="field__label" for="ld-email">Email</label><div class="field__control"><input class="input" id="ld-email" name="email" type="email" required autocomplete="email"></div><span class="field__error">Email no válido.</span></div>
          <div class="field"><label class="field__label" for="ld-goal">¿Qué te interesa más?</label><div class="field__control"><select class="select" id="ld-goal" name="goal"><option value="respiratorio">Respirar mejor (alergias, sinusitis…)</option><option value="piel">Cuidar mi piel</option><option value="estres">Estrés y descanso</option><option value="familia">Salud de mis hijos</option></select></div></div>
          <label class="check"><input type="checkbox" name="consent" required><span>Quiero recibir la guía y consejos ocasionales. Acepto la <a href="#" data-action="legal" data-doc="privacidad">privacidad</a>.</span></label>
        </form>
      </div>`);
    modal.setFoot(`<button class="btn btn--primary btn--block" type="button" data-submit>${icon("download")}Recibir la guía</button>`);
    const form = modal.body.querySelector("#leadForm");
    UI.liveValidate(form);
    const submit = () => {
      if (!UI.validate(form)) return;
      const fd = new FormData(form);
      const btn = modal.foot.querySelector("[data-submit]"); btn.setAttribute("aria-busy", "true");
      setTimeout(() => {
        H.Store.push("leads", { id: H.uid("LD"), createdAt: new Date().toISOString(), name: fd.get("name"), email: fd.get("email"), goal: fd.get("goal") });
        H.track && H.track("lead_captured", { goal: fd.get("goal") });
        modal.setTitle("¡Guía lista!");
        modal.setBody(`<div class="done"><div class="done__icon">${icon("check")}</div><h3 class="t-h3">Ya es tuya, ${esc(fd.get("name"))}</h3><p class="t-muted">También te la hemos enviado a ${esc(fd.get("email"))}.</p></div>`);
        modal.setFoot(`<a class="btn btn--secondary" href="guia-bienestar-respiratorio.html" target="_blank" rel="noopener">${icon("download")}Abrir la guía</a><div class="modal__foot-actions"><button class="btn btn--primary" type="button" data-book>Reservar primera sesión</button></div>`);
        modal.foot.querySelector("[data-book]").addEventListener("click", () => { modal.close(); setTimeout(() => F.booking({ plan: "single" }), 320); });
      }, 900);
    };
    modal.foot.addEventListener("click", (e) => { if (e.target.closest("[data-submit]")) submit(); });
    form.addEventListener("submit", (e) => { e.preventDefault(); submit(); });
    return modal;
  };

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  H.cap = cap;
})();
