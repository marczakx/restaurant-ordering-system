import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should not be logged in initially', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should complete OAuth2 login when the backend session is authenticated', () => {
    let result: boolean | undefined;
    service.completeOAuth2Login().subscribe((authenticated) => (result = authenticated));

    const req = httpMock.expectOne('/api/auth/status');
    expect(req.request.method).toBe('GET');
    req.flush({ authenticated: true, username: 'google-user' });

    expect(result).toBeTrue();
    expect(service.isLoggedIn()).toBeTrue();
    expect(localStorage.getItem('oauth_session')).toBe('true');
  });

  it('should stay logged out when the backend session is not authenticated', () => {
    let result: boolean | undefined;
    service.completeOAuth2Login().subscribe((authenticated) => (result = authenticated));

    const req = httpMock.expectOne('/api/auth/status');
    req.flush({ authenticated: false, username: null });

    expect(result).toBeFalse();
    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('oauth_session')).toBeNull();
  });

  it('should restore the OAuth2 session from localStorage', () => {
    localStorage.setItem('oauth_session', 'true');
    const restored = new AuthService(TestBed.inject(HttpClient));
    expect(restored.isLoggedIn()).toBeTrue();
  });

  it('should clear both the token and the OAuth2 session on cleanToken', () => {
    localStorage.setItem('oauth_session', 'true');
    const svc = new AuthService(TestBed.inject(HttpClient));
    expect(svc.isLoggedIn()).toBeTrue();

    svc.cleanToken();

    expect(svc.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('oauth_session')).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});