import { Role } from '../users/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/** Der eingeloggte Benutzer, wie ihn die Controller sehen. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
