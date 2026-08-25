describe('Order Layouts E2E Tests', () => {
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
      cy.visit('/menu');
      cy.reload();
      cy.wait(2000);
    });
  });

  function goToOrders() {
    cy.get('.nav-links a').contains('Orders').click();
    cy.url().should('include', '/orders');
    cy.get('h1').should('contain', 'Orders');
    cy.wait(3000);

    // Orders are loaded and the default (cards) view is displayed
    cy.get('.order-card').should('exist');
  }

  it('should display six view toggle buttons', () => {
    goToOrders();

    cy.get('.view-btn').should('have.length', 6);
  });

  it('should switch to table view with expandable rows', () => {
    goToOrders();

    cy.get('.view-btn[title="Table view"]').click();

    cy.get('.orders-table').should('exist');
    cy.get('.orders-table-row').should('have.length.at.least', 1);

    // Clicking a row expands its item details
    cy.get('.orders-table-row').first().click();
    cy.get('.orders-table-details').should('exist');

    // Clicking it again collapses the details
    cy.get('.orders-table-row').first().click();
    cy.get('.orders-table-details').should('not.exist');
  });

  it('should switch to board view grouped by status columns', () => {
    goToOrders();

    cy.get('.view-btn[title="Kanban board view"]').click();

    cy.get('.board').should('exist');
    cy.get('.board-column').should('have.length', 3);
    cy.get('.board-column-header').eq(0).should('contain', 'Do realizacji');
    cy.get('.board-column-header').eq(1).should('contain', 'W trakcie');
    cy.get('.board-column-header').eq(2).should('contain', 'Gotowe');
  });

  it('should move an order to the Done column from board view', () => {
    goToOrders();

    cy.get('.view-btn[title="Kanban board view"]').click();

    // Mark the first visible board card as done
    cy.get('.board-card')
      .first()
      .within(() => {
        cy.get('.status-btn.status-done').click();
      });
    cy.wait(2000);

    // The order should now be rendered inside the "Gotowe" column
    cy.get('.board-column').eq(2).find('.board-card').should('exist');
  });

  it('should switch to compact view with expandable rows and status change', () => {
    goToOrders();

    cy.get('.view-btn[title="Compact view"]').click();

    cy.get('.compact-row').should('have.length.at.least', 1);

    // Expand the first row
    cy.get('.compact-summary').first().click();
    cy.get('.compact-details').should('exist');

    // Change the status from the expanded details
    cy.get('.compact-details .status-btn.status-progress').first().click();
    cy.wait(2000);

    cy.get('.compact-summary')
      .first()
      .find('.status-badge')
      .should('contain', 'W trakcie');
  });
});