"""Baut alle Seiten aus daten.json.

Aufruf (im Projektordner):  python werkzeuge/bauen.py

Was passiert:
  1. gemeinsam/daten.js        – Stationen und Eröffnung für den Live-Status im Browser
  2. Marker in allen Seiten    – <!-- hof:NAME ... --> … <!-- /hof:NAME --> wird neu befüllt:
       kopf (Canonical, Open Graph, Strukturdaten), finder, steckbriefe, woche, chronik, fakten, fuss
  3. impressum.html, datenschutz.html je Entwurf
  4. livegang/<entwurf>/        – fertiges Paket für das Wurzelverzeichnis von STRATO
                                  (mit sitemap.xml, robots.txt, llms.txt, .htaccess); nicht im Git
"""
import html, json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(ROOT, "daten.json"), encoding="utf-8"))
ENTWÜRFE = ["eroeffnung", "hofbus", "hofgeschichte"]
VORSCHAU = "https://michele4800.github.io/huehnerhof-schneider-entwurf/{e}/"
LIVE = "https://www.huehnerhof-schneider.de/"
TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
KURZ = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
SCHEMA_TAG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
REIHE = [1, 2, 3, 4, 5, 6, 0]
B, L = D["betrieb"], D["laden"]
e = html.escape

SEITEN = {  # Titel ≤ 60, Beschreibung ≤ 160 Zeichen (wird geprüft)
    "index.html": ("Hofladen & Hofcafé in Deckenpfronn | Hühnerhof Schneider",
                   "Schneiders Hofladen & Hofcafé am Hühnerhof in Deckenpfronn bei Herrenberg: frische Eier von unseren Legehennen, Regionales und Kaffee."),
    "unterwegs.html": ("Hofbus & Wochenmärkte: Zeiten & Orte | Hühnerhof Schneider",
                       "Mobiler Hofladen vom Hühnerhof Schneider: Hofbus in Deckenpfronn, Holzbronn und Gültlingen, Wochenmärkte Böblingen (Mi) und Gärtringen (Sa)."),
    "geschichte.html": ("Unsere Geschichte | Hühnerhof Schneider, Deckenpfronn",
                        "Familienbetrieb in 3. Generation bei Herrenberg: von Blühwiese, Wochenmärkten und Hofbus bis zum neuen Hofladen mit Hofcafé in Deckenpfronn."),
    "impressum.html": ("Impressum | Hühnerhof Schneider", "Impressum von Hühnerhof Schneider und Schneiders Hofladen & Hofcafé in Deckenpfronn."),
    "datenschutz.html": ("Datenschutz | Hühnerhof Schneider", "Datenschutzerklärung von Hühnerhof Schneider und Schneiders Hofladen & Hofcafé in Deckenpfronn."),
}
for t, d in SEITEN.values():
    assert len(t) <= 60 and len(d) <= 160, (t, len(t), len(d))

# ---------- Zeiten ----------
def kurzzeit(s): return s.lstrip("0").replace(":00", "").replace(":", ".") if s != "00:00" else "0"
def spanne(z): return " und ".join("–".join(kurzzeit(x) for x in t.split("-")) for t in z.split(",")) + " Uhr"
def zeit_am(o, tag):
    if o.get("immer"): return "0–24 Uhr"
    z = o.get("zeiten", {}).get(str(tag))
    return None if not z else ("vormittags" if z == "vormittags" else spanne(z))
def zeiten_text(o):
    if o.get("immer"): return "Rund um die Uhr, jeden Tag"
    gruppen = []
    for t in REIHE:
        z = o.get("zeiten", {}).get(str(t))
        if not z: continue
        g = next((g for g in gruppen if g[0] == z), None)
        g[1].append(t) if g else gruppen.append([z, [t]])
    s = "; ".join(", ".join(KURZ[t] if len(ts) > 1 else TAGE[t] for t in ts) + " " + ("vormittags" if z == "vormittags" else spanne(z)) for z, ts in gruppen)
    return s + (". " + o["notiz"] if o.get("notiz") else "")
