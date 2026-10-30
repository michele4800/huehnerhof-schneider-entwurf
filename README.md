# Hühnerhof Schneider – Website-Entwürfe

Vier livegangfertige Entwürfe für Schneiders Hofladen & Hofcafé / Hühnerhof Schneider in Deckenpfronn.
Reines HTML/CSS/JS, keine Cookies, keine Anfragen an Dritte (Karten erst nach Klick).

**`noindex` ist absichtlich noch gesetzt** – erst entfernen, wenn der Hof die Freigabe gibt (siehe unten).

## Aufbau (in allen Entwürfen gleich)

| Seite | Inhalt |
|---|---|
| `index.html` | Hofladen & Hofcafé: Eröffnung, Öffnungszeiten, Sortiment, „Kurz & knapp“ mit FAQ, Anfahrt mit Karte |
| `unterwegs.html` | Hofbus & Wochenmärkte: Live-Status, Übersichtskarte, Steckbrief mit Zeiten und Karte je Station |
| `geschichte.html` | Unsere Geschichte: Chronik mit Quellen |
| `impressum.html`, `datenschutz.html` | Entwürfe – vor Livegang rechtlich prüfen |

Entwürfe: `eroeffnung/` (Stil der neuen Posts), `hofbus/` (kräftig), `hofgeschichte/` (Magazin), `kombi/` (Mischung aus 1 und 3). Übersicht: `index.html`.

## So wird gepflegt

1. **Alle Fakten stehen in `daten.json`** (Adressen, Stationen mit Zeiten und Koordinaten, Eröffnung, Chronik mit Quellen).
   Die Symbole der Chronik (Feld `zeichen`) liegen in `gemeinsam/zeichen.json` (SVG, `viewBox="0 0 80 80"`, nur Linien) – neue Symbole dort ergänzen, nicht in `werkzeuge/`.
2. Danach im Projektordner: `python werkzeuge/bauen.py`
   - schreibt Stationen, Wochentabelle, Chronik, FAQ, Fußzeile, Canonical/Open Graph und Strukturdaten (JSON-LD) als
     **statisches HTML** in alle Seiten (zwischen `<!-- hof:… -->`-Markern – dort nichts von Hand ändern),
   - erzeugt Impressum und Datenschutz je Entwurf, `gemeinsam/daten.js` für den Live-Status,
   - baut `livegang/<entwurf>/` und `livegang/livegang-<entwurf>.zip` (nicht im Git).
   - Ändern sich Stationen oder Koordinaten: `node werkzeuge/kartenbilder.mjs` erzeugt die Kartenbilder in `bilder/karten/`,
     die vor dem Klick auf die Karte zu sehen sind (Besucher laden dabei nichts von OpenStreetMap).
3. `gemeinsam/hof.js` ergänzt im Browser nur den Live-Status („Jetzt geöffnet bis …“), den heutigen Tag und den Countdown.
   Texte mit `data-hof-bis="2026-11-07"` verschwinden nach der Eröffnung automatisch, `data-hof-ab` erscheint ab dem Datum.

## Livegang bei STRATO

- Benötigt ein STRATO-Hosting-Paket mit SFTP (der Homepage-Baukasten kann kein eigenes HTML).
- Inhalt von `livegang/livegang-<entwurf>.zip` ins Wurzelverzeichnis laden. Enthalten: alle Seiten, `sitemap.xml`,
  `robots.txt`, `llms.txt`, `.htaccess` (HTTPS + www, Caching, Kompression).
- **Zur Freigabe:** in `werkzeuge/bauen.py` den `noindex`-Tag entfernen lassen (bzw. in allen Seiten
  `<meta name="robots" content="noindex, nofollow">` löschen), neu bauen, hochladen; danach Sitemap in der Google Search Console
  und den Bing Webmaster Tools einreichen.

## Geprüft (Oktober 2026)

- **SEO / lokale Sichtbarkeit / KI-Suche** (Skills `seo-audit`, `ai-seo`, `seo-ai-visibility`): statische Inhalte statt JS,
  einheitlicher Name/Adresse/Telefon, Titel ≤ 60 und Beschreibungen ≤ 160 Zeichen, Strukturdaten (Organization, Store/Café,
  SB-Lädle, Eröffnungs-Event, Hofbus mit Stationen), FAQ, `llms.txt`, Sitemap.
- **Barrierefreiheit WCAG 2.2 AA** (Skills `accessibility`, `accessibility-review`): Kontraste nachgemessen und angepasst,
  sichtbarer Fokus, Karte per Tastatur, Screenreader-Texte für Tabellen, Links und „heute“, kein Überlauf bei 320 px.
- **Ladezeit** (Skills `web-perf`, `web-design-guidelines`): WebP mit `srcset`, Hero mit `fetchpriority`, lokale Schriften,
  lokales Leaflet, Karten erst bei Sichtbarkeit, `.htaccess` mit Caching.

## Vor dem Livegang mit dem Kunden klären

- [ ] Fährt der Hofbus nach der Eröffnung weiter wie bisher (Deckenpfronn Mo, Do, Fr, Sa)?
- [ ] Genaue Marktzeit Böblingen (bisher nur „vormittags“)
- [ ] Sortiment und Kartenzahlung im neuen Hofladen
- [ ] Haltepunkte auf der Karte bestätigen (Holzbronn und Gültlingen = Ortsmitte)
- [ ] Impressum: welcher Betrieb, USt-IdNr. der GmbH; Datenschutz: Hosting-Anbieter eintragen; beides rechtlich prüfen lassen
- [ ] Nutzung der Instagram-Fotos auf der Website freigeben lassen
- [ ] Google-Unternehmensprofil für „Schneiders Hofladen & Hofcafé“ (Mahden 1) anlegen, gleiche Schreibweise wie auf der Website
