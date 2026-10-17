// Gemeinsame Daten und Logik für alle Varianten: Verkaufsstellen, Live-Status, Wochenübersicht, Countdown.
// Tage: 0 = Sonntag … 6 = Samstag. Zeiten "HH:MM-HH:MM", mehrere mit Komma. "vormittags" = Marktzeit ohne genaue Uhrzeit.
(function () {
  const BILD = (document.currentScript && document.currentScript.dataset.bilder) || "../bilder/";
  const ERÖFFNUNG = "2026-11-07";

  // Bilder passen zum Ort: hofbus-traktor = Post „Hallo Holzbronn“, hofbus-schirm = Gültlingen, markt-gemuese = Böblingen, markt-glaeser = Gärtringen.
  // gruppe: hof = am Hof in Deckenpfronn, bus = Hofbus (mobiler Hofladen), markt = Wochenmarkt mit dem Marktauto.
  // lat/lon per OpenStreetMap-Suche ermittelt (Holzbronn und Gültlingen: Ortsmitte) – vor Livegang vom Hof bestätigen lassen.
  const ORTE = [
    { id: "hofladen", gruppe: "hof", name: "Hofladen & Hofcafé", adresse: "Mahden 1, 75392 Deckenpfronn", bild: "neubau-aussen.jpg", hervor: true,
      lat: 48.65378, lon: 8.81667, ab: "2026-11-09", sonder: { "2026-11-07": "10:00-17:00" },
      zeiten: { 1: "09:00-12:00,14:30-17:30", 2: "09:00-12:00,14:30-17:30", 4: "09:00-12:00,14:30-17:30", 5: "09:00-12:00,14:30-17:30", 6: "09:00-12:00" },
      notiz: "Mittwoch Ruhetag" },
    { id: "laedle", gruppe: "hof", name: "SB-Lädle", adresse: "Calwer Straße 27/1, 75392 Deckenpfronn", bild: "eier-paletten.jpg", immer: true,
      lat: 48.65196, lon: 8.82001 },
    { id: "bus-deckenpfronn", gruppe: "bus", name: "Hofbus Deckenpfronn", adresse: "Calwer Straße 27/1, 75392 Deckenpfronn", bild: "hofbus-regal.jpg",
      lat: 48.65196, lon: 8.82001, zeiten: { 1: "16:00-18:00", 4: "16:00-18:00", 5: "08:00-12:00", 6: "10:00-12:00" } },
    { id: "bus-holzbronn", gruppe: "bus", name: "Hofbus Holzbronn", adresse: "Rathaus im Ortskern, Calw-Holzbronn", bild: "hofbus-traktor.jpg",
      lat: 48.66013, lon: 8.74331, zeiten: { 2: "15:00-17:00" } },
    { id: "bus-gueltlingen", gruppe: "bus", name: "Hofbus Gültlingen", adresse: "Bushaltestelle Ortskern, Wildberg-Gültlingen", bild: "hofbus-schirm.jpg",
      lat: 48.64979, lon: 8.77389, zeiten: { 5: "14:30-17:30" } },
    { id: "markt-boeblingen", gruppe: "markt", name: "Wochenmarkt Böblingen", adresse: "Elbenplatz, Böblingen", bild: "markt-gemuese.jpg",
      lat: 48.68485, lon: 9.00966, zeiten: { 3: "vormittags" }, notiz: "Mittwochs auch mit frischem Obst und Gemüse" },
    { id: "markt-gaertringen", gruppe: "markt", name: "Wochenmarkt Gärtringen", adresse: "Marktplatz, Gärtringen", bild: "markt-glaeser.jpg",
      lat: 48.64124, lon: 8.89574, zeiten: { 6: "07:00-12:00" } },
  ];
  const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const TAGE_LANG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const REIHE = [1, 2, 3, 4, 5, 6, 0];

  // Ortszeit Deckenpfronn, egal wo der Browser steht
  function jetzt() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    const iso = `${p.year}-${p.month}-${p.day}`;
    return { iso, tag: new Date(iso + "T12:00:00Z").getUTCDay(), min: (+p.hour % 24) * 60 + +p.minute };
  }
  const zuMin = s => { const [h, m] = s.split(":"); return h * 60 + +m; };
  const kurz = s => s.replace(/^0/, "").replace(":00", "").replace(":", ".");
  const spanne = z => z.split(",").map(t => t.split("-").map(kurz).join("–")).join(" und ") + " Uhr";

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
    const uhr = m => kurz(String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0")) + " Uhr";
    for (const [a, b] of z.split(",").map(t => t.split("-").map(zuMin))) {
      if (j.min < a) return { offen: false, text: "Heute ab " + uhr(a) };
      if (j.min < b) return { offen: true, text: "Jetzt geöffnet bis " + uhr(b) };
    }
    return { offen: false, text: "Für heute geschlossen" };
  }

  function zeitenText(o) {
    if (o.immer) return "Rund um die Uhr, jeden Tag";
    const tage = REIHE.filter(t => o.zeiten && o.zeiten[t]);
    // Gleiche Zeiten zusammenfassen: "Mo, Di, Do, Fr 9–12 und 14.30–17.30 Uhr"
    const gruppen = [];
    for (const t of tage) { const z = o.zeiten[t]; const g = gruppen.find(g => g.z === z); g ? g.t.push(t) : gruppen.push({ z, t: [t] }); }
    let s = gruppen.map(g => g.t.map(t => g.t.length > 1 ? TAGE[t] : TAGE_LANG[t]).join(", ") + " " + (g.z === "vormittags" ? "vormittags" : spanne(g.z))).join("; ");
    if (o.notiz) s += (s ? ". " : "") + o.notiz;
    return s;
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const auswahl = el => el.dataset.gruppen ? ORTE.filter(o => el.dataset.gruppen.split(",").includes(o.gruppe)) : ORTE;
  const route = o => `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lon}`;

  // Steckbrief pro Station wie auf der alten Seite: Foto, Adresse, Tagesplan, Karte, Route
  function steckbriefe(el) {
    const j = jetzt();
    el.innerHTML = auswahl(el).map(o => {
      const s = status(o, j);
      const plan = REIHE.map(d => {
        const z = o.immer ? "0–24 Uhr" : o.zeiten && o.zeiten[d] ? (o.zeiten[d] === "vormittags" ? "vormittags" : spanne(o.zeiten[d])) : "geschlossen";
        return `<tr${d === j.tag ? ' class="heute"' : ""}><th scope="row">${TAGE_LANG[d]}</th><td>${z}</td></tr>`;
      }).join("");
      return `<article class="station" id="${o.id}">
        <img class="station-bild" src="${BILD}${o.bild}" alt="" loading="lazy" width="600" height="400">
        <div class="station-text">
          <p class="ort-status"><span class="punkt${s.offen ? " offen" : ""}"></span>${esc(s.text)}</p>
          <h3 class="station-name">${esc(o.name)}</h3>
          <p class="station-adresse">${esc(o.adresse)}</p>
          ${o.notiz ? `<p class="station-notiz">${esc(o.notiz)}</p>` : ""}
          <table class="station-plan"><caption class="nur-vorleser">Öffnungszeiten ${esc(o.name)}</caption>${plan}</table>
          <a class="station-route" href="${route(o)}" target="_blank" rel="noopener">Route planen</a>
        </div>
        <div class="station-karte" data-karte="${o.id}"></div>
      </article>`;
    }).join("");
  }

  function finder(el, opt = {}) {
    const j = jetzt();
    el.innerHTML = auswahl(el).map(o => {
      const s = status(o, j);
      const zeiten = o.id === "hofladen" && j.iso < "2026-11-09" ? "Eröffnung 7. November, 10–17 Uhr. Ab 9. November: " + zeitenText(o) : zeitenText(o);
      return `<li class="ort${o.hervor ? " hervor" : ""}${s.offen ? " ist-offen" : ""}">
        ${opt.bilder === false ? "" : `<img class="ort-bild" src="${BILD}${o.bild}" alt="" loading="lazy" width="600" height="400">`}
        <div class="ort-text">
          <p class="ort-status"><span class="punkt${s.offen ? " offen" : ""}"></span>${esc(s.text)}</p>
          <h3 class="ort-name">${esc(o.name)}</h3>
          <p class="ort-adresse">${esc(o.adresse)}</p>
          <p class="ort-zeiten">${esc(zeiten)}</p>
        </div></li>`;
    }).join("");
  }

  function woche(table) {
    const j = jetzt();
    let t = `<caption>Alle Verkaufszeiten der Woche</caption><thead><tr><th scope="col">Wo</th>` +
      REIHE.map(d => `<th scope="col"${d === j.tag ? ' class="heute"' : ""}>${TAGE[d]}</th>`).join("") + "</tr></thead><tbody>";
    for (const o of auswahl(table)) {
      const regel = o.ab ? Object.assign({}, o, { ab: null, sonder: null }) : o;
      t += `<tr><th scope="row">${esc(o.name)}</th>` + REIHE.map(d => {
        const z = o.immer ? "0–24 Uhr" : regel.zeiten && regel.zeiten[d] ? (regel.zeiten[d] === "vormittags" ? "vormittags" : spanne(regel.zeiten[d]).replace(" und ", "<br>")) : "";
        return `<td${d === j.tag ? ' class="heute"' : ""}>${z ? `<span class="ei-mark" aria-hidden="true"></span><small>${z}</small>` : '<span class="zu">–</span>'}</td>`;
      }).join("") + "</tr>";
    }
    table.innerHTML = t + "</tbody>";
  }

  function tageBisEröffnung() {
    return Math.ceil((Date.parse(ERÖFFNUNG + "T00:00:00Z") - Date.parse(jetzt().iso + "T00:00:00Z")) / 864e5);
  }

  function gerade() {
    const j = jetzt();
    return ORTE.filter(o => !o.immer && status(o, j).offen).map(o => o.name);
  }

  // Alles mit data-hof-Attribut befüllen, jede Minute aktualisieren
  function start() {
    const lauf = () => {
      document.querySelectorAll("[data-hof=finder]").forEach(el => finder(el, { bilder: el.dataset.bilder !== "nein" }));
      document.querySelectorAll("[data-hof=woche]").forEach(woche);
      // Steckbriefe nur einmal zeichnen, sonst würden geladene Karten jede Minute verschwinden
      document.querySelectorAll("[data-hof=steckbriefe]:not([data-fertig])").forEach(el => { steckbriefe(el); el.dataset.fertig = "1"; });
      document.querySelectorAll("[data-hof=tage]").forEach(el => {
        const n = tageBisEröffnung(); const box = el.closest("[data-hof-countdown]") || el;
        if (n > 0) { el.textContent = n; box.hidden = false; const l = box.querySelector("[data-hof=tage-wort]"); if (l) l.textContent = n === 1 ? "Tag" : "Tage"; }
        else box.hidden = true;
      });
      document.querySelectorAll("[data-hof=gerade]").forEach(el => {
        const g = gerade();
        el.textContent = g.length ? "Gerade geöffnet: " + g.join(", ") : "SB-Lädle in Deckenpfronn: rund um die Uhr geöffnet";
      });
      document.querySelectorAll("[data-hof=heute]").forEach(el => el.textContent = TAGE_LANG[jetzt().tag]);
      document.querySelectorAll("[data-hof=jahr]").forEach(el => el.textContent = jetzt().iso.slice(0, 4));
    };
    lauf(); setInterval(lauf, 60000);
  }

  window.Hof = { ORTE, status, zeitenText, jetzt, start, route };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  // Selbsttest (nur mit ?test in der URL)
  if (location.search.includes("test")) {
    const h = ORTE[0], bus = ORTE[2], m = ORTE[6];
    console.assert(status(h, { iso: "2026-10-17", tag: 6, min: 600 }).bald, "vor Eröffnung");
    console.assert(status(h, { iso: "2026-11-07", tag: 6, min: 660 }).offen, "Eröffnungstag offen");
    console.assert(!status(h, { iso: "2026-11-08", tag: 0, min: 660 }).offen, "So 8.11 zu");
    console.assert(status(h, { iso: "2026-11-10", tag: 2, min: 15 * 60 }).offen, "Di 15 Uhr offen");
    console.assert(!status(h, { iso: "2026-11-10", tag: 2, min: 13 * 60 }).offen, "Di Mittagspause zu");
    console.assert(status(h, { iso: "2026-11-10", tag: 2, min: 13 * 60 }).text.includes("14.30"), "Mittagspause zeigt 14.30");
    console.assert(!status(h, { iso: "2026-11-11", tag: 3, min: 600 }).offen, "Mi Ruhetag");
    console.assert(status(bus, { iso: "2026-10-19", tag: 1, min: 17 * 60 }).offen, "Bus Mo 17 Uhr");
    console.assert(status(m, { iso: "2026-10-17", tag: 6, min: 8 * 60 }).offen, "Gärtringen Sa 8 Uhr");
    console.assert(zeitenText(h).startsWith("Mo, Di, Do, Fr 9–12 und 14.30–17.30 Uhr"), zeitenText(h));
    console.log("Hof-Selbsttest fertig");
  }
})();
