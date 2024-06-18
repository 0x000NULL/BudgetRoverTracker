const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;

// Example function to test
function add(a, b) {
  return a + b;
}

describe('Unit Tests', () => {
  it('should add two numbers correctly', () => {
    const result = add(2, 3);
    expect(result).to.equal(5);
  });

  // More unit tests here
});
