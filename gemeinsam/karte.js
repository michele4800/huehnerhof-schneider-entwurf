// Karten mit Zwei-Klick-Lösung: Erst nach Klick werden Leaflet und Kartenkacheln von OpenStreetMap geladen.
// Platzhalter: <div data-karte="alle"> | data-karte="bus,markt" (Gruppen) | data-karte="hofladen" (eine Station)
(function () {
  const FARBE = { hof: "#B8862F", bus: "#5E7A1F", markt: "#2F6F8A" };
  const MERKER = "hof-karte-erlaubt";
  let geladen = null;
  // Leaflet liegt lokal neben dieser Datei (keine Anfrage an ein CDN)
  const BASIS = document.currentScript.src.replace(/[^/]*$/, "");

  function erlaubt() { try { return localStorage.getItem(MERKER) === "1"; } catch (e) { return false; } }
  function merken() { try { localStorage.setItem(MERKER, "1"); } catch (e) {} }

  function laden() {
    if (geladen) return geladen;
    geladen = new Promise((ok, fehler) => {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = BASIS + "leaflet/leaflet.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = BASIS + "leaflet/leaflet.js";
      js.onload = ok; js.onerror = fehler;
      document.head.appendChild(js);
    });
    return geladen;
  }

  function orteFür(wert) {
    const alle = window.Hof.ORTE;
    if (wert === "alle") return alle;
    const teile = wert.split(",");
    return alle.filter(o => teile.includes(o.id) || teile.includes(o.gruppe));
  }

  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function zeichnen(el) {
    if (el.dataset.gezeichnet) return;
    el.dataset.gezeichnet = "1";
    el.innerHTML = "";
    el.classList.remove("karte-aus");
    el.style.backgroundImage = "";
    el.classList.add("karte-an");
    if (!el.hasAttribute("role")) { el.setAttribute("role", "region"); el.setAttribute("aria-label", "Karte der Verkaufsstellen"); }
    const orte = orteFür(el.dataset.karte);
    // SB-Lädle und Hofbus Deckenpfronn stehen an derselben Adresse: nur ein Punkt
    const punkte = [];
    for (const o of orte) {
      const p = punkte.find(p => p.lat === o.lat && p.lon === o.lon);
      p ? p.namen.push(o.name) : punkte.push({ lat: o.lat, lon: o.lon, namen: [o.name], adresse: o.adresse, gruppe: o.gruppe, o });
    }
    const karte = L.map(el, { scrollWheelZoom: false, zoomControl: false, zoomAnimation: !ruhig, fadeAnimation: !ruhig, markerZoomAnimation: !ruhig });
    L.control.zoom({ zoomInTitle: "Vergrößern", zoomOutTitle: "Verkleinern" }).addTo(karte);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(karte);
    // Erst den Ausschnitt setzen – vorher legt Leaflet keine Marker-Elemente an
    const grenzen = punkte.map(p => [p.lat, p.lon]);
    if (grenzen.length === 1) karte.setView(grenzen[0], 15);
    else karte.fitBounds(grenzen, { padding: [30, 30] });
    for (const p of punkte) {
      const name = p.namen.join(" & ");
      const m = L.circleMarker([p.lat, p.lon], { radius: 11, color: "#fff", weight: 3, fillColor: FARBE[p.gruppe] || "#444", fillOpacity: 1 })
        .addTo(karte)
        .bindPopup(`<strong>${name}</strong><br>${p.adresse}<br><a href="${window.Hof.route(p.o)}" target="_blank" rel="noopener">Route planen<span class="nur-vorleser"> (neues Fenster)</span></a>`);
      // Marker auch per Tastatur erreichbar
      const knoten = m.getElement();
      knoten.setAttribute("tabindex", "0"); knoten.setAttribute("role", "button"); knoten.setAttribute("aria-label", name + ", Details anzeigen");
      knoten.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); m.openPopup(); } });
    }
    karte.on("popupopen", ev => { const b = ev.popup.getElement().querySelector(".leaflet-popup-close-button"); if (b) { b.title = "Schließen"; b.setAttribute("aria-label", "Schließen"); } });
  }

  // Karten erst zeichnen, wenn sie in Sicht kommen (spart Kacheln auf langen Seiten)
  const beobachter = "IntersectionObserver" in window
    ? new IntersectionObserver(einträge => einträge.forEach(e => { if (e.isIntersecting) { beobachter.unobserve(e.target); zeichnen(e.target); } }), { rootMargin: "200px" })
    : null;

  function alleZeichnen(geklickt) {
    laden().then(() => {
      document.querySelectorAll("[data-karte]:not([data-gezeichnet])").forEach(el => beobachter && el !== geklickt ? beobachter.observe(el) : zeichnen(el));
      if (geklickt) { geklickt.setAttribute("tabindex", "-1"); geklickt.focus({ preventScroll: true }); }
    }).catch(() => document.querySelectorAll("[data-karte]:not([data-gezeichnet])").forEach(el => {
      const h = el.querySelector(".karte-hinweis"); if (h) h.textContent = "Die Karte konnte nicht geladen werden. Nutze den Link „Route planen“.";
    }));
  }

  function platzhalter() {
    document.querySelectorAll("[data-karte]:not([data-gezeichnet]):not([data-platzhalter])").forEach(el => {
      el.dataset.platzhalter = "1";
      el.classList.add("karte-aus");
      // Vorschaubild liegt auf dem eigenen Server (werkzeuge/kartenbilder.mjs) – vor dem Klick geht nichts an OpenStreetMap
      el.style.backgroundImage = `url("${BASIS}../bilder/karten/${el.dataset.karte.replace(/,/g, "-")}.webp")`;
      el.innerHTML = `<div class="karte-zu"><button type="button" class="karte-knopf">Karte bewegen und zoomen</button>
        <p class="karte-hinweis">Dabei werden Kartendaten von OpenStreetMap geladen und deine IP-Adresse an deren Server übertragen.</p></div>
        <span class="karte-quelle">© OpenStreetMap-Mitwirkende</span>`;
      el.querySelector("button").addEventListener("click", () => { merken(); alleZeichnen(el); });
    });
    if (erlaubt()) alleZeichnen();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", platzhalter); else platzhalter();
})();
