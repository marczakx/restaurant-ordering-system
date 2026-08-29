describe('Order Layouts E2E Tests', () => {
  beforeEach(() => {
    // loginViaKeycloak stores both the access token and the realm
    // roles extracted from the JWT, so any role-gated UI is rendered
    // consistently across the suite.
    cy.loginViaKeycloak('demo', 'demo');
    cy.visit('/menu');
    cy.reload();
    cy.wait(2000);
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

  it('should move an order to another column by dragging', () => {
    goToOrders();

    cy.get('.view-btn[title="Kanban board view"]').click();

    // Find a source column among "Do realizacji"/"W trakcie" that has a card
    cy.get('.board-column').then(($columns) => {
      let sourceIndex = -1;
      for (let i = 0; i < 2; i++) {
        if ($columns.eq(i).find('.board-card').length > 0) {
          sourceIndex = i;
          break;
        }
      }
      expect(sourceIndex, 'at least one card outside the Done column').to.be.at.least(0);

      const $sourceColumn = $columns.eq(sourceIndex);
      const orderId = $sourceColumn.find('.board-card .board-order-id').first().text().trim();

      // Simulate HTML5 drag & drop. The drop handler is bound to the
      // .board-cards container of the destination column, so we must
      // target that exact element. { force: true } bypasses the
      // actionability check (the empty "Gotowe" column is essentially
      // zero-height, which would otherwise make its .board-cards
      // unclickable in headless mode).
      cy.wrap($sourceColumn.find('.board-card').first()).trigger('dragstart');
      cy.get('.board-column').eq(2).find('.board-cards')
        .trigger('dragover', { force: true })
        .trigger('drop', { force: true });
      cy.wait(2000);

      // The dragged order should now be rendered inside the "Gotowe" column
      cy.get('.board-column')
        .eq(2)
        .find('.board-card')
        .contains('.board-order-id', orderId)
        .should('exist');
    });
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