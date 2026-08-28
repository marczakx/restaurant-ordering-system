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

  it('should remember the username reported by the backend after OAuth2 login', () => {
    service.completeOAuth2Login().subscribe();

    const req = httpMock.expectOne('/api/auth/status');
    req.flush({ authenticated: true, username: 'google-user' });

    expect(service.getUsername()).toBe('google-user');
    expect(localStorage.getItem('auth_username')).toBe('google-user');
  });

  it('should store the roles reported by the backend after OAuth2 login', () => {
    service.completeOAuth2Login().subscribe();

    const req = httpMock.expectOne('/api/auth/status');
    req.flush({ authenticated: true, username: 'google-user', roles: ['menu-editor', 'menu-creator'] });

    expect(service.getRoles()).toEqual(['menu-editor', 'menu-creator']);
    expect(service.hasRole('menu-editor')).toBeTrue();
    expect(service.hasRole('menu-creator')).toBeTrue();
    expect(JSON.parse(localStorage.getItem('auth_roles')!)).toEqual(['menu-editor', 'menu-creator']);
  });

  it('should have no roles when the backend reports none after OAuth2 login', () => {
    service.completeOAuth2Login().subscribe();

    const req = httpMock.expectOne('/api/auth/status');
    req.flush({ authenticated: true, username: 'google-user', roles: [] });

    expect(service.getRoles()).toEqual([]);
    expect(service.hasRole('menu-editor')).toBeFalse();
    expect(localStorage.getItem('auth_roles')).toBeNull();
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

  it('should restore the username from localStorage', () => {
    localStorage.setItem('oauth_session', 'true');
    localStorage.setItem('auth_username', 'google-user');
    const restored = new AuthService(TestBed.inject(HttpClient));
    expect(restored.getUsername()).toBe('google-user');
  });

  it('should restore the roles from localStorage', () => {
    localStorage.setItem('oauth_session', 'true');
    localStorage.setItem('auth_roles', JSON.stringify(['menu-editor']));
    const restored = new AuthService(TestBed.inject(HttpClient));
    expect(restored.hasRole('menu-editor')).toBeTrue();
    expect(restored.hasRole('menu-creator')).toBeFalse();
  });

  it('should ignore malformed stored roles', () => {
    localStorage.setItem('auth_roles', 'not-json');
    const restored = new AuthService(TestBed.inject(HttpClient));
    expect(restored.getRoles()).toEqual([]);
  });

  it('should extract the username from a Keycloak JWT when saving a token', () => {
    // header {"alg":"HS256"} / payload {"preferred_username":"john"} / signature
    const jwt = [
      btoa(JSON.stringify({ alg: 'HS256' })),
      btoa(JSON.stringify({ preferred_username: 'john' })),
      'signature'
    ].join('.');

    service.saveToken(jwt);

    expect(service.getUsername()).toBe('john');
    expect(localStorage.getItem('auth_username')).toBe('john');
  });

  it('should extract the realm roles from a Keycloak JWT when saving a token', () => {
    const jwt = [
      btoa(JSON.stringify({ alg: 'HS256' })),
      btoa(JSON.stringify({ preferred_username: 'demo', realm_access: { roles: ['menu-editor', 'menu-creator'] } })),
      'signature'
    ].join('.');

    service.saveToken(jwt);

    expect(service.getRoles()).toEqual(['menu-editor', 'menu-creator']);
    expect(service.hasRole('menu-editor')).toBeTrue();
    expect(service.hasRole('menu-creator')).toBeTrue();
    expect(JSON.parse(localStorage.getItem('auth_roles')!)).toEqual(['menu-editor', 'menu-creator']);
  });

  it('should fall back to no roles when the token has no realm_access claim', () => {
    const jwt = [
      btoa(JSON.stringify({ alg: 'HS256' })),
      btoa(JSON.stringify({ preferred_username: 'john' })),
      'signature'
    ].join('.');

    service.saveToken(jwt);

    expect(service.getRoles()).toEqual([]);
    expect(service.hasRole('menu-editor')).toBeFalse();
    expect(localStorage.getItem('auth_roles')).toBeNull();
  });

  it('should fall back to no username when the token has no preferred_username claim', () => {
    const jwt = [
      btoa(JSON.stringify({ alg: 'HS256' })),
      btoa(JSON.stringify({ sub: '123' })),
      'signature'
    ].join('.');

    service.saveToken(jwt);

    expect(service.getUsername()).toBeNull();
    expect(localStorage.getItem('auth_username')).toBeNull();
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

  it('should clear the username on cleanToken', () => {
    localStorage.setItem('oauth_session', 'true');
    localStorage.setItem('auth_username', 'google-user');
    const svc = new AuthService(TestBed.inject(HttpClient));
    expect(svc.getUsername()).toBe('google-user');

    svc.cleanToken();

    expect(svc.getUsername()).toBeNull();
    expect(localStorage.getItem('auth_username')).toBeNull();
  });

  it('should clear the roles on cleanToken', () => {
    localStorage.setItem('oauth_session', 'true');
    localStorage.setItem('auth_roles', JSON.stringify(['menu-editor']));
    const svc = new AuthService(TestBed.inject(HttpClient));
    expect(svc.hasRole('menu-editor')).toBeTrue();

    svc.cleanToken();

    expect(svc.getRoles()).toEqual([]);
    expect(svc.hasRole('menu-editor')).toBeFalse();
    expect(localStorage.getItem('auth_roles')).toBeNull();
  });
});