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

  /** Legt optional einen Demo-Agenten an (Zugangsdaten nur aus Umgebungsvariablen). */
  async onModuleInit() {
    const email = this.config.get<string>('SEED_AGENT_EMAIL');
    const password = this.config.get<string>('SEED_AGENT_PASSWORD');
    if (!email || !password) return;
    if (await this.findByEmail(email)) return;
    await this.create(email, password, Role.Agent);
    this.logger.log(`Demo-Agent ${email} angelegt`);
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
