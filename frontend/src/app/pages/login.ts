import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <section class="card narrow">
      <h1>{{ mode() === 'login' ? 'Anmelden' : 'Registrieren' }}</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          E-Mail
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <p class="error">Bitte eine gueltige E-Mail eingeben.</p>
        }
        <label>
          Passwort
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <p class="error">Mindestens 8 Zeichen.</p>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button type="submit" [disabled]="form.invalid || busy()">
          {{ mode() === 'login' ? 'Anmelden' : 'Konto erstellen' }}
        </button>
      </form>
      <button type="button" class="link" (click)="toggle()">
        {{ mode() === 'login' ? 'Noch kein Konto? Registrieren' : 'Schon registriert? Anmelden' }}
      </button>
    </section>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  toggle() {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.error.set(null);
  }

  submit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set(null);
    const call = this.mode() === 'login' ? this.auth.login(email, password) : this.auth.register(email, password);
    call.subscribe({
      next: () => void this.router.navigate(['/tickets']),
      error: (err: unknown) => {
        this.busy.set(false);
        const msg = err instanceof HttpErrorResponse ? err.error?.message : null;
        this.error.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Anmeldung fehlgeschlagen'));
      },
    });
  }
}
