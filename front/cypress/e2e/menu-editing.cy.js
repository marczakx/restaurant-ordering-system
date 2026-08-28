describe('Menu Editing E2E Tests', () => {
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

  it('should show the Edit button for every menu item', () => {
    cy.get('.menu-item', { timeout: 15000 }).should('exist');
    cy.get('.menu-item').first().find('button').contains('Edit').should('exist');
  });

  it('should open the edit form when clicking Edit', () => {
    cy.get('.menu-item', { timeout: 15000 }).first().within(() => {
      cy.get('button').contains('Edit').click();
    });

    cy.get('.edit-form').should('exist');
    cy.get('.edit-form h2').should('contain', 'Edit:');
    cy.get('.edit-form input[placeholder="Item name"]').should('exist');
    cy.get('.edit-form input[placeholder="Price"]').should('exist');
    cy.get('.edit-form select').should('exist');
  });

  it('should prefill the edit form with current values', () => {
    cy.get('.menu-item', { timeout: 15000 }).first().as('targetItem');
    cy.get('@targetItem').find('h3').invoke('text').then((itemName) => {
      cy.get('@targetItem').find('button').contains('Edit').click();
      cy.get('.edit-form input[placeholder="Item name"]').should('have.value', itemName.trim());
    });
  });

  it('should close the edit form when clicking Cancel', () => {
    cy.get('.menu-item', { timeout: 15000 }).first().within(() => {
      cy.get('button').contains('Edit').click();
    });

    cy.get('.edit-form').should('exist');
    cy.get('.edit-form button').contains('Cancel').click();
    cy.get('.edit-form').should('not.exist');
  });

  it('should update the menu item name and price after saving', () => {
    const newName = `E2E Edited ${Date.now()}`;
    const newPrice = '42.50';

    cy.get('.menu-item', { timeout: 15000 }).first().as('targetItem');
    cy.get('@targetItem').find('h3').invoke('text').as('originalName');
    cy.get('@targetItem').within(() => {
      cy.get('button').contains('Edit').click();
    });

    cy.get('.edit-form input[placeholder="Item name"]').clear().type(newName);
    cy.get('.edit-form input[placeholder="Price"]').clear().type(newPrice);
    cy.get('.edit-form button').contains('Save').click();

    // Edit form closes after successful save
    cy.get('.edit-form', { timeout: 10000 }).should('not.exist');

    // The list shows the updated values
    cy.get('.menu-item').first().find('h3').should('contain', newName);
    cy.get('.menu-item').first().find('.price').should('contain', '42.50');
  });

  it('should keep the Save button disabled without a name', () => {
    cy.get('.menu-item', { timeout: 15000 }).first().within(() => {
      cy.get('button').contains('Edit').click();
    });

    cy.get('.edit-form input[placeholder="Item name"]').clear();
    cy.get('.edit-form button').contains('Save').should('be.disabled');
  });

  it('should show the Edit button in list view', () => {
    cy.get('.menu-item', { timeout: 15000 }).should('exist');
    cy.get('.view-btn').contains('☰').click();
    cy.get('.menu-item.list-view').first().find('button').contains('Edit').should('exist');
  });

  it('should show the Edit button in classic view', () => {
    cy.get('.menu-item', { timeout: 15000 }).should('exist');
    cy.get('.view-btn').contains('☰☰').click();
    cy.get('.menu-item.classic-view').first().find('button').contains('Edit').should('exist');
  });
});