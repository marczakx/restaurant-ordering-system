describe('Google Login E2E Tests', () => {

  it('should show the Sign in with Google button on the login page', () => {
    cy.visit('/login');
    cy.get('.btn-google').should('be.visible');
    cy.get('.btn-google').should('contain', 'Sign in with Google');
  });

  it('should start the OAuth2 flow when clicking Sign in with Google', () => {
    cy.visit('/login');

    // Clicking the button navigates to /api/auth/google which must
    // answer with a redirect into the OAuth2 authorization endpoint.
    cy.intercept('GET', '/api/auth/google').as('googleLoginStart');
    cy.get('.btn-google').click();

    cy.wait('@googleLoginStart').then((interception) => {
      expect(interception.response.statusCode).to.eq(302);
      // Location may be relative or absolute (depends on proxy headers),
      // so only the path part is asserted.
      expect(interception.response.headers.location)
        .to.include('/oauth2/authorization/google');
    });
  });

  it('should redirect the OAuth2 authorization endpoint to Google', () => {
    // The authorization endpoint must hand the browser over to Google's
    // consent screen with our client id and a callback URI that points
    // back to the same origin the user is browsing (port included).
    cy.request({
      url: '/oauth2/authorization/google',
      followRedirect: false,
    }).then((response) => {
      expect(response.status).to.eq(302);
      const location = response.headers.location;
      expect(location).to.include('https://accounts.google.com/o/oauth2/v2/auth');
      expect(location).to.include('client_id=');
      expect(location).to.include('scope=openid');
    });
  });

  it('should land on the Google sign-in page when following the button flow', () => {
    // Follow the exact redirect chain a real browser walks through after
    // clicking the button (Cypress cannot navigate cross-origin itself):
    //   /api/auth/google -> /oauth2/authorization/google -> accounts.google.com
    cy.request({
      url: '/api/auth/google',
      followRedirect: false,
    }).then((first) => {
      expect(first.status).to.eq(302);
      return cy.request({
        url: first.headers.location,
        followRedirect: false,
      });
    }).then((second) => {
      expect(second.status).to.eq(302);
      expect(second.headers.location)
        .to.include('https://accounts.google.com/o/oauth2/v2/auth');
    });
  });
});