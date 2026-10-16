/**
 * Grenzen fuer Anfragen pro IP-Adresse. Benannte Konstanten statt Zahlen im Code,
 * damit man an einer Stelle sieht und aendert, was gilt.
 */
const ONE_MINUTE_MS = 60_000;

/** Allgemeine Grenze fuer alle Endpunkte. */
export const DEFAULT_RATE_LIMIT = { ttl: ONE_MINUTE_MS, limit: 100 };

/** Login und Registrierung: eng, damit niemand Passwoerter durchprobieren kann. */
export const AUTH_RATE_LIMIT = { ttl: ONE_MINUTE_MS, limit: 5 };
