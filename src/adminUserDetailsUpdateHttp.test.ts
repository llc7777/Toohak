/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';
import { createToken } from './helper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

let token = {};

beforeEach(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });

  token = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'jake.renzella@gmail.com',
      password: 'Password123',
      nameFirst: 'Jake',
      nameLast: 'Renzella'
    },
    timeout: TIMEOUT_MS
  });

  token = JSON.parse(token.body.toString());
});

describe('PUT /v1/admin/user/details', () => {
  describe('Tests for failure', () => {
    test('returns error for invalid token', () => {
      const invalidToken = { sessionId: 1, authUserId: 1531 };
      const encodedInvalid = { token: createToken(invalidToken) };

      const res = request('PUT', SERVER_URL + '/v1/admin/user/details', {
        json: {
          token: encodedInvalid,
          email: 'jake.renzella@gmail.com',
          nameFirst: 'Jake',
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toStrictEqual(401);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
    });

    test('returns error for empty token', () => {
      const emptyToken = { token: '' };

      const res = request('PUT', SERVER_URL + '/v1/admin/user/details', {
        json: {
          token: emptyToken,
          email: 'jake.renzella@gmail.com',
          nameFirst: 'Jake',
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toStrictEqual(401);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
      'invalidEmail', // No @ symbol
      'user@.com', // No domain
      '@example.com', // No local part
      'user@com', // Missing dot in domain
      'user@domain..com', // Consecutive dots
      'user@domain.c', // .com missing characters
      'user@-domain.com', // Invalid domain
    ])('returns error for invalid email: %s', (invalidEmail) => {
      const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token,
          email: invalidEmail,
          nameFirst: 'Jake',
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(result.statusCode).toStrictEqual(400);
      const response = JSON.parse(result.body.toString());
      expect(response).toStrictEqual({ error: expect.any(String) });
    });

    // test('given email already belongs to another user', () => {
    //   const user2Response = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    //     json: {
    //       email: 'second.user@gmail.com',
    //       password: 'Password123',
    //       nameFirst: 'Second',
    //       nameLast: 'User',
    //     },
    //     timeout: TIMEOUT_MS,
    //   });

    //   const user2 = JSON.parse(user2Response.body.toString());
    //   // Try to update the first user's details with the second user's email
    //   const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
    //     json: {
    //       token: token.token,
    //       email: 'second.user@gmail.com',
    //       nameFirst: 'UpdatedFirst',
    //       nameLast: 'UpdatedLast',
    //     },
    //     timeout: TIMEOUT_MS,
    //   });
    //   expect(result.statusCode).toStrictEqual(400);

    //   const response = JSON.parse(result.body.toString());
    //   expect(response).toStrictEqual({ error: expect.any(String) });
    // });

    test.each([
      'Jake123',
      'J@ke',
      'Jak#',
      'Jake!',
      'J*ke',
      'Jake_',
      'Jake$',
    ])('invalid nameFirst: %s', (invalidNameFirst) => {
      const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token,
          email: 'jake.renzella@gmail.com',
          nameFirst: invalidNameFirst,
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });
      expect(result.statusCode).toStrictEqual(400);

      const response = JSON.parse(result.body.toString());
      expect(response).toStrictEqual({ error: expect.any(String) });
    });

    test('nameFirst is too long (more than 20 characters)', () => {
      const nameFirst = 'Aaaaaaaaaaaaaaaaaaaaaa';
      const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token,
          email: 'jake.renzella@gmail.com',
          nameFirst: nameFirst,
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(result.statusCode).toStrictEqual(400);

      const response = JSON.parse(result.body.toString());
      expect(response).toStrictEqual({ error: expect.any(String) });
    });

    test('nameFirst is too short (less than 2 characters)', () => {
      const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token,
          email: 'jake.renzella@gmail.com',
          nameFirst: 'J', // 1 character
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(result.statusCode).toStrictEqual(400);

      const response = JSON.parse(result.body.toString());
      expect(response).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
      'Renzella123',
      'Renzell@',
      'Renzell#',
      'Renzella!',
      'Renzell*',
      'Renzella_',
      'Renzella$',
    ])('invalid namelast: %s', (invalidNameLast) => {
      const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token,
          email: 'jake.renzella@gmail.com',
          nameFirst: 'Jake',
          nameLast: invalidNameLast,
        },
        timeout: TIMEOUT_MS,
      });
      expect(result.statusCode).toStrictEqual(400);

      const response = JSON.parse(result.body.toString());
      expect(response).toStrictEqual({ error: expect.any(String) });
    });

    test('nameLast is too short (less than 2 characters)', () => {
      const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token,
          email: 'jake.renzella@gmail.com',
          nameFirst: 'Jake',
          nameLast: 'R',
        },
        timeout: TIMEOUT_MS,
      });

      expect(result.statusCode).toStrictEqual(400);

      const response = JSON.parse(result.body.toString());
      expect(response).toStrictEqual({ error: expect.any(String) });
    });

    test('nameLast is too long (longer than 20 characters)', () => {
      const nameLast = 'Renzellajakehelloitsme';
      const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token,
          email: 'jake.renzella@gmail.com',
          nameFirst: 'Jake',
          nameLast: nameLast,
        },
        timeout: TIMEOUT_MS,
      });

      expect(result.statusCode).toStrictEqual(400);

      const response = JSON.parse(result.body.toString());
      expect(response).toStrictEqual({ error: expect.any(String) });
    });
  });

  describe('Successful test cases', () => {
    test('change first name from jake to Jake', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token,
          email: 'jake.renzella@gmail.com',
          nameFirst: 'Jake',
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toStrictEqual(200);
      expect(JSON.parse(res.body.toString())).toStrictEqual({});

      const userDetails = request('GET', `${SERVER_URL}/v1/admin/user/details`, {
        json: { token: token.token },
        timeout: TIMEOUT_MS,
      });
      const userBody = JSON.parse(userDetails.body.toString());

      expect(userDetails.statusCode).toStrictEqual(200);
      expect(userBody.user.nameFirst).toStrictEqual('Jake');
    });

    test('change last name from renzella to Renzella', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token: token.token,
          email: 'jake.renzella@gmail.com',
          nameFirst: 'Jake',
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toStrictEqual(200);
      expect(JSON.parse(res.body.toString())).toStrictEqual({});

      const userDetails = request('GET', `${SERVER_URL}/v1/admin/user/details`, {
        json: { token: token.token },
        timeout: TIMEOUT_MS,
      });
      const userBody = JSON.parse(userDetails.body.toString());

      expect(userDetails.statusCode).toStrictEqual(200);
      expect(userBody.user.nameLast).toStrictEqual('Renzella');
    });

    test('change email from jake.renzella@gmail.com to jake@gmail.com', () => {
      const res = request('PUT', SERVER_URL + '/v1/admin/user/details', {
        json: {
          token: token.token,
          email: 'jake.newemail@gmail.com',
          nameFirst: 'Jake',
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toStrictEqual(200);
      expect(JSON.parse(res.body.toString())).toStrictEqual({});

      const userDetails = request('GET', `${SERVER_URL}/v1/admin/user/details`, {
        json: { token: token.token },
        timeout: TIMEOUT_MS,
      });
      const userBody = JSON.parse(userDetails.body.toString());

      expect(userDetails.statusCode).toStrictEqual(200);
      expect(userBody.user.email).toStrictEqual('jake.newemail@gmail.com');
    });

    test('make no changes (changes are identical to current state)', () => {
      const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token: token.token,
          email: 'jake.renzella@gmail.com',
          nameFirst: 'Jake',
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body.toString())).toStrictEqual({});
    });

    test('change first name to have exactly 20 characters', () => {
      const nameFirst = 'AlexandriannaBethany';
      const result = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
          token: token.token,
          email: 'jake.renzella@gmail.com',
          nameFirst: nameFirst,
          nameLast: 'Renzella',
        },
        timeout: TIMEOUT_MS,
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body.toString())).toStrictEqual({});

      const updatedResponse = request(
        'GET', `${SERVER_URL}/v1/admin/user/details/${token.authUserId}`,
        {
          json: { token: token.token },
          timeout: TIMEOUT_MS,
        });

      const updatedUser = JSON.parse(updatedResponse.body.toString());
      expect(updatedUser.user.nameFirst).toBe(nameFirst);
    });
  });
});
