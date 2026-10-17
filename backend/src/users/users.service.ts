import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role, User } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  /** Legt optional einen Demo-Agenten und einen Demo-Kunden an (Zugangsdaten nur aus Umgebungsvariablen). */
  async onModuleInit() {
    await this.seed('SEED_AGENT', Role.Agent);
    await this.seed('SEED_CUSTOMER', Role.Customer);
  }

  private async seed(prefix: string, role: Role) {
    const email = this.config.get<string>(`${prefix}_EMAIL`);
    const password = this.config.get<string>(`${prefix}_PASSWORD`);
    if (!email || !password) return;
    if (await this.findByEmail(email)) return;
    await this.create(email, password, role);
    this.logger.log(`Demo-Benutzer ${email} (${role}) angelegt`);
  }

  async create(email: string, password: string, role: Role = Role.Customer): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.users.save(this.users.create({ email: email.toLowerCase(), passwordHash, role }));
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
  }

  /** Mit passwordHash, nur fuer den Login. */
  findByEmailWithHash(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: email.toLowerCase() })
      .getOne();
  }
}
