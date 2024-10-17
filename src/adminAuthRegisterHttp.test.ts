import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('POST /v1/admin/auth/register', () => {
    test('Successful case', () => {
      const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
        json: {
          email: 'aero@mail.com',
          password: 'Aeropass1',
          nameFirst: 'Jason',
          nameLast: 'Chandra',
        },
        timeout: TIMEOUT_MS,
      });
  
      const registerResponse = JSON.parse(res.body.toString());
  
      expect(registerResponse).toStrictEqual({
        token: expect.any(String),
      });
  
      const logRes = request('POST', `${SERVER_URL}/admin/auth/login`, {
        json: {
          email: 'aero@mail.com',
          password: 'Aeropass1',
        },
        timeout: TIMEOUT_MS,
      });
  
      const loginResponse = JSON.parse(logRes.body.toString());
  
      expect(loginResponse).toStrictEqual({
        email: 'aero@mail.com',
        name: 'Jason Chandra',
        authUserId: expect.any(Number),
      });
    });
  });
  
  test('returns error for duplicate email', () => {
    request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Aeropass1',
        nameFirst: 'Jason',
        nameLast: 'Chandra',
      },
      timeout: TIMEOUT_MS,
    });

    const resultRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Aeropass2',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      },
      timeout: TIMEOUT_MS,
    });

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(resultRes.statusCode).toStrictEqual(400);
  });

  test('returns error for invalid email format', () => {
    const resultRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'invalid-email',
        password: 'Aeropass1',
        nameFirst: 'Jason',
        nameLast: 'Chandra',
      },
      timeout: TIMEOUT_MS,
    });

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(resultRes.statusCode).toStrictEqual(400);
  });

  test('returns error for invalid first name', () => {
    const resultRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Aeropass1',
        nameFirst: 'J',
        nameLast: 'Chandra',
      },
      timeout: TIMEOUT_MS,
    });

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(resultRes.statusCode).toStrictEqual(400);
  });

  test('returns error for invalid last name', () => {
    const resultRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Aeropass1',
        nameFirst: 'Jason',
        nameLast: 'C',
      },
      timeout: TIMEOUT_MS,
    });

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(resultRes.statusCode).toStrictEqual(400);
  });

  test('returns error for password too short', () => {
    const resultRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Notlong',
        nameFirst: 'Jason',
        nameLast: 'Chandra',
      },
      timeout: TIMEOUT_MS,
    });

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(resultRes.statusCode).toStrictEqual(400);
  });

  test('returns error for password without letter', () => {
    const resultRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: '12345678',
        nameFirst: 'Jason',
        nameLast: 'Chandra',
      },
      timeout: TIMEOUT_MS,
    });

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(resultRes.statusCode).toStrictEqual(400);
  });

  test('returns error for password without number', () => {
    const resultRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Nonumber',
        nameFirst: 'Jason',
        nameLast: 'Chandra',
      },
      timeout: TIMEOUT_MS,
    });

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(resultRes.statusCode).toStrictEqual(400);
  });