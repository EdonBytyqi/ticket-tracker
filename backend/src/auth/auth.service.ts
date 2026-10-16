import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role, User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  /** Selbstregistrierung erzeugt immer einen Kunden. Agenten werden nie ueber die API angelegt. */
  async register(email: string, password: string) {
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('E-Mail ist bereits registriert');
    }
    const user = await this.users.create(email, password, Role.Customer);
    return this.issueToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmailWithHash(email);
    // Gleiche Fehlermeldung fuer "unbekannt" und "falsches Passwort": kein Hinweis auf existierende Konten.
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !ok) {
      throw new UnauthorizedException('Ungueltige Zugangsdaten');
    }
    return this.issueToken(user);
  }

  private async issueToken(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwt.signAsync(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
