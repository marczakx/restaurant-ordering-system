describe('Order Viewer Role E2E Tests', () => {
  /**
   * Tags every outgoing GET /api/order call with an alias so the tests
   * can introspect the customer query parameter sent by the SPA and the
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
    return cy.request('/api/menu/items').then((response) => {
      cachedMenuItem = response.body[0];
      return cachedMenuItem;
    });
  }

  /**
   * Seeds the backend with an order placed by the given customer name.
   * The order references a real menu item fetched from the API so the
   * backend can persist it without trying to create a transient
   * MenuItem entity. Uses the public PUT /api/order endpoint, which
   * has no auth check on the backend, so any test can call it.
   */
  function placeOrderForCustomer(customerName) {
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
        status: 'TO_DO'
      };
      return cy.request('PUT', '/api/order', order);
    });
  }

  describe('Regular user without order-viewer role', () => {
    beforeEach(() => {
      // The "demo" Keycloak user has menu-editor + menu-creator but
      // NOT order-viewer - perfect for testing the restricted view.
      cy.loginViaKeycloak('demo', 'demo');
      interceptOrdersApi();
    });

    it('should send ?customer=<username> on the orders request', () => {
      cy.visit('/orders');
      cy.get('h1').should('contain', 'Orders');

      // The first /api/order request made by the SPA must carry the
      // customer filter derived from the logged-in Keycloak username
      // and MUST NOT include the viewer flag.
      cy.wait('@getOrders').then((interception) => {
        const url = new URL(interception.request.url, 'http://localhost');
        expect(url.pathname).to.equal('/api/order');
        expect(url.searchParams.get('customer')).to.equal('demo');
        expect(url.searchParams.get('viewer')).to.be.null;
      });
    });

    it('should only see orders placed by the logged-in user', () => {
      // Seed two orders: one for the current user (demo) and one for
      // someone else. Only the demo order should reach the UI.
      placeOrderForCustomer('demo');
      placeOrderForCustomer('someone-else');

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
      placeOrderForCustomer('someone-else');

      cy.request('/api/order?customer=demo').then((response) => {
        expect(response.status).to.eq(200);
        const customers = response.body.map((o) => o.customer);
        expect(customers).to.not.include('someone-else');
      });
    });

    it('should return nothing when neither ?customer nor ?viewer is provided', () => {
      // Without any scoping parameter the backend cannot tell who is
      // calling and must not leak the full order list to non-viewers.
      cy.request('/api/order').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.equal([]);
      });
    });
  });

  describe('Manager with order-viewer role', () => {
    beforeEach(() => {
      // The new "manager" Keycloak user is granted the order-viewer
      // realm role in restaurant-realm.json. loginViaKeycloak extracts
      // the role from the JWT and mirrors it into localStorage.auth_roles
      // so canViewAllOrders() in OrdersComponent returns true.
      cy.loginViaKeycloak('manager', 'manager');
      interceptOrdersApi();
    });

    it('should send ?viewer=true (and no customer filter) on the orders request', () => {
      cy.visit('/orders');
      cy.get('h1').should('contain', 'Orders');

      cy.wait('@getOrders').then((interception) => {
        const url = new URL(interception.request.url, 'http://localhost');
        expect(url.pathname).to.equal('/api/order');
        // order-viewer must receive the full list, so the SPA signals
        // the privilege via ?viewer=true and skips the customer filter.
        expect(url.searchParams.get('viewer')).to.equal('true');
        expect(url.searchParams.get('customer')).to.be.null;
      });
    });

    it('should see orders placed by any customer', () => {
      placeOrderForCustomer('alice');
      placeOrderForCustomer('bob');

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
      placeOrderForCustomer('alice-viewer-test');
      placeOrderForCustomer('bob-viewer-test');

      cy.request('/api/order?viewer=true').then((response) => {
        expect(response.status).to.eq(200);
        const customers = response.body.map((o) => o.customer);
        // Both seeded customers should be present - the viewer
        // bypasses the per-customer filter.
        expect(customers).to.include('alice-viewer-test');
        expect(customers).to.include('bob-viewer-test');
      });
    });
  });

  describe('Order visibility isolation between users', () => {
    it('should hide user A orders from user B when neither has order-viewer', () => {
      // User A (demo) places an order attributed to themselves
      cy.loginViaKeycloak('demo', 'demo');
      placeOrderForCustomer('demo');

      // Switch to user B (editor) - different Keycloak user, no
      // order-viewer role. They must not see demo's order.
      cy.loginViaKeycloak('editor', 'editor');
      cy.request('/api/order?customer=editor').then((response) => {
        expect(response.status).to.eq(200);
        const customers = response.body.map((o) => o.customer);
        expect(customers).to.not.include('demo');
      });
    });
  });
});