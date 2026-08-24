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

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem(this.TOKEN_KEY);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post('/login', {
      "user": username,
      "password": password
    }, httpOptions);
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
      //return true;
      return this.token !== null;
  }
}