def orte(gruppen): return [o for o in D["orte"] if o["gruppe"] in gruppen.split(",")]
def route(o): return f"https://www.google.com/maps/dir/?api=1&amp;destination={o['lat']},{o['lon']}"

def bild(name, pfad, alt="", klasse="", sizes="(max-width: 900px) 100vw, 30vw", lazy=True, w=640, h=480):
    return (f'<img{f" class={chr(34)}{klasse}{chr(34)}" if klasse else ""} src="{pfad}bilder/{name}-640.webp" '
            f'srcset="{pfad}bilder/{name}-640.webp 640w, {pfad}bilder/{name}.webp 1200w" sizes="{sizes}" '
            f'alt="{e(alt)}"{" loading=" + chr(34) + "lazy" + chr(34) if lazy else ""} width="{w}" height="{h}">')

STATUS = '<p class="ort-status" data-status="{id}"><span class="punkt"></span><span class="status-text">{text}</span></p>'

def finder(attr, p):
    eintr = []
    for o in orte(attr["gruppen"]):
        zt = zeiten_text(o)
        if o["id"] == "hofladen":
            zt = f"Eröffnung 7. November, 10–17 Uhr. Ab 9. November: {zt}"
        eintr.append(f'<li class="ort{" hervor" if o.get("hervor") else ""}" data-ort="{o["id"]}">'
                     f'{bild(o["bild"], p, klasse="ort-bild", sizes="(max-width: 600px) 100vw, 320px")}'
                     f'<div class="ort-text">{STATUS.format(id=o["id"], text="Öffnungszeiten")}'
                     f'<h3 class="ort-name">{e(o["name"])}</h3><p class="ort-adresse">{e(o["adresse"])}</p>'
                     f'<p class="ort-zeiten">{e(zt)}</p></div></li>')
    return f'<ul class="finder">{"".join(eintr)}</ul>'

def steckbriefe(attr, p):
    out = []
    for o in orte(attr["gruppen"]):
        zeilen = "".join(f'<tr data-tag="{t}"><th scope="row">{TAGE[t]}</th><td>{zeit_am(o, t) or "geschlossen"}</td></tr>' for t in REIHE)
        out.append(f'''<article class="station" id="{o["id"]}" data-ort="{o["id"]}">
  {bild(o["bild"], p, klasse="station-bild")}
  <div class="station-text">
    {STATUS.format(id=o["id"], text="Öffnungszeiten")}
    <h3 class="station-name">{e(o["name"])}</h3>
    <p class="station-adresse">{e(o["adresse"])}</p>
    {f'<p class="station-notiz">{e(o["notiz"])}</p>' if o.get("notiz") else ""}
    <table class="station-plan"><caption class="nur-vorleser">Öffnungszeiten {e(o["name"])}</caption><tbody>{zeilen}</tbody></table>
    <a class="station-route" href="{route(o)}" target="_blank" rel="noopener">Route planen<span class="nur-vorleser"> zu {e(o["name"])} (Google Maps, neues Fenster)</span></a>
  </div>
  <div class="station-karte" data-karte="{o["id"]}" role="region" aria-label="Karte {e(o["name"])}"></div>
</article>''')
    return f'<div class="stationen">{"".join(out)}</div>'

def woche(attr, p):
    kopf = "".join(f'<th scope="col" data-tag="{t}"><abbr title="{TAGE[t]}">{KURZ[t]}</abbr></th>' for t in REIHE)
    zeilen = ""
    for o in orte(attr["gruppen"]):
        zellen = ""
        for t in REIHE:
            z = zeit_am(o, t)
            zellen += f'<td data-tag="{t}">' + (f'<span class="ei-mark" aria-hidden="true"></span><small>{z.replace(" und ", "<br>")}</small>' if z else '<span class="zu" aria-hidden="true">–</span><span class="nur-vorleser">geschlossen</span>') + "</td>"
        zeilen += f'<tr><th scope="row">{e(o["name"])}</th>{zellen}</tr>'
    return f'<div class="woche" tabindex="0" role="region" aria-label="Wochenübersicht, waagerecht scrollbar"><table><caption>Alle Verkaufszeiten der Woche</caption><thead><tr><th scope="col">Verkaufsstelle</th>{kopf}</tr></thead><tbody>{zeilen}</tbody></table></div>'

