import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Ticket, TicketStatus } from '../core/models';
import { TicketsService } from '../core/tickets.service';

@Component({
  selector: 'app-ticket-list',
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <section class="card">
      <header class="row">
        <h1>{{ auth.isAgent() ? 'Alle Tickets' : 'Meine Tickets' }}</h1>
        <a routerLink="/tickets/new" class="button">Neues Ticket</a>
      </header>

      <label class="inline">
        Status
        <select [ngModel]="status()" (ngModelChange)="status.set($event); page.set(1)">
          <option value="">Alle</option>
          <option value="open">Offen</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="resolved">Geloest</option>
          <option value="closed">Geschlossen</option>
        </select>
      </label>

      @if (loading()) {
        <p>Laedt ...</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (tickets().length === 0) {
        <p>Keine Tickets gefunden.</p>
      } @else {
        <table>
          <thead>
            <tr><th>Titel</th><th>Status</th><th>Prioritaet</th><th>Erstellt</th></tr>
          </thead>
          <tbody>
            @for (t of tickets(); track t.id) {
              <tr>
                <td><a [routerLink]="['/tickets', t.id]">{{ t.title }}</a></td>
                <td><span class="badge" [class]="'status-' + t.status">{{ t.status }}</span></td>
                <td>{{ t.priority }}</td>
                <td>{{ t.createdAt | date: 'dd.MM.yyyy HH:mm' }}</td>
              </tr>
            }
          </tbody>
        </table>
        <footer class="row">
          <button type="button" (click)="page.set(page() - 1)" [disabled]="page() <= 1">Zurueck</button>
          <span>Seite {{ page() }} von {{ totalPages() }} ({{ total() }} Tickets)</span>
          <button type="button" (click)="page.set(page() + 1)" [disabled]="page() >= totalPages()">Weiter</button>
        </footer>
      }
    </section>
  `,
})
export class TicketListPage {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(TicketsService);
  private readonly pageSize = 10;

  readonly status = signal<TicketStatus | ''>('');
  readonly page = signal(1);
  readonly tickets = signal<Ticket[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  constructor() {
    // Laedt neu, sobald sich Filter oder Seite aendern.
    effect((onCleanup) => {
      const status = this.status();
      const page = this.page();
      this.loading.set(true);
      this.error.set(null);
      const sub = this.api.list({ status, page, pageSize: this.pageSize }).subscribe({
        next: (res) => {
          this.tickets.set(res.items);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Tickets konnten nicht geladen werden.');
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }
}
