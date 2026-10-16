import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Ticket, TicketPage, TicketPriority, TicketStatus } from './models';

export interface TicketUpdate {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly http = inject(HttpClient);

  list(opts: { status?: TicketStatus | ''; page?: number; pageSize?: number } = {}) {
    let params = new HttpParams();
    if (opts.status) params = params.set('status', opts.status);
    if (opts.page) params = params.set('page', opts.page);
    if (opts.pageSize) params = params.set('pageSize', opts.pageSize);
    return this.http.get<TicketPage>('/api/tickets', { params });
  }

  get(id: string) {
    return this.http.get<Ticket>(`/api/tickets/${id}`);
  }

  create(body: { title: string; description: string; priority?: TicketPriority }) {
    return this.http.post<Ticket>('/api/tickets', body);
  }

  update(id: string, body: TicketUpdate) {
    return this.http.patch<Ticket>(`/api/tickets/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<void>(`/api/tickets/${id}`);
  }
}
