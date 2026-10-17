# Hühnerhof Schneider – Website-Entwürfe

Drei Entwürfe für die neue Website von Schneiders Hofladen & Hofcafé / Hühnerhof Schneider in Deckenpfronn.
Reines HTML/CSS/JS, kein Build-Schritt, keine Cookies.

## Aufbau (in allen drei Entwürfen gleich)

| Seite | Inhalt |
|---|---|
| `index.html` | **Hofladen & Hofcafé**: Eröffnung, Öffnungszeiten, Sortiment, Anfahrt mit Karte |
| `unterwegs.html` | **Hofbus & Wochenmärkte**: Live-Status, Übersichtskarte, Steckbrief mit Zeiten und Karte je Station |
| `geschichte.html` | **Unsere Geschichte**: Chronik von 2020 bis zur Eröffnung |

Entwürfe: `eroeffnung/` (Stil der neuen Posts), `hofbus/` (kräftig, Grün des alten Logos), `hofgeschichte/` (Magazin-Stil).
Übersicht für den Kunden: `index.html` im Hauptordner.

## Gemeinsame Bausteine (`gemeinsam/`)

- `hof.js` – Stationen mit Zeiten und Koordinaten (Liste `ORTE`), Live-Status, Wochenübersicht, Countdown, Steckbriefe.
  Tage: 0 = Sonntag … 6 = Samstag. Zeiten wie `"09:00-12:00,14:30-17:30"`. Mit `?test` an der URL läuft ein Selbsttest in der Konsole.
- `chronik.js` – alle Einträge der Geschichte, **jeder mit Quellenangabe im Code**.
- `karte.js` – Karten mit Zwei-Klick-Lösung: OpenStreetMap wird erst nach Klick auf „Karte anzeigen“ geladen.
- `basis.css`, `menue.js` – Steckbrief-/Kartenlayout und mobiles Menü.

## Regeln für Inhalte

- Nur Belegtes: Quellen sind die alte Website, Instagram-Posts/-Highlights und das Eröffnungsplakat.
- Keine Zitate; Daten nur so genau, wie die Quelle sie hergibt.
- Bildunterschriften beschreiben, was zu sehen ist. Ortsangaben nur, wenn der Post den Ort nennt
  (`hofbus-traktor` = Holzbronn, `hofbus-schirm` = Gültlingen, `markt-gemuese` = Böblingen, `markt-glaeser` und `markt-nudeln` = Gärtringen).
- Fotos ohne Personen.

## Vor dem Livegang mit dem Kunden klären

- [ ] Fährt der Hofbus nach der Eröffnung weiter wie bisher (Mo, Do, Sa in Deckenpfronn)?
- [ ] Genaue Marktzeit Böblingen (bisher nur „vormittags“)
- [ ] Sortiment und Kartenzahlung im neuen Hofladen
- [ ] Haltepunkte auf der Karte bestätigen (Holzbronn und Gültlingen sind die Ortsmitte)
- [ ] Impressum: Hühnerhof Schneider und/oder die neue GmbH (Geschäftsführerin laut Register: Vanessa Schneider)
- [ ] Nutzung der Instagram-Fotos auf der Website freigeben lassen
- [ ] Vollständige Datenschutzerklärung (inkl. OpenStreetMap nach Klick); Google Fonts lokal einbinden
- [ ] `noindex`-Meta-Tag und das Entwurfs-Schild unten links entfernen

## Hosting bei STRATO

Im STRATO-Homepage-Baukasten lässt sich eigenes HTML nicht hochladen. Für diese Entwürfe braucht es ein
STRATO-Hosting-Paket mit SFTP-Zugang (die Domain kann bleiben) – oder die Domain zeigt auf ein anderes Hosting.
