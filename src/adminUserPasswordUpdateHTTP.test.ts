/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';
import { createToken } from './helper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// Error object
const ERROR = { error: expect.any(String) };

let token = {};

// clear the database before each test and register a user
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  token = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: TIMEOUT_MS
  });

  token = JSON.parse(token.body.toString());
});

describe('Test for PUT /v1/admin/user/password', () => {
  // Test for successful cases
  test('has the correct return and has it updated the password', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
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
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass2', newPassword: 'Aeropass3'
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
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass2', newPassword: 'Aeropass3'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for new password same as old password', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass1', newPassword: 'Aeropass1'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for new password has been already used before by the user', () => {
    request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass2', newPassword: 'Aeropass1'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for new password is less than 8 characters', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass1', newPassword: 'Aeropas'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for new password does not contain at least one letter and one number', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass1', newPassword: 'Aeropass'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);

    const res2 = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token, oldPassword: 'Aeropass1', newPassword: '12345678'
      },
      timeout: TIMEOUT_MS
    });

    expect(res2.statusCode).toStrictEqual(400);
    expect(JSON.parse(res2.body.toString())).toStrictEqual(ERROR);
  });

  test('error for empty token', () => {
    const emptyToken = { token: '' };

    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token: emptyToken, oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for invalid token', () => {
    const invalidToken = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid = { token: createToken(invalidToken) };

    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        token: encodedInvalid, oldPassword: 'Aeropass1', newPassword: 'Aeropass2'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
