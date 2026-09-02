describe('Order Viewer Role E2E Tests', () => {
  /**
   * Tags every outgoing GET /api/order call with an alias so the tests
   * can introspect the userId query parameter sent by the SPA and the
   * payload returned by the backend.
   */
  function interceptOrdersApi() {
    cy.intercept('GET', '/api/order*').as('getOrders');
  }

  /**
   * Fetches the first available menu item from the backend so seeded
   * orders reference a real, persisted MenuItem (Hibernate would
   * otherwise reject an unsaved transient MenuItem in OrderItem).
   * The chosen item is cached for the duration of the test run.
   */
  let cachedMenuItem = null;
  function getSeededMenuItem() {
    if (cachedMenuItem) {
      return cy.wrap(cachedMenuItem);
    }
    return cy.apiRequest('/api/menu/items').then((response) => {
      cachedMenuItem = response.body[0];
      return cachedMenuItem;
    });
  }

  /**
   * Seeds the backend with an order placed by the given user. The
   * {@code customer} field is the human-readable name used purely for
   * display; {@code userId} is the Keycloak {@code sub} claim that the
   * backend uses to scope order listings. The order references a real
   * menu item fetched from the API so the backend can persist it
   * without trying to create a transient MenuItem entity. Uses the
   * public PUT /api/order endpoint, which has no auth check on the
   * backend, so any test can call it.
   */
  function placeOrderForUser(userId, customerName) {
    return getSeededMenuItem().then((menuItem) => {
      const order = {
        id: 0,
        orderItems: [
          {
            id: 0,
            menuItem: {
              id: menuItem.id,
              name: menuItem.name,
              price: menuItem.price,
              additions: [],
              menuItemTypeName: menuItem.menuItemTypeName,
              cuisineIds: menuItem.cuisineIds || []
            },
            price: menuItem.price,
            quantity: 1,
            additionOrderItems: []
          }
        ],
        customer: customerName,
        userId: userId,
        status: 'TO_DO'
      };
      return cy.apiRequest('PUT', '/api/order', order);
    });
  }

  /**
   * Reads the Keycloak {@code sub} claim (mirrored into localStorage by
   * the loginViaKeycloak command) for the currently logged-in user.
   * Used to seed orders with the same id the backend will filter by.
   */
  function currentUserId() {
    return window.localStorage.getItem('auth_user_id');
  }

  describe('Regular user without order-viewer role', () => {
    beforeEach(() => {
      // The "demo" Keycloak user has menu-editor + menu-creator but
      // NOT order-viewer - perfect for testing the restricted view.
      cy.loginViaKeycloak('demo', 'demo');
      interceptOrdersApi();
    });

    it('should send ?userId=<sub> on the orders request', () => {
      const expectedUserId = currentUserId();
      cy.visit('/orders');
      cy.get('h1').should('contain', 'Orders');

      // The first /api/order request made by the SPA must carry the
      // userId filter derived from the logged-in Keycloak sub claim
      // and MUST NOT include the viewer flag.
      cy.wait('@getOrders').then((interception) => {
        const url = new URL(interception.request.url, 'http://localhost');
        expect(url.pathname).to.equal('/api/order');
        expect(url.searchParams.get('userId')).to.equal(expectedUserId);
        expect(url.searchParams.get('customer')).to.be.null;
        expect(url.searchParams.get('viewer')).to.be.null;
      });
    });

    it('should only see orders placed by the logged-in user', () => {
      // Seed two orders: one for the current user (demo) and one for
      // someone else. Only the demo order should reach the UI.
      const demoId = currentUserId();
      placeOrderForUser(demoId, 'demo');
      placeOrderForUser('someone-else-sub', 'someone-else');

      cy.visit('/orders');
      cy.get('h1').should('contain', 'Orders');
      cy.wait('@getOrders');

      // The current user's own order is visible
      cy.get('.order-card', { timeout: 10000 })
        .contains('.customer', 'demo')
        .should('exist');

      // No card rendered for a different customer
      cy.get('.order-card .customer').each(($el) => {
        expect($el.text()).to.not.include('someone-else');
      });
    });

    it('should not leak other users orders via the API either', () => {
      const demoId = currentUserId();
      placeOrderForUser('someone-else-sub', 'someone-else');

      cy.apiRequest(`/api/order?userId=${demoId}`).then((response) => {
        expect(response.status).to.eq(200);
        const customers = response.body.map((o) => o.customer);
        expect(customers).to.not.include('someone-else');
      });
    });

    it('should return nothing when neither ?userId nor ?viewer is provided', () => {
      // Without any scoping parameter the backend cannot tell who is
      // calling and must not leak the full order list to non-viewers.
      cy.apiRequest('/api/order').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.equal([]);
      });
    });
  });

  describe('Manager with order-viewer role', () => {
    beforeEach(() => {
      // The "manager" Keycloak user is granted the order-viewer
      // realm role in restaurant-realm.json. loginViaKeycloak extracts
      // the role from the JWT and mirrors it into localStorage.auth_roles
      // so canViewAllOrders() in OrdersComponent returns true.
      cy.loginViaKeycloak('manager', 'manager');
      interceptOrdersApi();
    });

    it('should send ?viewer=true (and no userId filter) on the orders request', () => {
      cy.visit('/orders');
      cy.get('h1').should('contain', 'Orders');

      cy.wait('@getOrders').then((interception) => {
        const url = new URL(interception.request.url, 'http://localhost');
        expect(url.pathname).to.equal('/api/order');
        // order-viewer must receive the full list, so the SPA signals
        // the privilege via ?viewer=true and skips the userId filter.
        expect(url.searchParams.get('viewer')).to.equal('true');
        expect(url.searchParams.get('userId')).to.be.null;
      });
    });

    it('should see orders placed by any customer', () => {
      placeOrderForUser('alice-sub', 'alice');
      placeOrderForUser('bob-sub', 'bob');

      cy.visit('/orders');
      cy.get('h1').should('contain', 'Orders');
      cy.wait('@getOrders');

      cy.get('.order-card .customer', { timeout: 10000 })
        .then(($els) => {
          const customers = $els
            .map((i, el) => el.textContent.replace(/^Customer:\s*/, '').trim())
            .get();
          expect(customers).to.include('alice');
          expect(customers).to.include('bob');
        });
    });

    it('should return every order from the backend when ?viewer=true', () => {
      placeOrderForUser('alice-viewer-sub', 'alice-viewer-test');
      placeOrderForUser('bob-viewer-sub', 'bob-viewer-test');

      cy.apiRequest('/api/order?viewer=true').then((response) => {
        expect(response.status).to.eq(200);
        const customers = response.body.map((o) => o.customer);
        // Both seeded customers should be present - the viewer
        // bypasses the per-user filter.
        expect(customers).to.include('alice-viewer-test');
        expect(customers).to.include('bob-viewer-test');
      });
    });
  });

  describe('Order visibility isolation between users', () => {
    it('should hide user A orders from user B when neither has order-viewer', () => {
      // User A (demo) places an order attributed to themselves
      cy.loginViaKeycloak('demo', 'demo');
      const demoId = currentUserId();
      placeOrderForUser(demoId, 'demo');

      // Switch to user B (editor) - different Keycloak user, no
      // order-viewer role. They must not see demo's order.
      cy.loginViaKeycloak('editor', 'editor');
      const editorId = currentUserId();
      cy.apiRequest(`/api/order?userId=${editorId}`).then((response) => {
        expect(response.status).to.eq(200);
        const customers = response.body.map((o) => o.customer);
        expect(customers).to.not.include('demo');
      });
    });
  });
});