import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginPage } from './pages/login';
import { TicketDetailPage } from './pages/ticket-detail/ticket-detail';
import { TicketListPage } from './pages/ticket-list';
import { TicketNewPage } from './pages/ticket-new';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'tickets', component: TicketListPage, canActivate: [authGuard] },
  { path: 'tickets/new', component: TicketNewPage, canActivate: [authGuard] },
  { path: 'tickets/:id', component: TicketDetailPage, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'tickets' },
  { path: '**', redirectTo: 'tickets' },
];
