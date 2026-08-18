# Chôm Chôm Sushibar

Statische Website für die Chôm Chôm Sushibar in Sauerlach (vietnamesische Küche &amp; Sushi). Nur HTML, CSS und ein kleines JavaScript für Theme-Umschalter und mobiles Menü. Kein Build-Schritt, keine externen Schriften/Skripte – schnell, günstig und leicht zu pflegen.

## Veröffentlichung

Der Decap-Editorial-Workflow legt Änderungen als Pull Request nach `main` vor.
Ein aktives GitHub-Ruleset muss Review und Prüfungen erzwingen; erst der Merge
löst `.github/workflows/pages.yml` aus und veröffentlicht die Website über
GitHub Pages. Die erforderlichen Regeln und externen Sicherheitsgrenzen sind in
[`docs/CMS_WORKFLOW.md`](docs/CMS_WORKFLOW.md) dokumentiert.

## Inhaltliche Basis

Adresse, Telefonnummer, Öffnungszeiten und Impressumsangaben (Inh. Hoang Bao Du Pham) stammen von der bisherigen, öffentlich erreichbaren Website `chomchom-sushibar.de`. Die Speisekarte (`speisekarte.html`) wurde direkt aus den beiden dort verlinkten PDF-Preislisten übertragen (Stand November 2025); die Original-PDFs liegen zusätzlich unter `menu/` und sind auf der Speisekarten-Seite verlinkt.

Farbpalette (Anthrazit `#2b2d2e`, warmes Off-White `#f6f4f1`, Holz-Gold-Akzent) und die Ambiente-Fotos in `img/ambiente-*.jpg` orientieren sich bewusst an der bisherigen Website und den dort veröffentlichten eigenen Handyfotos des Lokals (datiert 11.10.2024) – nicht an den zusätzlich auf der alten Seite eingebundenen generischen Stock-Food-Fotos (Sushi-Platte mit Orchidee, Lachs mit Kapern, Fingerfood-Buffet etc.), die nicht das eigene Lokal zeigen und daher hier nicht übernommen wurden.

## Vor dem produktiven Einsatz

Die verbindliche Launch- und Wartungsliste liegt ausschließlich in
[`.agent/TODO.md`](.agent/TODO.md). Die GitHub-Pages-Vorschau funktioniert; die
öffentliche Domain zeigte beim Agent-Handoff am 13.08.2026 noch nicht auf diese
Pages-Site. Die clientseitige Vorschau-Sperre ist keine Zugriffskontrolle.
