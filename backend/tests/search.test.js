// search.test.js – Search and filter test suite
import request from 'supertest';
import app from '../src/app.js';
import { getDatabasePool } from '../src/config/database.js';

/**
 * Register a user, verify email via a known token, and return an auth JWT.
 */
async function getAuthToken() {
  const email = `user_${Date.now()}@example.com`;
  const password = 'Password123!';
  await request(app)
    .post('/api/auth/register')
    .send({ email, password, role: 'landlord' })
    .expect(201);

  const pool = getDatabasePool();
  await pool.query('UPDATE users SET email_verified = TRUE WHERE email = ?', [email]);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  return loginRes.body.data.token;
}

describe('Search and Filter API', () => {
  let token = '';
  beforeAll(async () => {
    token = await getAuthToken();
  }, 30000);

  test('Search with matching filters returns results', async () => {
    // First, create a listing to be searchable
    const createRes = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Sunny Apartment',
        description: 'Great view',
        location: 'Campus',
        price: 1500,
        property_type: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        square_meters: 800,
      })
      .expect(201);
    const listingId = createRes.body.data.id;

    // Perform a search that should match the created listing
    const res = await request(app)
      .get('/api/listings/search')
      .set('Authorization', `Bearer ${token}`)
      .query({ location: 'Campus', minPrice: 1000, maxPrice: 2000, property_type: 'apartment' })
      .expect(200);
    expect(res.body).toHaveProperty('data.listings');
    const ids = res.body.data.listings.map(l => l.id);
    expect(ids).toContain(listingId);
  });

  test('Search with filters that yield no results returns empty array', async () => {
    const res = await request(app)
      .get('/api/listings/search')
      .set('Authorization', `Bearer ${token}`)
      .query({ location: 'NonExistentTown', minPrice: 9999 })
      .expect(200);
    expect(res.body).toHaveProperty('data.listings');
    expect(res.body.data.listings).toHaveLength(0);
  });

  test('Guest preview (public route) is accessible without auth', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toHaveProperty('message', 'Welcome to the Student Housing API!');
  });
});
