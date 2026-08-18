# Decap CMS: Editorial- und Pull-Request-Workflow

Stand: 20. August 2026. Dieses Dokument trennt die beteiligten
Sicherheitsgrenzen. Keine einzelne CMS-Option ersetzt GitHub-Berechtigungen,
Review-Regeln oder Deployment-Grenzen.

## Nachgewiesener Ausgangszustand

PR #1 und PR #2 zweigten bei `fec93d7` ab. Vor der Konsolidierung zeigte
`origin/main` auf `3dda2a6`; dieser neuere Stand ist in PR #1 integriert. Am
Ausgangspunkt der beiden PRs galt:

- `admin/config.yml` verwendete das GitHub-Backend, das Repository
  `chomchom-sushibar-de/chomchom-sushibar.de`, den Veröffentlichungsbranch
  `main`, den externen OAuth-Dienst
  `https://chomchom-cms-auth.chomchom-cms-auth.workers.dev` und den Endpunkt
  `auth`.
- `publish_mode` fehlte. Decap verwendet dann den Simple Mode und speichert
  Änderungen unmittelbar im konfigurierten Veröffentlichungsbranch.
- `open_authoring`, `squash_merges`, `cms_label_prefix` und
  `show_preview_links` fehlten ebenfalls.
- `admin/index.html` lud `decap-cms@^3.0.0`. Das war kein exakter Pin. Bei der
  Prüfung löste der Bereich über unpkg zu Version 3.15.1 auf.
- Die einzige editierbare Datei war `data/site.json`: ein Hinweisbanner und
  vier Zeilen für Öffnungszeiten. Die Medienpfade waren und bleiben
  `media_folder: img` und `public_folder: img`.
- `.github/workflows/pages.yml` lief bei einem Push auf `main` und zusätzlich
  manuell über `workflow_dispatch`. Auf `main` gab es keinen PR-Prüfworkflow.
- GitHub meldete keine Branch-Protection, kein aktives Ruleset und keine auf
  `main` angewandten Regeln. Der einzige sichtbare Collaborator hatte
  Admin- und Pushrechte. Direkte Pushes auf `main` waren damit möglich.
- GitHub Pages verwendete GitHub Actions, war auf `main` und `/` ausgerichtet
  und hatte eine Environment-Branch-Policy für `main`; Admins konnten diese
  Policy umgehen. Merge-, Rebase- und Squash-Merges waren erlaubt.
- GitHub Actions war aktiviert und erlaubte alle Actions ohne verpflichtende
  SHA-Pins. Der Standard-`GITHUB_TOKEN` hatte nur Leserechte und durfte keine
  Reviews freigeben. Workflows aus Forks brauchten bei erstmaligen Beitragenden
  zunächst eine Maintainerfreigabe.
- Draft PR #1 ist die funktionale Basis und erweitert das CMS auf das kanonische
  Menümodell. Die anwendbaren Sicherheitsgrenzen aus Draft PR #2 werden dort
  konsolidiert; PR #2 wird nicht separat gemergt.

## Zielkonfiguration im Repository

`admin/config.yml` setzt jetzt:

```yaml
backend:
  name: github
  repo: chomchom-sushibar-de/chomchom-sushibar.de
  branch: main
  base_url: https://chomchom-cms-auth.chomchom-cms-auth.workers.dev
  auth_endpoint: auth
  squash_merges: true
  open_authoring: true
  cms_label_prefix: decap-cms/

publish_mode: editorial_workflow
show_preview_links: false
```

`admin/index.html` lädt passend zur geprüften Implementierung exakt Decap CMS
3.15.1 statt eines veränderlichen 3.x-Bereichs. Ein Versionswechsel braucht
damit künftig einen sichtbaren Pull Request und eine erneute Prüfung.

Der bestehende Workflow `.github/workflows/quality.yml` führt unter dem stabilen
Checknamen `Combined quality and CMS safety` alle Qualitäts- und CMS-Prüfungen
zusammen. Er läuft für Pull Requests nach `main` mit ausschließlich lesendem
`GITHUB_TOKEN`, prüft Editorial-Konfiguration, die Allowlist
`data/site.json`/`data/menu.v1.json`, beide Datenmodelle, den PR-Diff und die
Pages-Grenze und führt anschließend die vollständige technische Suite aus. Er
deployt nichts und verwendet bewusst nicht `pull_request_target`. Ein zweiter,
widersprüchlicher CMS-Workflow existiert nicht.

Bei einem erstmaligen Open-Authoring-Beitrag aus einem Fork muss ein Maintainer
den sicheren Workflowlauf einmal auf GitHub freigeben. Danach laufen die
Prüfschritte automatisch; diese Schutzfunktion darf nicht durch einen
schreibenden Token oder `pull_request_target` umgangen werden.

