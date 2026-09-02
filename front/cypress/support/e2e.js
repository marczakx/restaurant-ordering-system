// Shared Cypress support - custom commands and global config.

/**
 * Logs in as the given Keycloak user via the password grant and stores the
 * access token in localStorage so the auth guard lets the test reach
 * protected pages. Also extracts the realm roles from the JWT and stores
 * them under the same key the AuthService uses ("auth_roles"), so UI
 * elements gated by roles (e.g. menu-creator, menu-editor) render
 * correctly during the test.
 *
 * @param {string} username - Keycloak username
 * @param {string} password - Keycloak password
 * @param {string} [clientId='restaurant-client'] - Keycloak client id
 * @param {string} [realm='restaurant'] - Keycloak realm
 */
Cypress.Commands.add('loginViaKeycloak', (username, password, clientId = 'restaurant-client', realm = 'restaurant') => {
  cy.request({
    method: 'POST',
    url: `/keycloak/realms/${realm}/protocol/openid-connect/token`,
    form: true,
    body: {
      grant_type: 'password',
      client_id: clientId,
      username,
      password
    }
  }).then((response) => {
    const token = response.body.access_token;
    window.localStorage.setItem('auth_token', token);

    // Mirror AuthService.saveToken: extract the realm roles from the
    // JWT payload and persist them so hasRole() checks succeed.
    const payload = JSON.parse(atob(token.split('.')[1]));
    const roles = (payload && payload.realm_access && Array.isArray(payload.realm_access.roles))
      ? payload.realm_access.roles
      : [];
    window.localStorage.setItem('auth_roles', JSON.stringify(roles));

    // Also extract preferred_username so the navbar can show who is
    // logged in, matching the real AuthService behaviour.
    if (payload && typeof payload.preferred_username === 'string') {
      window.localStorage.setItem('auth_username', payload.preferred_username);
    }

    // Mirror the stable Keycloak "sub" claim into localStorage so the
    // order API can scope the list to the logged-in user, matching the
    // real AuthService.saveToken behaviour.
    if (payload && typeof payload.sub === 'string') {
      window.localStorage.setItem('auth_user_id', payload.sub);
    }
  });
});
