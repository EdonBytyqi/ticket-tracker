import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Ticket } from '../../core/models';
import { TicketUpdate, TicketsService } from '../../core/tickets.service';
import { TicketAgentPanel } from './ticket-agent-panel';
import { TicketContentForm } from './ticket-content-form';

/**
 * Seite zum Anzeigen eines Tickets. Sie laedt, speichert und entscheidet, was sichtbar ist.
 * Die Formulare selbst stecken in den Kindkomponenten.
 */
@Component({
  selector: 'app-ticket-detail',
  imports: [RouterLink, DatePipe, TicketAgentPanel, TicketContentForm],
  template: `
    <section class="card narrow">
      <a routerLink="/tickets">&larr; Zurueck</a>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      @if (ticket(); as t) {
        <h1>{{ t.title }}</h1>
        <p>
          <span class="badge" [class]="'status-' + t.status">{{ t.status }}</span>
          Prioritaet: {{ t.priority }} &middot; erstellt {{ t.createdAt | date: 'dd.MM.yyyy HH:mm' }}
          @if (t.createdBy) { &middot; von {{ t.createdBy.email }} }
        </p>

        @if (auth.isAgent()) {
          <app-ticket-agent-panel
            [ticket]="t"
            [busy]="busy()"
            (save)="update($event)"
            (remove)="remove(t.id)"
          />
        }

        @if (canEditContent()) {
          <app-ticket-content-form [ticket]="t" [busy]="busy()" (save)="update($event)" />
        } @else {
          <p>{{ t.description }}</p>
          <p class="hint">Nur offene Tickets koennen vom Kunden bearbeitet werden.</p>
        }
      }
    </section>
  `,
})
export class TicketDetailPage implements OnInit {
  /** Kommt aus der Route (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly auth = inject(AuthService);
  private readonly api = inject(TicketsService);
  private readonly router = inject(Router);

  readonly ticket = signal<Ticket | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  /** Die Regel steht an einer Stelle und nicht im Template. */
  readonly canEditContent = computed(() => this.auth.isAgent() || this.ticket()?.status === 'open');

  ngOnInit() {
    this.api.get(this.id()).subscribe({
      next: (t) => this.ticket.set(t),
      error: () => this.error.set('Ticket nicht gefunden.'),
    });
  }

  update(changes: TicketUpdate) {
    this.busy.set(true);
    this.error.set(null);
    this.api.update(this.id(), changes).subscribe({
      next: (t) => {
        this.ticket.set(t);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.error.set('Speichern fehlgeschlagen.');
      },
    });
  }

  remove(id: string) {
    if (!confirm('Ticket wirklich löschen?')) return;
    this.busy.set(true);
    this.api.remove(id).subscribe({
      next: () => void this.router.navigate(['/tickets']),
      error: () => {
        this.busy.set(false);
        this.error.set('Löschen fehlgeschlagen.');
      },
    });
  }
}
