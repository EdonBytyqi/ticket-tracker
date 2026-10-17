# 001 – Ticket-Tracker Basis: Anforderungen

Status: umgesetzt. **Diese Spec wurde nachtraeglich erstellt**, um den bestehenden Stand festzuhalten.
Sie ist die Grundlage fuer alle weiteren Features, die spec-first entstehen.

## Ziel
Kunden koennen Support-Anfragen als Tickets erfassen und verfolgen. Support-Agenten bearbeiten,
priorisieren und schliessen sie.

## Nicht im Umfang
- E-Mail-Verifikation, Passwort zuruecksetzen, Refresh-Tokens
- Benachrichtigungen, Kommentare, Dateianhaenge
- Agenten-Zuweisung in der Oberflaeche (die API kann sie bereits)

## Rollen
- **Kunde**: entsteht durch Selbstregistrierung.
- **Agent**: wird nie ueber die API angelegt, nur per Konfiguration (Seed).

## User Stories und Akzeptanzkriterien

### US-1: Als Besucher moechte ich mich registrieren und anmelden, damit ich Tickets erfassen kann.
- **AK-1.1** Wenn sich jemand registriert, dann ist er immer ein Kunde und erhaelt ein Token.
- **AK-1.2** Wenn die E-Mail-Adresse schon registriert ist, dann wird die Registrierung abgelehnt (409 Conflict).
- **AK-1.3** Wenn E-Mail oder Passwort falsch sind, dann ist die Fehlermeldung in beiden Faellen gleich (401).
- **AK-1.4** Wenn mehr als 5 Login- oder Registrierungsversuche pro Minute von derselben IP kommen, dann antwortet die API mit 429.
- **AK-1.5** Wenn eine Anfrage an die Ticket-API kein gueltiges Token hat, dann antwortet die API mit 401.

### US-2: Als Kunde moechte ich Tickets erfassen und sehen, damit ich meine Anliegen verfolgen kann.
- **AK-2.1** Wenn ein Kunde ein Ticket erstellt, dann ist er als Ersteller gespeichert und der Status ist "open".
- **AK-2.2** Wenn ein Kunde die Liste abruft, dann sieht er nur seine eigenen Tickets.
- **AK-2.3** Wenn ein Kunde ein fremdes Ticket abruft, dann antwortet die API mit 404 (nicht 403).
- **AK-2.4** Wenn eine Anfrage Felder enthaelt, die nicht erlaubt sind, dann wird sie mit 400 abgelehnt.

### US-3: Als Kunde moechte ich offene Tickets korrigieren koennen.
- **AK-3.1** Wenn das Ticket offen ist, dann darf der Kunde Titel und Beschreibung aendern.
- **AK-3.2** Wenn das Ticket nicht mehr offen ist, dann wird jede Aenderung durch den Kunden abgelehnt (403).
- **AK-3.3** Wenn ein Kunde Status, Prioritaet oder Zuweisung aendern will, dann wird das abgelehnt (403).

### US-4: Als Agent moechte ich alle Tickets bearbeiten, damit ich den Support organisieren kann.
- **AK-4.1** Wenn ein Agent die Liste abruft, dann sieht er alle Tickets.
- **AK-4.2** Wenn ein Agent ein Ticket aendert, dann darf er Status, Prioritaet und Zuweisung setzen, unabhaengig vom Status.
- **AK-4.3** Wenn ein Ticket einem Benutzer zugewiesen wird, der kein Agent ist oder nicht existiert, dann wird das abgelehnt (400).
- **AK-4.4** Wenn ein Agent ein unbekanntes Ticket loescht, dann antwortet die API mit 404.
- **AK-4.5** Wenn eine Rolle keine definierte Bearbeitungsregel hat, dann scheitert die Anfrage laut (500), statt Felder still zu ignorieren.

### US-5: Als Benutzer moechte ich eine Oberflaeche, die zu meiner Rolle passt.
- **AK-5.1** Wenn ein nicht angemeldeter Benutzer eine geschuetzte Seite oeffnet, dann wird er zum Login umgeleitet.
- **AK-5.2** Wenn die API mit 401 antwortet, dann wird der Benutzer abgemeldet.
- **AK-5.3** Das Token wird nur an die eigene API gesendet, nie an fremde Adressen.
- **AK-5.4** Wenn ein Formular ungueltig ist, dann wird nichts gesendet.
- **AK-5.5** Agenten sehen ein zusaetzliches Panel fuer Status, Prioritaet und Loeschen; Kunden sehen bei nicht offenen Tickets den Text nur lesend, mit Hinweis.

