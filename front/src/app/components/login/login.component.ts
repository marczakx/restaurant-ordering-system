import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.error = '';
    this.authService.login(this.username, this.password).subscribe({
      next: (data: any) => {
        this.authService.saveToken(data.access_token);
        this.router.navigate(['/menu']);
      },
      error: (err: any) => {
        this.authService.cleanToken();
        this.error = 'Login failed. Please check your credentials.';
      }
    });
  }
}