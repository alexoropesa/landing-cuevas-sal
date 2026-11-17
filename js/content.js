/* =========================================================
   Halita · Content model + local store (shared by site & admin)
   All business data here is SAMPLE DATA (meta.demo = true).
   Replace via admin.htm before publishing.
   ========================================================= */
(function () {
  const H = (window.Halita = window.Halita || {});
  const KEY = "halita.content.v1";
  const LIST_KEYS = { bookings: "halita.bookings", leads: "halita.leads", messages: "halita.messages", gifts: "halita.gifts" };

  const DEFAULTS = {
    meta: { demo: true, updatedAt: null },
    business: {
      name: "Halita",
      descriptor: "Cueva de Sal · Haloterapia",
      phone: "+34 600 000 000",
      whatsapp: "34600000000",
      email: "hola@halita.example",
      address: "Calle de la Sal 12, local",
      city: "28004 Madrid",
      lat: 40.4237,
      lng: -3.7038,
      capacity: 8,
      sessionMinutes: 45,
    },
    proof: { rating: 4.9, reviews: 312, source: "Google", sessions: 12000 },
    promo: { active: true, text: "Otoño respira: −15 % en el Bono 5 sesiones", code: "OTONO15", until: "2026-11-30", planId: "bono5", discount: 15 },
    sessionTypes: [
      { id: "adulto", name: "Adulto", desc: "Sesión grupal en sala principal · desde 13 años", maxPeople: 6, icon: "user" },
      { id: "infantil", name: "Infantil", desc: "3 a 12 años con un adulto acompañante gratis", maxPeople: 4, icon: "smile" },
      { id: "privada", name: "Privada", desc: "Sala en exclusiva hasta 4 personas", maxPeople: 4, icon: "lock", flat: true },
    ],
    plans: [
      { id: "single", name: "Sesión individual", tag: "Prueba", sessions: 1, validity: "—", prices: { adulto: 25, infantil: 18, privada: 80 },
        features: ["1 sesión de 45 min", "Calcetines y manta incluidos", "Valoración inicial con nuestro equipo"], popular: false },
      { id: "bono5", name: "Bono 5 sesiones", tag: "Más popular", sessions: 5, validity: "3 meses", prices: { adulto: 105, infantil: 75, privada: 340 },
        features: ["5 sesiones de 45 min", "Compartible con 1 persona", "Reserva prioritaria", "Guía de respiración en casa"], popular: true },
      { id: "bono10", name: "Bono 10 sesiones", tag: "Tratamiento completo", sessions: 10, validity: "6 meses", prices: { adulto: 190, infantil: 140, privada: 620 },
        features: ["10 sesiones de 45 min", "Compartible con toda la familia", "Reserva prioritaria", "Seguimiento a mitad de tratamiento", "Guía de respiración en casa"], popular: false },
    ],
    compare: [
      { label: "Precio por sesión", type: "perSession" },
      { label: "Validez", type: "validity" },
      { label: "Compartible", values: { single: "—", bono5: "1 persona", bono10: "Familia" } },
      { label: "Reserva prioritaria", values: { single: false, bono5: true, bono10: true } },
      { label: "Guía de respiración en casa", values: { single: false, bono5: true, bono10: true } },
      { label: "Seguimiento de tratamiento", values: { single: false, bono5: false, bono10: true } },
      { label: "Cambio de cita sin coste (24 h)", values: { single: true, bono5: true, bono10: true } },
    ],
    hours: [
      { day: 1, label: "Lunes", open: "10:00", close: "21:00", closed: false },
      { day: 2, label: "Martes", open: "10:00", close: "21:00", closed: false },
      { day: 3, label: "Miércoles", open: "10:00", close: "21:00", closed: false },
      { day: 4, label: "Jueves", open: "10:00", close: "21:00", closed: false },
      { day: 5, label: "Viernes", open: "10:00", close: "21:00", closed: false },
      { day: 6, label: "Sábado", open: "10:00", close: "14:00", closed: false },
      { day: 0, label: "Domingo", open: "10:00", close: "14:00", closed: true },
    ],
    kidsSlots: ["17:00", "18:00", "11:00"], // infantil only at these start times (+ Saturday mornings)
    testimonials: [
      { id: "t1", name: "Lucía M.", need: "alergia", rating: 5, source: "Google", published: true, date: "2026-05-12",
        text: "Llevo años con rinitis en primavera. Hice el bono de 10 en abril y he notado la nariz mucho más despejada. El ambiente es precioso y muy limpio." },
      { id: "t2", name: "Javier R.", need: "insomnio", rating: 5, source: "Google", published: true, date: "2026-03-02",
        text: "Fui por curiosidad y salí con una calma que no sentía hace meses. Esa noche dormí del tirón. Ahora voy una vez por semana." },
      { id: "t3", name: "Marta G.", need: "estres", rating: 5, source: "Google", published: true, date: "2026-09-18",
        text: "45 minutos sin móvil, luz cálida y silencio. Es mi pausa del mes. El equipo te explica todo con mucha paciencia." },
      { id: "t4", name: "Ana y Pablo", need: "ninos", rating: 5, source: "Google", published: true, date: "2026-10-04",
        text: "Nuestra hija de 5 años lo vive como un parque de arena. Hemos notado menos mocos este otoño, y ella pide volver." },
      { id: "t5", name: "Sergio L.", need: "piel", rating: 4, source: "Google", published: true, date: "2026-07-21",
        text: "Tengo psoriasis leve en los codos. Tras varias sesiones la piel está menos irritada. Lo combino con el tratamiento de mi dermatóloga." },
      { id: "t6", name: "Carmen V.", need: "alergia", rating: 5, source: "Google", published: true, date: "2026-06-09",
        text: "Soy asmática y fui con el visto bueno de mi neumóloga. Me resulta muy agradable respirar allí dentro, y salgo con sensación de ligereza." },
    ],
    needs: { alergia: "Alergia estacional", insomnio: "Insomnio", estres: "Estrés", piel: "Piel", ninos: "Niños" },
    faqs: [
      { cat: "salud", q: "¿Tiene contraindicaciones la haloterapia?", a: ["No se recomienda en fiebre, infecciones agudas, tuberculosis activa, hipertensión no controlada, insuficiencia cardiaca o renal grave, cáncer en tratamiento activo ni en crisis asmática aguda.", "Si estás embarazada o tienes una patología crónica, consúltalo con tu médico antes de reservar. La haloterapia es una terapia complementaria y no sustituye ningún tratamiento médico."] },
      { cat: "salud", q: "¿Para qué afecciones se suele utilizar?", a: ["Las personas la utilizan como complemento en molestias respiratorias leves (rinitis, sinusitis, alergias estacionales) y en pieles reactivas (eccemas, psoriasis leve), y también para relajarse y descansar mejor."] },
      { cat: "higiene", q: "¿Cómo se mantiene la higiene de la cueva?", a: ["Entre sesiones renovamos el aire de la sala y aspiramos la superficie. La sal se repone de forma periódica, y el uso de calcetines limpios o cubrecalzado es obligatorio dentro de la cueva.", "Mantenemos la temperatura en torno a 20–22 °C y la humedad relativa entre 40 % y 50 %."] },
      { cat: "higiene", q: "¿Qué ropa debo llevar?", a: ["Ropa cómoda, preferiblemente de algodón y de tonos claros. Te damos calcetines y manta. La sal fina puede quedar en la ropa, pero se va con un sacudido o en el lavado normal."] },
      { cat: "ninos", q: "¿Desde qué edad pueden entrar los niños?", a: ["Desde los 3 años en sesiones infantiles y siempre con un adulto acompañante, que entra gratis. Para menores de 3 años, consúltanos antes por WhatsApp."] },
      { cat: "ninos", q: "¿Qué hacen los niños durante la sesión?", a: ["Juegan con la sal fina con cubos y palas de madera mientras suena música suave o un cuento. Las sesiones infantiles son más dinámicas y los grupos más pequeños."] },
      { cat: "frecuencia", q: "¿Cada cuánto debería venir?", a: ["Como orientación: para un objetivo respiratorio o de piel, 2–3 sesiones por semana durante 3–5 semanas (Bono 10). Para relajación, 1 sesión semanal o cuando lo necesites."] },
      { cat: "frecuencia", q: "¿Puedo cambiar o cancelar mi reserva?", a: ["Sí, sin coste hasta 24 h antes desde el enlace de tu confirmación o por WhatsApp. Si cancelas con menos tiempo, la sesión se descuenta del bono."] },
    ],
    faqCats: { salud: "Salud", higiene: "Higiene y ambiente", ninos: "Niños", frecuencia: "Frecuencia y reservas" },
  };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const safeGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const safeSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };

  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (typeof base !== "object" || base === null) return over !== undefined ? over : base;
    const out = { ...base };
    Object.keys(over || {}).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
    return out;
  }

  const listeners = new Set();

  H.Store = {
    defaults: () => clone(DEFAULTS),
    get() {
      const raw = safeGet(KEY);
      if (!raw) return clone(DEFAULTS);
      try { return deepMerge(clone(DEFAULTS), JSON.parse(raw)); } catch (e) { return clone(DEFAULTS); }
    },
    save(content) {
      content.meta = content.meta || {};
      content.meta.updatedAt = new Date().toISOString();
      const ok = safeSet(KEY, JSON.stringify(content));
      listeners.forEach((fn) => fn(content));
      return ok;
    },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} listeners.forEach((fn) => fn(clone(DEFAULTS))); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    list(name) { try { return JSON.parse(safeGet(LIST_KEYS[name]) || "[]"); } catch (e) { return []; } },
    push(name, item) { const l = H.Store.list(name); l.unshift(item); safeSet(LIST_KEYS[name], JSON.stringify(l)); return item; },
    setList(name, list) { safeSet(LIST_KEYS[name], JSON.stringify(list)); },
    KEY, LIST_KEYS,
  };

  // Cross-tab: admin edits reflect on an open site tab.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) { const c = H.Store.get(); listeners.forEach((fn) => fn(c)); }
  });

  /* ---------- Formatting helpers ---------- */
  const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
  H.fmt = {
    eur: (n) => eur.format(Math.round(n * 100) / 100),
    num: (n) => new Intl.NumberFormat("es-ES").format(n),
    rating: (n) => String(n).replace(".", ","),
    date: (d, opts) => new Intl.DateTimeFormat("es-ES", opts || { weekday: "long", day: "numeric", month: "long" }).format(d),
    iso: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  };

  /* ---------- Pricing ---------- */
  H.price = function (content, planId, typeId, people) {
    const plan = content.plans.find((p) => p.id === planId) || content.plans[0];
    const type = content.sessionTypes.find((t) => t.id === typeId) || content.sessionTypes[0];
    const base = plan.prices[type.id] || 0;
    const qty = type.flat ? 1 : Math.max(1, people || 1);
    const subtotal = base * qty;
    const promo = content.promo;
    const promoOk = promo && promo.active && promo.planId === plan.id && (!promo.until || new Date(promo.until + "T23:59:59") >= new Date());
    const discount = promoOk ? Math.round(subtotal * (promo.discount / 100) * 100) / 100 : 0;
    return { plan, type, base, qty, subtotal, discount, total: subtotal - discount, perSession: base / plan.sessions, promoApplied: promoOk };
  };

  /* ---------- Availability (deterministic simulation + stored bookings) ---------- */
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  H.availability = function (content, date, typeId) {
    const day = content.hours.find((h) => h.day === date.getDay());
    if (!day || day.closed) return [];
    const now = new Date();
    const cap = content.business.capacity;
    const booked = H.Store.list("bookings");
    const slots = [];
    for (let m = toMin(day.open); m + content.business.sessionMinutes <= toMin(day.close); m += 60) {
      const time = toHHMM(m);
      const iso = H.fmt.iso(date);
      const start = new Date(`${iso}T${time}:00`);
      let taken = hash(iso + time) % (cap + 3); // simulated occupancy
      if (taken > cap) taken = cap - 1;
      taken += booked.filter((b) => b.date === iso && b.time === time && b.status !== "cancelada").reduce((s, b) => s + (b.flat ? cap : b.people), 0);
      let left = Math.max(0, cap - taken);
      const past = start <= new Date(now.getTime() + 60 * 60 * 1000);
      let disabled = past || left === 0;
      if (typeId === "infantil" && !(content.kidsSlots.includes(time) || date.getDay() === 6)) disabled = true;
      if (typeId === "privada") { // private needs the whole room: only some slots are kept free
        const roomFree = hash("p" + iso + time) % 3 === 0 && !booked.some((b) => b.date === iso && b.time === time && b.status !== "cancelada");
        disabled = past || !roomFree;
        left = roomFree ? cap : 0;
      }
      slots.push({ time, left, disabled, period: m < 14 * 60 ? "Mañana" : "Tarde" });
    }
    return slots;
  };

  H.openNow = function (content) {
    const d = new Date();
    const day = content.hours.find((h) => h.day === d.getDay());
    if (!day || day.closed) return { open: false, label: "Cerrado hoy" };
    const m = d.getHours() * 60 + d.getMinutes();
    if (m >= toMin(day.open) && m < toMin(day.close)) return { open: true, label: `Abierto · hasta las ${day.close}` };
    if (m < toMin(day.open)) return { open: false, label: `Abre hoy a las ${day.open}` };
    return { open: false, label: "Cerrado ahora" };
  };

  H.uid = (p) => `${p}-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
})();
