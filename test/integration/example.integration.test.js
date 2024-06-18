const chai = require('chai');
const supertest = require('supertest');
const app = require('../index'); // Adjust path to your app entry point
const { expect } = chai;

describe('Integration Tests', () => {
  it('should return 200 on GET /', (done) => {
    supertest(app)
      .get('/')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.include('Rover Check-In/Out');
        done();
      });
  });

  // More integration tests here
});
