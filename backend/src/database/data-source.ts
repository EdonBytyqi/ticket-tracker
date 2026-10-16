import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dbOptions } from './db-options';

/** Wird nur von der TypeORM-CLI benutzt (migration:generate / run / revert). */
export default new DataSource(dbOptions());
