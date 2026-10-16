/**
 * E2E-Tests: echte App, echte HTTP-Anfragen, echtes PostgreSQL.
 * Die Unit-Tests pruefen die Regeln einzeln; hier pruefen wir, dass alles zusammen
 * funktioniert (Guards, Validierung, Migrationen, Datenbank).
 *
 * Braucht eine leere Test-Datenbank, z. B. DB_NAME=tickets_e2e (siehe README).
 */
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AUTH_RATE_LIMIT } from '../src/auth/rate-limits';
import { Role } from '../src/users/user.entity';
import { UsersService } from '../src/users/users.service';

const PASSWORD = 'Sicheres-Passwort-123';

describe('Ticket-Tracker (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let http: ReturnType<typeof request>;

  /** Registriert sich als Kunde und gibt das Token zurueck. */
  async function registerCustomer(email: string): Promise<string> {
    const res = await http.post('/api/auth/register').send({ email, password: PASSWORD }).expect(201);
    return res.body.access_token;
  }

  async function login(email: string): Promise<string> {
    const res = await http.post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
    return res.body.access_token;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app as NestExpressApplication);
    await app.init(); // fuehrt dabei die Migrationen aus

    db = app.get(DataSource);
    await db.query('TRUNCATE "tickets", "users" CASCADE');
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('Entities und Migrationen passen zusammen (kein vergessenes migration:generate)', async () => {
    const pending = await db.driver.createSchemaBuilder().log();
    expect(pending.upQueries.map((q) => q.query)).toEqual([]);
  });

  it('GET /api/health meldet App und Datenbank als erreichbar', async () => {
    await http.get('/api/health').expect(200, { status: 'ok', database: 'up' });
  });

  it('ohne Token gibt es keine Tickets', async () => {
    await http.get('/api/tickets').expect(401);
  });

  describe('Kunden und Agenten', () => {
    let anna: string;
    let ben: string;
    let agent: string;
    let agentId: string;
    let annaId: string;
    let ticketId: string;

    beforeAll(async () => {
      anna = await registerCustomer('anna@example.com');
      ben = await registerCustomer('ben@example.com');
      const users = app.get(UsersService);
      agentId = (await users.create('agent@example.com', PASSWORD, Role.Agent)).id;
      annaId = (await users.findByEmail('anna@example.com'))!.id;
      agent = await login('agent@example.com');
    });

    it('Kundin erstellt ein Ticket', async () => {
      const res = await http
        .post('/api/tickets')
        .auth(anna, { type: 'bearer' })
        .send({ title: 'Drucker streikt', description: 'Seit heute keine Ausdrucke' })
        .expect(201);
      expect(res.body.status).toBe('open');
      ticketId = res.body.id;
    });

    it('unbekannte Felder werden abgelehnt (400)', async () => {
      await http
        .post('/api/tickets')
        .auth(anna, { type: 'bearer' })
        .send({ title: 'Hack', description: 'x', status: 'closed' })
        .expect(400);
    });

    it('ein anderer Kunde sieht das Ticket nicht einmal (404, nicht 403)', async () => {
      await http.get(`/api/tickets/${ticketId}`).auth(ben, { type: 'bearer' }).expect(404);
    });

    it('die Kundin darf den Status nicht aendern (403)', async () => {
      await http
        .patch(`/api/tickets/${ticketId}`)
        .auth(anna, { type: 'bearer' })
        .send({ status: 'closed' })
        .expect(403);
    });

    it('der Agent kann nicht an eine Kundin zuweisen (400)', async () => {
      await http
        .patch(`/api/tickets/${ticketId}`)
        .auth(agent, { type: 'bearer' })
        .send({ assigneeId: annaId })
        .expect(400);
    });

    it('der Agent uebernimmt das Ticket und setzt den Status', async () => {
      const res = await http
        .patch(`/api/tickets/${ticketId}`)
        .auth(agent, { type: 'bearer' })
        .send({ status: 'in_progress', assigneeId: agentId })
        .expect(200);
      expect(res.body.status).toBe('in_progress');
      expect(res.body.assignee.id).toBe(agentId);
    });

    it('danach darf die Kundin den Inhalt nicht mehr bearbeiten (nicht mehr offen)', async () => {
      await http
        .patch(`/api/tickets/${ticketId}`)
        .auth(anna, { type: 'bearer' })
        .send({ title: 'Drucker streikt immer noch' })
        .expect(403);
    });

    it('die Antwort enthaelt nie den Passwort-Hash', async () => {
      const res = await http.get(`/api/tickets/${ticketId}`).auth(agent, { type: 'bearer' }).expect(200);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });
  });

  it(`Login wird nach ${AUTH_RATE_LIMIT.limit} Versuchen pro Minute gebremst (429)`, async () => {
    // Login hat ein eigenes Kontingent pro Endpunkt. Oben wurde 1x eingeloggt.
    const statuses: number[] = [];
    for (let i = 0; i < AUTH_RATE_LIMIT.limit + 1; i++) {
      const res = await http.post('/api/auth/login').send({ email: 'x@example.com', password: 'falsch-falsch' });
      statuses.push(res.status);
    }
    expect(statuses).toContain(401);
    expect(statuses[statuses.length - 1]).toBe(429);
  });
});