ZEICHEN = {
    "blume": '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="30" r="7"/><circle cx="40" cy="16" r="8"/><circle cx="53" cy="26" r="8"/><circle cx="49" cy="41" r="8"/><circle cx="31" cy="41" r="8"/><circle cx="27" cy="26" r="8"/><path d="M40 47v28M40 64c-8-2-12-8-12-12M40 60c7-1 11-6 12-10"/></svg>',
    "ei": '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 8C26 8 16 32 16 46a24 24 0 0 0 48 0C64 32 54 8 40 8z"/></svg>',
    "bus": '<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="8" y="22" width="58" height="34" rx="5"/><path d="M14 30h46M66 34h6v16h-6"/><circle cx="22" cy="58" r="6"/><circle cx="52" cy="58" r="6"/><path d="M20 30v14M32 30v14M44 30v14"/></svg>',
    "schindel": '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M10 20h60M10 38h60M10 56h60M20 20v18M35 20v18M50 20v18M65 20v18M12 38v18M27 38v18M42 38v18M57 38v18"/><path d="M10 20a5 5 0 0 0 10 0M20 20a5 5 0 0 0 15 0M35 20a5 5 0 0 0 15 0M50 20a5 5 0 0 0 15 0"/></svg>',
}
def chronik(attr, p):
    out = []
    for i, c in enumerate(D["chronik"]):
        b = (f'<div class="bogen">{bild(c["bild"], p, c["alt"], sizes="(max-width: 900px) 100vw, 40vw", lazy=i > 1)}</div>'
             if c.get("bild") else f'<div class="ohne-bild">{ZEICHEN[c["zeichen"]]}</div>')
        out.append(f'<li class="eintrag{" ziel" if c.get("ziel") else ""}"><div class="eintrag-text"><p class="wann">{e(c["wann"])}</p>'
                   f'<h3>{e(c["titel"])}</h3><p>{e(c["text"])}</p></div>{b}</li>')
    return f'<h2 class="nur-vorleser">Chronik</h2><ol class="chronik">{"".join(out)}</ol>'

def fakten(attr, p):
    hof = D["orte"][0]
    bus = orte("bus"); markt = orte("markt")
    fragen = [
        ("Wo kann ich in Deckenpfronn Eier kaufen?",
         f"Im Hofladen in {L['strasse']} (ab 7. November 2026), rund um die Uhr im SB-Lädle in der {B['strasse']} und im Hofbus, der ebenfalls in der {B['strasse']} hält."),
        ("Wann hat der Hofladen geöffnet?", f"Ab 9. November: {zeiten_text(hof)}. Am Eröffnungstag, Samstag 7. November 2026, von 10 bis 17 Uhr."),
        ("Wo hält der Hofbus?", " ".join(f"{o['name'].replace('Hofbus ', '')}: {zeiten_text(o)} ({o['adresse']})." for o in bus)),
        ("Auf welchen Wochenmärkten seid ihr?", " ".join(f"{o['name'].replace('Wochenmarkt ', '')}: {zeiten_text(o)} ({o['adresse']})." for o in markt)),
    ]
    faq = "".join(f'<details><summary>{e(f)}</summary><p>{e(a)}</p></details>' for f, a in fragen)
    return (f'<div class="fakten"><p class="fakten-kurz"><strong>{e(L["name"])}</strong> ist der Hofladen mit Café von {e(B["name"])}, '
            f'einem Familienbetrieb in dritter Generation mit Legehennen. Adresse: {e(L["strasse"])}, {L["plz"]} {L["ort"]} bei Herrenberg (Landkreis Böblingen). '
            f'Geöffnet ab 9. November 2026 {e(zeiten_text(hof))}. Telefon <a href="tel:{B["telefon"].replace(" ", "")}">{B["telefon_anzeige"]}</a>.</p>'
            f'<div class="faq">{faq}</div></div>')

