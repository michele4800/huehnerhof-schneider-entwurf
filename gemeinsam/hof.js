// Live-Status für alle Varianten. Das HTML (Stationen, Zeiten, Chronik) ist statisch und wird von werkzeuge/bauen.py
// aus daten.json erzeugt; dieses Skript ergänzt nur, was von der aktuellen Uhrzeit abhängt.
(function () {
  const DATEN = window.HOF_DATEN;
  const ORTE = DATEN.orte;
  const ERÖFFNUNG = DATEN.eroeffnung.datum;
  const TAGE_LANG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  // Ortszeit Deckenpfronn, egal wo der Browser steht
  function jetzt() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    const iso = `${p.year}-${p.month}-${p.day}`;
    return { iso, tag: new Date(iso + "T12:00:00Z").getUTCDay(), min: (+p.hour % 24) * 60 + +p.minute };
  }
  const zuMin = s => { const [h, m] = s.split(":"); return h * 60 + +m; };
  const uhr = m => (Math.floor(m / 60) + (m % 60 ? "." + String(m % 60).padStart(2, "0") : "")) + " Uhr";

  function heuteZeit(o, j) {
    if (o.sonder && o.sonder[j.iso]) return o.sonder[j.iso];
    if (o.ab && j.iso < o.ab) return null;
    return o.zeiten ? o.zeiten[j.tag] : null;
  }

  function status(o, j) {
    if (o.immer) return { offen: true, text: "Jetzt geöffnet, rund um die Uhr" };
    if (o.id === "hofladen" && j.iso < ERÖFFNUNG) return { offen: false, bald: true, text: "Eröffnung am 7. November" };
    const z = heuteZeit(o, j);
    if (!z) return { offen: false, text: "Heute geschlossen" };
    if (z === "vormittags") return j.min < 13 * 60 ? { offen: true, text: "Heute vormittags auf dem Markt" } : { offen: false, text: "Für heute vorbei" };
    for (const [a, b] of z.split(",").map(t => t.split("-").map(zuMin))) {
      if (j.min < a) return { offen: false, text: "Heute ab " + uhr(a) };
      if (j.min < b) return { offen: true, text: "Jetzt geöffnet bis " + uhr(b) };
    }
    return { offen: false, text: "Für heute geschlossen" };
  }

  const route = o => `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lon}`;
  const tageBis = j => Math.ceil((Date.parse(ERÖFFNUNG + "T00:00:00Z") - Date.parse(j.iso + "T00:00:00Z")) / 864e5);

  function aktualisieren() {
    const j = jetzt();
    for (const o of ORTE) {
      const s = status(o, j);
      document.querySelectorAll(`[data-status="${o.id}"]`).forEach(el => {
        el.querySelector(".status-text").textContent = s.text;
        el.querySelector(".punkt").classList.toggle("offen", s.offen);
        const karte = el.closest("[data-ort]");
        if (karte) karte.classList.toggle("ist-offen", s.offen);
      });
    }
    // Heutigen Tag in Wochen- und Stationstabellen markieren
    // (Farbe allein reicht nicht – Screenreader bekommen „(heute)“ dazu)
    document.querySelectorAll("[data-tag]").forEach(el => {
      const h = +el.dataset.tag === j.tag;
      el.classList.toggle("heute", h);
      const kopf = el.tagName === "TR" ? el.querySelector("th") : el.tagName === "TH" ? el : null;
      if (!kopf) return;
      const hinweis = kopf.querySelector(".heute-hinweis");
      if (h && !hinweis) kopf.insertAdjacentHTML("beforeend", '<span class="nur-vorleser heute-hinweis"> (heute)</span>');
      if (!h && hinweis) hinweis.remove();
    });
    document.querySelectorAll("[data-hof=heute]").forEach(el => el.textContent = TAGE_LANG[j.tag]);
    document.querySelectorAll("[data-hof=gerade]").forEach(el => {
      const g = ORTE.filter(o => !o.immer && status(o, j).offen).map(o => o.name);
      const text = g.length ? "Gerade geöffnet: " + g.join(", ") : "SB-Lädle in Deckenpfronn: rund um die Uhr geöffnet";
      if (el.textContent !== text) el.textContent = text;
    });
    const n = tageBis(j);
    document.querySelectorAll("[data-hof=tage]").forEach(el => {
      const box = el.closest("[data-hof-countdown]") || el;
      box.hidden = n <= 0;
      el.textContent = n;
      const w = box.querySelector("[data-hof=tage-wort]"); if (w) w.textContent = n === 1 ? "Tag" : "Tage";
    });
    // Texte rund um die Eröffnung: data-hof-bis="JJJJ-MM-TT" verschwindet nach dem Datum, data-hof-ab erscheint ab dem Datum
    document.querySelectorAll("[data-hof-bis]").forEach(el => el.hidden = j.iso > el.dataset.hofBis);
    document.querySelectorAll("[data-hof-ab]").forEach(el => el.hidden = j.iso < el.dataset.hofAb);
  }

  window.Hof = { ORTE, status, jetzt, route };
  aktualisieren();
  setInterval(aktualisieren, 60000);

  // Selbsttest (nur mit ?test in der URL)
  if (location.search.includes("test")) {
    const h = ORTE[0], bus = ORTE[2], m = ORTE[6];
    console.assert(status(h, { iso: "2026-10-17", tag: 6, min: 600 }).bald, "vor Eröffnung");
    console.assert(status(h, { iso: "2026-11-07", tag: 6, min: 660 }).offen, "Eröffnungstag offen");
    console.assert(!status(h, { iso: "2026-11-08", tag: 0, min: 660 }).offen, "So 8.11 zu");
    console.assert(status(h, { iso: "2026-11-10", tag: 2, min: 15 * 60 }).offen, "Di 15 Uhr offen");
    console.assert(status(h, { iso: "2026-11-10", tag: 2, min: 13 * 60 }).text === "Heute ab 14.30 Uhr", "Mittagspause");
    console.assert(!status(h, { iso: "2026-11-11", tag: 3, min: 600 }).offen, "Mi Ruhetag");
    console.assert(status(bus, { iso: "2026-10-19", tag: 1, min: 17 * 60 }).text === "Jetzt geöffnet bis 18 Uhr", "Bus Mo 17 Uhr");
    console.assert(status(m, { iso: "2026-10-17", tag: 6, min: 8 * 60 }).offen, "Gärtringen Sa 8 Uhr");
    console.log("Hof-Selbsttest fertig");
  }
})();