Der Pages-Workflow besitzt keinen manuellen oder PR-Trigger. Er läuft nur bei
einem Push auf `main` und veröffentlicht ausschließlich das validierte `dist/`.
Erst ein aktives GitHub-Ruleset macht aus „Push auf `main`“ beweisbar „Merge
eines geprüften Pull Requests“.

## 1. Authentifizierung

Der Cloudflare-Worker vermittelt die GitHub-OAuth-Anmeldung. Er entscheidet
nicht über Reviews oder Branch-Regeln; der resultierende GitHub-Token handelt
mit den Rechten des angemeldeten Kontos. Quellcode, Deployment-Konfiguration,
OAuth-Scopes, Secrets, Protokollierung und Token-Aufbewahrung des Workers sind
in keinem verbundenen Repository verifiziert. Der Worker bleibt deshalb eine
externe, noch zu auditierende Sicherheitsgrenze.

Für den Betrieb sind mindestens Callback-URL, OAuth-App-Eigentümer,
angeforderte Scopes, Secret-Rotation, erlaubte Origins, `postMessage`-Ziel,
Logging und Fehlermeldungen separat zu prüfen. Tokens und Secrets gehören
niemals in dieses Repository oder in Screenshots.

## 2. GitHub-Berechtigung

OAuth kann einem Benutzer keine höheren Repository-Rechte geben als dessen
GitHub-Konto bereits besitzt. Ein Benutzer ohne Schreibrecht arbeitet durch
`open_authoring: true` in einem Fork. Ein Benutzer mit Schreib- oder
Adminrecht arbeitet dagegen weiterhin im Ursprungsrepository.

Deshalb ist ein aktives Ruleset für `main` zwingend. Ohne Ruleset könnten
Schreibberechtigte Decap umgehen und direkt pushen. Die CMS-Konfiguration ist
eine Workflow-Vorgabe, keine Zugriffskontrolle.

## 3. CMS-Branching

`publish_mode: editorial_workflow` bewirkt bei normalen Inhaltsspeicherungen:

- Benutzer mit Schreibrecht speichern in einem `cms/...`-Branch des
  Ursprungsrepositories.
- Open-Authoring-Benutzer speichern in einem Branch ihres Forks.
- Weitere Entwurfsänderungen ergänzen denselben Branch; `main` bleibt bis zum
  Merge unverändert.

`backend.branch: main` bleibt korrekt: Es bezeichnet den veröffentlichten
Basis- und Zielbranch, nicht den Entwurfsbranch.

Wichtig für Medien: In Decap CMS 3.15.1 werden Medien, die zusammen mit einem
Eintrag gespeichert werden, Teil des Editorial-Commits. Die eigenständige
Media-Library-Aktion ruft dagegen den Backend-Medienpfad ohne
Editorial-Workflow-Option auf und versucht bei Schreibberechtigten einen
Commit auf den Veröffentlichungsbranch. Da dieses CMS keine Bild- oder
Dateifelder anbietet und Fotoänderungen nicht freigegeben sind, darf die
eigenständige Media Library nicht verwendet werden. Das verpflichtende
`main`-Ruleset muss solche Versuche technisch blockieren; sie können dann
fehlschlagen, aber `main` nicht verändern.

## 4. Pull-Request-Erzeugung

Bei einem Benutzer mit Schreibrecht erstellt Decap beim ersten gespeicherten
Entwurf den `cms/...`-Branch und den Pull Request. Bei Open Authoring entsteht
der Pull Request aus dem Fork, sobald der Benutzer den Entwurf auf „Ready to
Review“ setzt. Open-Authoring-Benutzer können nicht selbst veröffentlichen.

`cms_label_prefix: decap-cms/` kennzeichnet die von Decap verwendeten
Workflow-Labels. `show_preview_links: false` unterbindet Preview-Links im CMS;
der Pages-Workflow erzeugt ohnehin keine PR-Deployments.

## 5. Review

Der Maintainer prüft auf GitHub mindestens:

- Der PR zielt auf `main` und stammt aus einem `cms/...`-Branch oder einem
  erwarteten Fork.
- Der Diff enthält nur die ausdrücklich freigegebene Änderung in
  `data/site.json` oder `data/menu.v1.json`. Die CI-Allowlist verwirft in einem
  erkannten CMS-PR jeden anderen Pfad, insbesondere Workflows, JavaScript, CSS,
  HTML, Legaltexte und Bilder.
- Änderungen an Öffnungszeiten, Menü, Preisen oder Gerichten liegen nur mit
  dokumentierter Operatorfreigabe vor. Fotos, Rechtstexte, sonstige
  Restaurantdaten, Design, Domain, Preview-Gate und Bestellhelfer gehören nicht
  in einen Routine-CMS-PR.
