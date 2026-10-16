import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthUser, JwtPayload } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers['authorization'];
    const [scheme, token] = header?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token fehlt');
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user: AuthUser = { id: payload.sub, email: payload.email, role: payload.role };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Token ungueltig oder abgelaufen');
    }
  }
}