def fuss(attr, p):
    jahr = D["eroeffnung"]["datum"][:4]
    return f'''<footer class="fuss">
  <div class="wrap">
    <div>
      <h2 class="fuss-titel">{e(L["name"])}</h2>
      <p>{e(L["strasse"])}, {L["plz"]} {L["ort"]}<br>Telefon <a href="tel:{B["telefon"].replace(" ", "")}">{B["telefon_anzeige"]}</a><br><a href="mailto:{B["email"]}">{B["email"]}</a></p>
      <h2 class="fuss-titel">{e(B["name"])} &amp; SB-Lädle</h2>
      <p>{e(B["strasse"])}, {B["plz"]} {B["ort"]}</p>
    </div>
    <nav aria-label="Seiten">
      <h2 class="fuss-titel">Seiten</h2>
      <ul class="fuss-liste"><li><a href="./">Hofladen &amp; Hofcafé</a></li><li><a href="unterwegs.html">Hofbus &amp; Märkte</a></li><li><a href="geschichte.html">Unsere Geschichte</a></li><li><a href="{B["instagram"]}" target="_blank" rel="noopener">Instagram<span class="nur-vorleser"> (neues Fenster)</span></a></li></ul>
    </nav>
    <div>
      <h2 class="fuss-titel">Rechtliches</h2>
      <ul class="fuss-liste"><li><a href="impressum.html">Impressum</a></li><li><a href="datenschutz.html">Datenschutz</a></li></ul>
      <p>© {jahr} {e(B["name"])}</p>
    </div>
  </div>
</footer>'''

# ---------- Kopf: Canonical, Open Graph, Strukturdaten ----------
def oh_specs(o, ab=None):
    gruppen = {}
    for t, z in o.get("zeiten", {}).items():
        if z == "vormittags": continue
        for teil in z.split(","):
            gruppen.setdefault(teil, []).append(SCHEMA_TAG[int(t)])
    specs = [{"@type": "OpeningHoursSpecification", "dayOfWeek": tage, "opens": z.split("-")[0], "closes": z.split("-")[1]} for z, tage in gruppen.items()]
    if ab:
        for s in specs: s["validFrom"] = ab
    return specs

def adresse(strasse, plz, ort):
    return {"@type": "PostalAddress", "streetAddress": strasse, "postalCode": plz, "addressLocality": ort, "addressRegion": B["region"], "addressCountry": "DE"}

def strukturdaten(seite, basis):
    org = {"@type": "Organization", "@id": LIVE + "#hof", "name": B["name"], "url": basis, "telephone": B["telefon"], "email": B["email"],
           "address": adresse(B["strasse"], B["plz"], B["ort"]), "sameAs": [B["instagram"]], "description": B["beschreibung"]}
    graph = [org]
    if seite == "index.html":
        hof, laedle = D["orte"][0], D["orte"][1]
        er = D["eroeffnung"]
        graph += [
            {"@type": ["Store", "CafeOrCoffeeShop"], "@id": LIVE + "#hofladen", "name": L["name"], "url": basis, "image": basis + "bilder/teilen.jpg",
             "telephone": B["telefon"], "address": adresse(L["strasse"], L["plz"], L["ort"]),
             "geo": {"@type": "GeoCoordinates", "latitude": hof["lat"], "longitude": hof["lon"]}, "parentOrganization": {"@id": LIVE + "#hof"},
             "openingHoursSpecification": oh_specs(hof, D["eroeffnung"]["regulaer_ab"]),
             "specialOpeningHoursSpecification": [{"@type": "OpeningHoursSpecification", "validFrom": er["datum"], "validThrough": er["datum"], "opens": er["von"], "closes": er["bis"]}]},
            {"@type": "Store", "@id": LIVE + "#sb-laedle", "name": f"SB-Lädle {B['name']}", "address": adresse(B["strasse"], B["plz"], B["ort"]),
             "geo": {"@type": "GeoCoordinates", "latitude": laedle["lat"], "longitude": laedle["lon"]}, "parentOrganization": {"@id": LIVE + "#hof"},
             "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": SCHEMA_TAG, "opens": "00:00", "closes": "23:59"}]},
            {"@type": "Event", "name": f"Eröffnung {L['name']}", "startDate": f"{er['datum']}T{er['von']}+01:00", "endDate": f"{er['datum']}T{er['bis']}+01:00",
             "eventStatus": "https://schema.org/EventScheduled", "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
             "location": {"@id": LIVE + "#hofladen"}, "organizer": {"@id": LIVE + "#hof"}, "image": basis + "bilder/teilen.jpg",
             "description": f"Eröffnung von {L['name']} in {L['strasse']}, {L['ort']}. Am Eröffnungstag: {er['special']}."},
        ]
    elif seite == "unterwegs.html":
        graph.append({"@type": "Store", "name": f"Hofbus – mobiler Hofladen von {B['name']}", "parentOrganization": {"@id": LIVE + "#hof"},
                      "url": basis + "unterwegs.html", "telephone": B["telefon"],
                      "location": [{"@type": "Place", "name": o["name"], "address": o["adresse"],
                                    "geo": {"@type": "GeoCoordinates", "latitude": o["lat"], "longitude": o["lon"]},
                                    "openingHoursSpecification": oh_specs(o)} for o in orte("bus,markt")]})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)

