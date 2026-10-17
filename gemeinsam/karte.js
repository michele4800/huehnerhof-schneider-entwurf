// Karten mit Zwei-Klick-Lösung: Erst nach Klick werden Leaflet und Kartenkacheln von OpenStreetMap geladen.
// Platzhalter: <div data-karte="alle"> | data-karte="bus,markt" (Gruppen) | data-karte="hofladen" (eine Station)
(function () {
  const FARBE = { hof: "#B8862F", bus: "#5E7A1F", markt: "#2F6F8A" };
  const MERKER = "hof-karte-erlaubt";
  let geladen = null;

  function erlaubt() { try { return localStorage.getItem(MERKER) === "1"; } catch (e) { return false; } }
  function merken() { try { localStorage.setItem(MERKER, "1"); } catch (e) {} }

  function laden() {
    if (geladen) return geladen;
    geladen = new Promise((ok, fehler) => {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
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

  function zeichnen(el) {
    if (el.dataset.gezeichnet) return;
    el.dataset.gezeichnet = "1";
    el.innerHTML = "";
    el.classList.add("karte-an");
    const orte = orteFür(el.dataset.karte);
    // SB-Lädle und Hofbus Deckenpfronn stehen an derselben Adresse: nur ein Punkt
    const punkte = [];
    for (const o of orte) {
      const p = punkte.find(p => p.lat === o.lat && p.lon === o.lon);
      p ? p.namen.push(o.name) : punkte.push({ lat: o.lat, lon: o.lon, namen: [o.name], adresse: o.adresse, gruppe: o.gruppe, o });
    }
    const karte = L.map(el, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(karte);
    const grenzen = [];
    for (const p of punkte) {
      L.circleMarker([p.lat, p.lon], { radius: 10, color: "#fff", weight: 3, fillColor: FARBE[p.gruppe] || "#444", fillOpacity: 1 })
        .addTo(karte)
        .bindPopup(`<strong>${p.namen.join(" & ")}</strong><br>${p.adresse}<br><a href="${window.Hof.route(p.o)}" target="_blank" rel="noopener">Route planen</a>`);
      grenzen.push([p.lat, p.lon]);
    }
    if (grenzen.length === 1) karte.setView(grenzen[0], 15);
    else karte.fitBounds(grenzen, { padding: [30, 30] });
  }

  function alleZeichnen() {
    laden().then(() => document.querySelectorAll("[data-karte]").forEach(zeichnen))
      .catch(() => document.querySelectorAll("[data-karte]:not([data-gezeichnet])").forEach(el => {
        el.querySelector(".karte-hinweis").textContent = "Die Karte konnte nicht geladen werden. Nutze den Link „Route planen“.";
      }));
  }

  function platzhalter() {
    document.querySelectorAll("[data-karte]:not([data-gezeichnet]):not([data-platzhalter])").forEach(el => {
      el.dataset.platzhalter = "1";
      el.classList.add("karte-aus");
      el.innerHTML = `<div class="karte-zu"><button type="button" class="karte-knopf">Karte anzeigen</button>
        <p class="karte-hinweis">Beim Anzeigen werden Kartendaten von OpenStreetMap geladen. Dabei wird deine IP-Adresse an deren Server übertragen.</p></div>`;
      el.querySelector("button").addEventListener("click", () => { merken(); alleZeichnen(); });
    });
    if (erlaubt()) alleZeichnen();
  }

  // Steckbriefe werden von hof.js erst gezeichnet – danach Platzhalter setzen
  const los = () => setTimeout(platzhalter, 0);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", los); else los();
})();
