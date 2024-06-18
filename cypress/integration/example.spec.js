describe('End-to-End Tests', () => {
    it('should visit the home page and check the title', () => {
      cy.visit('http://localhost:3000');
      cy.contains('Rover Check-In/Out');
    });
  
    it('should allow form submission', () => {
      cy.visit('http://localhost:3000');
      cy.get('#roverNumber').type('LASB18359522505717');
      cy.get('#employeeID').type('1234');
      cy.get('#checkout').check();
      cy.get('form').submit();
    });
  
    // More E2E tests here
  });
  