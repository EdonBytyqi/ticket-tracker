import { DataSourceOptions } from 'typeorm';
import { Ticket } from '../tickets/ticket.entity';
import { User } from '../users/user.entity';

type Env = Record<string, string | undefined>;

/**
 * Eine Quelle fuer die DB-Einstellungen. Die App und die TypeORM-CLI benutzen dieselbe,
 * damit sie nie auseinanderlaufen.
 */
export function dbOptions(env: Env = process.env): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER ?? 'tickets',
    password: env.DB_PASSWORD ?? 'tickets',
    database: env.DB_NAME ?? 'tickets',
    entities: [User, Ticket],
    // .ts beim Entwickeln (ts-node), .js im Build (dist/).
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    // Das Schema aendert sich nur noch ueber Migrationen, nie automatisch.
    synchronize: false,
  };
}
