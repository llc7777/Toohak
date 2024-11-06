/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// Error object
const ERROR = { error: expect.any(String) };

// user token
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

  token = JSON.parse(token.body.toString()).token;
});

describe('Test for GET /v1/admin/quiz/list', () => {
  // Test for successful cases
  test('should return empty array if quiz is not generated', () => {
    const res = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token, {
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({ quizzes: [] });
  });

  test('should return one quiz if  one quiz is generated', () => {
    request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token, name: 'quiz1', description: 'description1'
      },
      timeout: TIMEOUT_MS
    });

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token, {
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: 'quiz1'
        }
      ]
    });
  });

  test('should return array of quizzes if quizzes are generated', () => {
    request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token, name: 'quiz1', description: 'description1'
      },
      timeout: TIMEOUT_MS
    });

    request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token, name: 'quiz2', description: 'description2'
      },
      timeout: TIMEOUT_MS
    });

    request('POST', SERVER_URL + '/v1/admin/quiz', {
      json:
        { token, name: 'quiz3', description: 'description3' },
      timeout: TIMEOUT_MS
    });

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token, {
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: 'quiz1'
        },
        {
          quizId: expect.any(Number),
          name: 'quiz2'
        },
        {
          quizId: expect.any(Number),
          name: 'quiz3'
        }
      ]
    });
  });

  // Test for error cases
  test('error for empty token', () => {
    const emptyToken = '';

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + emptyToken, {
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.statusCode)).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for invalid token', () => {
    const invalidToken = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid = createToken(invalidToken);

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + encodedInvalid, {
      json:
        { token: encodedInvalid },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.statusCode)).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
