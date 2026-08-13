# Chôm Chôm Sushibar

Statische DE/EN-Website für die Chôm Chôm Sushibar in Sauerlach
(vietnamesische Küche &amp; Sushi). Die ausgelieferte Seite bleibt pures HTML, CSS
und JavaScript ohne App-Backend, externe Schriften oder Online-Checkout. Ein
kleiner Node-Build validiert Inhalte, erzeugt die Speisekarte und bündelt den
GitHub-Pages-Stand reproduzierbar nach `dist/`.

Die Startseite führt mit vorhandenen Food-Fotos und den beiden Küchen; Google-
Bewertungen sind bewusst ein nachrangiger Vertrauenshinweis statt der Hauptinhalt.

## Veröffentlichung

Ein Push auf `main` startet `.github/workflows/pages.yml`. Der Workflow validiert
Schema und Menügleichheit, führt Browser-/Accessibility-/Visual- und Lighthouse-
Prüfungen aus, baut `dist/` und veröffentlicht ausschließlich dieses Artefakt über
GitHub Pages. Pull Requests laufen zusätzlich durch
`.github/workflows/quality.yml`.

## Lokale Entwicklung und Prüfung

```sh
npm ci
npx playwright install chromium
npm test
npm run lighthouse
npm run release:check
npm run build
```

Das versionierte kanonische Menü liegt in `data/menu.v1.json`; `npm run
menu:generate` erzeugt daraus Menü-HTML, strukturierte Daten und die Daten für den
telefonischen Auswahlhelfer. Preise werden als Integer-Cents verarbeitet. Details:
[`docs/MENU_DATA_MODEL.md`](docs/MENU_DATA_MODEL.md).

Hinweisbanner, die normalisierten Öffnungszeiten sowie Menüeinträge und
Verfügbarkeit können über Decap CMS im Editorial-/Pull-Request-Workflow gepflegt
werden. Schema- und Semantikfehler blockieren CI. Der externe Auth-Dienst bleibt
eine separat zu prüfende Betriebsgrenze; die ausgelieferte Website benötigt ihn
nicht.

## Inhaltliche Basis

Adresse, Telefonnummer, Öffnungszeiten und Impressumsangaben (Inh. Hoang Bao Du Pham) stammen von der bisherigen, öffentlich erreichbaren Website `chomchom-sushibar.de`. Die Speisekarte (`speisekarte.html`) wurde direkt aus den beiden dort verlinkten PDF-Preislisten übertragen (Stand November 2025); die Original-PDFs liegen zusätzlich unter `menu/` und sind auf der Speisekarten-Seite verlinkt.

Farbpalette (Anthrazit `#2b2d2e`, warmes Off-White `#f6f4f1`, Holz-Gold-Akzent) und die Ambiente-Fotos in `img/ambiente-*.jpg` orientieren sich bewusst an der bisherigen Website und den dort veröffentlichten eigenen Handyfotos des Lokals (datiert 11.10.2024) – nicht an den zusätzlich auf der alten Seite eingebundenen generischen Stock-Food-Fotos (Sushi-Platte mit Orchidee, Lachs mit Kapern, Fingerfood-Buffet etc.), die nicht das eigene Lokal zeigen und daher hier nicht übernommen wurden.

## Vor dem produktiven Einsatz

Die verbindliche Launch- und Wartungsliste liegt ausschließlich in
[`.agent/TODO.md`](.agent/TODO.md). Die GitHub-Pages-Vorschau funktioniert; die
öffentliche Domain zeigte beim Agent-Handoff am 13.08.2026 noch nicht auf diese
Pages-Site. Die clientseitige Vorschau-Sperre ist keine Zugriffskontrolle.

Technische Nachweise und die klare Trennung zu externen Freigaben stehen in
[`docs/VERIFICATION_MATRIX.md`](docs/VERIFICATION_MATRIX.md) und
[`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md). Nicht umgesetzte
Produkterweiterungen stehen ausschließlich in
[`docs/NICE_TO_HAVE.md`](docs/NICE_TO_HAVE.md).
