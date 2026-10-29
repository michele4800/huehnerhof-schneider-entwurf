// Erzeugt die Kartenbilder, die vor dem Klick auf „Karte anzeigen“ zu sehen sind (bilder/karten/*.webp).
// Die Kacheln werden dabei EINMALIG hier geladen – Besucher laden nur das fertige Bild vom eigenen Server.
// Nur neu ausführen, wenn sich Stationen oder Koordinaten in daten.json ändern:
//   node werkzeuge/kartenbilder.mjs
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// shortcut: puppeteer-core und Chrome kommen aus dem Kunden-Feedback-Projekt; bei anderem Rechner Pfade anpassen
const require = createRequire(path.join(ROOT, "../../KI-Projekte/kunden-feedback/package.json"));
const puppeteer = require("puppeteer-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const ORTE = JSON.parse(fs.readFileSync(path.join(ROOT, "daten.json"), "utf8")).orte;
// Gleiche Schlüssel wie data-karte in den Seiten; Dateiname = Schlüssel mit „-“ statt „,“
const KARTEN = ["hof", "bus,markt,hof", ...ORTE.filter(o => o.gruppe !== "hof").map(o => o.id)];
const ziel = path.join(ROOT, "bilder", "karten");
fs.mkdirSync(ziel, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const seite = await browser.newPage();
for (const schluessel of KARTEN) {
  const einzeln = !schluessel.includes(",") && schluessel !== "hof";
  // Groß genug, dass das Bild mit object-fit:cover in breiten und hohen Kästen die Punkte zeigt
  const [b, h] = einzeln ? [1000, 700] : [1600, 1000];
  await seite.setViewport({ width: b, height: h });
  await seite.setContent(`<!doctype html><style>html,body,#k{margin:0;width:100%;height:100%}</style><div id="k"></div>`);
  await seite.addStyleTag({ path: path.join(ROOT, "gemeinsam/leaflet/leaflet.css") });
  await seite.addScriptTag({ path: path.join(ROOT, "gemeinsam/leaflet/leaflet.js") });
  await seite.evaluate((orte, schluessel) => new Promise(fertig => {
    const FARBE = { hof: "#B8862F", bus: "#5E7A1F", markt: "#2F6F8A" };
    const teile = schluessel.split(",");
    const auswahl = orte.filter(o => teile.includes(o.id) || teile.includes(o.gruppe));
    const k = L.map("k", { zoomControl: false, attributionControl: false, fadeAnimation: false, zoomAnimation: false });
    const kacheln = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(k);
    const grenzen = auswahl.map(o => [o.lat, o.lon]);
    // Einzelne Station: Punkt ins obere Drittel, unten liegt der Knopf darüber
    if (grenzen.length === 1) { k.setView(grenzen[0], 15); k.panBy([0, k.getSize().y * 0.17], { animate: false }); }
    else k.fitBounds(grenzen, { padding: [330, 200], maxZoom: 16 });  // Punkte bleiben in der Bildmitte
    for (const o of auswahl) L.circleMarker([o.lat, o.lon], { radius: 11, color: "#fff", weight: 3, fillColor: FARBE[o.gruppe], fillOpacity: 1 }).addTo(k);
    kacheln.on("load", () => setTimeout(fertig, 300));
  }), ORTE, schluessel);
  const datei = path.join(ziel, schluessel.replace(/,/g, "-") + ".webp");
  await seite.screenshot({ path: datei, type: "webp", quality: 72 });
  console.log(path.relative(ROOT, datei), Math.round(fs.statSync(datei).size / 1024) + " KB");
}
await browser.close();
