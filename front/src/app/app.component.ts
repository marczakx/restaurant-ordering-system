import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="logo">Restaurant Ordering</a>
        <div class="nav-links">
          <a routerLink="/menu" routerLinkActive="active">Menu</a>
          <a routerLink="/orders" routerLinkActive="active">Orders</a>
          <ng-container *ngIf="authService.isLoggedIn(); else loginBtn">
            <a (click)="logout()" class="logout-btn">Logout</a>
          </ng-container>
          <ng-template #loginBtn>
            <a routerLink="/login" routerLinkActive="active">Login</a>
          </ng-template>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar {
      background: #1976d2;
      color: white;
      padding: 1rem 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 500;
      color: white;
      text-decoration: none;
    }
    .nav-links a {
      color: white;
      text-decoration: none;
      margin-left: 2rem;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.3s;
      cursor: pointer;
    }
    .nav-links a:hover, .nav-links a.active {
      background: rgba(255,255,255,0.2);
    }
    .logout-btn {
      background: rgba(255,255,255,0.1);
    }
    .logout-btn:hover {
      background: rgba(255,0,0,0.3);
    }
    .main-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
  `]
})
export class AppComponent {
  constructor(public authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.cleanToken();
    this.router.navigate(['/login']);
  }
}