FARBE = {"eroeffnung": "#F3EFE6", "hofbus": "#3D4718", "hofgeschichte": "#FBFAF7"}
def kopf(seite, entwurf, basis):
    titel, beschr = SEITEN[seite]
    url = basis + ("" if seite == "index.html" else seite)
    return f'''<link rel="canonical" href="{url}">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="{FARBE[entwurf]}">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="{e(L["name"])}">
<meta property="og:title" content="{e(titel)}">
<meta property="og:description" content="{e(beschr)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{basis}bilder/teilen.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<script type="application/ld+json">
{strukturdaten(seite, basis)}
</script>'''

BAUSTEINE = {"finder": finder, "steckbriefe": steckbriefe, "woche": woche, "chronik": chronik, "fakten": fakten, "fuss": fuss}
MARKER = re.compile(r'<!-- hof:(\w+)((?:\s+\w+="[^"]*")*)\s*-->.*?<!-- /hof:\1 -->', re.S)

def befüllen(text, seite, entwurf, basis, pfad="../"):
    def ersetze(m):
        name, attrs = m.group(1), dict(re.findall(r'(\w+)="([^"]*)"', m.group(2)))
        inhalt = kopf(seite, entwurf, basis) if name == "kopf" else BAUSTEINE[name](attrs, pfad)
        return f"<!-- hof:{name}{m.group(2)} -->\n{inhalt}\n<!-- /hof:{name} -->"
    text = MARKER.sub(ersetze, text)
    titel, beschr = SEITEN[seite]
    text = re.sub(r"<title>.*?</title>", f"<title>{e(titel)}</title>", text, count=1)
    text = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(beschr)}">', text, count=1)
    return text

# ---------- Rechtliches ----------
def impressum():
    return f'''<h1>Impressum</h1>
<p class="hinweis-entwurf">Entwurf – vor dem Livegang bitte rechtlich prüfen und mit dem Hof abstimmen, welcher Betrieb hier genannt wird.</p>
<h2>Angaben gemäß § 5 DDG</h2>
<p>{e(B["name"])}<br>{e(B["strasse"])}<br>{B["plz"]} {B["ort"]}</p>
<p>Geschäftsführer: {e(B["verantwortlich"])}<br>Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: {B["ust_id"]}</p>
<h2>Hofladen &amp; Hofcafé</h2>
<p>{e(L["gmbh"])}<br>{e(L["strasse"])}<br>{L["plz"]} {L["ort"]}</p>
<p>Registergericht: {e(L["register"])}<br>Geschäftsführerin: {e(L["geschaeftsfuehrung"])}<br>Umsatzsteuer-Identifikationsnummer: [bitte ergänzen]</p>
<h2>Kontakt</h2>
<p>Telefon: <a href="tel:{B["telefon"].replace(" ", "")}">{B["telefon"]}</a><br>E-Mail: <a href="mailto:{B["email"]}">{B["email"]}</a></p>
<h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
<p>{e(B["verantwortlich"])}, {e(B["strasse"])}, {B["plz"]} {B["ort"]}</p>
<h2>Verbraucherstreitbeilegung</h2>
<p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
<h2>Bildnachweis</h2>
<p>Alle Fotos: {e(B["name"])}. Kartendaten nach Klick: © OpenStreetMap-Mitwirkende.</p>'''

