export type Role = 'customer' | 'agent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy?: User;
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketPage {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}
