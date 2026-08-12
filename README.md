# Musikverein St. Michael Marbeck — Website

Neubau der Vereinswebsite: statisches HTML/CSS/JS, keine Datenbank, kein Build-Schritt.
Einfach die Dateien auf den Webspace laden — fertig.

```
mv-marbeck/
├── index.html            Startseite (Verein, Orchester, Ausbildung, Termine, Kontakt)
├── veranstaltungen.html  Alle Termine mit Filter (kommend / vergangen / alle)
├── impressum.html
├── datenschutz.html
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css     komplettes Design-System
    ├── js/main.js        Animationen & Interaktion (ohne Fremdbibliotheken)
    └── img/              Fotos & Wappen
```

## Lokal ansehen

```bash
python3 -m http.server 4321 --directory mv-marbeck
```

Dann <http://localhost:4321> im Browser öffnen.

## Veröffentlichen

Den Inhalt des Ordners `mv-marbeck/` in das Web-Verzeichnis des Hosters kopieren
(z. B. per FTP nach `httpdocs/` oder `public_html/`). Es wird kein PHP, kein Laravel
und keine Datenbank benötigt.

## Termine pflegen

Termine stehen direkt im HTML — je Termin ein `<li class="event">`.
Wichtig ist nur das Attribut `data-date` im Format `JJJJ-MM-TTTHH:MM`:
Daraus erkennt die Seite automatisch, ob ein Termin in der Zukunft oder
Vergangenheit liegt (vergangene werden ausgegraut und im Filter „Vergangen"
einsortiert).

```html
<li class="event" data-date="2026-12-18T19:30">
  <button class="event__head" aria-expanded="false">
    <span class="event__date"><b>18</b><i>Dez</i></span>
    <span class="event__main">
      <span class="event__title">Adventskonzert <span class="tag">Konzert</span></span>
      <span class="event__meta">19:30 Uhr · Kirche St. Michael Marbeck</span>
    </span>
    <span class="event__toggle" aria-hidden="true"></span>
  </button>
  <div class="event__panel"><div>
    <p>Beschreibungstext …</p>
  </div></div>
</li>
```

* `<span class="tag">…</span>` ist optional (goldene Markierung, z. B. „Konzert").
* `class="event event--highlight"` hebt einen Termin zusätzlich hervor.
* Auf der Startseite stehen die nächsten Termine, in `veranstaltungen.html` alle.
  Neue Termine am besten an beiden Stellen eintragen.

## Farben & Schrift

Alle Farben liegen als CSS-Variablen ganz oben in `assets/css/style.css` (`:root`).
Eine Zeile ändern reicht, um das ganze Design umzufärben.

| Variable | Bedeutung |
|---|---|
| `--ink` | dunkles Nachtblau (Hintergrund) |
| `--navy` | Vereinsblau aus dem Wappen (`#214998`) |
| `--brass` | Messing/Gold (Akzent) |
| `--cream` | heller Papierton |

Schriften: **Fraunces** (Überschriften) und **Inter** (Fließtext), geladen über
Google Fonts. Sollen keine Google-Server genutzt werden, können beide Schriften
lokal in `assets/fonts/` abgelegt und per `@font-face` eingebunden werden — dann
entfällt auch der entsprechende Absatz in der Datenschutzerklärung.

## Barrierefreiheit & Technik

* Tastaturbedienbar, „Zum Inhalt springen"-Link, sichtbare Fokusringe.
* `prefers-reduced-motion` wird respektiert: Wer im Betriebssystem reduzierte
  Bewegung eingestellt hat, bekommt die Seite ohne Animationen.
* Bilder als WebP, Fotos unterhalb des ersten Bildschirms werden lazy geladen.
* Strukturierte Daten (schema.org `MusicGroup`) für Google.

## Vorstand ergänzen

Der Abschnitt „Vorstand" (`index.html`, `<section id="vorstand">`) zeigt aktuell drei
Karten: Vorsitzender, Musikalische Leitung, Ausbildung. Direkt darunter steht ein
auskommentierter Vorlage-Block — einfach kopieren, Kürzel (zwei Buchstaben fürs
Monogramm), Amt, Name und eine kurze Beschreibung eintragen. Die Karten ordnen sich
automatisch in drei Spalten (zwei auf Tablet, eine auf dem Handy).

## Noch zu prüfen

* **Impressum**: Rechtsform und ggf. Vereinsregister/Registernummer ergänzen,
  falls der Verein eingetragen ist (e. V.).
* **Login**: Die alte Seite hatte einen Redaktionsbereich (`/login`). Diese Version
  ist bewusst statisch — Inhalte werden direkt im HTML gepflegt.
* **Fotos**: Es liegen bisher nur vier Vereinsfotos vor. Mehr Bildmaterial
  (Konzert, Youngster, Ausbildung) würde der Seite guttun.