## Nicht-funktionale Anforderungen
- **NF-1** Passwoerter werden mit bcrypt gehasht; der Hash wird nie ausgeliefert.
- **NF-2** Ohne `JWT_SECRET` startet die App in Produktion nicht.
- **NF-3** Das Datenbankschema aendert sich nur ueber Migrationen; Entities und Migrationen muessen uebereinstimmen.
- **NF-4** `GET /api/health` meldet App und Datenbank (200 oder 503).
- **NF-5** Jeder Push laeuft durch die CI: Unit-, E2E- und Frontend-Tests, Build, Docker-Images.

## Nachweis
| AK | Test |
| --- | --- |
| AK-1.1 | `auth.service.spec.ts › registriert immer einen Kunden und liefert ein Token` |
| AK-1.2 | `auth.service.spec.ts › lehnt doppelte E-Mail-Adressen ab` |
| AK-1.3 | `auth.service.spec.ts › lehnt falsches Passwort und unbekannte Konten gleich ab` |
| AK-1.4 | `app.e2e-spec.ts › Login wird nach 5 Versuchen pro Minute gebremst (429)` |
| AK-1.5 | `app.e2e-spec.ts › ohne Token gibt es keine Tickets` |
| AK-2.1 | `tickets.service.spec.ts › setzt beim Erstellen den Ersteller`; `app.e2e-spec.ts › Kundin erstellt ein Ticket` |
| AK-2.2 | `tickets.service.spec.ts › beschraenkt die Liste fuer Kunden auf eigene Tickets` |
| AK-2.3 | `tickets.service.spec.ts › liefert fuer fremde Tickets 404 statt 403`; `app.e2e-spec.ts › ein anderer Kunde sieht das Ticket nicht einmal` |
| AK-2.4 | `app.e2e-spec.ts › unbekannte Felder werden abgelehnt (400)` |
| AK-3.1 | `ticket-update.policy.spec.ts › erlaubt das Bearbeiten offener Tickets`, `› erlaubt Titel und Beschreibung` |
| AK-3.2 | `tickets.service.spec.ts › verbietet Kunden, ein nicht offenes Ticket zu bearbeiten`; `app.e2e-spec.ts › danach darf die Kundin den Inhalt nicht mehr bearbeiten` |
| AK-3.3 | `tickets.service.spec.ts › verbietet Kunden, den Status zu aendern`; `app.e2e-spec.ts › die Kundin darf den Status nicht aendern (403)` |
| AK-4.1 | `tickets.service.spec.ts › zeigt Agenten alle Tickets` |
| AK-4.2 | `tickets.service.spec.ts › erlaubt Agenten, Status und Zuweisung zu aendern`; `ticket-update.policy.spec.ts › erlaubt Agenten jeden Ticket-Zustand und alle Felder` |
| AK-4.3 | `tickets.service.spec.ts › lehnt die Zuweisung an einen Kunden ab`, `› ... an eine unbekannte ID ab`; `app.e2e-spec.ts › der Agent kann nicht an eine Kundin zuweisen` |
| AK-4.4 | `tickets.service.spec.ts › wirft 404 beim Loeschen eines unbekannten Tickets` |
| AK-4.5 | `ticket-update.policy.spec.ts › wirft einen 500er-Fehler fuer eine Rolle ohne Policy`; `tickets.service.spec.ts › scheitert laut bei einer Rolle ohne Policy` |
| AK-5.1 | `auth.spec.ts › leitet nicht angemeldete Benutzer zum Login um` |
| AK-5.2 | `auth.spec.ts › meldet bei 401 ab` |
| AK-5.3 | `auth.spec.ts › haengt das Token an API-Aufrufe, aber nicht an fremde URLs` |
| AK-5.4 | `ticket-forms.spec.ts › sendet nichts, solange das Formular ungueltig ist` |
| AK-5.5 | kein automatischer Test – manuell geprueft. **Luecke**, siehe tasks.md |
| NF-1 | `app.e2e-spec.ts › die Antwort enthaelt nie den Passwort-Hash` |
| NF-3 | `app.e2e-spec.ts › Entities und Migrationen passen zusammen` |
| NF-4 | `app.e2e-spec.ts › GET /api/health meldet App und Datenbank als erreichbar` |
| NF-5 | `.github/workflows/ci.yml` |
