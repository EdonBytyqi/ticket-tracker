import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role, User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const users = {
    findByEmail: jest.fn(),
    findByEmailWithHash: jest.fn(),
    create: jest.fn(),
  };
  const jwt = { signAsync: jest.fn(async () => 'signed-token') };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(users as unknown as UsersService, jwt as unknown as JwtService);
  });

  it('registriert immer einen Kunden und liefert ein Token', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue({ id: 'u-1', email: 'a@b.ch', role: Role.Customer } as User);
    const result = await service.register('a@b.ch', 'geheim123');
    expect(users.create).toHaveBeenCalledWith('a@b.ch', 'geheim123', Role.Customer);
    expect(result.access_token).toBe('signed-token');
  });

  it('lehnt doppelte E-Mail-Adressen ab', async () => {
    users.findByEmail.mockResolvedValue({ id: 'u-1' });
    await expect(service.register('a@b.ch', 'geheim123')).rejects.toBeInstanceOf(ConflictException);
  });

  it('loggt mit korrektem Passwort ein', async () => {
    const passwordHash = await bcrypt.hash('geheim123', 4);
    users.findByEmailWithHash.mockResolvedValue({
      id: 'u-1',
      email: 'a@b.ch',
      role: Role.Agent,
      passwordHash,
    });
    const result = await service.login('a@b.ch', 'geheim123');
    expect(result.user.role).toBe(Role.Agent);
  });

  it('lehnt falsches Passwort und unbekannte Konten gleich ab', async () => {
    const passwordHash = await bcrypt.hash('richtig123', 4);
    users.findByEmailWithHash.mockResolvedValueOnce({ id: 'u-1', passwordHash });
    await expect(service.login('a@b.ch', 'falsch')).rejects.toBeInstanceOf(UnauthorizedException);

    users.findByEmailWithHash.mockResolvedValueOnce(null);
    await expect(service.login('x@y.ch', 'irgendwas')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
