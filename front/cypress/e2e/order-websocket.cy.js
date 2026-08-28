describe('Order WebSocket E2E Tests', () => {
  beforeEach(() => {
    // Login via Keycloak (proxied by the frontend nginx under /keycloak)
    // since /orders is protected by authGuard
    cy.visit('/');
    cy.get('input[name="username"]').type('demo');
    cy.get('input[name="password"]').type('demo');
    cy.request({
      method: 'POST',
      url: '/keycloak/realms/restaurant/protocol/openid-connect/token',
      form: true,
      body: {
        grant_type: 'password',
        client_id: 'restaurant-client',
        username: 'demo',
        password: 'demo'
      }
    }).then((response) => {
      window.localStorage.setItem('auth_token', response.body.access_token);
      cy.visit('/orders');
      cy.reload();
      cy.wait(2000);
    });
  });

  it('should load orders and display them on the orders page', () => {
    cy.get('h1').should('contain', 'Orders');
    cy.get('.order-card').should('have.length.at.least', 1);
  });

  it('should display a new order in real-time when placed via API', () => {
    // Count existing orders before placing a new one
    cy.get('.order-card').then(($cards) => {
      const initialCount = $cards.length;

      // Place a new order via the REST API. The backend broadcasts the
      // saved order to the "/order" WebSocket topic, and the OrdersComponent
      // should receive it and append it to the list in real time.
      cy.request({
        method: 'PUT',
        url: '/api/order',
        body: {
          id: 0,
          orderItems: [],
          customer: 'WebSocket Test Customer',
          status: 'TO_DO'
        }
      }).then((response) => {
        const newOrderId = response.body.id;
        expect(newOrderId).to.be.a('number');

        // The new order should appear via the WebSocket update
        cy.get('.order-card', { timeout: 10000 }).should('have.length', initialCount + 1);
        cy.get('.order-card').contains('WebSocket Test Customer').should('exist');
        cy.get('.order-card').contains(`Order #${newOrderId}`).should('exist');
      });
    });
  });

  it('should update order status in real-time via WebSocket', () => {
    // Get the first order's ID from the UI
    cy.get('.order-card').first().within(() => {
      cy.get('h3').invoke('text').then((text) => {
        const orderId = text.match(/#(\d+)/)[1];

        // Change the status via the REST API. The backend broadcasts the
        // updated order to the "/order" WebSocket topic, and the
        // OrdersComponent should receive it and update the badge in real time.
        cy.request({
          method: 'PUT',
          url: `/api/order/${orderId}/status`,
          body: '"IN_PROGRESS"',
          headers: { 'Content-Type': 'application/json' }
        });

        // The status badge should update via the WebSocket broadcast
        cy.get('.status-badge').should('contain', 'W trakcie');
        cy.get('.status-badge').should('have.class', 'status-progress');
      });
    });
  });

  it('should update order status to DONE in real-time via WebSocket', () => {
    cy.get('.order-card').first().within(() => {
      cy.get('h3').invoke('text').then((text) => {
        const orderId = text.match(/#(\d+)/)[1];

        cy.request({
          method: 'PUT',
          url: `/api/order/${orderId}/status`,
          body: '"DONE"',
          headers: { 'Content-Type': 'application/json' }
        });

        cy.get('.status-badge').should('contain', 'Gotowe');
        cy.get('.status-badge').should('have.class', 'status-done');
      });
    });
  });

  it('should update order status back to TO_DO in real-time via WebSocket', () => {
    cy.get('.order-card').first().within(() => {
      cy.get('h3').invoke('text').then((text) => {
        const orderId = text.match(/#(\d+)/)[1];

        cy.request({
          method: 'PUT',
          url: `/api/order/${orderId}/status`,
          body: '"TO_DO"',
          headers: { 'Content-Type': 'application/json' }
        });

        cy.get('.status-badge').should('contain', 'Do realizacji');
        cy.get('.status-badge').should('have.class', 'status-todo');
      });
    });
  });

  it('should update item quantity in real-time via WebSocket', () => {
    // Find an order that has at least one order item
    cy.get('.order-card').then(($cards) => {
      let targetCard = null;
      let targetOrderId = null;
      let targetItemId = null;

      $cards.each(function () {
        const card = Cypress.$(this);
        const itemElements = card.find('.order-item');
        if (itemElements.length > 0) {
          targetCard = card;
          return false; // break
        }
      });

      // If no card with items found, skip this test
      if (!targetCard) {
        cy.log('No orders with items found, skipping quantity test');
        return;
      }

      // Extract order ID and item ID from the first order item
      const orderIdText = targetCard.find('h3').text();
      targetOrderId = orderIdText.match(/#(\d+)/)[1];

      // We need to get the item ID from the DOM. The order item doesn't
      // expose its ID directly in the HTML, so we'll use the API to
      // get the order details and find an item ID.
      cy.request('GET', `/api/order/${targetOrderId}`).then((response) => {
        const order = response.body;
        if (order.orderItems && order.orderItems.length > 0) {
          targetItemId = order.orderItems[0].id;

          // Update the item quantity via the REST API. The backend broadcasts
          // the updated order to the "/order" WebSocket topic.
          cy.request({
            method: 'PUT',
            url: `/api/order/${targetOrderId}/items/${targetItemId}/quantity?quantity=5`
          });

          // The quantity should update via the WebSocket broadcast
          cy.get('.order-card').contains(`Order #${targetOrderId}`).closest('.order-card')
            .find('.quantity').should('contain', '5');
        }
      });
    });
  });

  it('should remove an item in real-time via WebSocket', () => {
    // Find an order that has at least one order item
    cy.get('.order-card').then(($cards) => {
      let targetCard = null;

      $cards.each(function () {
        const card = Cypress.$(this);
        if (card.find('.order-item').length > 0) {
          targetCard = card;
          return false; // break
        }
      });

      if (!targetCard) {
        cy.log('No orders with items found, skipping removal test');
        return;
      }

      const orderIdText = targetCard.find('h3').text();
      const orderId = orderIdText.match(/#(\d+)/)[1];

      // Get the order details to find an item ID
      cy.request('GET', `/api/order/${orderId}`).then((response) => {
        const order = response.body;
        if (order.orderItems && order.orderItems.length > 0) {
          const itemId = order.orderItems[0].id;
          const initialItemCount = order.orderItems.length;

          // Remove the item via the REST API. The backend broadcasts the
          // updated order to the "/order" WebSocket topic.
          cy.request({
            method: 'DELETE',
            url: `/api/order/${orderId}/items/${itemId}`
          });

          // The order item should be removed via the WebSocket broadcast
          cy.get('.order-card').contains(`Order #${orderId}`).closest('.order-card')
            .find('.order-item', { timeout: 10000 }).should('have.length', initialItemCount - 1);
        }
      });
    });
  });

  it('should reflect status changes from another order update in real-time', () => {
    // This test verifies that when an order is updated (e.g. status changed),
    // the WebSocket broadcast updates the order in the list without a page reload.
    cy.get('.order-card').first().within(() => {
      cy.get('h3').invoke('text').then((text) => {
        const orderId = text.match(/#(\d+)/)[1];

        // First, set status to IN_PROGRESS via API
        cy.request({
          method: 'PUT',
          url: `/api/order/${orderId}/status`,
          body: '"IN_PROGRESS"',
          headers: { 'Content-Type': 'application/json' }
        });

        cy.get('.status-badge').should('contain', 'W trakcie');

        // Then, set status to DONE via API
        cy.request({
          method: 'PUT',
          url: `/api/order/${orderId}/status`,
          body: '"DONE"',
          headers: { 'Content-Type': 'application/json' }
        });

        cy.get('.status-badge').should('contain', 'Gotowe');
      });
    });
  });

  it('should show updated order details in real-time when a new order is placed from the menu', () => {
    // This test verifies the full flow: placing an order from the menu page
    // triggers a WebSocket broadcast that updates the orders page.
    // First, navigate to the menu page and place an order
    cy.get('.nav-links a').contains('Menu').click();
    cy.url().should('include', '/menu');

    // Wait for menu items to load
    cy.get('.menu-item', { timeout: 15000 }).should('exist');

    // Add a menu item to the order
    cy.get('.menu-item').first().within(() => {
      cy.get('button').contains('Add to Order').click();
    });

    // Enter customer name
    cy.get('.customer-form input[placeholder="Your name"]').type('WebSocket Menu Test');

    // Place the order
    cy.get('.customer-form button').contains('Place Order').click();

    // Wait for the order to be placed
    cy.wait(2000);

    // Navigate to the orders page
    cy.get('.nav-links a').contains('Orders').click();
    cy.url().should('include', '/orders');

    // The new order should appear on the orders page
    // (it was broadcast via WebSocket when the order was placed)
    cy.get('.order-card', { timeout: 10000 }).should('exist');
    cy.get('.order-card').contains('WebSocket Menu Test').should('exist');
  });
});
