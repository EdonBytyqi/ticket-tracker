import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

/** Eine Stelle fuer die App-Einrichtung, damit main.ts und die E2E-Tests genau gleich laufen. */
export function configureApp(app: NestExpressApplication) {
  // Hinter nginx: die echte Client-IP steht in X-Forwarded-For. Wichtig fuers Rate Limiting,
  // sonst teilen sich alle Nutzer die IP des Proxys.
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' });
  // Unbekannte Felder werden abgelehnt: Eingabevalidierung an der Grenze.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
}
