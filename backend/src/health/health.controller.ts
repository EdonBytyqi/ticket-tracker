import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

/**
 * Fuer Docker, Load Balancer und Monitoring: Laeuft die App und erreicht sie die Datenbank?
 * Gibt 200 oder 503 zurueck, damit Werkzeuge den Zustand ohne Parsen erkennen.
 */
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly db: DataSource) {}

  @Get()
  async check() {
    try {
      await this.db.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
    return { status: 'ok', database: 'up' };
  }
}