- Der Check `Combined quality and CMS safety` ist erfolgreich und alle Gespräche sind
  aufgelöst.
- Es gibt keine unerwarteten Binärdateien, Workflowänderungen oder
  Konfigurationsänderungen.

## 6. Merge

`squash_merges: true` weist Decap an, die Entwurfscommits beim Veröffentlichen
zusammenzufassen. Die verbindliche Freigabe erfolgt dennoch auf GitHub durch
einen festgelegten Maintainer. Ein CMS-Benutzer darf keine Ruleset-Ausnahme
erhalten. Nach neuen Commits muss eine alte Freigabe verfallen.

Für `main` ist erst nach einem erfolgreichen finalen Lauf des kombinierten Draft-
PRs ein aktives Repository-Ruleset mit folgenden Mindestwerten einzurichten:

1. Ziel: nur der Branch `main`; Enforcement: `Active`; keine Bypass-Akteure.
2. Pull Request vor jeder Änderung verpflichtend.
3. Mindestens eine Freigabe durch einen Benutzer mit Schreibrecht.
4. Veraltete Freigaben bei neuen Commits verwerfen und die Freigabe des
   letzten prüfbaren Pushes verlangen.
5. Offene Review-Gespräche müssen aufgelöst sein.
6. Statuscheck `Combined quality and CMS safety` verpflichtend und Branch vor
   Merge auf aktuellem Stand.
7. Force-Pushes und Branch-Löschung verbieten; Regeln auch für Admins
   erzwingen.

Derzeit ist dieses Ruleset **nicht aktiv**. Bis es aktiviert und erneut
read-only verifiziert wurde, ist die Aussage „`main` kann nur per Review
geändert werden“ noch nicht erfüllt.

## 7. Pages-Deployment

`.github/workflows/pages.yml` deployt ausschließlich beim Ereignis `push` auf
`main`. Pull Requests, `cms/...`-Branches und Forks erhalten weder ein
Pages-Deployment noch einen Preview-Link aus diesem Workflow. Mit dem oben
beschriebenen Ruleset entsteht ein Push auf `main` nur durch einen erlaubten
Merge; erst dann wird die Änderung veröffentlicht.

Die Pages-Environment-Policy ist eine zusätzliche Schranke, ersetzt aber kein
Ruleset. Insbesondere müssen Admin-Bypasses dort und im Ruleset ausgeschlossen
bleiben.

## Synthetischer Abnahmetest

Der End-to-End-Test erfolgt erst, wenn das Ruleset aktiv, der OAuth-Worker separat
geprüft und der kombinierte CMS-Stand in einer ausdrücklich freigegebenen
nichtöffentlichen Testumgebung erreichbar ist. Er verändert niemals Öffnungszeiten
oder andere Restaurantdaten und ist kein Grund, den Draft vorzeitig zu mergen:

1. Den aktuellen `main`-Commit und die letzte Pages-Deployment-ID notieren.
2. Mit einem Testeditor im CMS ausschließlich den Hinweisbanner auf exakt
   `TESTENTWURF - NICHT VERÖFFENTLICHEN` setzen und als Entwurf speichern.
3. Prüfen, dass `main` unverändert ist und ein `cms/...`-Branch beziehungsweise
   Fork-Branch existiert.
4. Bei Open Authoring den Entwurf auf „Ready to Review“ setzen und den PR nach
   `main` prüfen.
5. Prüfen, dass `Combined quality and CMS safety` läuft, keine Pages-Bereitstellung
   entsteht und ein Merge ohne Maintainerfreigabe blockiert ist.
6. Den PR ohne Merge schließen und nur den synthetischen Testbranch löschen.
7. Erneut bestätigen, dass `main`, die öffentlichen Inhalte und das letzte
   Pages-Deployment unverändert sind.

Ein echter CMS-Login oder dieser Test ist in der Repository-Automation nicht
simulierbar. Ein fehlgeschlagener eigenständiger Media-Library-Upload bei
aktivem Ruleset ist erwartetes Schutzverhalten und darf nicht durch eine
Bypass-Ausnahme „repariert“ werden.

## Quellen

- [Decap CMS: Editorial Workflows](https://decapcms.org/docs/editorial-workflows/)
- [Decap CMS: Open Authoring](https://decapcms.org/docs/open-authoring/)
- [Decap CMS: Configuration Options](https://decapcms.org/docs/configuration-options/)
- [Decap CMS 3.15.1: Core backend](https://github.com/decaporg/decap-cms/blob/decap-cms%403.15.1/packages/decap-cms-core/src/backend.ts)
- [Decap CMS 3.15.1: GitHub backend](https://github.com/decaporg/decap-cms/blob/decap-cms%403.15.1/packages/decap-cms-backend-github/src/API.ts)
- [GitHub: Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
