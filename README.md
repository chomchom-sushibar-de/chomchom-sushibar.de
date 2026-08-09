# Chôm Chôm Sushibar

Statische Website für die Chôm Chôm Sushibar in Sauerlach (vietnamesische Küche &amp; Sushi). Nur HTML, CSS und ein kleines JavaScript für Theme-Umschalter und mobiles Menü. Kein Build-Schritt, keine externen Schriften/Skripte – schnell, günstig und leicht zu pflegen.

## Veröffentlichung

Ein Push auf `main` startet `.github/workflows/pages.yml` und veröffentlicht die Website über GitHub Pages.

## Inhaltliche Basis

Adresse, Telefonnummer, Öffnungszeiten und Impressumsangaben (Inh. Hoang Bao Du Pham) stammen von der bisherigen, öffentlich erreichbaren Website `chomchom-sushibar.de`. Die Speisekarte (`speisekarte.html`) wurde direkt aus den beiden dort verlinkten PDF-Preislisten übertragen (Stand November 2025); die Original-PDFs liegen zusätzlich unter `menu/` und sind auf der Speisekarten-Seite verlinkt.

Bewusst verzichtet wurde auf die Fotos der bisherigen Seite (Bildrechte ungeklärt) – stattdessen kommen selbst gezeichnete SVG-Icons und ein reines Typografie-/Farbkonzept zum Einsatz.

## Vor dem produktiven Einsatz

- [ ] Mit dem Betreiber abstimmen, ob/wie die Inhalte (insb. Speisekarte, Öffnungszeiten) freigegeben werden.
- [ ] Aktuelle Preise/Gerichte gegen die im Lokal ausliegende Karte gegenchecken, falls sich seit November 2025 etwas geändert hat.
- [ ] Eigene Fotos vom Lokal/Gerichten ergänzen, sobald vorhanden.
- [ ] DNS für `chomchom-sushibar.de` auf GitHub Pages zeigen lassen (Custom-Domain-Einstellung in den Repo-Settings) und CNAME-Datei anlegen, sobald der Betreiber zustimmt.
