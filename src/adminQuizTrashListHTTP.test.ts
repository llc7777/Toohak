/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';
import { createToken } from './helper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// Error object
const ERROR = { error: expect.any(String) };

// User token
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

describe('Test for GET /v1/admin/quiz/trash', () => {
  // Test for successful cases
  test('should return empty array if quiz is not removed', () => {
    const res = request('GET', SERVER_URL + '/v1/admin/quiz/trash', {
      qs: { token },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ quizzes: [] });
  });

  test('should return one quiz if one quiz is removed', () => {
    const quiz = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token, name: 'quiz1', description: 'description1'
      },
      timeout: TIMEOUT_MS
    });

    const quizId = JSON.parse(quiz.body.toString()).quizId;

    request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      qs: { token },
      timeout: TIMEOUT_MS
    });

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/trash', {
      qs: { token },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: quizId,
          name: 'quiz1'
        }
      ]
    });

    request('DELETE', SERVER_URL + '/v1/admin/quiz/trash/empty', {
      qs: { token, quizIds: JSON.stringify([quizId]) },
      timeout: TIMEOUT_MS
    });
  });

  test('should return array of quizzes if quizzes are removed', () => {
    const quiz1 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token, name: 'quiz1', description: 'description1'
      },
      timeout: TIMEOUT_MS
    });

    const quizId1 = JSON.parse(quiz1.body.toString()).quizId;

    const quiz2 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token, name: 'quiz2', description: 'description2'
      },
      timeout: TIMEOUT_MS
    });

    const quizId2 = JSON.parse(quiz2.body.toString()).quizId;

    const quiz3 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token, name: 'quiz3', description: 'description3'
      },
      timeout: TIMEOUT_MS
    });

    const quizId3 = JSON.parse(quiz3.body.toString()).quizId;

    request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId1}`, {
      qs: { token },
      timeout: TIMEOUT_MS
    });

    request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId2}`, {
      qs: { token },
      timeout: TIMEOUT_MS
    });

    request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId3}`, {
      qs: { token },
      timeout: TIMEOUT_MS
    });

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/trash', {
      qs: { token },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'quiz1'
        },
        {
          quizId: quizId2,
          name: 'quiz2'
        },
        {
          quizId: quizId3,
          name: 'quiz3'
        }
      ]
    });

    request('DELETE', SERVER_URL + '/v1/admin/quiz/trash/empty', {
      qs: { token, quizIds: JSON.stringify([quizId1, quizId2, quizId3]) },
      timeout: TIMEOUT_MS
    });
  });

  // Test for error cases
  test('error for empty token', () => {
    const emptyToken = '';

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/trash', {
      qs: { token: emptyToken },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for invalid token', () => {
    const invalidToken = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid = createToken(invalidToken);

    const res = request('GET', SERVER_URL + '/v1/admin/quiz/trash', {
      qs: { token: encodedInvalid },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
