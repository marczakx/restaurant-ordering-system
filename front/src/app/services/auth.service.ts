import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

/** Shape of the backend response from GET /api/auth/status. */
interface AuthStatus {
  authenticated: boolean;
  username?: string | null;
  roles?: string[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly OAUTH_SESSION_KEY = 'oauth_session';
  private readonly USERNAME_KEY = 'auth_username';
  private readonly USER_ID_KEY = 'auth_user_id';
  private readonly ROLES_KEY = 'auth_roles';
  private token: string | null = null;
  private oauthSession = false;
  private username: string | null = null;
  // Stable Keycloak "sub" claim. Used by the order API to scope the
  // list of orders to the logged-in user (replaces the previous
  // preferred_username-based filter, which is fragile to renames).
  private userId: string | null = null;
  // Realm roles granted to the logged-in user (e.g. "menu-editor",
  // "menu-creator"). Used by the UI to show/hide menu editing actions.
  private roles: string[] = [];
  // Relative URL - Keycloak is proxied by the frontend nginx under /keycloak/,
  // so the same built bundle works in Docker Compose and Kubernetes.
  private readonly KEYCLOAK_URL = '/keycloak';
  private readonly REALM = 'restaurant';
  private readonly CLIENT_ID = 'restaurant-client';

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem(this.TOKEN_KEY);
    this.oauthSession = localStorage.getItem(this.OAUTH_SESSION_KEY) === 'true';
    this.username = localStorage.getItem(this.USERNAME_KEY);
    this.userId = localStorage.getItem(this.USER_ID_KEY);
    this.roles = this.readStoredRoles();
  }

  login(username: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', this.CLIENT_ID);
    body.set('username', username);
    body.set('password', password);

    return this.http.post(
      `${this.KEYCLOAK_URL}/realms/${this.REALM}/protocol/openid-connect/token`,
      body.toString(),
      { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
    );
  }

  /**
   * Called by the SPA callback route after the backend OAuth2 login
   * (e.g. Google) redirected the browser back into the app. Asks the
   * backend whether the server-side session is authenticated and, if so,
   * remembers it locally so the auth guard grants access.
   */
  completeOAuth2Login(): Observable<boolean> {
    return this.http.get<AuthStatus>('/api/auth/status').pipe(
      map((status) => {
        if (status.authenticated) {
          this.oauthSession = true;
          localStorage.setItem(this.OAUTH_SESSION_KEY, 'true');
          this.setUsername(status.username ?? null);
          this.setRoles(status.roles ?? []);
        }
        return status.authenticated;
      })
    );
  }

  cleanToken(): void {
    this.token = null;
    this.oauthSession = false;
    this.username = null;
    this.userId = null;
    this.roles = [];
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.OAUTH_SESSION_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.ROLES_KEY);
  }

  saveToken(token: string): void {
    this.token = token;
    localStorage.setItem(this.TOKEN_KEY, token);
    // Extract the human-readable name from the Keycloak JWT so the UI can
    // show who is logged in for both login methods (password + Google).
    this.setUsername(this.readPreferredUsername(token));
    // Extract the stable Keycloak "sub" claim so the order API can
    // scope the list of orders to the logged-in user.
    this.setUserId(this.readSubject(token));
    // Extract the realm roles from the Keycloak JWT so the UI can gate
    // menu editing/adding actions by role.
    this.setRoles(this.readRealmRoles(token));
  }

  getUsername(): string | null {
    return this.username;
  }

  /**
   * Returns the stable Keycloak {@code sub} claim of the logged-in
   * user, or {@code null} when not logged in. Used as the {@code userId}
   * filter for the orders endpoint.
   */
  getUserId(): string | null {
    return this.userId;
  }

  /** All roles granted to the logged-in user (empty when logged out). */
  getRoles(): string[] {
    return [...this.roles];
  }

  /** Whether the logged-in user has been granted the given role. */
  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  private setUsername(username: string | null): void {
    this.username = username;
    if (username) {
      localStorage.setItem(this.USERNAME_KEY, username);
    } else {
      localStorage.removeItem(this.USERNAME_KEY);
    }
  }

  private setUserId(userId: string | null): void {
    this.userId = userId;
    if (userId) {
      localStorage.setItem(this.USER_ID_KEY, userId);
    } else {
      localStorage.removeItem(this.USER_ID_KEY);
    }
  }

  private setRoles(roles: string[]): void {
    this.roles = roles ?? [];
    if (this.roles.length > 0) {
      localStorage.setItem(this.ROLES_KEY, JSON.stringify(this.roles));
    } else {
      localStorage.removeItem(this.ROLES_KEY);
    }
  }

  private readStoredRoles(): string[] {
    try {
      const raw = localStorage.getItem(this.ROLES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((r) => typeof r === 'string') : [];
    } catch {
      return [];
    }
  }

  /** Decodes the JWT payload and returns the "preferred_username" claim. */
  private readPreferredUsername(jwt: string): string | null {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      return typeof payload.preferred_username === 'string' ? payload.preferred_username : null;
    } catch {
      return null;
    }
  }

  /**
   * Decodes the JWT payload and returns the "sub" claim - the stable
   * Keycloak user identifier used as the userId filter for the orders API.
   */
  private readSubject(jwt: string): string | null {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }

  /**
   * Decodes the JWT payload and returns the Keycloak realm roles from the
   * "realm_access.roles" claim (populated by the "roles" client scope).
   */
  private readRealmRoles(jwt: string): string[] {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      const roles = payload?.realm_access?.roles;
      return Array.isArray(roles) ? roles.filter((r: unknown) => typeof r === 'string') : [];
    } catch {
      return [];
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isLoggedIn(): boolean {
    return this.token !== null || this.oauthSession;
  }
}