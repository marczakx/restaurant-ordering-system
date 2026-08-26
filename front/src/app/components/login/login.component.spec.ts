import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'saveToken',
      'cleanToken'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    authServiceSpy.login.and.returnValue(of({ access_token: 'fake-token' }));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty username, password, and error', () => {
    expect(component.username).toBe('');
    expect(component.password).toBe('');
    expect(component.error).toBe('');
  });

  it('should login successfully and navigate to menu', () => {
    component.username = 'testuser';
    component.password = 'password123';
    component.login();

    expect(authServiceSpy.login).toHaveBeenCalledWith('testuser', 'password123');
    expect(authServiceSpy.saveToken).toHaveBeenCalledWith('fake-token');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/menu']);
    expect(component.error).toBe('');
  });

  it('should set error message on login failure', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

    component.username = 'testuser';
    component.password = 'wrongpassword';
    component.login();

    expect(authServiceSpy.cleanToken).toHaveBeenCalled();
    expect(component.error).toBe('Login failed. Please check your credentials.');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