def datenschutz():
    return f'''<h1>Datenschutzerklärung</h1>
<p class="hinweis-entwurf">Entwurf – vor dem Livegang bitte rechtlich prüfen und den Hosting-Anbieter eintragen.</p>
<h2>1. Verantwortlich</h2>
<p>{e(B["name"])}, {e(B["strasse"])}, {B["plz"]} {B["ort"]}<br>Telefon {B["telefon"]}, E-Mail <a href="mailto:{B["email"]}">{B["email"]}</a></p>
<h2>2. Hosting und Server-Protokolle</h2>
<p>Diese Website wird bei [Hosting-Anbieter mit vollständiger Anschrift eintragen, z. B. STRATO] betrieben. Beim Aufruf speichert der Server automatisch technische Daten in Protokolldateien: IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, übertragene Datenmenge, die zuvor besuchte Seite und den verwendeten Browser. Das ist nötig, um die Website sicher und stabil auszuliefern (Art. 6 Abs. 1 lit. f DSGVO). Die Protokolle werden vom Anbieter nach kurzer Zeit gelöscht. Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung.</p>
<h2>3. Keine Cookies, keine Analyse</h2>
<p>Wir setzen keine Cookies und keine Analyse- oder Werbewerkzeuge ein. Schriften und Programmbibliotheken liegen auf unserem eigenen Server; beim normalen Besuch werden keine Daten an Dritte übertragen.</p>
<h2>4. Karten von OpenStreetMap</h2>
<p>Karten werden erst angezeigt, wenn du auf „Karte anzeigen“ klickst. Erst dann lädt dein Browser Kartenkacheln von den Servern der OpenStreetMap Foundation, St John’s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, Großbritannien. Dabei wird deine IP-Adresse an diese Server übertragen. Rechtsgrundlage ist deine Einwilligung durch den Klick (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Für Großbritannien besteht ein Angemessenheitsbeschluss der EU-Kommission. Damit du nicht bei jeder Seite neu klicken musst, merkt sich dein Browser die Zustimmung im lokalen Speicher (Eintrag „hof-karte-erlaubt“). Du kannst sie widerrufen, indem du die Website-Daten in deinem Browser löschst. Datenschutzerklärung der OpenStreetMap Foundation: <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener">osmfoundation.org<span class="nur-vorleser"> (neues Fenster)</span></a>.</p>
<h2>5. Links zu Google Maps und Instagram</h2>
<p>„Route planen“ und „Instagram“ sind einfache Links. Erst wenn du sie anklickst, wechselst du zum jeweiligen Anbieter; dort gelten dessen Datenschutzbestimmungen.</p>
<h2>6. Kontakt per E-Mail oder Telefon</h2>
<p>Wenn du uns kontaktierst, verarbeiten wir deine Angaben, um deine Anfrage zu beantworten (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Wir löschen sie, wenn sie nicht mehr gebraucht werden und keine Aufbewahrungspflicht besteht.</p>
<h2>7. Deine Rechte</h2>
<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, eine Einwilligung jederzeit zu widerrufen. Außerdem kannst du dich bei einer Aufsichtsbehörde beschweren, zum Beispiel beim Landesbeauftragten für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart.</p>
<p>Stand: Oktober 2026</p>'''

def rechtsseite(entwurf, name, inhalt):
    vorlage = open(os.path.join(ROOT, entwurf, "geschichte.html"), encoding="utf-8").read()
    kopfteil = vorlage.split('<main id="inhalt">')[0].replace(' aria-current="page"', "")
    rest = vorlage.split("</main>", 1)[1]
    return kopfteil + f'<main id="inhalt">\n<section class="abschnitt rechtliches"><div class="wrap">\n{inhalt}\n</div></section>\n</main>' + rest

