describe('Menu Adding E2E Tests', () => {
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

  it('should show the Add New Item button', () => {
    cy.get('.add-item-bar button.add-btn', { timeout: 15000 })
      .should('exist')
      .and('contain', 'Add New Item');
  });

  it('should open the add form when clicking Add New Item', () => {
    cy.get('.add-item-bar button.add-btn', { timeout: 15000 }).click();

    cy.get('.add-form').should('exist');
    cy.get('.add-form h2').should('contain', 'Add New Menu Item');
    cy.get('.add-form input[placeholder="Item name"]').should('have.value', '');
    cy.get('.add-form input[placeholder="Price"]').should('have.value', '');
    cy.get('.add-form select').should('exist');
  });

  it('should close the add form when clicking Cancel', () => {
    cy.get('.add-item-bar button.add-btn', { timeout: 15000 }).click();
    cy.get('.add-form').should('exist');
    cy.get('.add-form button').contains('Cancel').click();
    cy.get('.add-form').should('not.exist');
    cy.get('.add-item-bar').should('exist');
  });

  it('should keep the Add button disabled without name and price', () => {
    cy.get('.add-item-bar button.add-btn', { timeout: 15000 }).click();
    cy.get('.add-form button').contains('Add').should('be.disabled');

    cy.get('.add-form input[placeholder="Item name"]').type('Some Item');
    cy.get('.add-form button').contains('Add').should('be.disabled');
  });

  it('should add a new menu item and display it in the list', () => {
    const newItemName = `E2E New Item ${Date.now()}`;

    cy.get('.menu-item', { timeout: 15000 }).should('exist');

    cy.get('.add-item-bar button.add-btn').click();
    cy.get('.add-form input[placeholder="Item name"]').type(newItemName);
    cy.get('.add-form input[placeholder="Price"]').type('33.30');
    // The backend requires an existing menu item type, so pick the first
    // non-empty option from the type dropdown.
    cy.get('.add-form select').find('option').eq(1).invoke('val').then((typeName) => {
      cy.get('.add-form select').select(typeName);
      cy.get('.add-form button').contains('Add').click();
    });

    // Add form closes after successful save
    cy.get('.add-form', { timeout: 10000 }).should('not.exist');

    // The new item appears in the list
    cy.get('.menu-item', { timeout: 10000 })
      .contains(newItemName)
      .should('exist');
    cy.get('.menu-item').last().find('.price').should('contain', '33.30');
  });

  it('should hide the Add New Item button while a form is open', () => {
    cy.get('.add-item-bar button.add-btn', { timeout: 15000 }).click();
    cy.get('.add-form').should('exist');
    cy.get('.add-item-bar').should('not.exist');
  });
});