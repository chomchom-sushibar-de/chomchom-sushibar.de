# Chôm Chôm Sushibar

Statische Website für die Chôm Chôm Sushibar in Sauerlach (vietnamesische Küche &amp; Sushi). Nur HTML, CSS und ein kleines JavaScript für Theme-Umschalter und mobiles Menü. Kein Build-Schritt, keine externen Schriften/Skripte – schnell, günstig und leicht zu pflegen.

## Veröffentlichung

Ein Push auf `main` startet `.github/workflows/pages.yml` und veröffentlicht die Website über GitHub Pages.

## Inhaltliche Basis

Adresse, Telefonnummer, Öffnungszeiten und Impressumsangaben (Inh. Hoang Bao Du Pham) stammen von der bisherigen, öffentlich erreichbaren Website `chomchom-sushibar.de`. Die Speisekarte (`speisekarte.html`) wurde direkt aus den beiden dort verlinkten PDF-Preislisten übertragen (Stand November 2025); die Original-PDFs liegen zusätzlich unter `menu/` und sind auf der Speisekarten-Seite verlinkt.

Farbpalette (Anthrazit `#2b2d2e`, warmes Off-White `#f6f4f1`, Holz-Gold-Akzent) und die Ambiente-Fotos in `img/ambiente-*.jpg` orientieren sich bewusst an der bisherigen Website und den dort veröffentlichten eigenen Handyfotos des Lokals (datiert 11.10.2024) – nicht an den zusätzlich auf der alten Seite eingebundenen generischen Stock-Food-Fotos (Sushi-Platte mit Orchidee, Lachs mit Kapern, Fingerfood-Buffet etc.), die nicht das eigene Lokal zeigen und daher hier nicht übernommen wurden.

## Vor dem produktiven Einsatz

- [x] Betreiber (Hoang Bao Du Pham) telefonisch kontaktiert – Entwurf wird ihm gezeigt.
- [ ] Freigabe der Inhalte (insb. Speisekarte, Öffnungszeiten, verwendete Fotos) durch den Betreiber einholen.
- [ ] Aktuelle Preise/Gerichte gegen die im Lokal ausliegende Karte gegenchecken, falls sich seit November 2025 etwas geändert hat.
- [ ] Bei Bedarf eigene, aktuellere Fotos vom Lokal/Gerichten ergänzen.
- [ ] DNS für `chomchom-sushibar.de` auf GitHub Pages zeigen lassen (Custom-Domain-Einstellung in den Repo-Settings) und CNAME-Datei anlegen, sobald der Betreiber zustimmt.