# ---------- Ablauf ----------
def main():
    open(os.path.join(ROOT, "gemeinsam", "daten.js"), "w", encoding="utf-8").write(
        "// Automatisch erzeugt aus daten.json (werkzeuge/bauen.py) – nicht von Hand ändern.\nwindow.HOF_DATEN = "
        + json.dumps({"orte": D["orte"], "eroeffnung": D["eroeffnung"]}, ensure_ascii=False) + ";\n")
    for ent in ENTWÜRFE:
        for name, inhalt in (("impressum.html", impressum()), ("datenschutz.html", datenschutz())):
            open(os.path.join(ROOT, ent, name), "w", encoding="utf-8").write(rechtsseite(ent, name, inhalt))
        for seite in SEITEN:
            f = os.path.join(ROOT, ent, seite)
            t = befüllen(open(f, encoding="utf-8").read(), seite, ent, VORSCHAU.format(e=ent))
            open(f, "w", encoding="utf-8").write(t)
    print("Seiten gebaut.")
    if "--ohne-paket" not in sys.argv: pakete()

def pakete():
    ziel = os.path.join(ROOT, "livegang")
    shutil.rmtree(ziel, ignore_errors=True)
    for ent in ENTWÜRFE:
        z = os.path.join(ziel, ent); os.makedirs(z)
        for seite in SEITEN:
            t = open(os.path.join(ROOT, ent, seite), encoding="utf-8").read()
            t = befüllen(t, seite, ent, LIVE, pfad="")
            t = re.sub(r"\.\./(bilder|gemeinsam)/", r"\1/", t)
            t = re.sub(r'\s*<a class="entwurf"[^>]*>.*?</a>', "", t)  # Entwurfs-Schild raus
            # noindex bleibt drin, bis der Hof die Freigabe gibt
            open(os.path.join(z, seite), "w", encoding="utf-8").write(t)
        shutil.copy(os.path.join(ROOT, ent, "stil.css"), z)
        shutil.copytree(os.path.join(ROOT, "gemeinsam"), os.path.join(z, "gemeinsam"))
        shutil.copytree(os.path.join(ROOT, "bilder"), os.path.join(z, "bilder"))
        open(os.path.join(z, "sitemap.xml"), "w", encoding="utf-8").write(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"  <url><loc>{LIVE}{'' if s == 'index.html' else s}</loc></url>\n" for s in SEITEN) + "</urlset>\n")
        open(os.path.join(z, "robots.txt"), "w", encoding="utf-8").write(f"User-agent: *\nAllow: /\n\nSitemap: {LIVE}sitemap.xml\n")
        open(os.path.join(z, "llms.txt"), "w", encoding="utf-8").write(llms())
        open(os.path.join(z, ".htaccess"), "w", encoding="utf-8").write(HTACCESS)
        shutil.make_archive(os.path.join(ziel, f"livegang-{ent}"), "zip", z)
    print("Livegang-Pakete in livegang/ erstellt.")

def llms():
    hof = D["orte"][0]
    zeilen = "\n".join(f"- {o['name']}, {o['adresse']}: {zeiten_text(o)}" for o in D["orte"])
    return f"""# {B['name']} – {L['name']}

> {B['beschreibung']} Neuer Hofladen mit Hofcafé in {L['strasse']}, {L['plz']} {L['ort']}, Eröffnung am 7. November 2026 (10–17 Uhr).

## Verkaufsstellen und Zeiten
{zeilen}

## Kontakt
- Telefon: {B['telefon']}
- E-Mail: {B['email']}
- Instagram: {B['instagram']}

## Seiten
- [Hofladen & Hofcafé]({LIVE}): Eröffnung, Öffnungszeiten, Sortiment, Anfahrt
- [Hofbus & Wochenmärkte]({LIVE}unterwegs.html): alle Stationen mit Zeiten
- [Unsere Geschichte]({LIVE}geschichte.html): Chronik des Betriebs
"""

HTACCESS = """# Caching und Kompression (STRATO / Apache)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml text/plain application/xml
</IfModule>
# Immer HTTPS und mit www
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off [OR]
  RewriteCond %{HTTP_HOST} !^www\\. [NC]
  RewriteRule ^ https://www.huehnerhof-schneider.de%{REQUEST_URI} [L,R=301]
</IfModule>
"""

if __name__ == "__main__":
    main()
