import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, User } from './models';

const STORAGE_KEY = 'ticket-tracker.session';

interface Session {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isAgent = computed(() => this.session()?.user.role === 'agent');

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((res) => this.store(res)));
  }

  register(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/register', { email, password })
      .pipe(tap((res) => this.store(res)));
  }

  logout() {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Speicher nicht verfuegbar: ignorieren */
    }
    void this.router.navigate(['/login']);
  }

  private store(res: AuthResponse) {
    const session: Session = { token: res.access_token, user: res.user };
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* Speicher nicht verfuegbar: Session lebt nur im Speicher */
    }
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}
