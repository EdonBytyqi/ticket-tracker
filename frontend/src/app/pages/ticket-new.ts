import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketPriority } from '../core/models';
import { TicketsService } from '../core/tickets.service';

@Component({
  selector: 'app-ticket-new',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card narrow">
      <h1>Neues Ticket</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Titel
          <input formControlName="title" />
        </label>
        @if (form.controls.title.touched && form.controls.title.invalid) {
          <p class="error">Titel: 3 bis 200 Zeichen.</p>
        }
        <label>
          Beschreibung
          <textarea rows="6" formControlName="description"></textarea>
        </label>
        <label>
          Priorität
          <select formControlName="priority">
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
          </select>
        </label>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <div class="row">
          <a routerLink="/tickets">Abbrechen</a>
          <button type="submit" [disabled]="form.invalid || busy()">Erstellen</button>
        </div>
      </form>
    </section>
  `,
})
export class TicketNewPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(TicketsService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    priority: ['medium' as TicketPriority],
  });

  submit() {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.create(this.form.getRawValue()).subscribe({
      next: (ticket) => void this.router.navigate(['/tickets', ticket.id]),
      error: () => {
        this.busy.set(false);
        this.error.set('Ticket konnte nicht erstellt werden.');
      },
    });
  }
}
