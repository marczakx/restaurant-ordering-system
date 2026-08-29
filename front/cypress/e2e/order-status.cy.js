describe('Order Status Change E2E Tests', () => {
  beforeEach(() => {
    // loginViaKeycloak stores the access token plus the realm roles
    // extracted from the JWT, keeping the suite consistent with the
    // other e2e specs.
    cy.loginViaKeycloak('demo', 'demo');
    cy.visit('/menu');
    cy.reload();
    cy.wait(2000);
  });

  it('should navigate to orders page', () => {
    cy.get('.nav-links a').contains('Orders').click();
    cy.url().should('include', '/orders');
    cy.get('h1').should('contain', 'Orders');
  });

  it('should display order status buttons and badge', () => {
    cy.get('.nav-links a').contains('Orders').click();
    cy.url().should('include', '/orders');

    // Wait for orders to load
    cy.get('h1').should('contain', 'Orders');
    cy.wait(3000);

    // Check that orders are displayed
    cy.get('.order-card').should('exist');

    // Check status buttons exist
    cy.get('.status-btn').should('have.length.at.least', 3);
    cy.get('.status-badge').should('exist');
  });

  it('should change status from TO_DO to IN_PROGRESS', () => {
    cy.get('.nav-links a').contains('Orders').click();
    cy.url().should('include', '/orders');

    // Wait for orders to load
    cy.get('h1').should('contain', 'Orders');
    cy.wait(3000);

    cy.get('.order-card').should('exist');

    // Find first order and verify it has a status badge
    cy.get('.order-card').first().within(() => {
      cy.get('.status-badge').should('exist');

      // Click the IN_PROGRESS button
      cy.get('.status-btn.status-progress').click();

      // Wait for API call and UI update
      cy.wait(2000);

      // Verify the status badge has changed to W trakcie
      cy.get('.status-badge').should('contain', 'W trakcie');
      cy.get('.status-badge').should('have.class', 'status-progress');
    });
  });

  it('should change status from TO_DO or IN_PROGRESS to DONE', () => {
    cy.get('.nav-links a').contains('Orders').click();
    cy.url().should('include', '/orders');

    // Wait for orders to load
    cy.get('h1').should('contain', 'Orders');
    cy.wait(3000);

    cy.get('.order-card').should('exist');

    // Use the first order
    cy.get('.order-card').first().within(() => {
      // Click the DONE button
      cy.get('.status-btn.status-done').click();

      // Wait for API call and UI update
      cy.wait(2000);

      // Verify the status badge has changed to Gotowe
      cy.get('.status-badge').should('contain', 'Gotowe');
      cy.get('.status-badge').should('have.class', 'status-done');
    });
  });

  it('should change status from any status back to TO_DO', () => {
    cy.get('.nav-links a').contains('Orders').click();
    cy.url().should('include', '/orders');

    // Wait for orders to load
    cy.get('h1').should('contain', 'Orders');
    cy.wait(3000);

    cy.get('.order-card').should('exist');

    // Use the first order
    cy.get('.order-card').first().within(() => {
      // Click the TO_DO button
      cy.get('.status-btn.status-todo').click();

      // Wait for API call and UI update
      cy.wait(2000);

      // Verify the status badge has changed to Do realizacji
      cy.get('.status-badge').should('contain', 'Do realizacji');
      cy.get('.status-badge').should('have.class', 'status-todo');
    });
  });

  it('should display all three status buttons with correct labels', () => {
    cy.get('.nav-links a').contains('Orders').click();
    cy.url().should('include', '/orders');

    // Wait for orders to load
    cy.get('h1').should('contain', 'Orders');
    cy.wait(3000);

    cy.get('.order-card').should('exist');

    cy.get('.order-card').first().within(() => {
      cy.get('.status-btn.status-todo').should('contain', 'Do realizacji');
      cy.get('.status-btn.status-progress').should('contain', 'W trakcie');
      cy.get('.status-btn.status-done').should('contain', 'Gotowe');
    });
  });
});