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

/**
 * Drop-in replacement for cy.request that automatically attaches the
 * Keycloak bearer token to every request that targets the protected
 * /api/* and /ws endpoints. cy.request does not forward the browser's
 * Authorization header automatically, and overriding cy.request itself
 * is not supported by Cypress, so we expose a dedicated command and use
 * it in the e2e specs.
 *
 * Accepts the same signatures as cy.request:
 *   cy.apiRequest(url)
 *   cy.apiRequest(url, options)
 *   cy.apiRequest(method, url)
 *   cy.apiRequest(method, url, body)
 *   cy.apiRequest(options)
 */
Cypress.Commands.add('apiRequest', (...args) => {
  let opts;
  if (args.length === 1) {
    const arg = args[0];
    opts = typeof arg === 'string' ? { url: arg } : { ...arg };
  } else if (args.length >= 2) {
    opts = { method: args[0], url: args[1] };
    if (args.length >= 3 && args[2] !== undefined && args[2] !== null) {
      opts.body = args[2];
    }
  }

  const url = opts.url || '';
  const needsAuth = (url.startsWith('/api') || url.startsWith('/ws')) &&
                    !opts.headers?.Authorization;
  if (needsAuth) {
    const token = window.localStorage.getItem('auth_token');
    if (token) {
      opts.headers = { ...(opts.headers || {}), Authorization: `Bearer ${token}` };
    }
  }
  return cy.request(opts);
});

/**
 * Global beforeEach hook that guarantees the SPA is reloaded with a
 * valid token in localStorage BEFORE any spec starts. The Angular
 * AuthService is a singleton that reads the bearer token once in its
 * constructor; because cy.visit() to a same-origin path does not
 * always force a real reload, the interceptor would otherwise see an
 * outdated `this.token` value and omit the Authorization header, which
 * nginx then answers with a 401. Performing a full reload here makes
 * the AuthService pick up whatever login state the spec set up.
 */
beforeEach(() => {
  cy.visit('/', { failOnStatusCode: false });
  cy.reload();
});