import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const loginResponse = {
  access_token: 'abc.def.ghi',
  user: { id: 'u-1', email: 'kunde@example.com', role: 'customer' as const },
};

function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'login', children: [] }]),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
    ],
  });
  return {
    auth: TestBed.inject(AuthService),
    http: TestBed.inject(HttpClient),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('AuthService', () => {
  it('speichert die Session nach dem Login', () => {
    const { auth, httpMock } = setup();
    auth.login('kunde@example.com', 'geheim123').subscribe();
    httpMock.expectOne('/api/auth/login').flush(loginResponse);

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.token()).toBe('abc.def.ghi');
    expect(auth.isAgent()).toBe(false);
    expect(localStorage.getItem('ticket-tracker.session')).toContain('abc.def.ghi');
  });

  it('loescht die Session beim Abmelden', () => {
    const { auth, httpMock } = setup();
    auth.login('kunde@example.com', 'geheim123').subscribe();
    httpMock.expectOne('/api/auth/login').flush(loginResponse);

    auth.logout();
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('ticket-tracker.session')).toBeNull();
  });
});

describe('authInterceptor', () => {
  it('haengt das Token an API-Aufrufe, aber nicht an fremde URLs', () => {
    const { auth, http, httpMock } = setup();
    auth.login('kunde@example.com', 'geheim123').subscribe();
    httpMock.expectOne('/api/auth/login').flush(loginResponse);

    http.get('/api/tickets').subscribe();
    expect(httpMock.expectOne('/api/tickets').request.headers.get('Authorization')).toBe('Bearer abc.def.ghi');

    http.get('https://fremd.example.com/x').subscribe();
    expect(httpMock.expectOne('https://fremd.example.com/x').request.headers.has('Authorization')).toBe(false);
  });

  it('meldet bei 401 ab', () => {
    const { auth, http, httpMock } = setup();
    auth.login('kunde@example.com', 'geheim123').subscribe();
    httpMock.expectOne('/api/auth/login').flush(loginResponse);

    http.get('/api/tickets').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/tickets').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn()).toBe(false);
  });
});

describe('authGuard', () => {
  it('leitet nicht angemeldete Benutzer zum Login um', () => {
    setup();
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as never)).toBe('/login');
  });
});
