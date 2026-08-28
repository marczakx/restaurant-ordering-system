import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const setup = (): void => {
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUsername', 'getRoles', 'cleanToken']);
    authServiceSpy.isLoggedIn.and.returnValue(false);
    authServiceSpy.getRoles.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        // Real router (required by the routerLink directives in the navbar
        // template); navigation calls are spied on per test.
        provideRouter([])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should create', () => {
    setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the login link when not logged in', () => {
    setup();
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('.user-info')).toBeNull();
    expect(compiled.textContent).toContain('Login');
  });

  it('should display the logged in username in the navbar', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUsername.and.returnValue('google-user');
    setup();

    const compiled: HTMLElement = fixture.nativeElement;
    const userInfo = compiled.querySelector('.user-info');
    expect(userInfo).withContext('user-info element should be rendered').not.toBeNull();
    expect(userInfo?.textContent).toContain('google-user');
  });

  it('should display the assigned roles in the navbar', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUsername.and.returnValue('demo');
    authServiceSpy.getRoles.and.returnValue(['menu-editor', 'menu-creator']);
    setup();

    const compiled: HTMLElement = fixture.nativeElement;
    const roles = compiled.querySelector('.user-roles');
    expect(roles).withContext('user-roles element should be rendered').not.toBeNull();
    expect(roles?.textContent).toContain('menu-editor');
    expect(roles?.textContent).toContain('menu-creator');
  });

  it('should not show the roles span when the user has no roles', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUsername.and.returnValue('google-user');
    authServiceSpy.getRoles.and.returnValue([]);
    setup();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('.user-roles')).toBeNull();
  });

  it('should hide the user info when the username is unknown', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUsername.and.returnValue(null);
    setup();

    expect(fixture.nativeElement.querySelector('.user-info')).toBeNull();
  });

  it('should clear the session and navigate to login on logout', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUsername.and.returnValue('google-user');
    setup();

    (fixture.componentInstance as any).logout();

    expect(authServiceSpy.cleanToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
