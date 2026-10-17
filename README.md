# Ticket-Tracker

Kleine Fullstack-Demo-App: Kunden erfassen Support-Tickets, Agenten bearbeiten sie.
Gebaut als Lern- und Portfolio-Projekt mit TypeScript, Angular, NestJS und PostgreSQL.

## Stack

| Bereich | Technik |
| --- | --- |
| Frontend | Angular 21 (Standalone Components, Signals, Reactive Forms, HTTP-Interceptor, Route Guard) |
| Backend | NestJS 11, TypeORM, class-validator, JWT |
| Datenbank | PostgreSQL 16 |
| Betrieb | Docker, docker compose, GitHub Actions |
| Tests | Jest (Backend), Vitest (Frontend, Angular-Standard) |

## Funktionen

- Registrierung und Login (Passwort mit bcrypt gehasht, JWT mit 1 Stunde Laufzeit)
- Rollen: **Kunde** und **Agent**. Selbstregistrierung erzeugt immer einen Kunden.
- Kunden sehen und bearbeiten nur eigene Tickets, und nur solange sie offen sind.
- Agenten sehen alle Tickets, aendern Status und Prioritaet und koennen Tickets loeschen.
- Liste mit Statusfilter und Pagination.
- Zuweisung nur an existierende Agenten (sonst 400).
- Rate Limiting: Login und Registrierung max. 5 Anfragen pro Minute und IP, sonst 100.
- `GET /api/health` prueft App und Datenbank (200 oder 503) fuer Docker und Monitoring.

## Vorgehen: Spec-driven

Features werden zuerst als Spec beschrieben (Anforderungen mit pruefbaren Akzeptanzkriterien, Entwurf, Aufgaben),
dann umgesetzt. Jedes Akzeptanzkriterium verweist auf den Test, der es nachweist. Siehe [`specs/`](specs/README.md).

## Architektur

```
Browser -> nginx (Angular-Build, Port 8080) -> /api -> NestJS (Port 3000) -> PostgreSQL
```

Backend-Module: `auth` (Login, JWT-Guard, Rollen-Guard, Rate Limits), `users`, `tickets`, `health`, `database` (Verbindung und Migrationen).
Der Zugriffsschutz fuer Tickets steckt im `TicketsService`, nicht im Controller.
So ist die Regel an einer Stelle testbar (`tickets.service.spec.ts`).

Die Regeln pro Rolle beim Aendern eines Tickets stehen in `ticket-update.policy.ts`:
ein Interface `TicketUpdatePolicy`, eine Klasse pro Rolle und eine Zuordnung `Record<Role, ...>`.
Der Service verzweigt nicht auf der Rolle. Eine neue Rolle braucht eine neue Policy-Klasse,
und der Compiler verlangt sie. Eine Rolle ohne Policy scheitert laut (500), statt Felder still zu ignorieren.

Entscheidungen:

- **404 statt 403** bei fremden Tickets, damit Kunden nicht erfahren, welche Tickets existieren.
- **Gleiche Fehlermeldung** fuer falsches Passwort und unbekannte E-Mail beim Login.
- **ValidationPipe mit `whitelist` und `forbidNonWhitelisted`**: unbekannte Felder werden abgelehnt.
- **Kein Default fuer `JWT_SECRET` in Produktion**: ohne Secret startet die App nicht.
- **Migrationen statt `synchronize`**: das Schema aendert sich nur ueber versionierte Migrationen
  in `src/database/migrations`. Die App fuehrt offene Migrationen beim Start aus (fuer die Demo einfach;
  in groesseren Setups ein eigener Pipeline-Schritt vor dem Deployment).
- **Benannte Konstanten fuer Grenzwerte** (`auth/rate-limits.ts`) statt Zahlen im Code.
- **Token im localStorage** ist fuer eine Demo einfach, aber anfaellig bei XSS (siehe Aufgaben).

## Starten

### Mit Docker (alles zusammen)

```bash
cp .env.example .env
# JWT_SECRET, DB_PASSWORD und SEED_AGENT_PASSWORD in .env setzen
docker compose up --build
```

App: http://localhost:8080. Der Demo-Agent kommt aus `SEED_AGENT_EMAIL` und `SEED_AGENT_PASSWORD`,
der optionale Demo-Kunde aus `SEED_CUSTOMER_EMAIL` und `SEED_CUSTOMER_PASSWORD`.

### Lokal entwickeln

```bash
# 1. Datenbank
docker run --name tickets-db -e POSTGRES_USER=tickets -e POSTGRES_PASSWORD=tickets \
  -e POSTGRES_DB=tickets -p 5432:5432 -d postgres:16-alpine

# 2. Backend
cd backend
npm install
SEED_AGENT_EMAIL=agent@example.com SEED_AGENT_PASSWORD=agentpass123 \
  SEED_CUSTOMER_EMAIL=kunde@example.com SEED_CUSTOMER_PASSWORD=kundepass123 npm run start:dev
# Beim Start werden die Migrationen automatisch ausgefuehrt.

# 3. Frontend (anderes Terminal, Proxy leitet /api an Port 3000)
cd frontend
npm install
npm start
```

