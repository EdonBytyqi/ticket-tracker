# 001 – Ticket-Tracker Basis: Entwurf

## Ueberblick
```
Browser -> nginx (Angular-Build) -> /api -> NestJS -> PostgreSQL
```
Backend-Module: `auth`, `users`, `tickets`, `health`, `database`. Frontend: `core` (Auth, Interceptor,
Guard, API-Service) und `pages` (Login, Liste, Neu, Detail mit zwei Kindkomponenten).

## Datenmodell
- `users`: id (uuid), email (unique), passwordHash, role (customer | agent), createdAt
- `tickets`: id (uuid), title (max. 200), description, status (open | in_progress | resolved | closed),
  priority (low | medium | high), createdBy -> users (CASCADE), assignee -> users (SET NULL), createdAt, updatedAt
- Indizes auf `tickets.status` und `tickets.createdById` (Filter in der Liste)
- Migrationen: `InitialSchema`, `TicketIndexes`

## API
Siehe Tabelle im [README](../../README.md#api).

## Entscheidungen
- **E-1 Zugriffsregeln im Service, nicht im Controller** – an einer Stelle testbar.
- **E-2 Eine Policy pro Rolle** (`TicketUpdatePolicy`, `Record<Role, Policy>`) – eine neue Rolle braucht eine
  neue Klasse, der Compiler verlangt sie. Verworfen: if-Abfragen pro Rolle im Service (wachsen mit jeder Rolle).
- **E-3 404 statt 403 bei fremden Tickets** – verraet nicht, welche Tickets existieren.
- **E-4 Migrationen beim Start** – einfach fuer eine Instanz; abschaltbar mit `DB_MIGRATIONS_RUN=false`,
  bei mehreren Instanzen als eigener Pipeline-Schritt.
- **E-5 JWT im localStorage** – einfach fuer die Demo, aber XSS-anfaellig. Fuer Kunden: httpOnly-Cookie mit CSRF-Schutz.
- **E-6 Rate Limiting im Speicher** – reicht fuer eine Instanz; mehrere Instanzen braeuchten Redis.

## Risiken
- Token kann bis zum Ablauf (1 h) nicht widerrufen werden.
- Keine strukturierten Logs mit Korrelations-ID.
