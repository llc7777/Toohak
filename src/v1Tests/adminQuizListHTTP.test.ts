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
    const emptyToken: string = '';

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + emptyToken, {
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for invalid token', () => {
    const invalidToken: Token = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid: string = createToken(invalidToken);

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + encodedInvalid, {
      json:
        { token: encodedInvalid },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
