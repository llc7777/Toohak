/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';
import { createToken } from './helper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR = { error: expect.any(String) };

let token = {};
let quizId;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  // Register user and create a quiz
  const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'leo.kim@gmail.com',
      password: 'password1',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    },
    timeout: TIMEOUT_MS
  });

  token = JSON.parse(res.body.toString());

  const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
    json: { token, name: 'Quiz 1', description: 'This is a quiz' },
    timeout: TIMEOUT_MS
  });

  quizId = JSON.parse(quizRes.body.toString()).quizId;
});

describe('Test for PATCH /v1/admin/quiz/description', () => {
  // Test for successful cases
  test('should update the description successfully', () => {
    const res = request('PATCH', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: { token, description: 'This is a new description' },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.statusCode)).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('should update to an empty description', () => {
    const res = request('PATCH', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: { token, description: '' },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.statusCode)).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('should update the description multiple times', () => {
    const descriptions = ['First update', 'Second update', 'Third update'];

    descriptions.forEach((desc) => {
      const res = request('PATCH', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
        json: { token, description: desc },
        timeout: TIMEOUT_MS
      });
      expect(JSON.parse(res.statusCode)).toStrictEqual(200);
      expect(JSON.parse(res.body.toString())).toStrictEqual({});
    });
  });

  // Test for error cases
  test('should return error for invalid quizId', () => {
    const res = request('PATCH', SERVER_URL + `/v1/admin/quiz/${quizId + 1000}/description`, {
      json: { token, description: 'New description' },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.statusCode)).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error for invalid token', () => {
    const invalidToken = { sessionId: 1, authUserId: 9999 };
    const encodedInvalid = { token: createToken(invalidToken) };

    const res = request('PATCH', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: { token: encodedInvalid, description: 'New description' },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.statusCode)).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error if description exceeds 100 characters', () => {
    const longDescription = 'x'.repeat(101);
    const res = request('PATCH', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: { token, description: longDescription },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.statusCode)).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error for empty token', () => {
    const emptyToken = { token: '' };
    const res = request('PATCH', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: { token: emptyToken, description: 'New description' },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.statusCode)).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
