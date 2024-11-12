import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';
import { Token, ErrorResponse } from '../interfaces';

const SERVER_URL: string = `${url}:${port}`;
const TIMEOUT_MS: number = 5 * 1000;

// Error object
const ERROR: ErrorResponse = { error: expect.any(String) };

// user token
let token: string = '';

// clear the database before each test and register a user
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: TIMEOUT_MS
  });

  token = JSON.parse(res.body.toString()).token;
});

describe('Test for PUT /v2/admin/user/password', () => {
  // Test for successful cases
  test('has the correct return and has it updated the password', () => {
    const res = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});

    const newPasswordLogin = request('POST', SERVER_URL + '/v1/admin/auth/login', {
      json: {
        email: 'Aerospace@gmail.com', password: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(newPasswordLogin.body.toString())).toStrictEqual(
      { token: expect.any(String) });
  });

  test('has updated successfully several times', () => {
    const res = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass2', newPassword: 'Aeropass3'
      },
      timeout: TIMEOUT_MS
    });

    const newPasswordLogin = request('POST', SERVER_URL + '/v1/admin/auth/login', {
      json: {
        email: 'Aerospace@gmail.com', password: 'Aeropass3'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(newPasswordLogin.body.toString())).toStrictEqual(
      { token: expect.any(String) });
  });

  // Test for error cases
  test('error for invalid old password', () => {
    const res = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass2', newPassword: 'Aeropass3'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for new password same as old password', () => {
    const res = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass1', newPassword: 'Aeropass1'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for new password has been already used before by the user', () => {
    request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    const res = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass2', newPassword: 'Aeropass1'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for new password is less than 8 characters', () => {
    const res = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass1', newPassword: 'Aeropas'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for new password does not contain at least one letter and one number', () => {
    const res = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass1', newPassword: 'Aeropass'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);

    const res2 = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token },
      json: {
        oldPassword: 'Aeropass1', newPassword: '12345678'
      },
      timeout: TIMEOUT_MS
    });

    expect(res2.statusCode).toStrictEqual(400);
    expect(JSON.parse(res2.body.toString())).toStrictEqual(ERROR);
  });

  test('error for empty token', () => {
    const emptyToken: string = '';

    const res = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token: emptyToken },
      json: {
        oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for invalid token', () => {
    const invalidToken: Token = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid: string = createToken(invalidToken);

    const res = request('PUT', SERVER_URL + '/v2/admin/user/password', {
      headers: { token: encodedInvalid },
      json: {
        oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
