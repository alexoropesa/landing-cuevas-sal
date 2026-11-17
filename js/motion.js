/* =========================================================
   Halita · Scroll & cinematic motion (GSAP + ScrollTrigger)
   Ownership: GSAP animates [data-reveal] wrappers, hero intro,
   parallax images, manifesto words, how-it-works sequencing, ticker.
   Motion One (ui.js) animates children (.card, .btn, panels, modals).
   ========================================================= */
(function () {
  const H = window.Halita;
  const UI = H.UI;
  if (!window.gsap || !window.ScrollTrigger) { document.documentElement.classList.add("no-gsap"); return; }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const reduce = UI.reduced();
  const appScroll = document.getElementById("appScroll");

  /* Split manifesto into words once (static DOM, accessible text preserved via aria-label) */
  const mf = document.getElementById("manifestoText");
  if (mf && !mf.dataset.split) {
    const text = mf.textContent.trim();
    mf.setAttribute("aria-label", text);
    mf.innerHTML = text.split(" ").map((w) => `<span class="w" aria-hidden="true">${w} </span>`).join("");
    mf.dataset.split = "1";
  }

  if (reduce) return; // content is fully visible without animation

  /* ---------- Hero intro timeline (runs once) ---------- */
  const heroTl = gsap.timeline({ defaults: { ease: "expo.out" } });
  heroTl
    .from("[data-hero-img]", { scale: 1.14, duration: 2.4, ease: "power2.out" }, 0)
    .from("[data-hero-title] .line > span", { yPercent: 110, duration: 1.2, stagger: 0.12 }, 0.15)
    .from("[data-hero-in]", { opacity: 0, y: 24, duration: 1, stagger: 0.1 }, 0.45);

  // Sessions counter (GSAP owns this text node)
  const counter = document.querySelector("[data-count]");
  if (counter) {
    const target = H.Store.get().proof.sessions;
    const obj = { v: 0 };
    heroTl.to(obj, { v: target, duration: 1.8, ease: "power3.out", onUpdate: () => (counter.textContent = H.fmt.num(Math.round(obj.v / 10) * 10)) }, 0.6);
  }

  /* ---------- Ticker (infinite, linear) ---------- */
  const ticker = document.getElementById("ticker");
  let tickerTween;
  if (ticker) tickerTween = gsap.to(ticker, { xPercent: -50, ease: "none", duration: 40, repeat: -1 });

  /* ---------- Scroll-driven (per breakpoint scroller) ---------- */
  const mm = gsap.matchMedia();
  const build = (scroller) => {
    ScrollTrigger.defaults({ scroller });

    // Section & block reveals
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, { opacity: 0, y: 36, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });

    // Plan grid (container only: .plan children belong to Motion hover)
    gsap.from("#planGrid", { opacity: 0, y: 40, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: "#planGrid", start: "top 85%", once: true } });

    // Gallery items stagger (li wrappers; Motion animates the inner button on filter)
    ScrollTrigger.batch("#gallery .gallery__item", {
      start: "top 90%", once: true,
      onEnter: (batch) => gsap.from(batch, { opacity: 0, y: 48, duration: 1, ease: "expo.out", stagger: 0.08 }),
    });

    // Hero image drift
    gsap.to("[data-hero-img]", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // Breath A parallax
    gsap.utils.toArray("[data-parallax]").forEach((img) => {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: img.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
    });
    gsap.from(".breath-a__caption", { opacity: 0, y: 20, duration: 1, scrollTrigger: { trigger: ".breath-a", start: "top 40%", once: true } });

    // Manifesto: word-by-word light-up, scrubbed
    gsap.fromTo("#manifestoText .w", { opacity: 0.14 }, {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: ".manifesto", start: "top 70%", end: "bottom 65%", scrub: 0.6 },
    });

    // Footer CTA
    gsap.from(".footer__cta > *", { opacity: 0, y: 30, duration: 1, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".footer", start: "top 85%", once: true } });
  };

  mm.add("(min-width: 810px)", () => build(window));
  mm.add("(max-width: 809px)", () => build(appScroll));

  /* ---------- How it works: sticky media + step sequencing (desktop) ---------- */
  mm.add("(min-width: 1200px)", () => {
    ScrollTrigger.defaults({ scroller: window });
    const steps = gsap.utils.toArray(".how-step");
    const imgs = gsap.utils.toArray(".how__img");
    const bar = document.getElementById("howProgress");
    const activate = (i) => {
      steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
      imgs.forEach((im, k) => im.classList.toggle("is-active", k === i));
      if (bar) bar.style.width = ((i + 1) / steps.length) * 100 + "%";
    };
    steps.forEach((step, i) => {
      ScrollTrigger.create({ trigger: step, start: "top 55%", end: "bottom 55%", onToggle: (self) => self.isActive && activate(i) });
    });
    // subtle zoom of the active image while the section scrolls
    gsap.fromTo(".how__img img", { scale: 1.08 }, { scale: 1, ease: "none", scrollTrigger: { trigger: "#how", start: "top bottom", end: "bottom top", scrub: true } });
    return () => { steps.forEach((s) => s.classList.add("is-active")); };
  });

  /* ---------- Keep triggers in sync with content/layout changes ---------- */
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  H.Store.subscribe(() => setTimeout(refresh, 50));
  let rt; document.addEventListener("click", (e) => { if (e.target.closest("#compareToggle, .tab, .chip, .acc__trigger")) { clearTimeout(rt); rt = setTimeout(refresh, 450); } });

  // Pause ticker when not visible (perf)
  if (ticker && "IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => (en.isIntersecting ? tickerTween.play() : tickerTween.pause()), { root: null }).observe(ticker.parentElement);
  }
})();
