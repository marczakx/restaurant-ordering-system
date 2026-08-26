import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Landing route of the backend OAuth2 login flow (Google). After Spring
 * Security redirects here, the server-side session is verified via
 * /api/auth/status and the user continues into the protected routes.
 */
@Component({
  selector: 'app-login-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-callback.component.html',
  styleUrls: ['./login-callback.component.scss']
})
export class LoginCallbackComponent {
  error = '';

  constructor(private authService: AuthService, private router: Router) {
    this.authService.completeOAuth2Login().subscribe({
      next: (authenticated) => {
        this.router.navigate([authenticated ? '/menu' : '/login']);
      },
      error: () => {
        this.error = 'Sign-in could not be verified. Please try again.';
      }
    });
  }
}