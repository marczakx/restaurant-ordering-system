import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private token: string | null = null;
  // Relative URL - Keycloak is proxied by the frontend nginx under /keycloak/,
  // so the same built bundle works in Docker Compose and Kubernetes.
  private readonly KEYCLOAK_URL = '/keycloak';
  private readonly REALM = 'restaurant';
  private readonly CLIENT_ID = 'restaurant-client';

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem(this.TOKEN_KEY);
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

  cleanToken(): void {
    this.token = null;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  saveToken(token: string): void {
    this.token = token;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return this.token;
  }

  isLoggedIn(): boolean {
    return this.token !== null;
  }
}