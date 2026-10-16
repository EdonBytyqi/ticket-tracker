import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { DEFAULT_RATE_LIMIT } from './auth/rate-limits';
import { dbOptions } from './database/db-options';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbOptions(process.env),
        // Beim Start offene Migrationen ausfuehren. Einfach fuer die Demo; in groesseren
        // Setups laeuft das als eigener Schritt in der Pipeline vor dem Deployment.
        migrationsRun: process.env.DB_MIGRATIONS_RUN !== 'false',
      }),
    }),
    ThrottlerModule.forRoot([DEFAULT_RATE_LIMIT]),
    UsersModule,
    AuthModule,
    TicketsModule,
  ],
  controllers: [HealthController],
  // Rate Limiting gilt fuer alle Endpunkte; einzelne verschaerfen oder ueberspringen es.
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