Frontend: http://localhost:4200

### Tests

```bash
cd backend && npm test                 # Unit-Tests, ohne Datenbank
cd frontend && npx ng test --no-watch
```

E2E-Tests (echte HTTP-Anfragen gegen eine eigene, leere Test-Datenbank; sie wird geleert):

```bash
docker exec tickets-db psql -U tickets -c "CREATE DATABASE tickets_e2e;"
cd backend && DB_NAME=tickets_e2e npm run test:e2e
```

Ein E2E-Test prueft auch, dass Entities und Migrationen zusammenpassen.
Wer eine Entity aendert und `migration:generate` vergisst, bekommt einen roten Test.

### Schema aendern (Migrationen)

```bash
cd backend
# 1. Entity aendern, dann:
npm run migration:generate -- src/database/migrations/KurzerName
# 2. Erzeugte Datei lesen und pruefen (nie blind uebernehmen), dann:
npm run migration:run
# Zuruecknehmen der letzten Migration:
npm run migration:revert
```

## API

| Methode | Pfad | Zugriff |
| --- | --- | --- |
| POST | `/api/auth/register` | oeffentlich |
| POST | `/api/auth/login` | oeffentlich |
| GET | `/api/auth/me` | angemeldet |
| GET | `/api/tickets?status=&page=&pageSize=` | angemeldet (Kunde: nur eigene) |
| POST | `/api/tickets` | angemeldet |
| GET | `/api/tickets/:id` | angemeldet (Kunde: nur eigene) |
| PATCH | `/api/tickets/:id` | Kunde: Titel und Beschreibung, solange offen. Agent: zusaetzlich Status, Prioritaet, Zuweisung |
| DELETE | `/api/tickets/:id` | nur Agent |
| GET | `/api/health` | oeffentlich |

## Was ich geprueft habe

- Backend: 26 Unit-Tests und 12 E2E-Tests gruen (E2E gegen PostgreSQL 16), TypeScript-Build ohne Fehler.
- Migrationen: auf leerer Datenbank ausgefuehrt, zurueckgenommen und erneut ausgefuehrt;
  die gebaute App (`node dist/main.js`) legt das Schema beim Start an und `/api/health` meldet `ok`.
- Frontend: 10 Tests gruen, Produktions-Build ohne Fehler.
- API gegen eine echte PostgreSQL-16-Instanz getestet (Registrierung, Login, 401 ohne Token,
  Ablehnung unbekannter Felder, Rollenregeln, Filter, Loeschen).
- `docker-compose.yml` ist syntaktisch geprueft. Die Docker-Images wurden **noch nicht gebaut**
  (in der Entwicklungsumgebung lief kein Docker-Daemon). Die GitHub-Actions-Pipeline hat noch nicht gelaufen.

## Aufgaben zum Lernen (deine Erweiterungen)

Jede Aufgabe ist klein genug fuer einen Abend und bringt ein Gespraechsthema fuer das Interview.

Erledigt: Migrationen, E2E-Tests mit Supertest, Rate Limiting, Pruefung der Zuweisung, Health-Endpoint.

1. **Expand-Contract-Migration** ueben: z. B. `title` in `subject` umbenennen, ohne Ausfall
   (neue Spalte, beide schreiben, Daten kopieren, alte Spalte spaeter entfernen). Thema: Deployments ohne Downtime.
2. **Kommentare zu Tickets**: neue Entitaet `Comment`, Endpunkte, Anzeige im Detail. Thema: Beziehungen, N+1-Problem
   (mit `EXPLAIN` pruefen).
3. **Playwright-E2E-Test** fuer den Ablauf Registrieren, Ticket erstellen, als Agent bearbeiten.
4. **Token sicherer speichern**: httpOnly-Cookie statt localStorage, CSRF-Schutz bedenken. Thema: OWASP.
5. **OpenAPI-Dokumentation** mit `@nestjs/swagger`.
6. **Agenten-Zuweisung im UI**: Liste der Agenten laden und Zuweisung auswaehlen
   (Backend kann `assigneeId` schon).
7. **Logging mit Korrelations-ID** pro Anfrage.

## Bekannte Grenzen (ehrlich)

- Es gibt keine E-Mail-Verifikation und kein Passwort-Zuruecksetzen.
- Das Rate Limiting zaehlt im Speicher einer Instanz. Bei mehreren Instanzen braeuchte es einen
  gemeinsamen Speicher (z. B. Redis).
- Der Token-Ablauf ist fest auf eine Stunde gesetzt, es gibt keinen Refresh-Token.
