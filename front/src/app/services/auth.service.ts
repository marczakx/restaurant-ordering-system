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
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly OAUTH_SESSION_KEY = 'oauth_session';
  private token: string | null = null;
  private oauthSession = false;
  // Relative URL - Keycloak is proxied by the frontend nginx under /keycloak/,
  // so the same built bundle works in Docker Compose and Kubernetes.
  private readonly KEYCLOAK_URL = '/keycloak';
  private readonly REALM = 'restaurant';
  private readonly CLIENT_ID = 'restaurant-client';

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem(this.TOKEN_KEY);
    this.oauthSession = localStorage.getItem(this.OAUTH_SESSION_KEY) === 'true';
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
        }
        return status.authenticated;
      })
    );
  }

  cleanToken(): void {
    this.token = null;
    this.oauthSession = false;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.OAUTH_SESSION_KEY);
  }

  saveToken(token: string): void {
    this.token = token;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return this.token;
  }

  isLoggedIn(): boolean {
    return this.token !== null || this.oauthSession;
  }
}
