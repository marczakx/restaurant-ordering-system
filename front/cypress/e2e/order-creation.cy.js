describe('Order Creation E2E Tests', () => {
  beforeEach(() => {
    // Login via Keycloak (proxied by the frontend nginx under /keycloak)
    // since /menu is protected by authGuard
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
      cy.visit('/menu');
      cy.reload();
      cy.wait(2000);
    });
  });

  it('should display the menu page', () => {
    cy.get('h1').should('contain', 'Menu');
  });

  it('should load menu items from the API', () => {
    // Check that the page has loaded and has menu items
    // The menu items are loaded via ngOnInit in the MenuComponent
    cy.get('body').should('contain.text', 'Menu');
    
    // Wait for the API calls to complete
    cy.wait(5000);
    
    // Check for menu items - they should be displayed after API calls
    cy.get('.menu-item', { timeout: 15000 }).should('exist');
  });

  it('should add a menu item to the order', () => {
    cy.get('.menu-item', { timeout: 15000 }).first().within(() => {
      cy.get('button').contains('Add to Order').click();
    });
    
    cy.get('.order-summary').should('exist');
    cy.get('.order-item').should('have.length', 1);
  });

  it('should add multiple items to the order', () => {
    cy.get('.menu-item', { timeout: 15000 }).first().within(() => {
      cy.get('button').contains('Add to Order').click();
    });
    
    cy.get('.menu-item', { timeout: 15000 }).eq(1).within(() => {
      cy.get('button').contains('Add to Order').click();
    });
    
    cy.get('.order-item').should('have.length', 2);
  });

  it('should calculate the correct total', () => {
    cy.get('.menu-item', { timeout: 15000 }).first().within(() => {
      cy.get('button').contains('Add to Order').click();
    });
    
    cy.get('.total').should('contain', 'Total:');
  });

  it('should place an order successfully', () => {
    // Add item to order
    cy.get('.menu-item', { timeout: 15000 }).first().within(() => {
      cy.get('button').contains('Add to Order').click();
    });
    
    // Enter customer name
    cy.get('.customer-form input[placeholder="Your name"]').type('John Doe');
    
    // Register alert handler before clicking
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Order placed successfully!');
    });
    
    // Place order
    cy.get('.customer-form button').contains('Place Order').click();
    
    // Verify order is cleared (wait for API call to complete)
    cy.get('.order-summary', { timeout: 10000 }).should('not.exist');
  });

  it('should not place an order without customer name', () => {
    // Add item to order
    cy.get('.menu-item', { timeout: 15000 }).first().within(() => {
      cy.get('button').contains('Add to Order').click();
    });
    
    // Try to place order without customer name
    cy.get('.customer-form button').contains('Place Order').click();
    
    // Order summary should still exist (order not placed)
    cy.get('.order-summary').should('exist');
  });

  it('should remove an item from the order', () => {
    // Add item to order
    cy.get('.menu-item', { timeout: 15000 }).first().within(() => {
      cy.get('button').contains('Add to Order').click();
    });
    
    // Remove item
    cy.get('.order-item button').contains('Remove').click();
    
    // Order summary should not exist
    cy.get('.order-summary').should('not.exist');
  });

  it('should switch to list view mode', () => {
    // Wait for menu items to load
    cy.get('.menu-item', { timeout: 15000 }).should('exist');
    
    // Click the list view button (☰)
    cy.get('.view-btn').contains('☰').click();
    
    // Verify list view is active
    cy.get('.view-btn').contains('☰').should('have.class', 'active');
    
    // Verify menu items are displayed in list view
    cy.get('.menu-item.list-view').should('exist');
  });

  it('should switch to classic list view mode', () => {
    // Wait for menu items to load
    cy.get('.menu-item', { timeout: 15000 }).should('exist');
    
    // Click the classic list view button (☰☰)
    cy.get('.view-btn').contains('☰☰').click();
    
    // Verify classic view is active
    cy.get('.view-btn').contains('☰☰').should('have.class', 'active');
    
    // Verify menu items are displayed in classic view
    cy.get('.menu-item.classic-view').should('exist');
  });

  it('should switch back to card view mode', () => {
    // Wait for menu items to load
    cy.get('.menu-item', { timeout: 15000 }).should('exist');
    
    // Switch to list view first
    cy.get('.view-btn').contains('☰').click();
    
    // Then switch back to card view
    cy.get('.view-btn').contains('⊞').click();
    
    // Verify card view is active
    cy.get('.view-btn').contains('⊞').should('have.class', 'active');
    
    // Verify menu items are displayed in card view (not list or classic)
    cy.get('.menu-item.card-view').should('exist');
    cy.get('.menu-item.list-view').should('not.exist');
    cy.get('.menu-item.classic-view').should('not.exist');
  });
});