// Mobiles Menü: öffnen/schließen, nach Klick auf einen Link oder mit Escape wieder zu
(function () {
  const knopf = document.querySelector(".menue"), nav = document.getElementById("nav");
  if (!knopf || !nav) return;
  const zu = () => { nav.classList.remove("auf"); knopf.setAttribute("aria-expanded", false); };
  knopf.addEventListener("click", () => { const auf = nav.classList.toggle("auf"); knopf.setAttribute("aria-expanded", auf); });
  nav.addEventListener("click", e => { if (e.target.closest("a")) zu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("auf")) { zu(); knopf.focus(); } });
})();

// Chronik als waagerechte Zeitleiste: Pfeile zum Weiterblättern (nur wenn die Liste seitlich scrollt)
(function () {
  const liste = document.querySelector(".chronik");
  if (!liste || getComputedStyle(liste).overflowX !== "auto") return;
  const leiste = document.createElement("div");
  leiste.className = "chronik-bedienung";
  const knopf = (text, label, richtung) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = text; b.setAttribute("aria-label", label);
    b.addEventListener("click", () => liste.scrollBy({ left: richtung * (liste.querySelector(".eintrag").offsetWidth), behavior: "smooth" }));
    return b;
  };
  const zurueck = knopf("←", "Früheres Ereignis", -1), vor = knopf("→", "Späteres Ereignis", 1);
  leiste.append(zurueck, vor);
  liste.parentNode.insertBefore(leiste, liste);
  liste.tabIndex = 0;
  liste.setAttribute("role", "region");
  liste.setAttribute("aria-label", "Chronik, waagerecht scrollbar");
  const pruefen = () => {
    zurueck.disabled = liste.scrollLeft < 4;
    vor.disabled = liste.scrollLeft + liste.clientWidth >= liste.scrollWidth - 4;
  };
  liste.addEventListener("scroll", pruefen, { passive: true });
  window.addEventListener("resize", pruefen);
  pruefen();
})();

// Speise- & Getränkekarte: Reiter „Speisen“/„Getränke“, Preis hinter „–“ rechtsbündig
(function () {
  const karte = document.querySelector(".speisekarte");
  if (!karte) return;
  karte.querySelectorAll(".karte-liste li").forEach(li => {
    const m = li.textContent.match(/^(.*\S)\s+[–-]\s+(\S.*)$/);
    if (!m) return;
    const name = document.createElement("span"), punkte = document.createElement("span"), preis = document.createElement("span");
    name.textContent = m[1]; preis.textContent = m[2];
    punkte.className = "karte-punkte"; punkte.setAttribute("aria-hidden", "true"); preis.className = "karte-preis";
    li.replaceChildren(name, punkte, preis);
  });
  const leiste = karte.querySelector(".karte-reiter");
  if (!leiste) return;
  const reiter = [...leiste.querySelectorAll('[role="tab"]')];
  const zeigen = r => reiter.forEach(t => {
    const an = t === r;
    t.setAttribute("aria-selected", an); t.tabIndex = an ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !an;
  });
  reiter.forEach((t, i) => {
    t.addEventListener("click", () => zeigen(t));
    t.addEventListener("keydown", e => {
      const n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!n) return;
      const z = reiter[(i + n + reiter.length) % reiter.length];
      zeigen(z); z.focus();
    });
  });
  leiste.hidden = false; karte.classList.add("reiter");
  zeigen(reiter[0]);
})();
