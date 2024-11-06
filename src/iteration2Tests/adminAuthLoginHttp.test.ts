import request from 'sync-request-curl';
import { port, url } from '../config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

interface AuthLoginResponse {
  statusCode: number;
  body: {
    token?: string
    error?: string
  };
}

// Helper function to send the authLogin request
const loginUser = (email: string, password: string): AuthLoginResponse => {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/login`, {
    json: { email, password },
    timeout: TIMEOUT_MS
  });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
};

// Tests for adminAuthLogin API
describe('POST /v1/admin/auth/login', () => {
  beforeEach(() => {
    request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });

    // Register a valid user before testing login
    request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'validemail@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      },
      timeout: TIMEOUT_MS
    });
  });

  test('successful login returns auth token', () => {
    const loginResponse = loginUser('validemail@gmail.com', 'password123');
    expect(loginResponse).toMatchObject({
      statusCode: 200,
      body: {
        token: expect.any(String),
      },
    });
  });

  test('login with incorrect password returns error', () => {
    const loginResponse = loginUser('validemail@gmail.com', 'wrongpassword');
    expect(loginResponse).toMatchObject({
      statusCode: 400,
      body: {
        error: expect.any(String),
      },
    });
  });

  test('login with unregistered email returns error', () => {
    const loginResponse = loginUser('unregisteredemail@gmail.com', '123abc!@#');
    expect(loginResponse).toMatchObject({
      statusCode: 400,
      body: {
        error: expect.any(String),
      },
    });
  });

  test('login with missing email returns error', () => {
    const loginResponse = loginUser('', '123abc!@#');
    expect(loginResponse).toMatchObject({
      statusCode: 400,
      body: {
        error: expect.any(String),
      },
    });
  });

  test('login with missing password returns error', () => {
    const loginResponse = loginUser('validemail@gmail.com', '');
    expect(loginResponse).toMatchObject({
      statusCode: 400,
      body: {
        error: expect.any(String),
      },
    });
  });
});
