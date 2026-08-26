import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { LoginCallbackComponent } from './login-callback.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

describe('LoginCallbackComponent', () => {
  let component: LoginCallbackComponent;
  let fixture: ComponentFixture<LoginCallbackComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const setup = (status$: Observable<boolean>): void => {
    authServiceSpy.completeOAuth2Login.and.returnValue(status$);
    fixture = TestBed.createComponent(LoginCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['completeOAuth2Login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginCallbackComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    setup(of(false));
    expect(component).toBeTruthy();
  });

  it('should navigate to menu when the backend session is authenticated', () => {
    setup(of(true));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/menu']);
  });

  it('should navigate back to login when the backend session is not authenticated', () => {
    setup(of(false));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should show an error when the status check fails', () => {
    setup(throwError(() => new Error('network error')));
    expect(component.error).toContain('could not be verified');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});